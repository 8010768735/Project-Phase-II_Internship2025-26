package com.coffee.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.coffee.entity.MenuItem;
import com.coffee.repository.CafeDetailsRepo;
import com.coffee.repository.MenuItemRepo;
import com.coffee.entity.CafeDetails;

import java.io.File;
import java.io.IOException;
import java.util.List;

@Service
public class MenuItemService {

    private final MenuItemRepo menuRepo;
	private final CafeDetailsRepo cafeRepo;

    public MenuItemService(MenuItemRepo menuRepo,CafeDetailsRepo cafeRepo) {
        this.menuRepo = menuRepo;
        this.cafeRepo=cafeRepo;
    }

    // Get menu items by cafe
    public List<MenuItem> getMenuByCafe(Long cafeId) {

        return menuRepo.findByCafeId(cafeId);

    }

 // Add menu item
//    public MenuItem addMenuItem(Long cafeId,
//                                String itemName,
//                                Double price,
//                                String description,
//                                MultipartFile image) throws IOException {
//
//    	CafeDetails cafe=cafeRepo.findById(cafeId);
//    	.orElseThrow(()-> new RuntimeException("cafe not found"));
//       
//    	MenuItem item = new MenuItem();
// 
////        item.setCafeId(cafeId);
//        item.setCafe(cafe); // ✅ correct
//
//        item.setItemName(itemName);
//        item.setPrice(price);
//        item.setDescription(description);
//
//        if (image != null && !image.isEmpty()) {
//
//            String uploadDir = System.getProperty("user.dir") + "/uploads/";
//
//            File dir = new File(uploadDir);
//            if (!dir.exists()) {
//                dir.mkdirs();
//            }
//
//            String fileName = image.getOriginalFilename();
//            String filePath = uploadDir + fileName;
//
//            image.transferTo(new File(filePath));
//
//            // ✅ Save only relative path
//            item.setImageUrl("/uploads/" + fileName);
//        }
//
//        return menuRepo.save(item);
//    }

    public MenuItem addMenuItem(Long cafeId,
            String itemName,
            Double price,
            String description,
            String seasonalOfferSeason,
            Double seasonalOfferPercentage,
            MultipartFile image) throws IOException {

			CafeDetails cafe = cafeRepo.findById(cafeId)
			.orElseThrow(() -> new RuntimeException("Cafe not found"));
			
			MenuItem item = new MenuItem();
			
			item.setCafe(cafe);   // ✅ set cafe object instead of cafeId
			item.setItemName(itemName);
			item.setPrice(price);
			item.setDescription(description);
			item.setSeasonalOfferSeason(normalizeSeasonalOfferSeason(seasonalOfferSeason));
			item.setSeasonalOfferPercentage(normalizeSeasonalOfferPercentage(seasonalOfferPercentage));
			
			if (image != null && !image.isEmpty()) {
			
			String uploadDir = System.getProperty("user.dir") + "/uploads/";
			
			File dir = new File(uploadDir);
			if (!dir.exists()) {
			dir.mkdirs();
			}
			
			String fileName = image.getOriginalFilename();
			String filePath = uploadDir + fileName;
			
			image.transferTo(new File(filePath));
			
			item.setImageUrl("/uploads/" + fileName);
			}
			
			return menuRepo.save(item);
			}


 // Update menu item
    public MenuItem updateMenuItem(Long id,
                                   String itemName,
                                   Double price,
                                   String description,
                                   String seasonalOfferSeason,
                                   Double seasonalOfferPercentage,
                                   MultipartFile image) throws IOException {

        MenuItem item = menuRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        item.setItemName(itemName);
        item.setPrice(price);
        item.setDescription(description);
        item.setSeasonalOfferSeason(normalizeSeasonalOfferSeason(seasonalOfferSeason));
        item.setSeasonalOfferPercentage(normalizeSeasonalOfferPercentage(seasonalOfferPercentage));

        if (image != null && !image.isEmpty()) {

            String uploadDir = System.getProperty("user.dir") + "/uploads/";

            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String fileName = image.getOriginalFilename();
            String filePath = uploadDir + fileName;

            image.transferTo(new File(filePath));

            // ✅ Save only relative path
            item.setImageUrl("/uploads/" + fileName);
        }

        return menuRepo.save(item);
    }

    private String normalizeSeasonalOfferSeason(String seasonalOfferSeason) {
        if (seasonalOfferSeason == null || seasonalOfferSeason.isBlank()) {
            return null;
        }

        return seasonalOfferSeason.trim().toUpperCase();
    }

    private Double normalizeSeasonalOfferPercentage(Double seasonalOfferPercentage) {
        if (seasonalOfferPercentage == null || seasonalOfferPercentage <= 0) {
            return 0.0;
        }

        return Math.min(seasonalOfferPercentage, 100.0);
    }


    // Delete menu item
    public void deleteMenuItem(Long id) {

        menuRepo.deleteById(id);

    }

}







//package com.coffee.service;
//
//import java.io.IOException;
//import java.nio.file.Files;
//import java.nio.file.Path;
//import java.nio.file.Paths;
//import java.util.List;
//import java.util.UUID;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//import org.springframework.web.multipart.MultipartFile;
//
//import com.coffee.entity.CafeDetails;
//import com.coffee.entity.MenuItem;
//import com.coffee.repository.CafeDetailsRepo;
//import com.coffee.repository.MenuItemRepo;
//
//@Service
//public class MenuItemService {
//	
//	
//	
//	@Autowired
//	private MenuItemRepo menuItemRepo;
//
//	
//	@Autowired
//	private CafeDetailsRepo cafeDetailsRepo;
//
//
//	
//	public List<MenuItem> getMenu() {
//		return menuItemRepo.findAll();
//	}
//	
//	public List<MenuItem> getMenuByCafe(Long cafeId) {
//	    return menuItemRepo.findByCafeId(cafeId);
//	}
//
// 
//	
////	public MenuItem addMenuItem(Long cafeId,
////            String name,
////            double price,
////            String description,
////            MultipartFile image) throws IOException {
////
////		CafeDetails cafe = cafeDetailsRepo.findById(cafeId).orElseThrow();
////		
////		String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();
////		
////		Path uploadPath = Paths.get("uploads/" + fileName);
////		
////		Files.copy(image.getInputStream(), uploadPath);
////		
////		MenuItem item = new MenuItem();
////		
////		item.setItemName(name);
////		item.setPrice(price);
////		item.setDescription(description);
////		item.setImageUrl("http://localhost:8080/uploads/" + fileName);
////		item.setCafe(cafe);
////		
////		return menuItemRepo.save(item);
////		}
//
//		
//		
//	public MenuItem updateMenuItem(Long id,
//            String itemName,
//            double price,
//            String description,
//            MultipartFile image) throws IOException {
//
//		// 1️⃣ Find existing menu item
//		MenuItem item = menuItemRepo.findById(id).orElseThrow();
//		
//		// 2️⃣ Update fields
//		item.setItemName(itemName);
//		item.setPrice(price);
//		item.setDescription(description);
//		
//		// 3️⃣ Update image only if new image uploaded
//		if (image != null && !image.isEmpty()) {
//		
//		String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();
//		
//		Path uploadDir = Paths.get("uploads");
//		
//		if (!Files.exists(uploadDir)) {
//		Files.createDirectories(uploadDir);
//		}
//		
//		Path filePath = uploadDir.resolve(fileName);
//		
//		Files.copy(image.getInputStream(), filePath);
//		
//		String imageUrl = "http://localhost:8080/uploads/" + fileName;
//		
//		item.setImageUrl(imageUrl);
//		}
//		
//		// 4️⃣ Save updated item
//		return menuItemRepo.save(item);
//		}
//
//	public MenuItem get(Long id){
//        return menuItemRepo.findById(id).orElse(null);
//    }
//	
//	
//	public void deleteMenuItem(Long id) {
//		menuItemRepo.deleteById(id);
//		}
//		
//	}
//
	



	

