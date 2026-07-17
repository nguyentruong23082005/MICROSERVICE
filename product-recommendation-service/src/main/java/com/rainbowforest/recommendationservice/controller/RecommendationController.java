package com.rainbowforest.recommendationservice.controller;

import com.rainbowforest.recommendationservice.dto.ReviewRequest;
import com.rainbowforest.recommendationservice.http.header.HeaderGenerator;
import com.rainbowforest.recommendationservice.model.Recommendation;
import com.rainbowforest.recommendationservice.service.RecommendationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import feign.FeignException;

@RestController
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final HeaderGenerator headerGenerator;

    public RecommendationController(RecommendationService recommendationService,
                                    HeaderGenerator headerGenerator) {
        this.recommendationService = recommendationService;
        this.headerGenerator = headerGenerator;
    }

    @GetMapping(value = "/recommendations")
    public ResponseEntity<List<Recommendation>> getAllRating(@RequestParam(value = "name", required = false) String productName){
        List<Recommendation> recommendations;
        if (productName == null || productName.isBlank()) {
            recommendations = recommendationService.getAllRecommendations();
        } else {
            recommendations = recommendationService.getAllRecommendationByProductName(productName);
        }
        return new ResponseEntity<List<Recommendation>>(
                recommendations,
                headerGenerator.getHeadersForSuccessGetMethod(),
                HttpStatus.OK);
    }

    @GetMapping(value = "/reviews")
    public ResponseEntity<List<Recommendation>> getReviews(
            @RequestParam(value = "productId", required = false) Long productId,
            @RequestParam(value = "status", required = false) String status) {
        try {
            return new ResponseEntity<>(
                    recommendationService.getReviews(productId, status),
                    headerGenerator.getHeadersForSuccessGetMethod(),
                    HttpStatus.OK);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(
                    headerGenerator.getHeadersForError(),
                    HttpStatus.BAD_REQUEST);
        }
    }

    
    @PostMapping(value = "/{userId}/recommendations/{productId}")
    public ResponseEntity<Recommendation> saveRecommendations(
            @PathVariable ("userId") Long userId,
            @PathVariable ("productId") Long productId,
            @RequestParam ("rating") int rating,
            HttpServletRequest request){
        try {
            Recommendation recommendation = recommendationService.createRecommendation(userId, productId, rating);
            return new ResponseEntity<>(
                    recommendation,
                    headerGenerator.getHeadersForSuccessPostMethod(request, recommendation.getId()),
                    HttpStatus.CREATED);
        } catch (FeignException.NotFound exception) {
            return new ResponseEntity<>(
                    headerGenerator.getHeadersForError(),
                    HttpStatus.NOT_FOUND);
        } catch (FeignException exception) {
            return new ResponseEntity<>(
                    headerGenerator.getHeadersForError(),
                    HttpStatus.BAD_GATEWAY);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(
                    headerGenerator.getHeadersForError(),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping(value = "/{userId}/reviews/{productId}")
    public ResponseEntity<Recommendation> createReview(
            @PathVariable("userId") Long userId,
            @PathVariable("productId") Long productId,
            @RequestBody ReviewRequest reviewRequest,
            HttpServletRequest request) {
        try {
            Recommendation review = recommendationService.createReview(
                    userId,
                    productId,
                    reviewRequest == null ? 0 : reviewRequest.getRating(),
                    reviewRequest == null ? null : reviewRequest.getTitle(),
                    reviewRequest == null ? null : reviewRequest.getComment());
            return new ResponseEntity<>(
                    review,
                    headerGenerator.getHeadersForSuccessPostMethod(request, review.getId()),
                    HttpStatus.CREATED);
        } catch (FeignException.NotFound exception) {
            return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
        } catch (FeignException exception) {
            return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.BAD_GATEWAY);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping(value = "/reviews/{id}/status")
    public ResponseEntity<Recommendation> updateReviewStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") String status) {
        try {
            Recommendation review = recommendationService.updateReviewStatus(id, status);
            if (review == null) {
                return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity<>(
                    review,
                    headerGenerator.getHeadersForSuccessGetMethod(),
                    HttpStatus.OK);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping(value = {"/recommendations/{id}", "/reviews/{id}"})
    public ResponseEntity<Void> deleteRecommendations(@PathVariable("id") Long id){
        boolean deleted = recommendationService.deleteRecommendation(id);
        if (deleted) {
            return new ResponseEntity<>(
                    headerGenerator.getHeadersForSuccessGetMethod(),
                    HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(
                headerGenerator.getHeadersForError(),
                HttpStatus.NOT_FOUND);
    }
}
