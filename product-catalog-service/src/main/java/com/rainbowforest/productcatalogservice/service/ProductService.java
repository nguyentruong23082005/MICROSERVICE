package com.rainbowforest.productcatalogservice.service;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.rainbowforest.productcatalogservice.entity.Product;

public interface ProductService {
    public List<Product> getAllProduct();
    public Page<Product> getAllProduct(Pageable pageable);
    public Page<Product> searchProductsAdmin(String name, String category, Boolean inStock, BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable);
    public List<Product> getAllProductByCategory(String category);
    public List<Product> getAllProductByCategorySlug(String categorySlug);
    public Product getProductById(Long id);
    public List<Product> getAllProductsByName(String name);
    public List<Product> getAllProductsByRoom(String room);
    public List<Product> getAllProductsByMaterial(String material);
    public Product addProduct(Product product);
    public Product updateProduct(Long productId, Product product);
    public boolean deleteProduct(Long productId);
}
