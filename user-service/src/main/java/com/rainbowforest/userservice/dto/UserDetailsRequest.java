package com.rainbowforest.userservice.dto;

import com.rainbowforest.userservice.entity.UserDetails;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserDetailsRequest(
        @NotBlank(message = "First name is required")
        @Size(max = 50, message = "First name must not exceed 50 characters")
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 50, message = "Last name must not exceed 50 characters")
        String lastName,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 50, message = "Email must not exceed 50 characters")
        String email,

        @Size(max = 15, message = "Phone number must not exceed 15 characters")
        String phoneNumber,

        @Size(max = 30, message = "Street must not exceed 30 characters")
        String street,

        @Size(max = 10, message = "Street number must not exceed 10 characters")
        String streetNumber,

        @Size(max = 6, message = "Zip code must not exceed 6 characters")
        String zipCode,

        @Size(max = 30, message = "Locality must not exceed 30 characters")
        String locality,

        @Size(max = 30, message = "Country must not exceed 30 characters")
        String country) {

    public UserDetails toEntity() {
        UserDetails details = new UserDetails();
        details.setFirstName(firstName);
        details.setLastName(lastName);
        details.setEmail(email);
        details.setPhoneNumber(phoneNumber);
        details.setStreet(street);
        details.setStreetNumber(streetNumber);
        details.setZipCode(zipCode);
        details.setLocality(locality);
        details.setCountry(country);
        return details;
    }
}

