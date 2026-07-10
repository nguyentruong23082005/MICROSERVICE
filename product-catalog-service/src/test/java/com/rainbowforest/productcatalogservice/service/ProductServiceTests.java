package com.rainbowforest.productcatalogservice.service;

import com.rainbowforest.productcatalogservice.entity.Product;
import com.rainbowforest.productcatalogservice.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class ProductServiceTests {

    private static final String PRODUCT_NAME = "test";
    private static final Long PRODUCT_ID = 5L;
    private static final String PRODUCT_CATEGORY = "testCategory";

    private List<Product> products;
    private Product product;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    @BeforeEach
    public void setUp() {
        product = new Product();
        product.setId(PRODUCT_ID);
        product.setProductName(PRODUCT_NAME);
        product.setCategory(PRODUCT_CATEGORY);
        products = new ArrayList<>();
        products.add(product);
    }

    @Test
    public void get_all_product_test() {
        Mockito.when(productRepository.findAllByOrderByIdAsc()).thenReturn(products);

        List<Product> foundProducts = productService.getAllProduct();

        assertEquals(PRODUCT_NAME, foundProducts.get(0).getProductName());
        Mockito.verify(productRepository, Mockito.times(1)).findAllByOrderByIdAsc();
        Mockito.verifyNoMoreInteractions(productRepository);
    }

    @Test
    public void get_one_by_id_test() {
        Mockito.when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

        Product found = productService.getProductById(PRODUCT_ID);

        assertNotNull(found);
        assertEquals(PRODUCT_ID, found.getId());
        Mockito.verify(productRepository, Mockito.times(1)).findById(PRODUCT_ID);
        Mockito.verifyNoMoreInteractions(productRepository);
    }

    @Test
    public void get_all_product_by_category_test() {
        Mockito.when(productRepository.findAllByCategoryOrderByIdAsc(PRODUCT_CATEGORY)).thenReturn(products);

        List<Product> foundProducts = productService.getAllProductByCategory(PRODUCT_CATEGORY);

        assertEquals(PRODUCT_CATEGORY, foundProducts.get(0).getCategory());
        assertEquals(PRODUCT_NAME, foundProducts.get(0).getProductName());
        Mockito.verify(productRepository, Mockito.times(1)).findAllByCategoryOrderByIdAsc(Mockito.anyString());
        Mockito.verifyNoMoreInteractions(productRepository);
    }

    @Test
    public void get_all_products_by_name_test() {
        Mockito.when(productRepository.findAllByProductNameOrderByIdAsc(PRODUCT_NAME)).thenReturn(products);

        List<Product> foundProducts = productService.getAllProductsByName(PRODUCT_NAME);

        assertEquals(PRODUCT_NAME, foundProducts.get(0).getProductName());
        Mockito.verify(productRepository, Mockito.times(1)).findAllByProductNameOrderByIdAsc(Mockito.anyString());
        Mockito.verifyNoMoreInteractions(productRepository);
    }

}
