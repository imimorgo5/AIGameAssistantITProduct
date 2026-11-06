package ru.project.gameAssistantBackend.service;

import ru.project.gameAssistantBackend.dto.chat.SystemPropertiesDTO;
import ru.project.gameAssistantBackend.dto.chat.StartChatDTO;
import ru.project.gameAssistantBackend.exception.customEx.notFound.ChatNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.GameNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.SystemPropertiesNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.UserNotFoundException;
import ru.project.gameAssistantBackend.models.Chat;

import java.io.IOException;
import java.util.List;

public interface ChatServiceI {

    Chat startChat(StartChatDTO startChatDTO)
            throws GameNotFoundException, SystemPropertiesNotFoundException, UserNotFoundException;

    Chat continueChat(Long id, SystemPropertiesDTO systemPropertiesDTO) throws ChatNotFoundException;

    Chat create(Long gameId) throws GameNotFoundException, UserNotFoundException;

    String delete(Long id) throws ChatNotFoundException;

    Chat getChatById(Long chatId) throws ChatNotFoundException;

    String getSystemMessageTextMd(Long gameId) throws IOException, GameNotFoundException, SystemPropertiesNotFoundException;

    List<Chat> getChatsByAuthUserAndGame(Long authUserId, Long gameId);

    List<Chat> getChatsByAuthUser(Long authUserId);
}
