package com.rainbowforest.productcatalogservice.service;

import java.util.List;

import com.rainbowforest.productcatalogservice.entity.Product;

public interface ProductService {
    public List<Product> getAllProduct();
    public List<Product> getAllProductByCategory(String category);
    public Product getProductById(Long id);
    public List<Product> getAllProductsByName(String name);
    public List<Product> getAllProductsByRoom(String room);
    public List<Product> getAllProductsByMaterial(String material);
    public Product addProduct(Product product);
    public void deleteProduct(Long productId);
}
