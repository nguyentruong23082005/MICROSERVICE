package com.rainbowforest.userservice.controller;

import com.rainbowforest.userservice.dto.LoginRequest;
import com.rainbowforest.userservice.dto.LoginResponse;
import com.rainbowforest.userservice.entity.User;
import com.rainbowforest.userservice.http.header.HeaderGenerator;
import com.rainbowforest.userservice.service.JwtTokenService;
import com.rainbowforest.userservice.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;

@RestController
public class RegisterController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenService jwtTokenService;
    
    @Autowired
    private HeaderGenerator headerGenerator;
    
    @PostMapping(value = "/registration")
    public ResponseEntity<User> addUser(@RequestBody User user, HttpServletRequest request){
    	if(user != null)
    		try {
    			userService.saveUser(user);
    			return new ResponseEntity<User>(
    					user,
    					headerGenerator.getHeadersForSuccessPostMethod(request, user.getId()),
    					HttpStatus.CREATED);
    		}catch (Exception e) {
    			e.printStackTrace();
    			return new ResponseEntity<User>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
    	return new ResponseEntity<User>(HttpStatus.BAD_REQUEST);
    }

    @PostMapping(value = "/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        if (loginRequest == null || loginRequest.getUserName() == null || loginRequest.getPassword() == null) {
            return new ResponseEntity<LoginResponse>(HttpStatus.BAD_REQUEST);
        }

        User user = userService.getUserByName(loginRequest.getUserName());
        if (user == null || user.getActive() != 1 || !loginRequest.getPassword().equals(user.getUserPassword())) {
            return new ResponseEntity<LoginResponse>(HttpStatus.UNAUTHORIZED);
        }

        String roleName = user.getRole() == null ? "ROLE_USER" : user.getRole().getRoleName();
        String token = jwtTokenService.generateToken(user);
        LoginResponse response = new LoginResponse(token, user.getId(), user.getUserName(), roleName);
        return new ResponseEntity<LoginResponse>(response, HttpStatus.OK);
    }
}
