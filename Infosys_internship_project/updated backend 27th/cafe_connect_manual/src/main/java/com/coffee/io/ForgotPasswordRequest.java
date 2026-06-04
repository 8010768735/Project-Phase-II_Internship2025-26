package com.coffee.io;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ForgotPasswordRequest {

    @Email
    @NotBlank
    private String email;

//    ======= getters and setters ==========
    
    public String getEmail() { return email; }

    public void setEmail(String email) { this.email = email; }
}
