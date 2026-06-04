package com.coffee.service;

import org.springframework.stereotype.Service;

import com.coffee.exception.InvalidCredentialsException;
import com.coffee.entity.CafeDetails;
import com.coffee.entity.Staff;
import com.coffee.repository.CafeDetailsRepo;
import com.coffee.repository.StaffRepo;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class StaffService {

    private final StaffRepo staffRepository;
    private final CafeDetailsRepo cafeRepository;
    private final PasswordEncoder passwordEncoder;

    
    public StaffService(StaffRepo staffRepository, CafeDetailsRepo cafeRepository, PasswordEncoder passwordEncoder) {
        this.staffRepository = staffRepository;
        this.cafeRepository = cafeRepository;
        this.passwordEncoder=passwordEncoder;
    }

    // ✅ GET STAFF BY CAFE
    public List<Staff> getStaffByCafe(Long cafeId) {
        return staffRepository.findByCafeId(cafeId);
    }

    // ✅ ADD STAFF (IMPORTANT)
    public Staff addStaff(Long cafeId, Staff staff) {

        CafeDetails cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new RuntimeException("Cafe not found"));

        staff.setEmail(normalizeEmail(staff.getEmail()));
        staff.setRole(normalizeRole(staff.getRole()));
        String rawPassword = staff.getPassword() == null ? "" : staff.getPassword().trim();

        if (rawPassword.isEmpty()) {
            throw new InvalidCredentialsException("Password is required while creating staff.");
        }

        staff.setPassword(passwordEncoder.encode(rawPassword));

        // ⭐ LINK STAFF TO CAFE
        staff.setCafe(cafe);

        return staffRepository.save(staff);
    }

    // ✅ UPDATE STAFF
    public Staff updateStaff(Long id, Staff updatedStaff) {

        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        staff.setName(updatedStaff.getName());
        staff.setEmail(normalizeEmail(updatedStaff.getEmail()));
        staff.setPhone(updatedStaff.getPhone());
        staff.setRole(normalizeRole(updatedStaff.getRole()));
        staff.setGender(updatedStaff.getGender());
        staff.setAddress(updatedStaff.getAddress());
        staff.setQualifications(updatedStaff.getQualifications());
        if (updatedStaff.getAadharCardImage() != null && !updatedStaff.getAadharCardImage().isEmpty()) {
            staff.setAadharCardImage(updatedStaff.getAadharCardImage());
            staff.setAadharCardFileName(updatedStaff.getAadharCardFileName());
        }

        // ⭐ PASSWORD SAFE UPDATE
        if (updatedStaff.getPassword() != null && !updatedStaff.getPassword().isEmpty()) {
            if (!updatedStaff.getPassword().equals(staff.getPassword())) {
                staff.setPassword(passwordEncoder.encode(updatedStaff.getPassword()));
            }
        }


        return staffRepository.save(staff);
    }

    // ✅ DELETE STAFF
    public void deleteStaff(Long id) {
        staffRepository.deleteById(id);
    }
    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String normalizeRole(String role) {
        return role == null ? null : role.trim();
    }
}










//package com.coffee.service;
//
//
//import org.springframework.stereotype.Service;
//
//import com.coffee.entity.CafeDetails;
//import com.coffee.entity.Staff;
//import com.coffee.repository.CafeDetailsRepo;
//import com.coffee.repository.StaffRepo;
//
//import java.util.List;
//import java.util.Optional;
//
//@Service
//public class StaffService {
//
//    private final StaffRepo staffRepo;
//    private final CafeDetailsRepo cafeDetailsRepo;
//    
//    public StaffService(StaffRepo staffRepo ,CafeDetailsRepo cafeDetailsRepo ) {
//        this.staffRepo = staffRepo;
//        this.cafeDetailsRepo=cafeDetailsRepo;
//    }
//
//    // Get staff by cafe
//    public List<Staff> getStaffByCafe(Long cafeId) {
//        return staffRepo.findByCafeId(cafeId);
//    }
//
//    // Add staff
//    public Staff addStaff(Long cafeId, Staff staff) {
//    	   CafeDetails cafe = cafeDetailsRepo.findById(cafeId)
//                .orElseThrow(() -> new RuntimeException("Cafe not found"));
//    	    staff.setCafe(cafe);
//        return staffRepo.save(staff);
//    }
//
//    // Update staff
//    public Staff updateStaff(Long id, Staff updatedStaff) {
//
//        Optional<Staff> optionalStaff = staffRepo.findById(id);
//
//        if(optionalStaff.isPresent()) {
//
//            Staff staff = optionalStaff.get();
//
//            staff.setName(updatedStaff.getName());
//            staff.setEmail(updatedStaff.getEmail());
//            staff.setPhone(updatedStaff.getPhone());
//            staff.setGender(updatedStaff.getGender());
//            staff.setAddress(updatedStaff.getAddress());
//            staff.setQualifications(updatedStaff.getQualifications());
//            staff.setRole(updatedStaff.getRole());
//
//            return staffRepo.save(staff);
//        }
//
//        return null;
//    }
//
//    // Delete staff
//    public void deleteStaff(Long id) {
//        staffRepo.deleteById(id);
//    }
//
//}
//
//
