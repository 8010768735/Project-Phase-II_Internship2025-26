package com.coffee.controller;


import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.coffee.entity.MenuItem;
import com.coffee.service.MenuItemService;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/menu")
@CrossOrigin(origins = "http://localhost:5173")
public class MenuItemController {

    private final MenuItemService menuService;

    public MenuItemController(MenuItemService menuService) {
        this.menuService = menuService;
    }

    // Get menu by cafe
    @GetMapping("/cafe/{cafeId}")
    public List<MenuItem> getMenuByCafe(@PathVariable Long cafeId) {

        return menuService.getMenuByCafe(cafeId);

    }

    // Add menu item
    @PostMapping("/cafe/{cafeId}")
    public MenuItem addMenuItem(
            @PathVariable Long cafeId,
            @RequestParam String itemName,
            @RequestParam Double price,
            @RequestParam String description,
            @RequestParam(required = false) String seasonalOfferSeason,
            @RequestParam(required = false) Double seasonalOfferPercentage,
            @RequestParam(required = false) MultipartFile image
    ) throws IOException {

        return menuService.addMenuItem(cafeId, itemName, price, description, seasonalOfferSeason, seasonalOfferPercentage, image);

    }

    // Update menu item
    @PutMapping("/{id}")
    public MenuItem updateMenuItem(
            @PathVariable Long id,
            @RequestParam String itemName,
            @RequestParam Double price,
            @RequestParam String description,
            @RequestParam(required = false) String seasonalOfferSeason,
            @RequestParam(required = false) Double seasonalOfferPercentage,
            @RequestParam(required = false) MultipartFile image
    ) throws IOException {

        return menuService.updateMenuItem(id, itemName, price, description, seasonalOfferSeason, seasonalOfferPercentage, image);

    }

    // Delete menu item
    @DeleteMapping("/{id}")
    public void deleteMenuItem(@PathVariable Long id) {

        menuService.deleteMenuItem(id);

    }

}




//import java.io.IOException;
//import java.util.List;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.web.bind.annotation.CrossOrigin;
//import org.springframework.web.bind.annotation.DeleteMapping;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.PathVariable;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.PutMapping;
//import org.springframework.web.bind.annotation.RequestBody;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RequestParam;
//import org.springframework.web.bind.annotation.RestController;
//import org.springframework.web.multipart.MultipartFile;
//
//import com.coffee.entity.MenuItem;
//import com.coffee.service.MenuItemService;
//
//@RestController
//@RequestMapping("/api/menu")
//@CrossOrigin(origins="http://localhost:5173")
//public class MenuItemController {
//
//	@Autowired
//	private MenuItemService menuItemService;
//	
//	
////	@GetMapping("/cafe/{cafeId}") 
////	public List<MenuItem> getall(){
////		return menuItemService.getMenu();
////	}
//	
//	@GetMapping("/cafe/{cafeId}")
//	public List<MenuItem> getMenuByCafe(@PathVariable Long cafeId) {
//	    return menuItemService.getMenuByCafe(cafeId);
//	}
//
//
//	
////	@PostMapping(value="/cafe/{cafeId}", consumes="multipart/form-data")
////	public MenuItem addItem(
////	        @PathVariable Long cafeId,
////	        @RequestParam("itemName") String itemName,
////	        @RequestParam("price") double price,
////	        @RequestParam(value="description", required=false) String description,
////	        @RequestParam("image") MultipartFile image
////	) throws IOException {
////
////	    return menuItemService.addMenuItem(cafeId, itemName, price, description, image);
////	}
//	
//	
//	
//	@PutMapping(value="/menu/{id}", consumes="multipart/form-data")
//	public MenuItem updateItem(
//	        @PathVariable Long id,
//	        @RequestParam("itemName") String itemName,
//	        @RequestParam("price") double price,
//	        @RequestParam(value="description", required=false) String description,
//	        @RequestParam(value="image", required=false) MultipartFile image
//	) throws IOException {
//
//	    return menuItemService.updateMenuItem(id, itemName, price, description, image);
//	}
// 
//	
//	 @DeleteMapping("/menu/{id}")
//	 public void deleteItem(@PathVariable Long id) {
//		 menuItemService.deleteMenuItem(id);
//	 }
//	
//	
//}



