package com.rainbowforest.orderservice.service;

import com.rainbowforest.orderservice.domain.Order;
import com.rainbowforest.orderservice.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit test cho OrderServiceImpl — dùng JUnit 5 + Mockito extension.
 * Không cần khởi động Spring context → chạy nhanh (~30ms).
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceTests {

    private final Long ORDER_ID = 1L;
    private final String ORDER_STATUS = "testStatus";
    private Order order;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    @BeforeEach
    void setUp() {
        order = new Order();
        order.setId(ORDER_ID);
        order.setStatus(ORDER_STATUS);
    }

    @Test
    void save_order_test() {
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        Order created = orderService.saveOrder(order);

        assertEquals(ORDER_ID, created.getId());
        assertEquals(ORDER_STATUS, created.getStatus());
        verify(orderRepository, times(1)).save(any(Order.class));
        verifyNoMoreInteractions(orderRepository);
    }
}
