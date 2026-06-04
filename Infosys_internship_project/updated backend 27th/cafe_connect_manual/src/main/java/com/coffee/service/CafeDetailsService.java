package com.coffee.service;

import org.springframework.stereotype.Service;

import com.coffee.entity.CafeDetails;
import com.coffee.repository.CafeDetailsRepo;

import java.util.List;

@Service
public class CafeDetailsService {

    private final CafeDetailsRepo cafeRepo;

    public CafeDetailsService(CafeDetailsRepo cafeRepo) {
        this.cafeRepo = cafeRepo;
    }

    // Register Cafe
    public CafeDetails registerCafe(CafeDetails cafe) {
        return cafeRepo.save(cafe);
    }

    // Get cafes by owner
    public List<CafeDetails> getCafesByOwner(Long ownerId) {

        return cafeRepo.findByOwnerId(ownerId);

    }

    public List<CafeDetails> getAllCafes() {
        return cafeRepo.findAll();
    }
     
    public CafeDetails getCafeById(Long id) {
        return cafeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Cafe not found"));
    }

    public CafeDetails updateCafe(Long id, Long ownerId, CafeDetails updatedCafe) {
        CafeDetails existingCafe = getCafeById(id);
        validateOwnership(existingCafe, ownerId);

        existingCafe.setCafeName(updatedCafe.getCafeName());
        existingCafe.setAddress(updatedCafe.getAddress());
        existingCafe.setCity(updatedCafe.getCity());
        existingCafe.setState(updatedCafe.getState());
        existingCafe.setPincode(updatedCafe.getPincode());
        existingCafe.setSeatingCapacity(updatedCafe.getSeatingCapacity());
        existingCafe.setOpeningTime(updatedCafe.getOpeningTime());
        existingCafe.setClosingTime(updatedCafe.getClosingTime());
        existingCafe.setWorkingDays(updatedCafe.getWorkingDays());
        existingCafe.setGstNumber(updatedCafe.getGstNumber());
        existingCafe.setFssaiLicense(updatedCafe.getFssaiLicense());

        String nextImageUrl = updatedCafe.getImageUrl();
        if (nextImageUrl == null || nextImageUrl.isBlank()) {
            nextImageUrl = existingCafe.getImageUrl();
        }
        existingCafe.setImageUrl(nextImageUrl);

        return cafeRepo.save(existingCafe);
    }

    public void deleteCafe(Long id, Long ownerId) {
        CafeDetails existingCafe = getCafeById(id);
        validateOwnership(existingCafe, ownerId);
        cafeRepo.delete(existingCafe);
    }

    private void validateOwnership(CafeDetails cafe, Long ownerId) {
        if (ownerId == null || !ownerId.equals(cafe.getOwnerId())) {
            throw new RuntimeException("You are not allowed to modify this cafe");
        }
    }

//    public List<MenuItem> findByCafeId(Long cafeId){
//    	    return cafeRepo.findById(cafeId);
//    }
}





//import java.util.List;
//import java.util.Optional;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//
//import com.coffee.entity.CafeDetails;
//import com.coffee.repository.CafeDetailsRepo;
//
//@Service
//public class CafeDetailsService {
//
//	@Autowired
//	private CafeDetailsRepo cafeDetailsRepo;
//	
//	
//	public CafeDetails saveCafeDetails(CafeDetails cafeDetails) {
//		return cafeDetailsRepo.save(cafeDetails);
//	}
//	
////	public Optional<CafeDetails> getCafeDetails() {
////		 List<CafeDetails> details=cafeDetailsRepo.findAll();
////		 return details.isEmpty() ? Optional.empty() : Optional.of(details.get(0));
////	}
//	
//	 public List<CafeDetails> getCafesByOwner(Long ownerId) {
//	        return cafeDetailsRepo.findByOwnerId(ownerId);
//	    }
//	
	 
//	
//	
//}
