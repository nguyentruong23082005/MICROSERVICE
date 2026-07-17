package com.rainbowforest.recommendationservice.service;

import com.rainbowforest.recommendationservice.model.Recommendation;
import java.util.List;

public interface RecommendationService {
    Recommendation createRecommendation(Long userId, Long productId, int rating);
    Recommendation createReview(Long userId, Long productId, int rating, String title, String comment);
    Recommendation updateReviewStatus(Long recommendationId, String status);
    List<Recommendation> getAllRecommendationByProductName(String productName);
    List<Recommendation> getAllRecommendations();
    List<Recommendation> getReviews(Long productId, String status);
    boolean deleteRecommendation(Long id);

}
