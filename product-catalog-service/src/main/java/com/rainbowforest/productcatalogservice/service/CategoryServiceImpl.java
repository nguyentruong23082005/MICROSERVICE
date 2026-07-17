package com.rainbowforest.productcatalogservice.service;

import com.rainbowforest.productcatalogservice.entity.Category;
import com.rainbowforest.productcatalogservice.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Category> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAscNameAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Category> getVisibleCategories() {
        return categoryRepository.findAllByActiveTrueOrderByDisplayOrderAscNameAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public Category getCategoryBySlug(String slug) {
        return categoryRepository.findBySlug(slug).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id).orElse(null);
    }

    @Override
    public Category saveCategory(Category category) {
        if (category == null) {
            throw new IllegalArgumentException("Category is required");
        }
        return categoryRepository.save(category);
    }

    @Override
    public Category updateCategory(Long id, Category category) {
        if (id == null || category == null) {
            throw new IllegalArgumentException("Category id and payload are required");
        }
        if (!categoryRepository.existsById(id)) {
            return null;
        }
        category.setId(id);
        return saveCategory(category);
    }

    @Override
    public boolean deleteCategory(Long id) {
        if (id == null || !categoryRepository.existsById(id)) {
            return false;
        }
        categoryRepository.deleteById(id);
        return true;
    }
}
