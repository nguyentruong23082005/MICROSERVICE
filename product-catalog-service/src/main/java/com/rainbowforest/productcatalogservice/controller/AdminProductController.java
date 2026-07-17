
package com.rainbowforest.productcatalogservice.controller;

import com.rainbowforest.productcatalogservice.entity.Product;
import com.rainbowforest.productcatalogservice.http.header.HeaderGenerator;
import com.rainbowforest.productcatalogservice.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/admin")
public class AdminProductController {

    private final ProductService productService;
    private final HeaderGenerator headerGenerator;

    public AdminProductController(ProductService productService, HeaderGenerator headerGenerator) {
        this.productService = productService;
        this.headerGenerator = headerGenerator;
    }

    @PostMapping(value = "/products")
    public ResponseEntity<Product> addProduct(@RequestBody Product product, HttpServletRequest request) {
        if (!isAdmin()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        try {
            Product saved = productService.addProduct(product);
            return new ResponseEntity<>(
                    saved,
                    headerGenerator.getHeadersForSuccessPostMethod(request, saved.getId()),
                    HttpStatus.CREATED);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(
                    headerGenerator.getHeadersForError(),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception exception) {
            return new ResponseEntity<>(
                    headerGenerator.getHeadersForError(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping(value = "/products/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable("id") Long id,
            @RequestBody Product product,
            HttpServletRequest request) {
        if (!isAdmin()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        try {
            Product saved = productService.updateProduct(id, product);
            if (saved == null) {
                return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity<>(
                    saved,
                    headerGenerator.getHeadersForSuccessPostMethod(request, saved.getId()),
                    HttpStatus.OK);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(
                    headerGenerator.getHeadersForError(),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception exception) {
            return new ResponseEntity<>(
                    headerGenerator.getHeadersForError(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @DeleteMapping(value = "/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable("id") Long id) {
        if (!isAdmin()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        try {
            if (!productService.deleteProduct(id)) {
                return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity<>(
                    headerGenerator.getHeadersForSuccessGetMethod(),
                    HttpStatus.OK);
        } catch (Exception exception) {
            return new ResponseEntity<>(
                    headerGenerator.getHeadersForError(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
