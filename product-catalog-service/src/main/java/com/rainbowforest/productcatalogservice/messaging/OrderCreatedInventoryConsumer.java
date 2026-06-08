package com.rainbowforest.productcatalogservice.messaging;

import com.rainbowforest.productcatalogservice.entity.Product;
import com.rainbowforest.productcatalogservice.event.OrderCreatedEvent;
import com.rainbowforest.productcatalogservice.event.OrderItemEvent;
import com.rainbowforest.productcatalogservice.repository.ProductRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class OrderCreatedInventoryConsumer {

    private final ProductRepository productRepository;

    public OrderCreatedInventoryConsumer(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional
    @KafkaListener(topics = "${app.kafka.topics.order-created:order-created}", groupId = "${spring.kafka.consumer.group-id:product-catalog-service}")
    public void handleOrderCreated(OrderCreatedEvent event) {
        if (event == null || event.getItems() == null) {
            return;
        }

        for (OrderItemEvent item : event.getItems()) {
            reduceAvailability(item);
        }
    }

    private void reduceAvailability(OrderItemEvent item) {
        if (item == null || item.getProductId() == null || item.getQuantity() <= 0) {
            return;
        }

        productRepository.findById(item.getProductId()).ifPresent(product -> {
            Product updatedProduct = product;
            int nextAvailability = Math.max(0, updatedProduct.getAvailability() - item.getQuantity());
            updatedProduct.setAvailability(nextAvailability);
            productRepository.save(updatedProduct);
        });
    }
}
