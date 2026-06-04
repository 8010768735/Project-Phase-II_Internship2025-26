package com.coffee.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coffee.io.UserProfileRequest;
import com.coffee.io.UserProfileResponse;
import com.coffee.service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

	private final UserService userService;

	public UserController (UserService userService) {
		this.userService=userService;
	}

    @GetMapping("/{id}")
    public UserProfileResponse getUser(@PathVariable Long id) {
        return userService.getProfile(id);
    }
	
	@PutMapping("/{id}")
	public UserProfileResponse updateUser(@PathVariable Long id,
	                       @RequestBody UserProfileRequest user) {

	    return userService.updateProfile(id, user);

	}

}
