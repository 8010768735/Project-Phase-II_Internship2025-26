//package com.coffee.service;
//
//import java.util.*;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//import com.coffee.io.DashboardResponse;
//import com.coffee.entity.User;
//import com.coffee.repository.UserRepository;
//
//@Service
//public class AdminService {
//
//    @Autowired
//    private UserRepository userRepository;
//
//    public DashboardResponse getDashboardData() {
//
//        long total = userRepository.count();
//        long active = userRepository.countByActiveTrue();
//        long inactive = userRepository.countByActiveFalse();
//        long notReset = userRepository.countByPasswordResetFalse();
//
//        Calendar cal = Calendar.getInstance();
//        cal.set(Calendar.HOUR_OF_DAY, 0);
//        Date todayStart = cal.getTime();
//
//        long today = userRepository.countByCreatedAtAfter(todayStart);
//
//        // Role distribution
//        Map<String, Long> roles = new HashMap<>();
//        roles.put("Customer", userRepository.countByRole("customer"));
//        roles.put("Cafe Owner", userRepository.countByRole("cafe_owner"));
//        roles.put("Chef", userRepository.countByRole("chef"));
//        roles.put("Waiter", userRepository.countByRole("waiter"));
//
//        // Dummy weekly growth (replace with real query later)
//        Map<String, Long> weekly = new LinkedHashMap<>();
//        weekly.put("Mon", 5L);
//        weekly.put("Tue", 8L);
//        weekly.put("Wed", 12L);
//        weekly.put("Thu", 7L);
//        weekly.put("Fri", 10L);
//        weekly.put("Sat", 15L);
//        weekly.put("Sun", 9L);
//
//        return new DashboardResponse(
//                total, active, inactive, notReset, today,
//                roles, weekly
//        );
//    }
//}













package com.coffee.service;

import java.util.Comparator;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.coffee.entity.CafeDetails;
import com.coffee.entity.User;
import com.coffee.io.AdminCafeResponse;
import com.coffee.io.AdminDashboardSummaryResponse;
import com.coffee.io.AdminUserResponse;
import com.coffee.repository.CafeDetailsRepo;
import com.coffee.repository.UserRepository;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CafeDetailsRepo cafeDetailsRepo;

    @Autowired
    private EmailService emailService;

    public List<AdminUserResponse> getPendingRequests() {
        return userRepository.findByStatus("PENDING").stream()
                .filter(this::isNonAdminUser)
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapUser)
                .collect(Collectors.toList());
    }

    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .filter(this::isNonAdminUser)
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapUser)
                .collect(Collectors.toList());
    }

    public List<AdminCafeResponse> getAllCafes() {
        return cafeDetailsRepo.findAll().stream()
                .sorted(Comparator.comparing(CafeDetails::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapCafe)
                .collect(Collectors.toList());
    }

    public AdminDashboardSummaryResponse getDashboardSummary() {
        List<User> users = userRepository.findAll().stream()
                .filter(this::isNonAdminUser)
                .toList();

        AdminDashboardSummaryResponse summary = new AdminDashboardSummaryResponse();
        summary.setTotalUsers(users.size());
        summary.setApprovedUsers(users.stream().filter(user -> "APPROVED".equalsIgnoreCase(user.getStatus())).count());
        summary.setPendingUsers(users.stream().filter(user -> "PENDING".equalsIgnoreCase(user.getStatus())).count());
        summary.setRejectedUsers(users.stream().filter(user -> "REJECTED".equalsIgnoreCase(user.getStatus())).count());
        summary.setTotalCustomers(users.stream().filter(user -> "CUSTOMER".equalsIgnoreCase(user.getRole())).count());
        summary.setTotalCafeOwners(users.stream().filter(user -> "CAFE_OWNER".equalsIgnoreCase(user.getRole())).count());
        summary.setTotalCafes(cafeDetailsRepo.count());
        return summary;
    }

    public String approveUser(Long id){

        User user = userRepository.findById(id).orElseThrow();

        String otp = String.valueOf(new Random().nextInt(900000) + 100000);

        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        user.setStatus("APPROVED");

        userRepository.save(user);

        emailService.sendOtpMail(user.getEmail(), otp);

        return "User approved successfully";
    }
    
    


    public String rejectUser(Long id){

        User user = userRepository.findById(id).orElseThrow();

        user.setStatus("REJECTED");

        userRepository.save(user);

        return "User rejected";
    }

    private boolean isNonAdminUser(User user) {
        return user.getRole() == null || !"ADMIN".equalsIgnoreCase(user.getRole());
    }

    private AdminUserResponse mapUser(User user) {
        AdminUserResponse response = new AdminUserResponse();
        response.setId(user.getId());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRole(user.getRole());
        response.setStatus(user.getStatus());
        response.setActive(user.isActive());
        response.setPasswordReset(user.isPasswordReset());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }

    private AdminCafeResponse mapCafe(CafeDetails cafe) {
        AdminCafeResponse response = new AdminCafeResponse();
        response.setId(cafe.getId());
        response.setCafeName(cafe.getCafeName());
        response.setAddress(cafe.getAddress());
        response.setCity(cafe.getCity());
        response.setState(cafe.getState());
        response.setPincode(cafe.getPincode());
        response.setSeatingCapacity(cafe.getSeatingCapacity());
        response.setOpeningTime(cafe.getOpeningTime());
        response.setClosingTime(cafe.getClosingTime());
        response.setWorkingDays(cafe.getWorkingDays());

        userRepository.findById(cafe.getOwnerId()).ifPresent(owner -> {
            response.setOwnerName(String.format("%s %s",
                    owner.getFirstName() == null ? "" : owner.getFirstName(),
                    owner.getLastName() == null ? "" : owner.getLastName()).trim());
            response.setOwnerEmail(owner.getEmail());
        });

        return response;
    }
}










