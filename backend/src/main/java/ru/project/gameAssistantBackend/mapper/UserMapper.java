package ru.project.gameAssistantBackend.mapper;

import org.springframework.stereotype.Component;
import ru.project.gameAssistantBackend.dto.user.UserResponseDTO;
import ru.project.gameAssistantBackend.models.Role;
import ru.project.gameAssistantBackend.models.User;

import java.util.ArrayList;
import java.util.List;

@Component
public class UserMapper {
    private final ru.project.gameAssistantBackend.ai.ModelCatalog catalog;
    public UserMapper(ru.project.gameAssistantBackend.ai.ModelCatalog catalog) { this.catalog = catalog; }


    public UserResponseDTO mapToResponseDTO(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getEmail(),
                user.getLogin(),
                user.getRole().equals(Role.ADMIN),
                user.getImageFileTitle(),
                catalog.isEnabled(user.getModel()) ? user.getModel() : null,
                user.isEnabled()
        );
    }

    public List<UserResponseDTO> mapAllUsersDTO(List<User> users){
        List<UserResponseDTO> userResponseDTOS = new ArrayList<>();
        for(User user : users){
            userResponseDTOS.add(mapToResponseDTO(user));
        }
        return userResponseDTOS;
    }
}
