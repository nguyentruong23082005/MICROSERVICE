package com.rainbowforest.productcatalogservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rainbowforest.productcatalogservice.entity.Product;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findAllByOrderByIdAsc();
    List<Product> findAllByCategoryOrderByIdAsc(String category);
    List<Product> findAllByProductNameOrderByIdAsc(String name);
    List<Product> findAllByRoomOrderByIdAsc(String room);
    List<Product> findAllByMaterialOrderByIdAsc(String material);
}

