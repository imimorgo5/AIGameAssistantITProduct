package ru.project.gameAssistantBackend.service;

import org.springframework.web.multipart.MultipartFile;
import ru.project.gameAssistantBackend.exception.customEx.notFound.UserNotFoundException;
import ru.project.gameAssistantBackend.models.User;

import java.util.List;

public interface UserServiceI {

    List<User> getAllUsers();

    User getByEmail(String email) throws UserNotFoundException;

    User getById(Long id) throws UserNotFoundException;

    void updatePassword(User user, String password);

    User updateImage(User user, MultipartFile imageFile);

    void updateRole(Long id) throws UserNotFoundException;

    void deleteUser(Long userId) throws UserNotFoundException;
}
