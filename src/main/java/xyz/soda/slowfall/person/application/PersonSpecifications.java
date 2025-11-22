package xyz.soda.slowfall.person.application;

import org.springframework.data.jpa.domain.Specification;
import xyz.soda.slowfall.person.domain.Person;

import java.util.Locale;

public final class PersonSpecifications {
    private PersonSpecifications() {
    }

    public static Specification<Person> firstNameContains(String firstName) {
        return (root, query, cb) -> {
            if (firstName == null || firstName.isBlank()) return null;
            String pattern = "%" + firstName.toLowerCase(Locale.ROOT) + "%";
            return cb.like(cb.lower(root.get("firstName")), pattern);
        };
    }

    public static Specification<Person> lastNameContains(String lastName) {
        return (root, query, cb) -> {
            if (lastName == null || lastName.isBlank()) return null;
            String pattern = "%" + lastName.toLowerCase(Locale.ROOT) + "%";
            return cb.like(cb.lower(root.get("lastName")), pattern);
        };
    }

    public static Specification<Person> isPilot(Boolean pilot) {
        return (root, query, cb) -> {
            if (pilot == null) return null;
            return cb.equal(root.get("pilot"), pilot);
        };
    }

    public static Specification<Person> isSkyDiver(Boolean skyDiver) {
        return (root, query, cb) -> {
            if (skyDiver == null) return null;
            return cb.equal(root.get("skyDiver"), skyDiver);
        };
    }
}