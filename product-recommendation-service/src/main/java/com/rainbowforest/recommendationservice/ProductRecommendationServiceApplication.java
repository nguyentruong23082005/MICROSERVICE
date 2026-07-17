package com.rainbowforest.recommendationservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableFeignClients
@EnableJpaRepositories
@EnableCaching
public class ProductRecommendationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProductRecommendationServiceApplication.class, args);
    }
}
