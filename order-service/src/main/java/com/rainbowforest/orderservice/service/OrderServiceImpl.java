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
import com.rainbowforest.orderservice.utilities.OrderUtilities;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class OrderServiceImpl implements OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final CouponService couponService;
    private final UserClient userClient;
    private final UserRepository userRepository;
    private final OrderEventPublisher orderEventPublisher;

    public OrderServiceImpl(OrderRepository orderRepository,
                            CartService cartService,
                            CouponService couponService,
                            UserClient userClient,
                            UserRepository userRepository,
                            OrderEventPublisher orderEventPublisher) {
        this.orderRepository = orderRepository;
        this.cartService = cartService;
        this.couponService = couponService;
        this.userClient = userClient;
        this.userRepository = userRepository;
        this.orderEventPublisher = orderEventPublisher;
    }

    @Override
    public Page<Order> searchOrdersAdmin(String status, String search, Pageable pageable) {
        String statusClean = (status == null || status.trim().isEmpty()) ? null : status.trim();
        String searchClean = (search == null || search.trim().isEmpty()) ? null : search.trim();
        return orderRepository.searchOrdersAdmin(statusClean, searchClean, pageable);
    }

    @Override
    public Order saveOrder(Order order) {
        return orderRepository.save(order);
    }

    @Override
    public Order placeOrder(Long userId, String cartId, ShippingInfoRequest shippingInfo, boolean forceFailure) {
        if (userId == null || cartId == null || cartId.isBlank()) {
            throw new NoSuchElementException("Cart or user not found");
        }

        List<Item> cart = cartService.getAllItemsFromCart(cartId);
        if (cart == null || cart.isEmpty()) {
            throw new NoSuchElementException("Cart is empty");
        }

        User user = userClient.getUserById(userId);
        if (user == null || user.getId() == null) {
            throw new NoSuchElementException("User not found");
        }

        User localUser = upsertUser(user);
        Order order = createOrder(cart, localUser, shippingInfo, user.getPhoneNumber());
        Order savedOrder = orderRepository.save(order);
        orderEventPublisher.publishOrderCreated(savedOrder, forceFailure);
        cartService.deleteCart(cartId);
        return savedOrder;
    }

    @Override
    public void updateOrderStatus(Long orderId, String status) {
        orderRepository.findById(orderId).ifPresentOrElse(
                order -> {
                    order.setStatus(status);
                    orderRepository.save(order);
                    log.info("[SAGA] Order #{} status → {}", orderId, status);
                },
                () -> log.warn("[SAGA] Order #{} not found when updating status to {}", orderId, status)
        );
    }

    @Override
    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId).orElse(null);
    }

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUser_IdOrderByOrderedDateDescIdDesc(userId);
    }

    @Override
    public Order cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order #" + orderId + " not found"));
        String status = order.getStatus();
        if ("DELIVERED".equals(status) || "CANCELLED".equals(status)) {
            throw new IllegalStateException(
                    "Order #" + orderId + " cannot be cancelled — current status: " + status);
        }
        order.setStatus("CANCELLED");
        Order saved = orderRepository.save(order);
        log.info("[ORDER] Order #{} cancelled", orderId);
        return saved;
    }

    private User upsertUser(User source) {
        return userRepository.findById(source.getId())
                .orElseGet(() -> userRepository.save(source));
    }

    private Order createOrder(List<Item> cart, User user, ShippingInfoRequest shippingInfo, String phoneNumber) {
        Order order = new Order();
        String shippingPhone = firstPresent(shippingInfo == null ? null : shippingInfo.getShippingPhone(), phoneNumber);
        BigDecimal subtotal = OrderUtilities.countTotalPrice(cart);
        Coupon coupon = couponService.getValidCoupon(shippingInfo == null ? null : shippingInfo.getCouponCode(), subtotal);
        BigDecimal discountTotal = couponService.calculateDiscount(coupon, subtotal);
        order.setItems(cart);
        order.setUser(user);
        order.setSubtotal(subtotal);
        order.setDiscountTotal(discountTotal);
        order.setCouponCode(coupon == null ? null : coupon.getCode());
        order.setTotal(subtotal.subtract(discountTotal));
        order.setTrackingNumber("ORD-" + LocalDate.now().toString().replace("-", "") + "-" + Long.toHexString(System.nanoTime()).toUpperCase());
        order.setOrderedDate(LocalDate.now());
        order.setStatus("PAYMENT_EXPECTED");
        order.setPhoneNumber(shippingPhone);
        order.setShippingName(firstPresent(shippingInfo == null ? null : shippingInfo.getShippingName(), user.getUserName()));
        order.setShippingEmail(normalize(shippingInfo == null ? null : shippingInfo.getShippingEmail()));
        order.setShippingPhone(shippingPhone);
        order.setShippingAddress(normalize(shippingInfo == null ? null : shippingInfo.getShippingAddress()));
        order.setShippingCity(normalize(shippingInfo == null ? null : shippingInfo.getShippingCity()));
        return order;
    }

    private String firstPresent(String preferred, String fallback) {
        String normalized = normalize(preferred);
        return normalized != null ? normalized : normalize(fallback);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
