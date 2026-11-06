package ru.project.gameAssistantBackend.mapper;

import org.springframework.stereotype.Component;
import ru.project.gameAssistantBackend.dto.chat.ChatDTO;
import ru.project.gameAssistantBackend.dto.chat.ChatPreviewDTO;
import ru.project.gameAssistantBackend.dto.chat.MessageDTO;
import ru.project.gameAssistantBackend.models.ChatRole;
import ru.project.gameAssistantBackend.models.Chat;
import ru.project.gameAssistantBackend.models.Message;

import java.util.ArrayList;
import java.util.List;

@Component
public class ChatMapper {

    public ChatDTO mapToChatDTO(Chat chat){
        return new ChatDTO(
                chat.getId(),
                chat.getTitle(),
                chat.getLastUseTime(),
                mapToMessageDTOs(chat.getMessages()));
    }

    public List<MessageDTO> mapToMessageDTOs(List<Message> messages){
        List<MessageDTO> messageDTOs = new ArrayList<>();
        for (Message message : messages) {
            if(message.getRole().equals(ChatRole.system)) continue;
            messageDTOs.add(mapToMessageDTO(message));
        }
        return messageDTOs;
    }

    public MessageDTO mapToMessageDTO(Message message){
        return new MessageDTO(
                message.getRole(),
                message.getText(),
                message.getTimestamp(), message.getModelId(), message.getRemoteModel(), message.getProvider(),
                message.getInputTokens(), message.getOutputTokens(), message.getDurationMs());
    }

    public List<ChatPreviewDTO> mapToPreviewDTOs(List<Chat> chats){
        List<ChatPreviewDTO> previewDTOs = new ArrayList<>();
        for (Chat chat : chats) {
            previewDTOs.add(mapToChatPreviewDTO(chat));
        }
        return previewDTOs;
    }

    public ChatPreviewDTO mapToChatPreviewDTO(Chat chat){
        return new ChatPreviewDTO(
                chat.getId(),
                chat.getGame() != null ? chat.getGame().getId() : -1L,
                chat.getTitle(),
                chat.getLastUseTime());
    }
}
