package ru.project.gameAssistantBackend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.project.gameAssistantBackend.dto.PagedResponseDTO;
import ru.project.gameAssistantBackend.dto.ResponseDTO;
import ru.project.gameAssistantBackend.dto.user.UpdatePasswordDTO;
import ru.project.gameAssistantBackend.dto.user.UserRequestDTO;
import ru.project.gameAssistantBackend.dto.user.UserResponseDTO;
import ru.project.gameAssistantBackend.exception.customEx.notFound.UserNotFoundException;
import ru.project.gameAssistantBackend.mapper.UserMapper;
import ru.project.gameAssistantBackend.models.User;
import ru.project.gameAssistantBackend.service.impl.UserServiceImpl;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserServiceImpl userServiceImpl;

    private final UserMapper userMapper;

    @Autowired
    public UserController(
            UserServiceImpl userServiceImpl,
            UserMapper userMapper
    ) {
        this.userServiceImpl = userServiceImpl;
        this.userMapper = userMapper;
    }

    @PreAuthorize("hasAuthority('ADMIN') or #userId == @authServiceImpl.getAuthenticatedUser().getId()")
    @GetMapping("/{userId}")
    public UserResponseDTO getUser(@PathVariable("userId") Long userId)
            throws UserNotFoundException {
        User user = userServiceImpl.getById(userId);
        return userMapper.mapToResponseDTO(user);
    }

    @PreAuthorize("hasAuthority('ADMIN') or #userId == @authServiceImpl.getAuthenticatedUser().getId()")
    @PatchMapping("/{userId}/password")
    public void updatePassword(
            @PathVariable("userId") Long userId,
            @RequestBody UpdatePasswordDTO updatePasswordDTO)
            throws UserNotFoundException {
        User user = userServiceImpl.getById(userId);
        userServiceImpl.updatePassword(user, updatePasswordDTO.newPassword());
    }

    @PreAuthorize("hasAuthority('ADMIN') or #userId == @authServiceImpl.getAuthenticatedUser().getId()")
    @PatchMapping("/{userId}/model")
    public void updateModel(
            @PathVariable("userId") Long userId,
            @RequestParam String model)
            throws UserNotFoundException {
        User user = userServiceImpl.getById(userId);
        userServiceImpl.updateModel(user, model);
    }

    @PreAuthorize("hasAuthority('ADMIN') or #userId == @authServiceImpl.getAuthenticatedUser().getId()")
    @PatchMapping("/{userId}/image")
    public UserResponseDTO updateImage(
            @PathVariable("userId") Long userId,
            @ModelAttribute UserRequestDTO userRequestDTO)
            throws UserNotFoundException {
        User user = userServiceImpl.getById(userId);
        User updatedUser = userServiceImpl.updateImage(user, userRequestDTO.imageFile());
        return userMapper.mapToResponseDTO(updatedUser);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping
    public List<UserResponseDTO> getAllUsers() {
        List<User> usersData = userServiceImpl.getAllUsers();
        return userMapper.mapAllUsersDTO(usersData);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/paged")
    public PagedResponseDTO<UserResponseDTO> getPagedAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String filter
    ) {
        Page<User> users = userServiceImpl.getPagedUsers(page, size, filter);
        return new PagedResponseDTO<>(
                userMapper.mapAllUsersDTO(users.getContent()),
                users.getTotalElements(),
                users.getTotalPages(),
                users.getNumber(),
                users.getSize()
        );
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/{userId}")
    public void delete(@PathVariable("userId") Long userId)
            throws UserNotFoundException {
        userServiceImpl.deleteUser(userId);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/{userId}/make-admin")
    public ResponseDTO makeAdmin(@PathVariable("userId") Long userId)
            throws UserNotFoundException {
        userServiceImpl.updateRole(userId);
        return new ResponseDTO(String.format(
                "Пользователь с id = %d теперь имеет роль ADMIN", userId));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/{userId}/make-not-admin")
    public ResponseDTO makeNotAdmin(@PathVariable("userId") Long userId)
            throws UserNotFoundException {
        userServiceImpl.updateRole(userId);
        return new ResponseDTO(String.format(
                "Пользователь с id = %d теперь имеет роль USER", userId));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/{userId}/enable")
    public ResponseDTO enableUser(@PathVariable("userId") Long userId)
            throws UserNotFoundException {
        User user = userServiceImpl.getById(userId);
        userServiceImpl.enableUser(user);
        return new ResponseDTO(String.format(
                "Пользователь с id = %d подтверждён", userId));

    }
}
