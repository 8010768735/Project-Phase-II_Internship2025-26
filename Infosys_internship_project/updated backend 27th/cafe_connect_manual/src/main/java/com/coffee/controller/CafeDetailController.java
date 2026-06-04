package com.coffee.controller;


import org.springframework.web.bind.annotation.*;

import com.coffee.entity.CafeDetails;
import com.coffee.entity.MenuItem;
import com.coffee.repository.MenuItemRepo;
import com.coffee.service.CafeDetailsService;

import java.util.List;

@RestController
@RequestMapping("/api/cafe")
@CrossOrigin(origins = "*")
public class CafeDetailController {

    private final CafeDetailsService cafeService;
	private MenuItemRepo menuItemRepo;

    public CafeDetailController(CafeDetailsService cafeService , MenuItemRepo menuItemRepo) {
        this.cafeService = cafeService;
        this.menuItemRepo=menuItemRepo; 
    }

    // Register cafe
    @PostMapping("/register")
    public CafeDetails registerCafe(@RequestBody CafeDetails cafe) {
        return cafeService.registerCafe(cafe);
    }

    // Get cafes by owner
    @GetMapping("/owner/{ownerId}")
    public List<CafeDetails> getCafesByOwner(@PathVariable Long ownerId) {

        return cafeService.getCafesByOwner(ownerId);

    }

	@GetMapping
    public List<CafeDetails> getAllCafes() {
        return cafeService.getAllCafes();
    }
	
	// Get menu items for a cafe
    @GetMapping("/{cafeId}/menu")
    public List<MenuItem> getMenuForCafe(@PathVariable Long cafeId) {
        return menuItemRepo.findByCafeId(cafeId);
    }
//    @GetMapping("/{id}")
//    public CafeDetails getCafeById(@PathVariable Long id) {
//        return cafeService.getAllCafes()
//                .stream()
//                .filter(cafe -> cafe.getId().equals(id))
//                .findFirst()
//                .orElseThrow(() -> new RuntimeException("Cafe not found"));
//    }

    
@GetMapping("/{id}")
    public CafeDetails getCafeById(@PathVariable Long id) {
        return cafeService.getCafeById(id);
    }

    @PutMapping("/{id}")
    public CafeDetails updateCafe(
            @PathVariable Long id,
            @RequestBody CafeDetails cafe
    ) {
        return cafeService.updateCafe(id, cafe.getOwnerId(), cafe);
    }

    @DeleteMapping("/{id}")
    public void deleteCafe(
            @PathVariable Long id,
            @RequestParam Long ownerId
    ) {
        cafeService.deleteCafe(id, ownerId);
    }

}



//import java.util.List;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import com.coffee.entity.CafeDetails;
//import com.coffee.service.CafeDetailsService;
//
//@RestController
//@RequestMapping("/api/cafe")
//@CrossOrigin(origins = "*")
//public class CafeDetailController {
//
//	@Autowired
//	private CafeDetailsService cafeDetailsService;
//	 
//	@PostMapping("/register")
//	public CafeDetails registerCafe( @RequestBody CafeDetails cafeDetails) {
//		return cafeDetailsService.saveCafeDetails(cafeDetails);
//	}
//	
//	@GetMapping("/owner/{ownerId}")
//	public List<CafeDetails> getCafesByOwner(@PathVariable Long ownerId) {
//	    return cafeDetailsService.getCafesByOwner(ownerId);
//	}
//
//	   

//	
//	
//
//	
//}
