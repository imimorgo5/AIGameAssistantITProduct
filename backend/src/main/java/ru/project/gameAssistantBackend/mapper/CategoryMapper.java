package ru.project.gameAssistantBackend.mapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.project.gameAssistantBackend.dto.category.CategoryResponseDTO;
import ru.project.gameAssistantBackend.models.Category;
import ru.project.gameAssistantBackend.service.impl.GameServiceImpl;

import java.util.ArrayList;
import java.util.List;

@Component
public class CategoryMapper {

    private final GameServiceImpl gameService;

    @Autowired
    public CategoryMapper(GameServiceImpl gameService) {
        this.gameService = gameService;
    }

    public CategoryResponseDTO mapToCategoryResponseDTO(Category category) {
        return new CategoryResponseDTO(
                category.getId(),
                category.getName(),
                gameService.getCountByCategory(category)
        );
    }

    public List<CategoryResponseDTO> mapToCategoryResponseDTOs(List<Category> categories) {
        List<CategoryResponseDTO> categoryResponseDTOs = new ArrayList<>();
        for (Category category : categories) {
            categoryResponseDTOs.add(mapToCategoryResponseDTO(category));
        }
        return categoryResponseDTOs;
    }
}
