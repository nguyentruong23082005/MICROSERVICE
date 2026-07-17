package com.rainbowforest.recommendationservice.repository;

import com.rainbowforest.recommendationservice.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<WishlistItem> findByUserIdAndProductId(Long userId, Long productId);
}
