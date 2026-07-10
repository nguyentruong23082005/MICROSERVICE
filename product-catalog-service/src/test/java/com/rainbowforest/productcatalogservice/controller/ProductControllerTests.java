package com.rainbowforest.productcatalogservice.controller;

import com.rainbowforest.productcatalogservice.entity.Product;
import com.rainbowforest.productcatalogservice.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class ProductControllerTests {

    private static final String PRODUCT_NAME = "test";
    private static final Long PRODUCT_ID = 5L;
    private static final String PRODUCT_CATEGORY = "testCategory";
    private List<Product> products;
    private Product product;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

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
    public void get_all_products_controller_should_return200_when_validRequest() throws Exception {
        when(productService.getAllProduct()).thenReturn(products);

        mockMvc.perform(get("/products"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(PRODUCT_ID))
                .andExpect(jsonPath("$[0].productName").value(PRODUCT_NAME));

        verify(productService, Mockito.times(1)).getAllProduct();
        verifyNoMoreInteractions(productService);
    }

    @Test
    public void get_all_products_controller_should_return404_when_productList_isEmpty() throws Exception {
        List<Product> products = new ArrayList<>();

        when(productService.getAllProduct()).thenReturn(products);

        mockMvc.perform(get("/products"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));

        verify(productService, Mockito.times(1)).getAllProduct();
        verifyNoMoreInteractions(productService);
    }

    @Test
    public void get_all_product_by_category_controller_should_return200_when_validRequest() throws Exception {
        when(productService.getAllProductByCategory(PRODUCT_CATEGORY)).thenReturn(products);

        mockMvc.perform(get("/products").param("category", PRODUCT_CATEGORY))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(PRODUCT_ID))
                .andExpect(jsonPath("$[0].category").value(PRODUCT_CATEGORY));

        verify(productService, times(1)).getAllProductByCategory(anyString());
        verifyNoMoreInteractions(productService);
    }

    @Test
    public void get_all_product_by_category_controller_should_return404_when_productList_isEmpty() throws Exception {
        List<Product> products = new ArrayList<>();

        when(productService.getAllProductByCategory(PRODUCT_CATEGORY)).thenReturn(products);

        mockMvc.perform(get("/products").param("category", PRODUCT_CATEGORY))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));

        verify(productService, times(1)).getAllProductByCategory(anyString());
        verifyNoMoreInteractions(productService);
    }

    @Test
    public void get_one_product_by_id_controller_should_return200_when_validRequest() throws Exception {
        when(productService.getProductById(anyLong())).thenReturn(product);

        mockMvc.perform(get("/products/{id}", PRODUCT_ID))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(PRODUCT_ID))
                .andExpect(jsonPath("$.productName").value(PRODUCT_NAME))
                .andExpect(jsonPath("$.category").value(PRODUCT_CATEGORY));

        verify(productService, times(1)).getProductById(PRODUCT_ID);
        verifyNoMoreInteractions(productService);
    }

    @Test
    public void get_one_product_by_id_controller_should_return404_when_product_isNotExist() throws Exception {
        when(productService.getProductById(anyLong())).thenReturn(null);

        mockMvc.perform(get("/products/{id}", PRODUCT_ID))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(status().isNotFound());

        verify(productService, times(1)).getProductById(PRODUCT_ID);
        verifyNoMoreInteractions(productService);
    }
}
