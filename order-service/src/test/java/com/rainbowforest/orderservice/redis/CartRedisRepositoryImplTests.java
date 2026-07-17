package com.rainbowforest.orderservice.redis;

import com.rainbowforest.orderservice.domain.Item;
import org.junit.jupiter.api.Test;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CartRedisRepositoryImplTests {

    @Test
    void get_cart_borrows_and_returns_a_connection_for_each_operation() {
        JedisPool jedisPool = mock(JedisPool.class);
        Jedis firstConnection = mock(Jedis.class);
        Jedis secondConnection = mock(Jedis.class);
        when(jedisPool.getResource()).thenReturn(firstConnection, secondConnection);
        when(firstConnection.smembers("cart-1")).thenReturn(Collections.emptySet());
        when(secondConnection.smembers("cart-1")).thenReturn(Collections.emptySet());
        CartRedisRepositoryImpl repository = new CartRedisRepositoryImpl(jedisPool);

        assertTrue(repository.getCart("cart-1", Item.class).isEmpty());
        assertTrue(repository.getCart("cart-1", Item.class).isEmpty());

        verify(jedisPool, times(2)).getResource();
        verify(firstConnection).close();
        verify(secondConnection).close();
    }
}
