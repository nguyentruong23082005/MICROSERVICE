package com.rainbowforest.orderservice.feignclient;

import com.rainbowforest.orderservice.exception.ProductNotFoundException;
import com.rainbowforest.orderservice.exception.ProductServiceUnavailableException;
import feign.FeignException;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

@Component
public class ProductClientFallbackFactory implements FallbackFactory<ProductClient> {

    @Override
    public ProductClient create(Throwable cause) {
        return productId -> {
            if (cause instanceof FeignException.NotFound) {
                throw new ProductNotFoundException(productId);
            }
            throw new ProductServiceUnavailableException(productId, cause);
        };
    }
}
