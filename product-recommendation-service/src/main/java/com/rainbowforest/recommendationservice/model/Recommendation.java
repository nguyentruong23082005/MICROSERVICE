package com.rainbowforest.recommendationservice.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table (name = "recommendation")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Recommendation {

    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;
    @Column (name = "rating")
    private int rating;

    @Column(name = "title", length = 160)
    private String title;

    @Column(name = "comment", length = 2000)
    private String comment;

    @Column(name = "status", length = 30)
    private String status = "APPROVED";

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @ManyToOne
    @JoinColumn (name = "product_id")
    @JsonIgnoreProperties({"recomendations", "wishlistItems", "hibernateLazyInitializer", "handler"})
    private Product product;

    @ManyToOne
    @JoinColumn (name = "user_id")
    @JsonIgnoreProperties({"recomendations", "wishlistItems", "hibernateLazyInitializer", "handler"})
    private User user;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null || status.isBlank()) {
            status = "APPROVED";
        }
    }
    
    public Recommendation() {
	
	}

	public Recommendation(int rating, Product product, User user) {
        this.rating = rating;
        this.product = product;
        this.user = user;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
