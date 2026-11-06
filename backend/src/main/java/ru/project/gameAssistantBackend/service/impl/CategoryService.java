package ru.project.gameAssistantBackend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.project.gameAssistantBackend.exception.customEx.notFound.CategoryNotFoundException;
import ru.project.gameAssistantBackend.models.Category;
import ru.project.gameAssistantBackend.repository.CategoryRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Autowired
    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public Set<Category> getCategories(List<String> names) throws CategoryNotFoundException {
        Set<Category> categories = new HashSet<>();
        for (String name : names) {
            categories.add(getByName(name));
        }
        return categories;
    }

    public Category getByName(String name) throws CategoryNotFoundException {
        return categoryRepository.findByName(name)
                .orElseThrow(() -> new CategoryNotFoundException("Категория не найдена"));
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getById(Long id) throws CategoryNotFoundException {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Категория не найдена"));
    }

    @Transactional
    public Category save(Category category) {
        return categoryRepository.save(category);
    }

    @Transactional
    public void delete(Category category) {
        categoryRepository.delete(category);
    }

    public boolean isExists(String name) {
        return categoryRepository.existsByName(name);
    }
}
