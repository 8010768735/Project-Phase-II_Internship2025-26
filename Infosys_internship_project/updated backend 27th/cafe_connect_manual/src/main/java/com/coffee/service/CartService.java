package com.coffee.service;

import org.springframework.stereotype.Service;

import com.coffee.entity.Cart;
import com.coffee.repository.CartRepository;

import java.util.List;

@Service
public class CartService {

    private final CartRepository repo;

    public CartService(CartRepository repo) {
        this.repo = repo;
    }

    public Cart addToCart(Cart cart) {

        // check if item already exists for user
        List<Cart> items = repo.findByUserId(cart.getUserId());

        for (Cart c : items) {
            if (c.getItemId().equals(cart.getItemId())) {
                c.setQuantity(c.getQuantity() + 1);
                if (cart.getCafeId() != null) {
                    c.setCafeId(cart.getCafeId());
                }
                if (cart.getCafeName() != null && !cart.getCafeName().isBlank()) {
                    c.setCafeName(cart.getCafeName());
                }
                if (cart.getImageUrl() != null && !cart.getImageUrl().isBlank()) {
                    c.setImageUrl(cart.getImageUrl());
                }
                if (cart.getOriginalPrice() != null) {
                    c.setOriginalPrice(cart.getOriginalPrice());
                }
                if (cart.getOfferLabel() != null && !cart.getOfferLabel().isBlank()) {
                    c.setOfferLabel(cart.getOfferLabel());
                }
                c.setPrice(cart.getPrice());
                return repo.save(c);
            }
        }

        cart.setQuantity(1);
        return repo.save(cart);
    }

    public List<Cart> getUserCart(Long userId) {
        return repo.findByUserId(userId);
    }

    public void removeItem(Long id) {
        repo.deleteById(id);
    }

    public void clearCart(Long userId) {
        List<Cart> items = repo.findByUserId(userId);
        repo.deleteAll(items);
    }
    
    public Cart updateQuantity(Cart cart) {

        Cart existing = repo.findById(cart.getId())
                .orElseThrow(() -> new RuntimeException("Item not found"));

        existing.setQuantity(cart.getQuantity());

        return repo.save(existing);
    }

    
}
