package com.rainbowforest.orderservice.controller;

import com.rainbowforest.orderservice.http.header.HeaderGenerator;
import com.rainbowforest.orderservice.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import jakarta.servlet.http.HttpServletRequest;

@RestController
public class CartController {

    @Autowired
    CartService cartService;
    
    @Autowired
    private HeaderGenerator headerGenerator;

    // ── Endpoints nhận cartId qua Cookie (API gốc) ─────────────────────────

    @GetMapping(value = "/cart")
    public ResponseEntity<List<Object>> getCart(@RequestHeader(value = "Cookie") String cartId) {
        List<Object> cart = cartService.getCart(cartId);
        if (!cart.isEmpty()) {
            return new ResponseEntity<>(cart, headerGenerator.getHeadersForSuccessGetMethod(), HttpStatus.OK);
        }
        return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
    }

    @PostMapping(value = "/cart", params = {"productId", "quantity"})
    public ResponseEntity<List<Object>> addItemToCart(
            @RequestParam("productId") Long productId,
            @RequestParam("quantity") Integer quantity,
            @RequestHeader(value = "Cookie") String cartId,
            HttpServletRequest request) {
        List<Object> cart = cartService.getCart(cartId);
        if (cart != null) {
            if (cart.isEmpty()) {
                cartService.addItemToCart(cartId, productId, quantity);
            } else {
                if (cartService.checkIfItemIsExist(cartId, productId)) {
                    cartService.changeItemQuantity(cartId, productId, quantity);
                } else {
                    cartService.addItemToCart(cartId, productId, quantity);
                }
            }
            // BUG FIX: trả về cart SAU khi thêm/cập nhật
            List<Object> updatedCart = cartService.getCart(cartId);
            return new ResponseEntity<>(updatedCart,
                    headerGenerator.getHeadersForSuccessPostMethod(request, Long.parseLong(cartId)),
                    HttpStatus.CREATED);
        }
        return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.BAD_REQUEST);
    }

    @DeleteMapping(value = "/cart", params = "productId")
    public ResponseEntity<Void> removeItemFromCart(
            @RequestParam("productId") Long productId,
            @RequestHeader(value = "Cookie") String cartId) {
        List<Object> cart = cartService.getCart(cartId);
        if (cart != null) {
            cartService.deleteItemFromCart(cartId, productId);
            return new ResponseEntity<>(headerGenerator.getHeadersForSuccessGetMethod(), HttpStatus.OK);
        }
        return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
    }

    // ── Endpoints nhận cartId qua Path (dễ test bằng curl/Postman) ─────────

    @GetMapping(value = "/cart/{cartId}")
    public ResponseEntity<List<Object>> getCartByPath(@PathVariable("cartId") String cartId) {
        List<Object> cart = cartService.getCart(cartId);
        if (!cart.isEmpty()) {
            return new ResponseEntity<>(cart, headerGenerator.getHeadersForSuccessGetMethod(), HttpStatus.OK);
        }
        return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
    }

    @PostMapping(value = "/cart/{cartId}/items", params = {"productId", "quantity"})
    public ResponseEntity<List<Object>> addItemToCartByPath(
            @PathVariable("cartId") String cartId,
            @RequestParam("productId") Long productId,
            @RequestParam("quantity") Integer quantity,
            HttpServletRequest request) {
        List<Object> cart = cartService.getCart(cartId);
        if (cart != null) {
            if (cart.isEmpty()) {
                cartService.addItemToCart(cartId, productId, quantity);
            } else {
                if (cartService.checkIfItemIsExist(cartId, productId)) {
                    cartService.changeItemQuantity(cartId, productId, quantity);
                } else {
                    cartService.addItemToCart(cartId, productId, quantity);
                }
            }
            List<Object> updatedCart = cartService.getCart(cartId);
            return new ResponseEntity<>(updatedCart,
                    headerGenerator.getHeadersForSuccessGetMethod(),
                    HttpStatus.CREATED);
        }
        return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.BAD_REQUEST);
    }

    @DeleteMapping(value = "/cart/{cartId}/items", params = "productId")
    public ResponseEntity<Void> removeItemFromCartByPath(
            @PathVariable("cartId") String cartId,
            @RequestParam("productId") Long productId) {
        List<Object> cart = cartService.getCart(cartId);
        if (cart != null) {
            cartService.deleteItemFromCart(cartId, productId);
            return new ResponseEntity<>(headerGenerator.getHeadersForSuccessGetMethod(), HttpStatus.OK);
        }
        return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
    }
}
