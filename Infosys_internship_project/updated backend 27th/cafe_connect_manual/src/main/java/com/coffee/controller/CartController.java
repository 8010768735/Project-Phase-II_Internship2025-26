package com.coffee.controller;


import org.springframework.web.bind.annotation.*;

import com.coffee.entity.Cart;
import com.coffee.service.CartService;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin
public class CartController {

    private final CartService service;

    public CartController(CartService service) {
        this.service = service;
    }

    @PostMapping("/add")
    public Cart addToCart(@RequestBody Cart cart) {
        return service.addToCart(cart);
    }

    @GetMapping("/user/{userId}")
    public List<Cart> getCart(@PathVariable Long userId) {
        return service.getUserCart(userId);
    }

    @DeleteMapping("/{id}")
    public void remove(@PathVariable Long id) {
        service.removeItem(id);
    }

    @DeleteMapping("/clear/{userId}")
    public void clear(@PathVariable Long userId) {
        service.clearCart(userId);
    }
    
    @PutMapping("/update")
    public Cart updateQuantity(@RequestBody Cart cart) {
        return service.updateQuantity(cart);
    }

}
