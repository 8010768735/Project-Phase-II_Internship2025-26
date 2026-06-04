package com.coffee.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.coffee.entity.PasswordResetOtp;
import com.coffee.entity.Staff;
import com.coffee.entity.User;
import com.coffee.io.LoginRequest;
import com.coffee.io.LoginResponse;
import com.coffee.io.RegisterRequest;
import com.coffee.io.ResetPasswordRequest;
import com.coffee.io.ForgotPasswordRequest;
import com.coffee.repository.PasswordResetOtpRepository;
import com.coffee.repository.StaffRepo;
import com.coffee.repository.UserRepository;

import jakarta.transaction.Transactional;

import com.coffee.exception.EmailAlreadyExistsException;
import com.coffee.exception.InvalidCredentialsException;
import com.coffee.exception.OtpExpiredException;
import com.coffee.exception.UserNotFoundException;


@Service
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
	private final PasswordResetOtpRepository otpRepository;
	private final StaffRepo staffRepo;

    public AuthenticationService(UserRepository userRepository,
                                 PasswordEncoder passwordEncoder,
                                 EmailService emailService, 
                                 PasswordResetOtpRepository otpRepository,
                                 StaffRepo staffRepo) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.otpRepository = otpRepository;
        this.staffRepo=staffRepo;
    }

    // ================= REGISTER =================
    public String registerUser(RegisterRequest request) {

        String normalizedEmail = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("Email already registered. Please login.");
        }

        User user = new User();
        
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(normalizedEmail);
        user.setPhone(request.getPhone());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(request.getGender());
        user.setHighestQualification(request.getHighestQualification());
        user.setInstitutionName(request.getInstitutionName());
        user.setYearOfPassing(request.getYearOfPassing());
        user.setAdditionalCertifications(request.getAdditionalCertifications());
        user.setSpecialization(request.getSpecialization());
        user.setCurrentEmploymentStatus(request.getCurrentEmploymentStatus());
        user.setSkills(request.getSkills());
        user.setIdProofType(request.getIdProofType());
        user.setIdProofNumber(request.getIdProofNumber());
        user.setAddress(request.getAddress());
        user.setCity(request.getCity());
        user.setState(request.getState());
        user.setPincode(request.getPincode());
        user.setCountry(request.getCountry());

        user.setRole(request.getRole());

        // system fields
        user.setStatus("PENDING");

        userRepository.save(user);

        return "Registration request submitted. Waiting for admin approval.";
    }


//    ========== reset password ========
    
//    @Transactional
//    public String resetPassword(ResetPasswordRequest request) {
//
//        String email = request.getEmail();
//
//        // =========================
//        // 1️⃣ FIND OTP BY EMAIL
//        // =========================
//        PasswordResetOtp otpRecord = otpRepository
//                .findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("OTP not found"));
//
//        // =========================
//        // 2️⃣ VALIDATE OTP
//        // =========================
//        if (!otpRecord.getOtp().equals(request.getOtp())) {
//            throw new RuntimeException("Invalid OTP");
//        }
//
//        if (otpRecord.getExpiryTime().isBefore(LocalDateTime.now())) {
//            throw new RuntimeException("OTP expired");
//        }
//
//        // =========================
//        // 3️⃣ CHECK USER
//        // =========================
//        var userOpt = userRepository.findByEmail(email);
//
//        if (userOpt.isPresent()) {
//            User user = userOpt.get();
//
//            user.setPassword(passwordEncoder.encode(request.getPassword()));
//            user.setPasswordReset(true);
//
//            userRepository.save(user);
//            otpRepository.delete(otpRecord);
//
//            return "Password reset successful (User)";
//        }
//
//        // =========================
//        // 4️⃣ CHECK STAFF
//        // =========================
//        Staff staff = staffRepo.findByEmail(email);
//
//        if (staff != null) {
//
//            staff.setPassword(passwordEncoder.encode(request.getPassword())); // ✅ FIXED
//            staffRepo.save(staff);
//
//            otpRepository.delete(otpRecord);
//
//            return "Password reset successful (Staff)";
//        }
//
//        // =========================
//        // 5️⃣ NOT FOUND
//        // =========================
//        throw new RuntimeException("Email not registered");
//    }
//
//    
    
    
    
//    @Transactional
//    public String resetPassword(ResetPasswordRequest request) {
//
//        String email = request.getEmail();
//
//        // =========================
//        // 1️⃣ CHECK USERS
//        // =========================
//        var userOpt = userRepository.findByEmail(email);
//
//        if (userOpt.isPresent()) {
//
//            User user = userOpt.get();
//
//            PasswordResetOtp otpRecord = otpRepository
//                    .findByUserIdAndOtp(user.getId(), request.getOtp())
//                    .orElseThrow(() -> new RuntimeException("Invalid OTP"));
//
//            if (otpRecord.getExpiryTime().isBefore(LocalDateTime.now())) {
//                throw new RuntimeException("OTP expired");
//            }
//
//            user.setPassword(passwordEncoder.encode(request.getPassword()));
//            user.setPasswordReset(true);
//
//            userRepository.save(user);
//            otpRepository.delete(otpRecord);
//
//            return "Password reset successful";
//        }
//
//        // =========================
//        // 2️⃣ CHECK STAFF
//        // =========================
//        Staff staff = staffRepo.findByEmail(email);
//
//        if (staff != null) {
//
//            PasswordResetOtp otpRecord = otpRepository
//                    .findByUserIdAndOtp(-staff.getId(), request.getOtp())
//                    .orElseThrow(() -> new RuntimeException("Invalid OTP"));
//
//            if (otpRecord.getExpiryTime().isBefore(LocalDateTime.now())) {
//                throw new RuntimeException("OTP expired");
//            }
//
//            // ⚠️ storing plain text (same as your current logic)
//            staff.setPassword(request.getPassword());
//
//            staffRepo.save(staff);
//            otpRepository.delete(otpRecord);
//
//            return "Password reset successful";
//        }
//
//        // =========================
//        // 3️⃣ NOT FOUND
//        // =========================
//        throw new RuntimeException("Email not registered");
//    }
//
//    
    
//    @Transactional
//    public String resetPassword(ResetPasswordRequest request) {
//
//        // Find user
//        User user = userRepository.findByEmail(request.getEmail())
//                .orElseThrow(() -> new RuntimeException("Email not registered"));
//
//        System.out.println("ENTERED OTP: " + request.getOtp());
//        System.out.println("USER ID: " + user.getId());
//
//        
//        // Find OTP record
//        PasswordResetOtp otpRecord = otpRepository.findByUserIdAndOtp(user.getId(), request.getOtp())
//                .orElseThrow(() -> new RuntimeException("Invalid OTP"));
//
//        // Check expiry
//        if (otpRecord.getExpiryTime().isBefore(LocalDateTime.now())) {
//            throw new RuntimeException("OTP expired");
//        }
//
//        // Update password
//        user.setPassword(passwordEncoder.encode(request.getPassword()));
//        
//        user.setPasswordReset(true); 
//        userRepository.save(user);
//        // Delete used OTP
//        otpRepository.delete(otpRecord);
//
//        return "Password reset successful";
//    }

    
//    @Transactional
//    public String resetPassword(ResetPasswordRequest request) {
//
//        User user = userRepository.findByEmail(request.getEmail())
//                .orElseThrow(() -> new RuntimeException("Email not registered"));
//
//        PasswordResetOtp otpRecord = otpRepository
//                .findTopByUserIdOrderByExpiryTimeDesc(user.getId())
//                .orElseThrow(() -> new RuntimeException("OTP not found"));
//
//        if (!otpRecord.getOtp().trim().equals(request.getOtp().trim())) {
//            throw new RuntimeException("Invalid OTP");
//        }
//
//        if (otpRecord.getExpiryTime().isBefore(LocalDateTime.now())) {
//            throw new RuntimeException("OTP expired");
//        }
//
//        user.setPassword(passwordEncoder.encode(request.getPassword()));
//        user.setPasswordReset(true);
//        userRepository.save(user);
//
//        otpRepository.delete(otpRecord);
//
//        return "Password reset successful";
//    }

    
//  ========== reset password ========
  @Transactional
  public String resetPassword(ResetPasswordRequest request) {

      String email = normalizeEmail(request.getEmail());
      String newPassword = request.getPassword();

      if (newPassword == null || newPassword.isBlank()) {
          throw new InvalidCredentialsException("New password is required");
      }

      // =========================
      // 1️⃣ CHECK USERS
      // =========================
      var userOpt = userRepository.findByEmail(email);

      if (userOpt.isPresent()) {

          User user = userOpt.get();
          Optional<PasswordResetOtp> otpRecordOpt = otpRepository.findByUserIdAndOtp(user.getId(), request.getOtp());

          if (otpRecordOpt.isPresent()) {
              PasswordResetOtp otpRecord = otpRecordOpt.get();

              if (otpRecord.getExpiryTime().isBefore(LocalDateTime.now())) {
                  throw new OtpExpiredException("OTP expired");
              }

              otpRepository.delete(otpRecord);
          } else {
              if (user.getOtp() == null || !request.getOtp().equals(user.getOtp())) {
                  throw new InvalidCredentialsException("Invalid OTP");
              }

              if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
                  throw new OtpExpiredException("OTP expired");
              }
          }

          user.setPassword(passwordEncoder.encode(newPassword));
          user.setPasswordReset(true);
          user.setOtp(null);
          user.setOtpExpiry(null);

          userRepository.save(user);

          return "Password reset successful";
      }

      // =========================
      // 2️⃣ CHECK STAFF
      // =========================
      Staff staff = staffRepo.findByEmailIgnoreCase(email);

      if (staff != null) {

          PasswordResetOtp otpRecord = otpRepository
                  .findByUserIdAndOtp(-staff.getId(), request.getOtp())
                  .orElseThrow(() -> new InvalidCredentialsException("Invalid OTP"));

          if (otpRecord.getExpiryTime().isBefore(LocalDateTime.now())) {
              throw new OtpExpiredException("OTP expired");
          }

          // ⚠️ storing plain text (same as your current logic)
          staff.setPassword(passwordEncoder.encode(newPassword));

          staffRepo.save(staff);
          otpRepository.delete(otpRecord);

          return "Password reset successful";
      }

      // =========================
      // 3️⃣ NOT FOUND
      // =========================
      throw new UserNotFoundException("Email not registered");
  }

  
  
//    ============== login =================
    
    public LoginResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        String rawPassword = request.getPassword();

        // =========================
        // 1️⃣ CHECK USERS TABLE
        // =========================
        User user = userRepository.findByEmail(normalizedEmail).orElse(null);

        if (user != null) {

            if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
                throw new InvalidCredentialsException("Invalid password");
            }

            // ADMIN APPROVAL CHECK
            if (!"APPROVED".equals(user.getStatus())) {
                return new LoginResponse(null, false, "ADMIN_APPROVAL_PENDING");
            }

            // PASSWORD RESET CHECK
            if (!"ADMIN".equalsIgnoreCase(user.getRole()) && !user.isPasswordReset()) {
                return new LoginResponse(user.getRole(), false, "RESET_PASSWORD_REQUIRED");
            }

            // LOGIN SUCCESS
            LoginResponse response = new LoginResponse();

            response.setId(user.getId());
            response.setEmail(user.getEmail());
            response.setFirstName(user.getFirstName());
            response.setLastName(user.getLastName());
            response.setRole(user.getRole());
            response.setPasswordReset(user.isPasswordReset());

            return response;
        }

        // =========================
        // 2️⃣ CHECK STAFF TABLE 
        // =========================
        Staff staff = staffRepo.findByEmailIgnoreCase(normalizedEmail);

        if (staff != null) {

            // Backward compatibility for any legacy plain-text staff passwords.
//            if (!staff.getPassword().equals(request.getPassword()))
            boolean passwordMatches = false;
            String storedPassword = staff.getPassword();

            if (storedPassword != null && !storedPassword.isBlank()) {
                try {
                    passwordMatches = passwordEncoder.matches(rawPassword, storedPassword);
                } catch (IllegalArgumentException ignored) {
                    passwordMatches = false;
                }
            }

            if (!passwordMatches && rawPassword.equals(storedPassword)) {
                staff.setPassword(passwordEncoder.encode(rawPassword));
                staffRepo.save(staff);
                passwordMatches = true;
            }

        	if (!passwordMatches){
                throw new InvalidCredentialsException("Invalid password");
            }

            // LOGIN SUCCESS (STAFF)
            LoginResponse response = new LoginResponse();

            response.setId(staff.getId());
            response.setEmail(staff.getEmail());
            response.setFirstName(staff.getName()); // ⭐ map name
            response.setLastName(""); // optional
            response.setRole(staff.getRole()); // Chef / Waiter
            response.setPasswordReset(true); // ⭐ skip reset for staff
            if (staff.getCafe() != null) {
                response.setCafeId(staff.getCafe().getId());
                response.setCafeName(staff.getCafe().getCafeName());
            }

            return response;
        }

        // =========================
        // 3️⃣ NOT FOUND
        // =========================
        throw new UserNotFoundException("User not found");
    }

    
    
//    public LoginResponse login(LoginRequest request) {
//
//        User user = userRepository.findByEmail(request.getEmail())
//                .orElseThrow(() -> new RuntimeException("User not found"));
//
//        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
//            throw new RuntimeException("Invalid password");
//        }
//
//        // ADMIN APPROVAL CHECK
//        if (!"APPROVED".equals(user.getStatus())) {
//            return new LoginResponse(null, false, "ADMIN_APPROVAL_PENDING");
//        }
//
//        // PASSWORD RESET CHECK
//        if (!user.isPasswordReset()) {
//            return new LoginResponse(user.getRole(), false, "RESET_PASSWORD_REQUIRED");
//        }
// 
//        // LOGIN SUCCESS
//        LoginResponse response = new LoginResponse();
//
//        response.setId(user.getId());
//        response.setEmail(user.getEmail());
//        response.setFirstName(user.getFirstName());
//        response.setLastName(user.getLastName());
//        response.setRole(user.getRole());
//        response.setPasswordReset(user.isPasswordReset());
//
//        return response;
//        
//    }

    
    
    
////    ============== forgot password ===========
    
//    @Transactional
//    public String forgotPassword(ForgotPasswordRequest request) {
//
//        String email = request.getEmail();
//        System.out.println("FORGOT PASSWORD API CALLED: " + email);
//
//        // =========================
//        // 1️⃣ CHECK USER OR STAFF
//        // =========================
//        var userOpt = userRepository.findByEmail(email);
//        Staff staff = staffRepo.findByEmail(email);
//
//        if (userOpt.isEmpty() && staff == null) {
//            throw new RuntimeException("Email not registered");
//        }
//
//        // =========================
//        // 2️⃣ GENERATE OTP
//        // =========================
//        String otp = String.format("%06d", new Random().nextInt(999999));
//
//        System.out.println("OTP: " + otp);
//        
//
//        
//        PasswordResetOtp resetOtp = new PasswordResetOtp();
//        
//        System.out.println("Saving email: " + resetOtp.getEmail());
//        
//        resetOtp.setEmail(email);   // ✅ KEY CHANGE
//        resetOtp.setOtp(otp);
//        resetOtp.setExpiryTime(LocalDateTime.now().plusMinutes(10));
//
//        // delete old OTP if exists
//        otpRepository.deleteByEmail(email);
//
//        PasswordResetOtp saved=otpRepository.save(resetOtp);
//
//        System.out.println("Saved OTP ID: " + saved.getId());
//        // =========================
//        // 3️⃣ SEND EMAIL
//        // =========================
//        emailService.sendOtp(email, otp);
//
//        return "OTP sent to your email";
//    }
//
//    
    
    
    
    
//    @Transactional
//    public String forgotPassword(ForgotPasswordRequest request) {
//
//        String email = request.getEmail();
//
//        // =========================
//        // 1️⃣ CHECK USERS
//        // =========================
//        var userOpt = userRepository.findByEmail(email);
//
//        if (userOpt.isPresent()) {
//
//            User user = userOpt.get();
//
//            String otp = String.format("%06d", new Random().nextInt(999999));
//
//            PasswordResetOtp resetOtp = new PasswordResetOtp();
//            resetOtp.setUserId(user.getId());
//            resetOtp.setOtp(otp);
//            resetOtp.setExpiryTime(LocalDateTime.now().plusMinutes(10));
//
//            otpRepository.deleteByUserId(user.getId());
//            otpRepository.save(resetOtp);
//
//            emailService.sendOtp(user.getEmail(), otp);
//
//            return "OTP sent to your email";
//        }
//
//        // =========================
//        // 2️⃣ CHECK STAFF
//        // =========================
//        Staff staff = staffRepo.findByEmail(email);
//
//        if (staff != null) {
//
//            String otp = String.format("%06d", new Random().nextInt(999999));
//
//            PasswordResetOtp resetOtp = new PasswordResetOtp();
//
//            // ⭐ IMPORTANT: store negative ID to differentiate
//            resetOtp.setUserId(-staff.getId());
//
//            resetOtp.setOtp(otp);
//            resetOtp.setExpiryTime(LocalDateTime.now().plusMinutes(10));
//
//            otpRepository.deleteByUserId(-staff.getId());
//            otpRepository.save(resetOtp);
//
//            emailService.sendOtp(staff.getEmail(), otp);
//
//            return "OTP sent to your email";
//        }
//
//        // =========================
//        // 3️⃣ NOT FOUND
//        // =========================
//        throw new RuntimeException("Email not registered");
//    }
//
//    
    
    
// // ⭐ Send OTP to user email
//    @Transactional
//    public String forgotPassword(ForgotPasswordRequest request) {
//        String email = request.getEmail();
//
//        var userOpt = userRepository.findByEmail(email);
//        if (userOpt.isEmpty()) {
//            throw new RuntimeException("Email not registered");
//        }
//
//        var user = userOpt.get();
//
//        // Generate 6-digit OTP
//        String otp = String.format("%06d", new Random().nextInt(999999));
//        System.out.println("GENERATED OTP: " + otp);
//        System.out.println("USER ID: " + user.getId());
//
//        // Save OTP in DB, expiry 10 mins from now
//        PasswordResetOtp resetOtp = new PasswordResetOtp();
//        resetOtp.setUserId(user.getId());
//        resetOtp.setOtp(otp);
//        resetOtp.setExpiryTime(LocalDateTime.now().plusMinutes(10));
//
//        otpRepository.deleteByUserId(user.getId()); // remove old OTPs
//        otpRepository.save(resetOtp);
//
//        // Send email
//        emailService.sendOtp(user.getEmail(), otp);
//
//        return "OTP sent to your email";
//    }
    
    
    
    
//  ============== forgot password ===========
    
  @Transactional
  public String forgotPassword(ForgotPasswordRequest request) {

      String email = normalizeEmail(request.getEmail());

      // =========================
      // 1️⃣ CHECK USERS
      // =========================
      var userOpt = userRepository.findByEmail(email);

      if (userOpt.isPresent()) {

          User user = userOpt.get();

          String otp = String.format("%06d", new Random().nextInt(999999));

          PasswordResetOtp resetOtp = new PasswordResetOtp();
          resetOtp.setUserId(user.getId());
          resetOtp.setOtp(otp);
          resetOtp.setExpiryTime(LocalDateTime.now().plusMinutes(10));

          otpRepository.deleteByUserId(user.getId());
          otpRepository.save(resetOtp);

          emailService.sendOtp(user.getEmail(), otp);

          return "OTP sent to your email";
      }

      // =========================
      // 2️⃣ CHECK STAFF
      // =========================
      Staff staff = staffRepo.findByEmailIgnoreCase(email);

      if (staff != null) {

          String otp = String.format("%06d", new Random().nextInt(999999));

          PasswordResetOtp resetOtp = new PasswordResetOtp();

          // ⭐ IMPORTANT: store negative ID to differentiate
          resetOtp.setUserId(-staff.getId());

          resetOtp.setOtp(otp);
          resetOtp.setExpiryTime(LocalDateTime.now().plusMinutes(10));

          otpRepository.deleteByUserId(-staff.getId());
          otpRepository.save(resetOtp);

          emailService.sendOtp(staff.getEmail(), otp);

          return "OTP sent to your email";
      }

      // =========================
      // 3️⃣ NOT FOUND
      // =========================
      throw new UserNotFoundException("Email not registered");
  }

  private String normalizeEmail(String email) {
      return email == null ? null : email.trim().toLowerCase();
  }

  
  
    
}   
    
    
    
    
    
