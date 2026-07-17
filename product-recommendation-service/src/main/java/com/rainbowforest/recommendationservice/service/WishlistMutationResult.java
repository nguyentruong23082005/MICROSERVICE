package com.rainbowforest.recommendationservice.service;

import com.rainbowforest.recommendationservice.model.WishlistItem;

public record WishlistMutationResult(WishlistItem item, boolean created) {
}
