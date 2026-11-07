package ru.project.gameAssistantBackend.service.impl.assistant;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.project.gameAssistantBackend.dto.chat.*;
import ru.project.gameAssistantBackend.exception.customEx.notFound.ChatNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.GameNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.SystemPropertiesNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.UserNotFoundException;
import ru.project.gameAssistantBackend.models.ChatRole;
import ru.project.gameAssistantBackend.models.Chat;
import ru.project.gameAssistantBackend.models.Game;
import ru.project.gameAssistantBackend.models.User;
import ru.project.gameAssistantBackend.repository.ChatRepository;
import ru.project.gameAssistantBackend.service.ChatServiceI;
import ru.project.gameAssistantBackend.service.impl.AuthServiceImpl;
import ru.project.gameAssistantBackend.service.impl.FileServiceImpl;
import ru.project.gameAssistantBackend.service.impl.GameServiceImpl;
import ru.project.gameAssistantBackend.service.impl.SystemPropertiesServiceImpl;

import java.time.Instant;
import java.util.List;

@Service
public class ChatServiceImpl implements ChatServiceI {

    private final GameServiceImpl gameServiceImpl;

    private final SystemPropertiesServiceImpl systemPropertiesServiceImpl;

    private final AuthServiceImpl authServiceImpl;

    private final ChatRepository chatRepository;

    private final FileServiceImpl fileServiceImpl;

    @Autowired
    public ChatServiceImpl(GameServiceImpl gameServiceImpl,
                           SystemPropertiesServiceImpl systemPropertiesServiceImpl,
                           ChatRepository chatRepository,
                           AuthServiceImpl authServiceImpl,
                           FileServiceImpl fileServiceImpl) {
        this.gameServiceImpl = gameServiceImpl;
        this.systemPropertiesServiceImpl = systemPropertiesServiceImpl;
        this.chatRepository = chatRepository;
        this.authServiceImpl = authServiceImpl;
        this.fileServiceImpl = fileServiceImpl;
    }

    @Transactional
    @Override
    public Chat startChat(StartChatDTO startChatDTO)
            throws GameNotFoundException, SystemPropertiesNotFoundException, UserNotFoundException {
        Chat chat = create(startChatDTO.gameId());
        String systemMessageText = getSystemMessageTextMd(startChatDTO.gameId());
        chat.addMessage(systemMessageText, ChatRole.system);
        chat.addMessage(startChatDTO.request(), ChatRole.user);
        chat.setLastUseTime(Instant.now());
        String title = startChatDTO.request().strip();
        if(title.length() > 30){
            title = title.substring(0, 30);
        }
        chat.setTitle(title);
        return chatRepository.save(chat);
    }

    @Transactional
    @Override
    public Chat continueChat(Long id, SystemPropertiesDTO systemPropertiesDTO)
            throws ChatNotFoundException {
        if (systemPropertiesDTO.prompt() == null || systemPropertiesDTO.prompt().isBlank() || systemPropertiesDTO.prompt().length() > 10000) {
            throw new IllegalArgumentException("Сообщение должно содержать от 1 до 10000 символов");
        }
        Chat chat = getChatById(id);
        chat.addMessage(systemPropertiesDTO.prompt(), ChatRole.user);
        return chatRepository.save(chat);
    }

    @Transactional
    @Override
    public Chat create(Long gameId) throws GameNotFoundException, UserNotFoundException {
        Chat chat = new Chat();
        User user = authServiceImpl.getAuthenticatedUser();
        Game game = gameServiceImpl.getGameById(gameId);
        chat.setUzer(user);
        chat.setGame(game);
        return chatRepository.save(chat);
    }

    @Transactional
    @Override
    public String delete(Long id) throws ChatNotFoundException {
        Chat chat = getChatById(id);
        chatRepository.delete(chat);
        return "Данный Chat удален вместе с сообщениями";
    }

    @Override
    public Chat getChatById(Long chatId) throws ChatNotFoundException {
        return chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatNotFoundException("Chat с таким id не найден"));
    }

    @Override
    public String getSystemMessageTextMd(Long gameId)
            throws GameNotFoundException, SystemPropertiesNotFoundException {
        String promptText = systemPropertiesServiceImpl.getPromptText();
        String rulesFileTitle = gameServiceImpl.getGameById(gameId).getRulesFileTitle();
        String rulesMdText = fileServiceImpl.extractTextFromMarkdown(rulesFileTitle);
        return String.format("%s %s", promptText, rulesMdText);
    }

    @Override
    public List<Chat> getChatsByAuthUserAndGame(Long authUserId, Long gameId){
        return chatRepository.findByUzerIdAndGameId(authUserId, gameId);
    }

    @Override
    public List<Chat> getChatsByAuthUser(Long authUserId) {
        return chatRepository.findByUzerId(authUserId);
    }

    public Page<Chat> getAllPagedChats(int page, int size, Long gameId, Long authUserId){
        Sort sort = Sort.by("lastUseTime").descending();
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 1000), sort);
        if (gameId != null) {
            return chatRepository.findByUzerIdAndGameId(authUserId, gameId, pageRequest);
        }
        return chatRepository.findByUzerId(authUserId, pageRequest);
    }

    @Transactional
    public void saveAssistantStreamingAnswer(Long chatId, ru.project.gameAssistantBackend.ai.GenerationResult result) throws ChatNotFoundException {
        Chat chat = getChatById(chatId);
        chat.addMessage(result.text(), ChatRole.assistant).setGeneration(result);
        chat.setLastUseTime(Instant.now());
        chatRepository.save(chat);
    }
}
