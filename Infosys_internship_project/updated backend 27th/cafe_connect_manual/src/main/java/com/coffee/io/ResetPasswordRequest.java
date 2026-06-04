package com.coffee.io;

import com.fasterxml.jackson.annotation.JsonAlias;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ResetPasswordRequest {

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String otp;

    @NotBlank
    @JsonAlias("newPassword")
    private String password;

    // getters/setters
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getOtp() { return otp; }
    public void setOtp(String tempPassword) { this.otp = tempPassword; }
    public String getPassword() { return password; }
    public void setPassword(String newPassword) { this.password = newPassword; }
}