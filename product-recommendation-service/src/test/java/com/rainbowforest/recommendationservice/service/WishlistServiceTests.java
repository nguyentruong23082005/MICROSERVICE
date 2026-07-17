package com.rainbowforest.recommendationservice.service;

import com.rainbowforest.recommendationservice.feignClient.ProductClient;
import com.rainbowforest.recommendationservice.feignClient.UserClient;
import com.rainbowforest.recommendationservice.model.Product;
import com.rainbowforest.recommendationservice.model.User;
import com.rainbowforest.recommendationservice.model.WishlistItem;
import com.rainbowforest.recommendationservice.repository.ProductRepository;
import com.rainbowforest.recommendationservice.repository.UserRepository;
import com.rainbowforest.recommendationservice.repository.WishlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WishlistServiceTests {

    private static final Long USER_ID = 1L;
    private static final Long PRODUCT_ID = 10L;

    private User user;
    private Product product;
    private WishlistItem wishlistItem;

    @Mock
    private WishlistRepository wishlistRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductClient productClient;

    @Mock
    private UserClient userClient;

    @InjectMocks
    private WishlistServiceImpl wishlistService;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(USER_ID);
        user.setUserName("linh");

        product = new Product();
        product.setId(PRODUCT_ID);
        product.setProductName("Sofa Vai Linen");
        product.setPrice(new BigDecimal("12500000"));
        product.setImageUrl("/images/sofa.jpg");
        product.setCategory("Sofa");

        wishlistItem = new WishlistItem();
        wishlistItem.setId(99L);
        wishlistItem.setUser(user);
        wishlistItem.setProduct(product);
    }

    @Test
    void getWishlistByUserId_should_return_items_ordered_by_created_time() {
        when(wishlistRepository.findAllByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of(wishlistItem));

        List<WishlistItem> result = wishlistService.getWishlistByUserId(USER_ID);

        assertEquals(1, result.size());
        assertSame(wishlistItem, result.get(0));
        verify(wishlistRepository).findAllByUserIdOrderByCreatedAtDesc(USER_ID);
    }

    @Test
    void addToWishlist_should_return_existing_item_without_creating_duplicate() {
        when(wishlistRepository.findByUserIdAndProductId(USER_ID, PRODUCT_ID)).thenReturn(Optional.of(wishlistItem));

        WishlistMutationResult result = wishlistService.addToWishlist(USER_ID, PRODUCT_ID);

        assertFalse(result.created());
        assertSame(wishlistItem, result.item());
        verify(wishlistRepository, never()).save(any(WishlistItem.class));
        verify(userRepository, never()).save(any(User.class));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void addToWishlist_should_store_user_and_product_snapshot_when_item_is_new() {
        when(wishlistRepository.findByUserIdAndProductId(USER_ID, PRODUCT_ID)).thenReturn(Optional.empty());
        when(productClient.getProductById(PRODUCT_ID)).thenReturn(product);
        when(userClient.getUserById(USER_ID)).thenReturn(user);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.empty());
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(wishlistRepository.save(any(WishlistItem.class))).thenAnswer(invocation -> {
            WishlistItem item = invocation.getArgument(0);
            item.setId(100L);
            return item;
        });

        WishlistMutationResult result = wishlistService.addToWishlist(USER_ID, PRODUCT_ID);

        assertTrue(result.created());
        assertEquals(100L, result.item().getId());
        assertEquals(USER_ID, result.item().getUser().getId());
        assertEquals(PRODUCT_ID, result.item().getProduct().getId());
        assertEquals("Sofa Vai Linen", result.item().getProduct().getProductName());

        ArgumentCaptor<WishlistItem> itemCaptor = ArgumentCaptor.forClass(WishlistItem.class);
        verify(wishlistRepository).save(itemCaptor.capture());
        assertEquals(USER_ID, itemCaptor.getValue().getUser().getId());
        assertEquals(PRODUCT_ID, itemCaptor.getValue().getProduct().getId());
    }

    @Test
    void removeFromWishlist_should_delete_existing_user_product_item() {
        when(wishlistRepository.findByUserIdAndProductId(USER_ID, PRODUCT_ID)).thenReturn(Optional.of(wishlistItem));

        boolean removed = wishlistService.removeFromWishlist(USER_ID, PRODUCT_ID);

        assertTrue(removed);
        verify(wishlistRepository).delete(wishlistItem);
    }
}
