package com.rainbowforest.recommendationservice.feignClient;

import com.rainbowforest.recommendationservice.model.Product;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;

@FeignClient(name = "product-catalog-service")
public interface ProductClient {

    @GetMapping(value = "/products/{id}")
    public Product getProductById(@PathVariable(value = "id") Long productId);

    @GetMapping(value = "/products")
    public List<Product> getAllProducts();
}
