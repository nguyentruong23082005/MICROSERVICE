package com.rainbowforest.productcatalogservice.service;

import com.rainbowforest.productcatalogservice.entity.Category;

import java.util.List;

public interface CategoryService {
    List<Category> getAllCategories();
    List<Category> getVisibleCategories();
    Category getCategoryBySlug(String slug);
    Category getCategoryById(Long id);
    Category saveCategory(Category category);
    Category updateCategory(Long id, Category category);
    boolean deleteCategory(Long id);
}
