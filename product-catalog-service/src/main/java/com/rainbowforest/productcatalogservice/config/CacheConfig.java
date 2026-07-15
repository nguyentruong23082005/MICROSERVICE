package com.rainbowforest.productcatalogservice.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * Redis Cache configuration for product-catalog-service.
 *
 * Cache names and TTLs:
 *   - "products"   : single product by ID → TTL 30 min
 *   - "productList": paginated product lists → TTL 10 min (shorter, changes more often)
 *   - "categories" : category list          → TTL 60 min
 *
 * Cache is invalidated via @CacheEvict on create/update/delete operations.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new StringRedisSerializer())
                )
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new GenericJackson2JsonRedisSerializer())
                )
                .disableCachingNullValues();

        RedisCacheConfiguration shortTtlConfig = defaultConfig
                .entryTtl(Duration.ofMinutes(10));

        RedisCacheConfiguration longTtlConfig = defaultConfig
                .entryTtl(Duration.ofMinutes(60));

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaultConfig)
                .withCacheConfiguration("products", defaultConfig)
                .withCacheConfiguration("productList", shortTtlConfig)
                .withCacheConfiguration("categories", longTtlConfig)
                .build();
    }
}
