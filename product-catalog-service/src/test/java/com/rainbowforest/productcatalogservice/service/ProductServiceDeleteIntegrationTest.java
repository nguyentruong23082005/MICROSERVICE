package com.rainbowforest.productcatalogservice.service;

import com.rainbowforest.productcatalogservice.entity.Product;
import com.rainbowforest.productcatalogservice.entity.ProductImage;
import com.rainbowforest.productcatalogservice.entity.ProductSpecification;
import com.rainbowforest.productcatalogservice.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest(properties = "spring.sql.init.mode=never")
@Import(ProductServiceImpl.class)
class ProductServiceDeleteIntegrationTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void deleteProduct_removesAggregateAndItsChildren() {
        Product product = createProductAggregate();
        Product saved = productRepository.saveAndFlush(product);
        Long productId = saved.getId();

        assertEquals(1L, childCount("product_images", productId));
        assertEquals(1L, childCount("product_specifications", productId));

        assertTrue(productService.deleteProduct(productId));

        assertFalse(productRepository.existsById(productId));
        assertEquals(0L, childCount("product_images", productId));
        assertEquals(0L, childCount("product_specifications", productId));
    }

    private Product createProductAggregate() {
        Product product = new Product();
        product.setProductName("Delete integration fixture");
        product.setPrice(new BigDecimal("1250000"));
        product.setCategory("fixture-category");
        product.setAvailability(1);

        ProductImage image = new ProductImage();
        image.setImageUrl("/fixtures/delete-product.webp");
        image.setAltText("Delete integration fixture");
        product.addImage(image);

        ProductSpecification specification = new ProductSpecification();
        specification.setSpecKey("fixture-material");
        specification.setSpecLabel("Material");
        specification.setSpecValue("Test-only material");
        product.addSpecification(specification);

        return product;
    }

    private long childCount(String table, Long productId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + table + " WHERE product_id = ?",
                Long.class,
                productId);
        return count == null ? 0L : count;
    }
}
