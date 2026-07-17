package com.rainbowforest.recommendationservice.service;

import com.rainbowforest.recommendationservice.feignClient.ProductClient;
import com.rainbowforest.recommendationservice.feignClient.UserClient;
import com.rainbowforest.recommendationservice.model.Product;
import com.rainbowforest.recommendationservice.model.User;
import com.rainbowforest.recommendationservice.model.WishlistItem;
import com.rainbowforest.recommendationservice.repository.ProductRepository;
import com.rainbowforest.recommendationservice.repository.UserRepository;
import com.rainbowforest.recommendationservice.repository.WishlistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductClient productClient;
    private final UserClient userClient;

    public WishlistServiceImpl(WishlistRepository wishlistRepository,
                               UserRepository userRepository,
                               ProductRepository productRepository,
                               ProductClient productClient,
                               UserClient userClient) {
        this.wishlistRepository = wishlistRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.productClient = productClient;
        this.userClient = userClient;
    }

    @Override
    @Transactional(readOnly = true)
    public List<WishlistItem> getWishlistByUserId(Long userId) {
        return wishlistRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional
    public WishlistMutationResult addToWishlist(Long userId, Long productId) {
        validateUserIdAndProductId(userId, productId);
        return wishlistRepository.findByUserIdAndProductId(userId, productId)
                .map(item -> new WishlistMutationResult(item, false))
                .orElseGet(() -> {
                    Product product = productClient.getProductById(productId);
                    User user = userClient.getUserById(userId);
                    return new WishlistMutationResult(addWishlistSnapshot(user, product), true);
                });
    }

    private WishlistItem addWishlistSnapshot(User user, Product product) {
        validateUserAndProduct(user, product);
        return wishlistRepository.findByUserIdAndProductId(user.getId(), product.getId())
                .orElseGet(() -> createWishlistItem(user, product));
    }

    @Override
    @Transactional
    public boolean removeFromWishlist(Long userId, Long productId) {
        return wishlistRepository.findByUserIdAndProductId(userId, productId)
                .map(item -> {
                    wishlistRepository.delete(item);
                    return true;
                })
                .orElse(false);
    }

    private WishlistItem createWishlistItem(User user, Product product) {
        WishlistItem wishlistItem = new WishlistItem();
        wishlistItem.setUser(upsertUser(user));
        wishlistItem.setProduct(upsertProduct(product));
        return wishlistRepository.save(wishlistItem);
    }

    private User upsertUser(User source) {
        return userRepository.findById(source.getId())
                .map(existing -> {
                    existing.setUserName(source.getUserName());
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(source));
    }

    private Product upsertProduct(Product source) {
        return productRepository.findById(source.getId())
                .map(existing -> {
                    existing.setProductName(source.getProductName());
                    existing.setPrice(source.getPrice());
                    existing.setImageUrl(source.getImageUrl());
                    existing.setCategory(source.getCategory());
                    return productRepository.save(existing);
                })
                .orElseGet(() -> productRepository.save(source));
    }

    private void validateUserAndProduct(User user, Product product) {
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("User is required");
        }
        if (product == null || product.getId() == null) {
            throw new IllegalArgumentException("Product is required");
        }
    }

    private void validateUserIdAndProductId(Long userId, Long productId) {
        if (userId == null) {
            throw new IllegalArgumentException("User is required");
        }
        if (productId == null) {
            throw new IllegalArgumentException("Product is required");
        }
    }
}
