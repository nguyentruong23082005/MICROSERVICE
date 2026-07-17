package com.rainbowforest.recommendationservice.controller;

import com.rainbowforest.recommendationservice.http.header.HeaderGenerator;
import com.rainbowforest.recommendationservice.model.WishlistItem;
import com.rainbowforest.recommendationservice.service.WishlistService;
import com.rainbowforest.recommendationservice.service.WishlistMutationResult;
import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class WishlistController {

    private final WishlistService wishlistService;
    private final HeaderGenerator headerGenerator;

    public WishlistController(WishlistService wishlistService,
                              HeaderGenerator headerGenerator) {
        this.wishlistService = wishlistService;
        this.headerGenerator = headerGenerator;
    }

    @GetMapping("/{userId}/wishlist")
    public ResponseEntity<List<WishlistItem>> getWishlist(@PathVariable("userId") Long userId) {
        return new ResponseEntity<>(
                wishlistService.getWishlistByUserId(userId),
                headerGenerator.getHeadersForSuccessGetMethod(),
                HttpStatus.OK);
    }

    @PostMapping("/{userId}/wishlist/{productId}")
    public ResponseEntity<WishlistItem> addToWishlist(
            @PathVariable("userId") Long userId,
            @PathVariable("productId") Long productId,
            HttpServletRequest request) {
        try {
            WishlistMutationResult result = wishlistService.addToWishlist(userId, productId);
            WishlistItem item = result.item();

            if (!result.created()) {
                return new ResponseEntity<>(
                        item,
                        headerGenerator.getHeadersForSuccessGetMethod(),
                        HttpStatus.OK);
            }

            return new ResponseEntity<>(
                    item,
                    headerGenerator.getHeadersForSuccessPostMethod(request, item.getId()),
                    HttpStatus.CREATED);
        } catch (FeignException.NotFound exception) {
            return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
        } catch (FeignException exception) {
            System.err.println("FeignException caught in WishlistController: Status=" + exception.status() + ", Msg=" + exception.getMessage());
            exception.printStackTrace();
            return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.BAD_GATEWAY);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{userId}/wishlist/{productId}")
    public ResponseEntity<Void> removeFromWishlist(
            @PathVariable("userId") Long userId,
            @PathVariable("productId") Long productId) {
        boolean removed = wishlistService.removeFromWishlist(userId, productId);
        if (removed) {
            return new ResponseEntity<>(headerGenerator.getHeadersForSuccessGetMethod(), HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
    }
}
