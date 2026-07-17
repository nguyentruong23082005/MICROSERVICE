package com.rainbowforest.productcatalogservice.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.rainbowforest.productcatalogservice.entity.Product;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findAllByOrderByIdAsc();

    List<Product> findAllByCategoryOrderByIdAsc(String category);

    @Query("""
            select p from Product p
            left join p.categoryRef c
            where lower(c.slug) = lower(:categorySlug)
               or lower(p.category) = lower(:categorySlug)
            order by p.id asc
            """)
    List<Product> findAllByCategorySlugOrLegacyCategory(@Param("categorySlug") String categorySlug);

    List<Product> findAllByProductNameContainingIgnoreCaseOrderByIdAsc(String name);

    List<Product> findAllByRoomOrderByIdAsc(String room);

    List<Product> findAllByMaterialOrderByIdAsc(String material);

    @Query("""
            select p from Product p
            left join p.categoryRef c
            where (:name = '' or lower(p.productName) like lower(concat('%', :name, '%')))
              and (:category = '' or p.category = :category or lower(c.slug) = lower(:category))
              and (:inStockStr = 'ALL' or (:inStockStr = 'TRUE' and p.availability > 0) or (:inStockStr = 'FALSE' and p.availability = 0))
              and (:minPrice is null or p.price >= :minPrice)
              and (:maxPrice is null or p.price <= :maxPrice)
            """)
    Page<Product> searchProductsAdmin(
            @Param("name") String name,
            @Param("category") String category,
            @Param("inStockStr") String inStockStr,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable);
}
