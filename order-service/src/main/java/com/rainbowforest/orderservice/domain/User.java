package com.rainbowforest.orderservice.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * Entity đại diện cho User được lưu trong database của order-service.
 * Thông tin đầy đủ từ user-service được fetch qua Feign và denormalize.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    private Long id;

    @Column(name = "user_name")
    @NotNull
    private String userName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<Order> orders;

    public User() {
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

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public List<Order> getOrders() {
        return orders;
    }

    public void setOrders(List<Order> orders) {
        this.orders = orders;
    }
}
