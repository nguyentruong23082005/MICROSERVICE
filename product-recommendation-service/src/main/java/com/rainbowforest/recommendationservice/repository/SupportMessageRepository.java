package com.rainbowforest.recommendationservice.repository;

import com.rainbowforest.recommendationservice.model.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {

    List<SupportMessage> findTop100ByCustomerIdOrderByCreatedAtAsc(String customerId);

    @Query("""
            select m.customerId
            from SupportMessage m
            group by m.customerId
            order by max(m.createdAt) desc
            """)
    List<String> findActiveCustomerIds();
}
