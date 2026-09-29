package com.karimmarket.services;

import com.karimmarket.models.Category;
import com.karimmarket.repositories.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Optional<Category> getCategoryById(String id) {
        return categoryRepository.findById(id);
    }

    public Category createCategory(Category category) {
        category.setId(null);
        return categoryRepository.save(category);
    }

    public Category updateCategory(String id, Category categoryDetails) {
        return categoryRepository.findById(id).map(category -> {
            if (categoryDetails.getName() != null) category.setName(categoryDetails.getName());
            if (categoryDetails.getIcon() != null) category.setIcon(categoryDetails.getIcon());
            return categoryRepository.save(category);
        }).orElseThrow(() -> new RuntimeException("Catégorie non trouvée avec l'id : " + id));
    }

    public void deleteCategory(String id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Catégorie non trouvée avec l'id : " + id);
        }
        categoryRepository.deleteById(id);
    }
}
