package com.rainbowforest.recommendationservice.controller;

import com.rainbowforest.recommendationservice.feignClient.ProductClient;
import com.rainbowforest.recommendationservice.feignClient.UserClient;
import com.rainbowforest.recommendationservice.model.Product;
import com.rainbowforest.recommendationservice.model.User;
import com.rainbowforest.recommendationservice.model.WishlistItem;
import com.rainbowforest.recommendationservice.service.RecommendationService;
import com.rainbowforest.recommendationservice.service.WishlistService;
import com.rainbowforest.recommendationservice.service.WishlistMutationResult;
import feign.FeignException;
import feign.Request;
import feign.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@SpringBootTest
class WishlistControllerTests {

    private static final Long USER_ID = 1L;
    private static final Long PRODUCT_ID = 10L;

    private User user;
    private Product product;
    private WishlistItem wishlistItem;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WishlistService wishlistService;

    @MockBean
    private RecommendationService recommendationService;

    @MockBean
    private ProductClient productClient;

    @MockBean
    private UserClient userClient;

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
    void getWishlist_should_return_user_wishlist_items() throws Exception {
        when(wishlistService.getWishlistByUserId(USER_ID)).thenReturn(List.of(wishlistItem));

        mockMvc.perform(get("/{userId}/wishlist", USER_ID))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(99L))
                .andExpect(jsonPath("$[0].product.id").value(PRODUCT_ID))
                .andExpect(jsonPath("$[0].product.productName").value("Sofa Vai Linen"))
                .andExpect(jsonPath("$[0].product.price").value(12500000));

        verify(wishlistService).getWishlistByUserId(USER_ID);
    }

    @Test
    void addToWishlist_should_return201_when_item_is_new() throws Exception {
        when(wishlistService.addToWishlist(USER_ID, PRODUCT_ID))
                .thenReturn(new WishlistMutationResult(wishlistItem, true));

        mockMvc.perform(post("/{userId}/wishlist/{productId}", USER_ID, PRODUCT_ID))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.product.id").value(PRODUCT_ID));
    }

    @Test
    void addToWishlist_should_return200_when_item_already_exists() throws Exception {
        when(wishlistService.addToWishlist(USER_ID, PRODUCT_ID))
                .thenReturn(new WishlistMutationResult(wishlistItem, false));

        mockMvc.perform(post("/{userId}/wishlist/{productId}", USER_ID, PRODUCT_ID))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.product.id").value(PRODUCT_ID));
    }

    @Test
    void addToWishlist_should_return502_when_product_lookup_fails_downstream() throws Exception {
        when(wishlistService.addToWishlist(USER_ID, PRODUCT_ID)).thenThrow(downstreamFailure(500));

        mockMvc.perform(post("/{userId}/wishlist/{productId}", USER_ID, PRODUCT_ID))
                .andExpect(status().isBadGateway());
    }

    @Test
    void removeFromWishlist_should_return204_when_item_exists() throws Exception {
        when(wishlistService.removeFromWishlist(USER_ID, PRODUCT_ID)).thenReturn(true);

        mockMvc.perform(delete("/{userId}/wishlist/{productId}", USER_ID, PRODUCT_ID))
                .andExpect(status().isNoContent());

        verify(wishlistService).removeFromWishlist(USER_ID, PRODUCT_ID);
    }

    @Test
    void removeFromWishlist_should_reject_extra_path_segment() throws Exception {
        mockMvc.perform(delete("/{userId}/wishlist/{productId}/{ignored}", USER_ID, PRODUCT_ID, 1))
                .andExpect(status().isNotFound());

        verifyNoInteractions(wishlistService);
    }

    private FeignException downstreamFailure(int status) {
        Request request = Request.create(
                Request.HttpMethod.GET,
                "/products/" + PRODUCT_ID,
                Map.of(),
                null,
                StandardCharsets.UTF_8,
                null);
        Response response = Response.builder()
                .request(request)
                .status(status)
                .reason("Downstream failure")
                .build();
        return FeignException.errorStatus("ProductClient#getProductById", response);
    }
}
