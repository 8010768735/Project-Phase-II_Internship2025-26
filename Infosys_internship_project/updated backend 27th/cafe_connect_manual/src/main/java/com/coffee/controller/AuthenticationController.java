package com.coffee.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import com.coffee.io.*;
import com.coffee.service.AuthenticationService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    public AuthenticationController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authenticationService.registerUser(request));
    }

//    // LOGIN
//    @PostMapping("/login")
//    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
//        return ResponseEntity.ok(authenticationService.loginUser(request));
//    }
//
//    // CREATE PASSWORD (after email token)
//    @PostMapping("/create-password")
//    public ResponseEntity<String> createPassword(@Valid @RequestBody CreatePasswordRequest request) {
//        return ResponseEntity.ok(authenticationService.createPassword(request));
//    }
//
//    // RESET PASSWORD (otp based)
//    @PostMapping("/reset-password")
//    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
//        return ResponseEntity.ok(authenticationService.resetPassword(request));
//    }
//    
 // FORGOT PASSWORD (SEND OTP)
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authenticationService.forgotPassword(request));
    }
    
    
//    @PostMapping("/reset-password")
//    public ResponseEntity<?> resetPassword(
//            @RequestBody ResetPasswordRequest request) {
//
//        String response = authenticationService.resetPassword(request);
//
//        return ResponseEntity.ok(response);
//    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        String response = authenticationService.resetPassword(request);

        return ResponseEntity.ok(response);
    }

    
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {

        LoginResponse response = authenticationService.login(request);

        return ResponseEntity.ok(response);
    }

    

}
