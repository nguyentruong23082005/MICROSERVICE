package com.rainbowforest.recommendationservice.repository;

import com.rainbowforest.recommendationservice.model.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
@Transactional
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {

    @Query("select r FROM Recommendation r WHERE r.product.productName = :productName")
    public List<Recommendation> findAllRatingByProductName(@Param("productName") String productName);

    List<Recommendation> findAllByOrderByCreatedAtDesc();

    List<Recommendation> findAllByStatusOrderByCreatedAtDesc(String status);

    List<Recommendation> findAllByProduct_IdOrderByCreatedAtDesc(Long productId);

    List<Recommendation> findAllByProduct_IdAndStatusOrderByCreatedAtDesc(Long productId, String status);
}
