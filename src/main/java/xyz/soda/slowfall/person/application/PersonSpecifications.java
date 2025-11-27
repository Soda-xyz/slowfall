package xyz.soda.slowfall.person.application;

import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;
import xyz.soda.slowfall.person.domain.Person;

public final class PersonSpecifications {
    private PersonSpecifications() {}

    /**
     * Build a specification to match persons whose first name contains the provided text (case-insensitive).
     *
     * @param firstName substring to match against firstName
     * @return a Specification for Person or null if {@code firstName} is blank
     */
    public static Specification<Person> firstNameContains(String firstName) {
        return (root, query, cb) -> {
            if (firstName == null || firstName.isBlank()) return null;
            String pattern = "%" + firstName.toLowerCase(Locale.ROOT) + "%";
            return cb.like(cb.lower(root.get("firstName")), pattern);
        };
    }

    /**
     * Build a specification to match persons whose last name contains the provided text (case-insensitive).
     * @param lastName substring to match against lastName
     * @return a Specification for Person or null if {@code lastName} is blank
     */
    public static Specification<Person> lastNameContains(String lastName) {
        return (root, query, cb) -> {
            if (lastName == null || lastName.isBlank()) return null;
            String pattern = "%" + lastName.toLowerCase(Locale.ROOT) + "%";
            return cb.like(cb.lower(root.get("lastName")), pattern);
        };
    }

    /**
     * Build a specification to filter by pilot flag.
     * @param pilot the pilot flag to match (null to ignore)
     * @return a Specification for Person or null if {@code pilot} is null
     */
    public static Specification<Person> isPilot(Boolean pilot) {
        return (root, query, cb) -> {
            if (pilot == null) return null;
            return cb.equal(root.get("pilot"), pilot);
        };
    }

    /**
     * Build a specification to filter by skydiver flag.
     * @param skydiver the skydiver flag to match (null to ignore)
     * @return a Specification for Person or null if {@code skydiver} is null
     */
    public static Specification<Person> isSkydiver(Boolean skydiver) {
        return (root, query, cb) -> {
            if (skydiver == null) return null;
            return cb.equal(root.get("skydiver"), skydiver);
        };
    }
}
