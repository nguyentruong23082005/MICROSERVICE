package com.rainbowforest.recommendationservice.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table (name = "users")
public class User {

    @Id
    private Long id;
    @Column (name = "user_name")
    private String userName;

    @OneToMany (mappedBy = "user")
    @JsonIgnore
    private List<Recommendation> recomendations;

    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<WishlistItem> wishlistItems;
    
    public User() {
    	
    }

    public User(String userName, List<Recommendation> recomendations) {
        this.userName = userName;
        this.recomendations = recomendations;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public List<Recommendation> getRecomendations() {
        return recomendations;
    }

    public void setRecomendations(List<Recommendation> recomendations) {
        this.recomendations = recomendations;
    }

    public List<WishlistItem> getWishlistItems() {
        return wishlistItems;
    }

    public void setWishlistItems(List<WishlistItem> wishlistItems) {
        this.wishlistItems = wishlistItems;
    }
}
