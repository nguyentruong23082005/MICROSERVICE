package com.rainbowforest.recommendationservice.service;

import com.rainbowforest.recommendationservice.model.WishlistItem;

import java.util.List;

public interface WishlistService {
    List<WishlistItem> getWishlistByUserId(Long userId);
    WishlistMutationResult addToWishlist(Long userId, Long productId);
    boolean removeFromWishlist(Long userId, Long productId);
}
