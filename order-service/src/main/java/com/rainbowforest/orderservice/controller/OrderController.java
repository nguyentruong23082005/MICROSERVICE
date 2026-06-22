package com.rainbowforest.orderservice.controller;

import com.rainbowforest.orderservice.domain.Item;
import com.rainbowforest.orderservice.domain.Order;
import com.rainbowforest.orderservice.domain.User;
import com.rainbowforest.orderservice.dto.OrderResponse;
import com.rainbowforest.orderservice.event.OrderEventPublisher;
import com.rainbowforest.orderservice.feignclient.UserClient;
import com.rainbowforest.orderservice.http.header.HeaderGenerator;
import com.rainbowforest.orderservice.service.CartService;
import com.rainbowforest.orderservice.service.OrderService;
import com.rainbowforest.orderservice.utilities.OrderUtilities;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import jakarta.servlet.http.HttpServletRequest;

@RestController
public class OrderController {

    @Autowired private UserClient userClient;
    @Autowired private OrderService orderService;
    @Autowired private CartService cartService;
    @Autowired private OrderEventPublisher orderEventPublisher;
    @Autowired private HeaderGenerator headerGenerator;

    /**
     * Đặt hàng với cookie cartId.
     * @param forceFailure true → giả lập thanh toán thất bại (demo Saga compensation)
     */
    @PostMapping(value = "/order/{userId}")
    public ResponseEntity<OrderResponse> saveOrder(
            @PathVariable("userId") Long userId,
            @CookieValue(value = "cartId", required = false) String cartId,
            @RequestParam(value = "forceFailure", required = false, defaultValue = "false") boolean forceFailure,
            HttpServletRequest request) {

        return processOrder(userId, cartId, forceFailure, request);
    }

    /**
     * Đặt hàng với cartId qua path variable (dễ test hơn với Postman).
     * @param forceFailure true → giả lập thanh toán thất bại
     */
    @PostMapping(value = "/order/{userId}/cart/{cartId}")
    public ResponseEntity<OrderResponse> saveOrderByPath(
            @PathVariable("userId") Long userId,
            @PathVariable("cartId") String cartId,
            @RequestParam(value = "forceFailure", required = false, defaultValue = "false") boolean forceFailure,
            HttpServletRequest request) {

        return processOrder(userId, cartId, forceFailure, request);
    }

    // ─── Private helper ─────────────────────────────────────────────────────

    private ResponseEntity<OrderResponse> processOrder(Long userId, String cartId,
                                                        boolean forceFailure,
                                                        HttpServletRequest request) {
        List<Item> cart = cartService.getAllItemsFromCart(cartId);
        User user = userClient.getUserById(userId);

        if (cart != null && !cart.isEmpty() && user != null) {
            try {
                // Snapshot phoneNumber trước khi set id=null
                String phoneSnapshot = user.getPhoneNumber();
                user.setId(null);

                Order order = createOrder(cart, user, phoneSnapshot);
                Order savedOrder = orderService.saveOrder(order);
                orderEventPublisher.publishOrderCreated(savedOrder, forceFailure);
                cartService.deleteCart(cartId);

                OrderResponse response = OrderResponse.from(savedOrder);
                return new ResponseEntity<>(
                        response,
                        headerGenerator.getHeadersForSuccessPostMethod(request, savedOrder.getId()),
                        HttpStatus.CREATED);
            } catch (Exception ex) {
                ex.printStackTrace();
                return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
    }

    private Order createOrder(List<Item> cart, User user, String phoneNumber) {
        Order order = new Order();
        order.setItems(cart);
        order.setUser(user);
        order.setTotal(OrderUtilities.countTotalPrice(cart));
        order.setOrderedDate(LocalDate.now());
        order.setStatus("PAYMENT_EXPECTED");
        order.setPhoneNumber(phoneNumber); // Snapshot SĐT tại thời điểm đặt hàng
        return order;
    }
}
