package com.rainbowforest.orderservice.repository;

import com.rainbowforest.orderservice.domain.ShippingAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShippingAddressRepository extends JpaRepository<ShippingAddress, Long> {
    List<ShippingAddress> findAllByUser_IdOrderByDefaultAddressDescCreatedAtDesc(Long userId);
}
