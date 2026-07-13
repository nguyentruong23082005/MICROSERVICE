package com.rainbowforest.productcatalogservice.service;

import com.rainbowforest.productcatalogservice.entity.Product;
import com.rainbowforest.productcatalogservice.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    public ProductServiceImpl(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public List<Product> getAllProduct() {
        return productRepository.findAllByOrderByIdAsc();
    }

    @Override
    public Page<Product> getAllProduct(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    @Override
    public Page<Product> searchProductsAdmin(String name, String category, Boolean inStock, Pageable pageable) {
        String nameClean = (name == null || name.trim().isEmpty()) ? null : name.trim();
        String catClean = (category == null || category.trim().isEmpty()) ? null : category.trim();
        return productRepository.searchProductsAdmin(nameClean, catClean, inStock, pageable);
    }

    @Override
    public List<Product> getAllProductByCategory(String category) {
        return productRepository.findAllByCategoryOrderByIdAsc(category);
    }

    @Override
    public List<Product> getAllProductByCategorySlug(String categorySlug) {
        return productRepository.findAllByCategorySlugOrLegacyCategory(categorySlug);
    }

    @Override
    public Product getProductById(Long id) {
        if (id == null) {
            return null;
        }
        return productRepository.findById(id).orElse(null);
    }

    @Override
    public List<Product> getAllProductsByName(String name) {
        return productRepository.findAllByProductNameOrderByIdAsc(name);
    }

    @Override
    public List<Product> getAllProductsByRoom(String room) {
        return productRepository.findAllByRoomOrderByIdAsc(room);
    }

    @Override
    public List<Product> getAllProductsByMaterial(String material) {
        return productRepository.findAllByMaterialOrderByIdAsc(material);
    }

    @Override
    public Product addProduct(Product product) {
        if (product == null) {
            throw new IllegalArgumentException("Product is required");
        }
        prepareProductForSave(product);
        return productRepository.save(product);
    }

    @Override
    public Product updateProduct(Long productId, Product product) {
        if (productId == null || product == null) {
            throw new IllegalArgumentException("Product id and payload are required");
        }
        if (productRepository.findById(productId).isEmpty()) {
            return null;
        }
        product.setId(productId);
        return addProduct(product);
    }

    @Override
    public boolean deleteProduct(Long productId) {
        if (productId == null || !productRepository.existsById(productId)) {
            return false;
        }
        productRepository.deleteById(productId);
        return true;
    }

    private void prepareProductForSave(Product product) {
        product.getImages().forEach(image -> image.setProduct(product));
        product.getSpecifications().forEach(specification -> specification.setProduct(product));
        if (product.getCategoryRef() != null && product.getCategoryRef().getName() != null) {
            product.setCategory(product.getCategoryRef().getName());
        }
    }
}
