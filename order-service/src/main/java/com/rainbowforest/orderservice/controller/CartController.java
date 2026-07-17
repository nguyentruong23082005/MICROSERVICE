package com.rainbowforest.orderservice.controller;

import com.rainbowforest.orderservice.exception.ProductNotFoundException;
import com.rainbowforest.orderservice.exception.ProductServiceUnavailableException;
import com.rainbowforest.orderservice.http.header.HeaderGenerator;
import com.rainbowforest.orderservice.service.CartService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class CartController {

    private final CartService cartService;
    private final HeaderGenerator headerGenerator;

    public CartController(CartService cartService, HeaderGenerator headerGenerator) {
        this.cartService = cartService;
        this.headerGenerator = headerGenerator;
    }

    @GetMapping(value = "/cart")
    public ResponseEntity<List<Object>> getCart(@RequestHeader(value = "Cookie") String cartId) {
        List<Object> cart = cartService.getCart(cartId);
        return new ResponseEntity<>(cart, headerGenerator.getHeadersForSuccessGetMethod(), HttpStatus.OK);
    }

    @PostMapping(value = "/cart", params = {"productId", "quantity"})
    public ResponseEntity<List<Object>> addItemToCart(
            @RequestParam("productId") Long productId,
            @RequestParam("quantity") Integer quantity,
            @RequestHeader(value = "Cookie") String cartId) {
        return addOrUpdateCartItem(cartId, productId, quantity);
    }

    @DeleteMapping(value = "/cart", params = "productId")
    public ResponseEntity<Void> removeItemFromCart(
            @RequestParam("productId") Long productId,
            @RequestHeader(value = "Cookie") String cartId) {
        return removeCartItem(cartId, productId);
    }

    @GetMapping(value = "/cart/{cartId}")
    public ResponseEntity<List<Object>> getCartByPath(@PathVariable("cartId") String cartId) {
        List<Object> cart = cartService.getCart(cartId);
        return new ResponseEntity<>(cart, headerGenerator.getHeadersForSuccessGetMethod(), HttpStatus.OK);
    }

    @PostMapping(value = "/cart/{cartId}/items", params = {"productId", "quantity"})
    public ResponseEntity<List<Object>> addItemToCartByPath(
            @PathVariable("cartId") String cartId,
            @RequestParam("productId") Long productId,
            @RequestParam("quantity") Integer quantity) {
        return addOrUpdateCartItem(cartId, productId, quantity);
    }

    @DeleteMapping(value = "/cart/{cartId}/items", params = "productId")
    public ResponseEntity<Void> removeItemFromCartByPath(
            @PathVariable("cartId") String cartId,
            @RequestParam("productId") Long productId) {
        return removeCartItem(cartId, productId);
    }

    private ResponseEntity<List<Object>> addOrUpdateCartItem(String cartId, Long productId, Integer quantity) {
        try {
            List<Object> updatedCart = cartService.addOrUpdateItem(cartId, productId, quantity);
            if (updatedCart == null) {
                return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.BAD_REQUEST);
            }
            return new ResponseEntity<>(
                    updatedCart,
                    headerGenerator.getHeadersForSuccessGetMethod(),
                    HttpStatus.CREATED);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.BAD_REQUEST);
        } catch (ProductNotFoundException exception) {
            return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
        } catch (ProductServiceUnavailableException exception) {
            return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    private ResponseEntity<Void> removeCartItem(String cartId, Long productId) {
        try {
            if (!cartService.removeItem(cartId, productId)) {
                return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity<>(headerGenerator.getHeadersForSuccessGetMethod(), HttpStatus.OK);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.BAD_REQUEST);
        }
    }
}
