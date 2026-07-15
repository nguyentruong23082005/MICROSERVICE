package com.rainbowforest.orderservice.controller;

import com.rainbowforest.orderservice.domain.Order;
import com.rainbowforest.orderservice.dto.OrderResponse;
import com.rainbowforest.orderservice.dto.ShippingInfoRequest;
import com.rainbowforest.orderservice.http.header.HeaderGenerator;
import com.rainbowforest.orderservice.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);
    private final OrderService orderService;
    private final HeaderGenerator headerGenerator;

    public OrderController(OrderService orderService, HeaderGenerator headerGenerator) {
        this.orderService = orderService;
        this.headerGenerator = headerGenerator;
    }

    @GetMapping(value = "/order/{orderId}")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable("orderId") Long orderId,
            HttpServletRequest request) {

        log.info("[order-service] GET /order/{}", orderId);
        String currentUserIdStr = request.getHeader("X-User-Id");
        String currentUserRoles = request.getHeader("X-User-Roles");
        if (currentUserIdStr == null || currentUserIdStr.isBlank()) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        Long currentUserId = Long.parseLong(currentUserIdStr);
        boolean isAdmin = currentUserRoles != null && currentUserRoles.contains("ROLE_ADMIN");

        Order order = orderService.getOrderById(orderId);
        if (order == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        boolean isOwner = order.getUser() != null && order.getUser().getId().equals(currentUserId);
        if (!isOwner && !isAdmin) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        return new ResponseEntity<>(OrderResponse.from(order), HttpStatus.OK);
    }

    @GetMapping(value = "/orders")
    public ResponseEntity<?> getAllOrders(
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "search", required = false) String search,
            HttpServletRequest request) {
        String currentUserIdStr = request.getHeader("X-User-Id");
        String currentUserRoles = request.getHeader("X-User-Roles");
        if (currentUserIdStr == null || currentUserIdStr.isBlank()) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        if (!isAdmin(currentUserRoles)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        
        if (page != null && size != null) {
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                    page, size, org.springframework.data.domain.Sort.by("id").descending());
            org.springframework.data.domain.Page<Order> orderPage = orderService.searchOrdersAdmin(status, search, pageable);
            org.springframework.data.domain.Page<OrderResponse> responsePage = orderPage.map(OrderResponse::from);
            return new ResponseEntity<>(responsePage, HttpStatus.OK);
        }
        
        List<OrderResponse> responses = orderService.getAllOrders().stream()
                .map(OrderResponse::from)
                .toList();
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @GetMapping(value = "/orders/user/{userId}")
    public ResponseEntity<List<OrderResponse>> getOrdersByUserId(
            @PathVariable("userId") Long userId,
            HttpServletRequest request) {
        String currentUserIdStr = request.getHeader("X-User-Id");
        String currentUserRoles = request.getHeader("X-User-Roles");
        if (currentUserIdStr == null || currentUserIdStr.isBlank()) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        Long currentUserId = Long.parseLong(currentUserIdStr);
        if (!currentUserId.equals(userId) && !isAdmin(currentUserRoles)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        List<OrderResponse> responses = orderService.getOrdersByUserId(userId).stream()
                .map(OrderResponse::from)
                .toList();
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @PutMapping(value = "/order/{orderId}/status")
    public ResponseEntity<Void> updateOrderStatus(
            @PathVariable("orderId") Long orderId,
            @RequestParam("status") String status,
            HttpServletRequest request) {
        String currentUserRoles = request.getHeader("X-User-Roles");
        if (!isAdmin(currentUserRoles)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        Order order = orderService.getOrderById(orderId);
        if (order == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        orderService.updateOrderStatus(orderId, status);
        return ResponseEntity.ok().build();
    }

    @PutMapping(value = "/order/{orderId}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable("orderId") Long orderId,
            HttpServletRequest request) {

        String currentUserIdStr = request.getHeader("X-User-Id");
        String currentUserRoles = request.getHeader("X-User-Roles");
        if (currentUserIdStr == null || currentUserIdStr.isBlank()) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        Long currentUserId = Long.parseLong(currentUserIdStr);
        boolean isAdmin = isAdmin(currentUserRoles);

        Order order = orderService.getOrderById(orderId);
        if (order == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        boolean isOwner = order.getUser() != null && order.getUser().getId().equals(currentUserId);
        if (!isOwner && !isAdmin) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        String status = order.getStatus();
        if ("DELIVERED".equals(status) || "CANCELLED".equals(status)) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }

        try {
            Order cancelled = orderService.cancelOrder(orderId);
            return new ResponseEntity<>(OrderResponse.from(cancelled), HttpStatus.OK);
        } catch (IllegalStateException ex) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }
    }

    @PostMapping(value = "/order/{userId}")
    public ResponseEntity<OrderResponse> saveOrder(
            @PathVariable("userId") Long userId,
            @CookieValue(value = "cartId", required = false) String cartId,
            @RequestParam(value = "forceFailure", required = false, defaultValue = "false") boolean forceFailure,
            @Valid @RequestBody(required = false) ShippingInfoRequest shippingInfo,
            HttpServletRequest request) {

        return processOrder(userId, cartId, forceFailure, shippingInfo, request);
    }

    @PostMapping(value = "/order/{userId}/cart/{cartId}")
    public ResponseEntity<OrderResponse> saveOrderByPath(
            @PathVariable("userId") Long userId,
            @PathVariable("cartId") String cartId,
            @RequestParam(value = "forceFailure", required = false, defaultValue = "false") boolean forceFailure,
            @Valid @RequestBody(required = false) ShippingInfoRequest shippingInfo,
            HttpServletRequest request) {

        return processOrder(userId, cartId, forceFailure, shippingInfo, request);
    }

    private ResponseEntity<OrderResponse> processOrder(Long userId,
                                                        String cartId,
                                                        boolean forceFailure,
                                                        ShippingInfoRequest shippingInfo,
                                                        HttpServletRequest request) {
        String currentUserIdStr = request.getHeader("X-User-Id");
        String currentUserRoles = request.getHeader("X-User-Roles");
        if (currentUserIdStr == null || currentUserIdStr.isBlank()) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        Long currentUserId = Long.parseLong(currentUserIdStr);
        if (!currentUserId.equals(userId) && !isAdmin(currentUserRoles)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        try {
            Order savedOrder = orderService.placeOrder(userId, cartId, shippingInfo, forceFailure);
            return new ResponseEntity<>(
                    OrderResponse.from(savedOrder),
                    headerGenerator.getHeadersForSuccessPostMethod(request, savedOrder.getId()),
                    HttpStatus.CREATED);
        } catch (NoSuchElementException ex) {
            return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
        } catch (IllegalArgumentException ex) {
            return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.BAD_REQUEST);
        } catch (Exception ex) {
            return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private boolean isAdmin(String roles) {
        return roles != null && roles.contains("ROLE_ADMIN");
    }
}
