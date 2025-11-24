package xyz.soda.slowfall.person.api;

import jakarta.validation.constraints.*;

public record CreatePersonRequest(
        @NotBlank @Size(max = 20) String firstName,
        @NotBlank @Size(max = 20) String lastName,
        boolean pilot,
        boolean skydiver,
        @NotNull @Positive Integer weight,
        @Email String email) {
}
