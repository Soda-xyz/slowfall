package xyz.soda.slowfall.person.api;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreatePersonRequest(
        @NotBlank
        @Size(max = 20) String firstName,
        @NotBlank
        @Size(max = 20) String lastName,
        @NotBlank boolean pilot,
        @NotBlank boolean skyDiver,
        @NotBlank
        @Positive Integer weight,
        @Email String email
) {
}
