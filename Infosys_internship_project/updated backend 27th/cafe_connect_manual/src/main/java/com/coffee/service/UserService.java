package com.coffee.service;

import com.coffee.entity.User;
import com.coffee.io.UserProfileRequest;
import com.coffee.io.UserProfileResponse;
import com.coffee.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {
	
	
	private final UserRepository userRepository;


	public UserService(UserRepository userRepository) {
		this.userRepository=userRepository;
	}
	
    public UserProfileResponse getProfile(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return mapToProfileResponse(user);
    }

	public UserProfileResponse updateProfile(Long id, UserProfileRequest request) {

	    User user = userRepository.findById(id)
	            .orElseThrow(() -> new RuntimeException("User not found"));

	    user.setFirstName(request.getFirstName());
	    user.setLastName(request.getLastName());
	    user.setEmail(request.getEmail());
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

	    return mapToProfileResponse(userRepository.save(user));
	}

    private UserProfileResponse mapToProfileResponse(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setDateOfBirth(user.getDateOfBirth());
        response.setGender(user.getGender());
        response.setHighestQualification(user.getHighestQualification());
        response.setInstitutionName(user.getInstitutionName());
        response.setYearOfPassing(user.getYearOfPassing());
        response.setAdditionalCertifications(user.getAdditionalCertifications());
        response.setSpecialization(user.getSpecialization());
        response.setCurrentEmploymentStatus(user.getCurrentEmploymentStatus());
        response.setSkills(user.getSkills());
        response.setIdProofType(user.getIdProofType());
        response.setIdProofNumber(user.getIdProofNumber());
        response.setAddress(user.getAddress());
        response.setCity(user.getCity());
        response.setState(user.getState());
        response.setPincode(user.getPincode());
        response.setCountry(user.getCountry());
        response.setRole(user.getRole());
        return response;
    }

}
