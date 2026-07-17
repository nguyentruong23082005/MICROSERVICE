package com.rainbowforest.productcatalogservice.controller;

import com.rainbowforest.productcatalogservice.entity.Product;
import com.rainbowforest.productcatalogservice.http.header.HeaderGenerator;
import com.rainbowforest.productcatalogservice.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
public class ProductController {

    @Autowired
    private ProductService productService;
    
    @Autowired
    private HeaderGenerator headerGenerator;

    @GetMapping (value = "/products")
    public ResponseEntity<?> getAllProducts(
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "inStock", required = false) Boolean inStock,
            @RequestParam(value = "minPrice", required = false) BigDecimal minPrice,
            @RequestParam(value = "maxPrice", required = false) BigDecimal maxPrice){
        
        if (page != null && size != null) {
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                    page, size, org.springframework.data.domain.Sort.by("id").ascending());
            org.springframework.data.domain.Page<Product> productPage = productService.searchProductsAdmin(name, category, inStock, minPrice, maxPrice, pageable);
            return new ResponseEntity<>(productPage, HttpStatus.OK);
        }

        List<Product> products = productService.getAllProduct();
        if (!products.isEmpty()) {
            return new ResponseEntity<List<Product>>(
            		products,
            		headerGenerator.getHeadersForSuccessGetMethod(),
            		HttpStatus.OK);       
        }
        return new ResponseEntity<List<Product>>(
        		headerGenerator.getHeadersForError(),
        		HttpStatus.NOT_FOUND);
    }

    @GetMapping(value = "/products", params = "category")
    public ResponseEntity<List<Product>> getAllProductByCategory(@RequestParam ("category") String category){
        List<Product> products = productService.getAllProductByCategory(category);
        if(!products.isEmpty()) {
        	return new ResponseEntity<List<Product>>(
        			products,
        			headerGenerator.getHeadersForSuccessGetMethod(),
        			HttpStatus.OK);
        }
        return new ResponseEntity<List<Product>>(
    		headerGenerator.getHeadersForError(),
    		HttpStatus.NOT_FOUND);
    }

    @GetMapping(value = "/products", params = "categorySlug")
    public ResponseEntity<List<Product>> getAllProductByCategorySlug(@RequestParam("categorySlug") String categorySlug) {
        List<Product> products = productService.getAllProductByCategorySlug(categorySlug);
        if (!products.isEmpty()) {
            return new ResponseEntity<>(
                    products,
                    headerGenerator.getHeadersForSuccessGetMethod(),
                    HttpStatus.OK);
        }
        return new ResponseEntity<>(
                headerGenerator.getHeadersForError(),
                HttpStatus.NOT_FOUND);
    }

    @GetMapping (value = "/products/{id}")
    public ResponseEntity<Product> getOneProductById(@PathVariable ("id") long id){
        Product product =  productService.getProductById(id);
        if(product != null) {
        	return new ResponseEntity<Product>(
        			product,
        			headerGenerator.getHeadersForSuccessGetMethod(),
        			HttpStatus.OK);
        }
        return new ResponseEntity<Product>(
        		headerGenerator.getHeadersForError(),
        		HttpStatus.NOT_FOUND);
    }

    @GetMapping(value = "/products", params = "name")
    public ResponseEntity<List<Product>> getAllProductsByName(@RequestParam("name") String name) {
        List<Product> products = productService.getAllProductsByName(name);
        if (!products.isEmpty()) {
            return new ResponseEntity<>(products, headerGenerator.getHeadersForSuccessGetMethod(), HttpStatus.OK);
        }
        return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
    }

    @GetMapping(value = "/products", params = "room")
    public ResponseEntity<List<Product>> getAllProductsByRoom(@RequestParam("room") String room) {
        List<Product> products = productService.getAllProductsByRoom(room);
        if (!products.isEmpty()) {
            return new ResponseEntity<>(products, headerGenerator.getHeadersForSuccessGetMethod(), HttpStatus.OK);
        }
        return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
    }

    @GetMapping(value = "/products", params = "material")
    public ResponseEntity<List<Product>> getAllProductsByMaterial(@RequestParam("material") String material) {
        List<Product> products = productService.getAllProductsByMaterial(material);
        if (!products.isEmpty()) {
            return new ResponseEntity<>(products, headerGenerator.getHeadersForSuccessGetMethod(), HttpStatus.OK);
        }
        return new ResponseEntity<>(headerGenerator.getHeadersForError(), HttpStatus.NOT_FOUND);
    }
}
