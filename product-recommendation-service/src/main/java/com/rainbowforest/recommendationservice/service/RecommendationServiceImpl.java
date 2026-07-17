package com.rainbowforest.recommendationservice.service;

import com.rainbowforest.recommendationservice.feignClient.ProductClient;
import com.rainbowforest.recommendationservice.feignClient.UserClient;
import com.rainbowforest.recommendationservice.model.Recommendation;
import com.rainbowforest.recommendationservice.model.Product;
import com.rainbowforest.recommendationservice.model.User;
import com.rainbowforest.recommendationservice.repository.ProductRepository;
import com.rainbowforest.recommendationservice.repository.RecommendationRepository;
import com.rainbowforest.recommendationservice.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class RecommendationServiceImpl implements RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductClient productClient;
    private final UserClient userClient;

    public RecommendationServiceImpl(RecommendationRepository recommendationRepository,
                                     UserRepository userRepository,
                                     ProductRepository productRepository,
                                     ProductClient productClient,
                                     UserClient userClient) {
        this.recommendationRepository = recommendationRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.productClient = productClient;
        this.userClient = userClient;
    }

    @Override
    @Transactional
    public Recommendation createRecommendation(Long userId, Long productId, int rating) {
        return createReview(userId, productId, rating, null, null);
    }

    @Override
    @Transactional
    public Recommendation createReview(Long userId, Long productId, int rating, String title, String comment) {
        validateUserIdAndProductId(userId, productId);
        Product product = productClient.getProductById(productId);
        User user = userClient.getUserById(userId);
        return createReviewSnapshot(user, product, rating, title, comment);
    }

    private Recommendation createReviewSnapshot(User user, Product product, int rating, String title, String comment) {
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("User is required");
        }
        if (product == null || product.getId() == null) {
            throw new IllegalArgumentException("Product is required");
        }
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        Recommendation review = new Recommendation();
        review.setUser(upsertUser(user));
        review.setProduct(upsertProduct(product));
        review.setRating(rating);
        review.setTitle(normalize(title));
        review.setComment(normalize(comment));
        review.setStatus("APPROVED");
        return recommendationRepository.save(review);
    }

    @Override
    @Transactional
    public Recommendation updateReviewStatus(Long recommendationId, String status) {
        Recommendation review = getRecommendationById(recommendationId);
        if (review == null) {
            return null;
        }
        review.setStatus(normalizeStatus(status));
        return recommendationRepository.save(review);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Recommendation> getAllRecommendationByProductName(String productName) {
        return recommendationRepository.findAllRatingByProductName(productName);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Recommendation> getAllRecommendations() {
        return recommendationRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Recommendation> getReviews(Long productId, String status) {
        String normalizedStatus = normalizeStatusOrNull(status);
        if (productId != null && normalizedStatus != null) {
            return recommendationRepository.findAllByProduct_IdAndStatusOrderByCreatedAtDesc(productId, normalizedStatus);
        }
        if (productId != null) {
            return recommendationRepository.findAllByProduct_IdAndStatusOrderByCreatedAtDesc(productId, "APPROVED");
        }
        if (normalizedStatus != null) {
            return recommendationRepository.findAllByStatusOrderByCreatedAtDesc(normalizedStatus);
        }
        return recommendationRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    @Transactional
    public boolean deleteRecommendation(Long id) {
        if (id == null || !recommendationRepository.existsById(id)) {
            return false;
        }
        recommendationRepository.deleteById(id);
        return true;
    }

    @Transactional(readOnly = true)
	private Recommendation getRecommendationById(Long recommendationId) {
		return recommendationRepository.findById(recommendationId).orElse(null);
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

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeStatus(String status) {
        String normalized = normalizeStatusOrNull(status);
        if (normalized == null) {
            throw new IllegalArgumentException("Invalid review status");
        }
        return normalized;
    }

    private String normalizeStatusOrNull(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return null;
        }
        String normalized = status.trim().toUpperCase();
        if (!List.of("PENDING", "APPROVED", "HIDDEN").contains(normalized)) {
            throw new IllegalArgumentException("Invalid review status");
        }
        return normalized;
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
