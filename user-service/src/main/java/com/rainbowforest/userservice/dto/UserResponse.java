package com.rainbowforest.userservice.dto;

import com.rainbowforest.userservice.entity.User;
import com.rainbowforest.userservice.entity.UserDetails;

public record UserResponse(
        Long id,
        String userName,
        Integer active,
        UserDetailsResponse userDetails,
        String role) {

    public static UserResponse from(User user) {
        UserDetailsResponse details = user.getUserDetails() == null
                ? null
                : UserDetailsResponse.from(user.getUserDetails());
        String role = user.getRole() == null ? null : user.getRole().getRoleName();
        return new UserResponse(user.getId(), user.getUserName(), user.getActive(), details, role);
    }

    public record UserDetailsResponse(
            String firstName,
            String lastName,
            String email,
            String phoneNumber,
            String street,
            String streetNumber,
            String zipCode,
            String locality,
            String country) {

        private static UserDetailsResponse from(UserDetails details) {
            return new UserDetailsResponse(
                    details.getFirstName(),
                    details.getLastName(),
                    details.getEmail(),
                    details.getPhoneNumber(),
                    details.getStreet(),
                    details.getStreetNumber(),
                    details.getZipCode(),
                    details.getLocality(),
                    details.getCountry());
        }
    }
}

