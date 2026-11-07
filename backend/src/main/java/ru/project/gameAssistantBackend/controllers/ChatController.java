package ru.project.gameAssistantBackend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import ru.project.gameAssistantBackend.dto.PagedResponseDTO;
import ru.project.gameAssistantBackend.dto.chat.*;
import ru.project.gameAssistantBackend.exception.customEx.notFound.ChatNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.GameNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.SystemPropertiesNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.UserNotFoundException;
import ru.project.gameAssistantBackend.ai.ModelCatalog;
import ru.project.gameAssistantBackend.ai.OpenRouterClient;
import org.springframework.http.codec.ServerSentEvent;
import ru.project.gameAssistantBackend.mapper.ChatMapper;
import ru.project.gameAssistantBackend.models.Chat;
import ru.project.gameAssistantBackend.service.AuthServiceI;
import ru.project.gameAssistantBackend.service.impl.SystemPropertiesServiceImpl;
import ru.project.gameAssistantBackend.service.impl.assistant.ChatServiceImpl;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatServiceImpl chatServiceImpl;

    private final ChatMapper chatMapper;

    private final OpenRouterClient openRouter;
    private final ModelCatalog catalog;

    private final AuthServiceI authService;

    private final SystemPropertiesServiceImpl systemPropertiesServiceImpl;

    @Autowired
    public ChatController(
            ChatServiceImpl chatServiceImpl,
            ChatMapper chatMapper,
            OpenRouterClient openRouter,
            ModelCatalog catalog,
            AuthServiceI authService,
            SystemPropertiesServiceImpl systemPropertiesServiceImpl
    ) {
        this.chatServiceImpl = chatServiceImpl;
        this.chatMapper = chatMapper;
        this.openRouter = openRouter;
        this.catalog = catalog;
        this.authService = authService;
        this.systemPropertiesServiceImpl = systemPropertiesServiceImpl;
    }

    @GetMapping("/{chatId}")
    public ChatDTO getChat(@PathVariable("chatId") Long chatId)
            throws ChatNotFoundException, UserNotFoundException {
        Chat chat = ownedChat(chatId);
        return chatMapper.mapToChatDTO(chat);
    }

    @PostMapping("/start")
    public ChatDTO startChat(@jakarta.validation.Valid @RequestBody StartChatDTO startChatDTO)
            throws GameNotFoundException, SystemPropertiesNotFoundException, UserNotFoundException {
        Chat chat = chatServiceImpl.startChat(startChatDTO);
        return chatMapper.mapToChatDTO(chat);
    }

    @PutMapping("/{chatId}")
    public ChatDTO continueChat(
            @PathVariable("chatId") Long chatId,
            @jakarta.validation.Valid @RequestBody SystemPropertiesDTO systemPropertiesDTO)
            throws ChatNotFoundException, UserNotFoundException {
        ownedChat(chatId);
        Chat chat = chatServiceImpl.continueChat(chatId, systemPropertiesDTO);
        return chatMapper.mapToChatDTO(chat);
    }

    @PostMapping(value = "/{chatId}/answer", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> getStreamedAnswer(@PathVariable Long chatId)
            throws SystemPropertiesNotFoundException, ChatNotFoundException, UserNotFoundException {
        Chat chat = ownedChat(chatId);
        var model = catalog.resolve(authService.getAuthenticatedUser().getModel(),
                systemPropertiesServiceImpl.getSystemProperties().getModel());
        return openRouter.stream(model, chat.getMessages(), answer -> {
                    try {
                        chatServiceImpl.saveAssistantStreamingAnswer(chatId, answer);
                    } catch (ChatNotFoundException e) {
                        throw new IllegalStateException("Не удалось сохранить ответ", e);
                    }
                })
                .map(text -> ServerSentEvent.builder(text).build())
                .concatWithValues(ServerSentEvent.builder("ok").event("done").build())
                .onErrorResume(error -> Flux.just(ServerSentEvent.builder(error.getMessage()).event("error").build()));
    }

    @DeleteMapping("/{chatId}")
    public String delete(@PathVariable("chatId") Long chatId)
            throws ChatNotFoundException, UserNotFoundException {
        ownedChat(chatId);
        return chatServiceImpl.delete(chatId);
    }

    @GetMapping("/md/{chatId}")
    public String getMarkdownParsed(@PathVariable("chatId") Long chatId)
            throws GameNotFoundException, SystemPropertiesNotFoundException, ChatNotFoundException, UserNotFoundException {
        return chatServiceImpl.getSystemMessageTextMd(ownedChat(chatId).getGame().getId());
    }

    @GetMapping("/by-game/{gameId}")
    public List<ChatPreviewDTO> getChatPreviews(@PathVariable("gameId") Long gameId)
            throws UserNotFoundException {
        Long authUserId = authService.getAuthenticatedUser().getId();
        List<Chat> chats = chatServiceImpl.getChatsByAuthUserAndGame(authUserId, gameId);
        return chatMapper.mapToPreviewDTOs(chats);
    }

    @GetMapping("/by-user")
    public List<ChatPreviewDTO> getChatPreviews()
            throws UserNotFoundException {
        Long authUserId = authService.getAuthenticatedUser().getId();
        List<Chat> chats = chatServiceImpl.getChatsByAuthUser(authUserId);
        return chatMapper.mapToPreviewDTOs(chats);
    }

    @GetMapping("/paged")
    public PagedResponseDTO<ChatPreviewDTO> getPagedChatPreviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long gameId
    ) throws UserNotFoundException {
        Long authUserId = authService.getAuthenticatedUser().getId();
        Page<Chat> chats = chatServiceImpl.getAllPagedChats(page, size, gameId, authUserId);
        return new PagedResponseDTO<>(
                chatMapper.mapToPreviewDTOs(chats.getContent()),
                chats.getTotalElements(),
                chats.getTotalPages(),
                chats.getNumber(),
                chats.getSize()
        );
    }

    private Chat ownedChat(Long chatId) throws ChatNotFoundException, UserNotFoundException {
        Chat chat = chatServiceImpl.getChatById(chatId);
        if (!chat.getUzer().getId().equals(authService.getAuthenticatedUser().getId())) {
            throw new ChatNotFoundException("Чат не найден");
        }
        return chat;
    }

}
