package com.coffee.io;

public class LoginResponse {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private String token;
    private boolean isPasswordReset;
    private String message;
    private Long cafeId;
    private String cafeName;
   
    public LoginResponse() {
    	
    }
    public LoginResponse(Long id, String email, String firstName,
                         String lastName, String role,
                         String token, boolean isPasswordReset) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.token = token;
        this.isPasswordReset = isPasswordReset;
        
    }
    
    public LoginResponse(String role, boolean isPasswordReset, String message) {
        this.role = role;
        this.isPasswordReset = isPasswordReset;
        this.message = message;
    }

    // getters & setters
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getRole() { return role; }
    public String getToken() { return token; }
    public boolean isPasswordReset() { return isPasswordReset; }
    public String getMessage() { return message; }
    public Long getCafeId() { return cafeId; }
    public String getCafeName() { return cafeName; }

    public void setId(Long id) { this.id = id; }
    public void setEmail(String email) { this.email = email; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setRole(String role) { this.role = role; }
    public void setToken(String token) { this.token = token; }
    public void setPasswordReset(boolean passwordReset) { isPasswordReset = passwordReset; }
    public void setMessage(String message) { this.message = message; }
    public void setCafeId(Long cafeId) { this.cafeId = cafeId; }
    public void setCafeName(String cafeName) { this.cafeName = cafeName; }
}
