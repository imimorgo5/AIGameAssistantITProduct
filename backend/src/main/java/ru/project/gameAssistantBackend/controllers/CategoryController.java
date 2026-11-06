package ru.project.gameAssistantBackend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.project.gameAssistantBackend.dto.category.CategoryRequestDTO;
import ru.project.gameAssistantBackend.dto.category.CategoryResponseDTO;
import ru.project.gameAssistantBackend.exception.customEx.notFound.CategoryNotFoundException;
import ru.project.gameAssistantBackend.mapper.CategoryMapper;
import ru.project.gameAssistantBackend.models.Category;
import ru.project.gameAssistantBackend.service.impl.CategoryService;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    private final CategoryMapper categoryMapper;

    @Autowired
    public CategoryController(
            CategoryService categoryService,
            CategoryMapper categoryMapper
    ) {
        this.categoryService = categoryService;
        this.categoryMapper = categoryMapper;
    }

    @GetMapping
    public List<CategoryResponseDTO> getAllCategories(){
        List<Category> categories = categoryService.getAllCategories();
        return categoryMapper.mapToCategoryResponseDTOs(categories);
    }

    @GetMapping("/{categoryId}")
    public CategoryResponseDTO getCategoryById(@PathVariable("categoryId") Long categoryId)
            throws CategoryNotFoundException {
        Category category = categoryService.getById(categoryId);
        return categoryMapper.mapToCategoryResponseDTO(category);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping
    public CategoryResponseDTO create(@RequestBody CategoryRequestDTO categoryRequestDTO){
        if(categoryService.isExists(categoryRequestDTO.name())){
            throw new RuntimeException("Категория с таким названием уже существует");
        }
        Category category = new Category();
        category.setName(categoryRequestDTO.name());
        categoryService.save(category);
        return categoryMapper.mapToCategoryResponseDTO(category);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/{categoryId}")
    public String deleteCategoryById(@PathVariable("categoryId") Long categoryId)
            throws CategoryNotFoundException {
        Category category = categoryService.getById(categoryId);
        categoryService.delete(category);
        return String.format("Категория с id = %d была удалена", categoryId);
    }
}
