package com.rainbowforest.orderservice.service;

import com.rainbowforest.orderservice.domain.Coupon;
import com.rainbowforest.orderservice.domain.Item;
import com.rainbowforest.orderservice.domain.Order;
import com.rainbowforest.orderservice.domain.User;
import com.rainbowforest.orderservice.dto.ShippingInfoRequest;
import com.rainbowforest.orderservice.event.OrderEventPublisher;
import com.rainbowforest.orderservice.feignclient.UserClient;
import com.rainbowforest.orderservice.repository.OrderRepository;
import com.rainbowforest.orderservice.repository.UserRepository;
import com.rainbowforest.orderservice.feignclient.ProductClient;
import com.rainbowforest.orderservice.domain.Product;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
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
    private final Long USER_ID = 7L;
    private final String ORDER_STATUS = "testStatus";
    private Order order;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartService cartService;

    @Mock
    private CouponService couponService;

    @Mock
    private UserClient userClient;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderEventPublisher orderEventPublisher;

    @Mock
    private ProductClient productClient;

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

    @Test
    void get_orders_by_user_id_returns_repository_results() {
        when(orderRepository.findByUser_IdOrderByOrderedDateDescIdDesc(USER_ID)).thenReturn(List.of(order));

        List<Order> orders = orderService.getOrdersByUserId(USER_ID);

        assertEquals(1, orders.size());
        assertEquals(ORDER_ID, orders.get(0).getId());
        verify(orderRepository, times(1)).findByUser_IdOrderByOrderedDateDescIdDesc(USER_ID);
        verifyNoMoreInteractions(orderRepository);
    }

    @Test
    void cancel_order_sets_status_to_cancelled_and_saves_order() {
        order.setStatus("PAYMENT_EXPECTED");
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order cancelled = orderService.cancelOrder(ORDER_ID);

        assertEquals("CANCELLED", cancelled.getStatus());
        verify(orderRepository, times(1)).findById(ORDER_ID);
        verify(orderRepository, times(1)).save(order);
        verifyNoMoreInteractions(orderRepository);
    }

    @Test
    void place_order_should_create_order_publish_event_and_clear_cart() {
        User remoteUser = new User();
        remoteUser.setId(USER_ID);
        remoteUser.setUserName("Linh");
        remoteUser.setPhoneNumber("0999999999");

        Item item = new Item();
        item.setProductId(10L);
        item.setQuantity(2);
        item.setProductPrice(new BigDecimal("500000"));
        item.setSubTotal(new BigDecimal("1000000"));

        Product mockProduct = new Product();
        mockProduct.setId(10L);
        mockProduct.setAvailability(5); // sufficient stock

        when(productClient.getProductById(10L)).thenReturn(mockProduct);
        when(cartService.getAllItemsFromCart("cart-1")).thenReturn(List.of(item));

        Coupon coupon = new Coupon();
        coupon.setCode("SAVE10");

        ShippingInfoRequest request = new ShippingInfoRequest();
        request.setShippingName("Linh Nguyen");
        request.setShippingEmail("linh@example.com");
        request.setShippingPhone("0901123456");
        request.setShippingAddress("12 Nguyen Trai");
        request.setShippingCity("Ha Noi");
        request.setCouponCode("SAVE10");
        request.setShippingFee(new BigDecimal("25000"));

        when(cartService.getAllItemsFromCart("cart-1")).thenReturn(List.of(item));
        when(userClient.getUserById(USER_ID)).thenReturn(remoteUser);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());
        when(userRepository.save(remoteUser)).thenReturn(remoteUser);
        when(couponService.getValidCoupon("SAVE10", new BigDecimal("1000000"))).thenReturn(coupon);
        when(couponService.calculateDiscount(coupon, new BigDecimal("1000000"))).thenReturn(new BigDecimal("100000"));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        Order savedOrder = orderService.placeOrder(USER_ID, "cart-1", request, false);

        assertEquals(99L, savedOrder.getId());
        assertEquals("PAYMENT_EXPECTED", savedOrder.getStatus());
        assertEquals("SAVE10", savedOrder.getCouponCode());
        assertEquals(new BigDecimal("1000000"), savedOrder.getSubtotal());
        assertEquals(new BigDecimal("100000"), savedOrder.getDiscountTotal());
        assertEquals(new BigDecimal("25000"), savedOrder.getShippingFee());
        assertEquals(new BigDecimal("925000"), savedOrder.getTotal());
        assertEquals("0901123456", savedOrder.getPhoneNumber());
        assertEquals("Linh Nguyen", savedOrder.getShippingName());
        assertEquals("linh@example.com", savedOrder.getShippingEmail());
        assertEquals("12 Nguyen Trai", savedOrder.getShippingAddress());
        assertEquals("Ha Noi", savedOrder.getShippingCity());
        verify(orderEventPublisher, times(1)).publishOrderCreated(savedOrder, false);
        verify(cartService, times(1)).deleteCart("cart-1");
    }
}
