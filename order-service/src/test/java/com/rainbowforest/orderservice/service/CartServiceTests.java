package com.rainbowforest.orderservice.service;

import com.rainbowforest.orderservice.domain.Item;
import com.rainbowforest.orderservice.domain.Product;
import com.rainbowforest.orderservice.exception.ProductServiceUnavailableException;
import com.rainbowforest.orderservice.feignclient.ProductClient;
import com.rainbowforest.orderservice.redis.CartRedisRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartServiceTests {

    private static final String CART_ID = "cart-1";
    private static final Long PRODUCT_ID = 5L;

    private Product product;

    @Mock
    private ProductClient productClient;

    @Mock
    private CartRedisRepository cartRedisRepository;

    @InjectMocks
    private CartServiceImpl cartService;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(PRODUCT_ID);
        product.setProductName("Chair");
        product.setPrice(new BigDecimal("100000"));
        product.setCategory("Chair");
    }

    @Test
    void add_or_update_item_should_add_when_cart_is_empty() {
        List<Object> emptyCart = new ArrayList<>();
        List<Object> updatedCart = new ArrayList<>();

        when(cartRedisRepository.getCart(CART_ID, Item.class)).thenReturn(emptyCart, updatedCart);
        when(productClient.getProductById(PRODUCT_ID)).thenReturn(product);

        List<Object> result = cartService.addOrUpdateItem(CART_ID, PRODUCT_ID, 2);

        assertSame(updatedCart, result);
        ArgumentCaptor<Object> itemCaptor = ArgumentCaptor.forClass(Object.class);
        verify(cartRedisRepository).addItemToCart(eq(CART_ID), itemCaptor.capture());
        Item added = (Item) itemCaptor.getValue();
        assertEquals(PRODUCT_ID, added.getProductId());
        assertEquals(2, added.getQuantity());
        assertEquals(new BigDecimal("200000"), added.getSubTotal());
    }

    @Test
    void add_or_update_item_should_surface_product_service_unavailable() {
        List<Object> emptyCart = new ArrayList<>();

        when(cartRedisRepository.getCart(CART_ID, Item.class)).thenReturn(emptyCart);
        when(productClient.getProductById(PRODUCT_ID))
                .thenThrow(new ProductServiceUnavailableException(PRODUCT_ID, new RuntimeException("down")));

        assertThrows(ProductServiceUnavailableException.class,
                () -> cartService.addOrUpdateItem(CART_ID, PRODUCT_ID, 2));
    }

    @Test
    void add_or_update_item_should_change_quantity_when_item_exists() {
        Item existing = new Item(1, product, new BigDecimal("100000"));
        List<Object> cart = new ArrayList<>();
        cart.add(existing);
        List<Object> updatedCart = new ArrayList<>();

        when(cartRedisRepository.getCart(CART_ID, Item.class)).thenReturn(cart, cart, cart, updatedCart);

        List<Object> result = cartService.addOrUpdateItem(CART_ID, PRODUCT_ID, 3);

        assertSame(updatedCart, result);
        verify(cartRedisRepository).deleteItemFromCart(CART_ID, existing);
        verify(cartRedisRepository).addItemToCart(CART_ID, existing);
        assertEquals(3, existing.getQuantity());
        assertEquals(new BigDecimal("300000"), existing.getSubTotal());
    }

    @Test
    void remove_item_should_delete_when_cart_exists() {
        Item existing = new Item(1, product, new BigDecimal("100000"));
        List<Object> cart = new ArrayList<>();
        cart.add(existing);

        when(cartRedisRepository.getCart(CART_ID, Item.class)).thenReturn(cart, cart);

        assertTrue(cartService.removeItem(CART_ID, PRODUCT_ID));

        verify(cartRedisRepository).deleteItemFromCart(CART_ID, existing);
    }

    @Test
    void remove_item_should_return_false_when_cart_is_missing() {
        when(cartRedisRepository.getCart(CART_ID, Item.class)).thenReturn(null);

        assertFalse(cartService.removeItem(CART_ID, PRODUCT_ID));
    }
}
