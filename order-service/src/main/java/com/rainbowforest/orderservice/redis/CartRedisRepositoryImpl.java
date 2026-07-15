package com.rainbowforest.orderservice.redis;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Repository;
import org.springframework.beans.factory.annotation.Value;
import redis.clients.jedis.Jedis;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;

@Repository
public class CartRedisRepositoryImpl implements CartRedisRepository{

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Jedis jedis;

    public CartRedisRepositoryImpl(
            @Value("${spring.data.redis.host:localhost}") String redisHost,
            @Value("${spring.data.redis.port:6379}") int redisPort) {
        this.jedis = new Jedis(redisHost, redisPort);
    }

    @Override
    public void addItemToCart(String key, Object item) {
        try {
            String jsonObject = objectMapper.writeValueAsString(item);
            jedis.sadd(key, jsonObject);

        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }

    @Override
    public Collection<Object> getCart(String key, Class type) {
        Collection<Object> cart = new ArrayList<>();
        for (String smember : jedis.smembers(key)) {
            try {
                cart.add(objectMapper.readValue(smember, type));
            } catch (JsonParseException e) {
                e.printStackTrace();
            } catch (JsonMappingException e) {
                e.printStackTrace();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return cart;
    }

    @Override
    public void deleteItemFromCart(String key, Object item) {
        if (!(item instanceof com.rainbowforest.orderservice.domain.Item)) {
            return;
        }
        com.rainbowforest.orderservice.domain.Item targetItem = (com.rainbowforest.orderservice.domain.Item) item;
        Long targetProductId = targetItem.getProductId();
        if (targetProductId == null) {
            return;
        }
        for (String smember : jedis.smembers(key)) {
            try {
                com.rainbowforest.orderservice.domain.Item parsed = objectMapper.readValue(smember, com.rainbowforest.orderservice.domain.Item.class);
                if (targetProductId.equals(parsed.getProductId())) {
                    jedis.srem(key, smember);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }


    @Override
    public void deleteCart(String key) {
        jedis.del(key);
    }
}
