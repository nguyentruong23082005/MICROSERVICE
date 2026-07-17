package com.rainbowforest.productcatalogservice.controller;

import com.rainbowforest.productcatalogservice.entity.Category;
import com.rainbowforest.productcatalogservice.http.header.HeaderGenerator;
import com.rainbowforest.productcatalogservice.service.CategoryService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class CategoryController {

    private final CategoryService categoryService;
    private final HeaderGenerator headerGenerator;

    public CategoryController(CategoryService categoryService, HeaderGenerator headerGenerator) {
        this.categoryService = categoryService;
        this.headerGenerator = headerGenerator;
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getVisibleCategories() {
        return ResponseEntity.ok(categoryService.getVisibleCategories());
    }

    @GetMapping("/categories/{slug}")
    public ResponseEntity<Category> getCategoryBySlug(@PathVariable("slug") String slug) {
        Category category = categoryService.getCategoryBySlug(slug);
        if (category == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return ResponseEntity.ok(category);
    }

    @GetMapping("/admin/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        if (!isAdmin()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PostMapping("/admin/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Category category, HttpServletRequest request) {
        if (!isAdmin()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        try {
            Category saved = categoryService.saveCategory(category);
            return new ResponseEntity<>(
                    saved,
                    headerGenerator.getHeadersForSuccessPostMethod(request, saved.getId()),
                    HttpStatus.CREATED);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/admin/categories/{id}")
    public ResponseEntity<Category> updateCategory(
            @PathVariable("id") Long id,
            @RequestBody Category category) {
        if (!isAdmin()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        try {
            Category saved = categoryService.updateCategory(id, category);
            if (saved == null) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/admin/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable("id") Long id) {
        if (!isAdmin()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        if (!categoryService.deleteCategory(id)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return ResponseEntity.ok().build();
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
