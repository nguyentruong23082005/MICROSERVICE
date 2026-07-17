package com.rainbowforest.productcatalogservice.repository;

import com.rainbowforest.productcatalogservice.entity.ContentPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContentPageRepository extends JpaRepository<ContentPage, Long> {
    Optional<ContentPage> findBySlug(String slug);
    Optional<ContentPage> findBySlugAndPublishedTrue(String slug);
    boolean existsBySlug(String slug);
    List<ContentPage> findAllByOrderByDisplayOrderAscTitleAsc();
    List<ContentPage> findAllByPublishedTrueOrderByDisplayOrderAscTitleAsc();
}
