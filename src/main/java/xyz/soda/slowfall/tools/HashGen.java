package xyz.soda.slowfall.tools;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Small CLI helper that prints a BCrypt hash for the provided password.
 * Usage: java -cp build/libs/... xyz.soda.slowfall.tools.HashGen <password>
 * Or run via Gradle task: gradle printHash -Ppw=<password>
 */
public class HashGen {
    /**
     * CLI entry point that prints a BCrypt hash for the given password.
     * <p>
     * Accepts a password as the first argument or via system property `pw`.
     * Exits with status 2 when no password is provided.
     *
     * @param args command-line arguments (args[0] is the password if present)
     */
    public static void main(String[] args) {
        String pw = null;
        if (args != null && args.length > 0 && args[0] != null && !args[0].isEmpty()) pw = args[0];
        if (pw == null || pw.isEmpty()) pw = System.getProperty("pw", "");
        if (pw == null || pw.isEmpty()) {
            System.err.println("Usage: java HashGen <password>  OR gradle printHash -Ppw=<password>");
            System.exit(2);
        }
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode(pw);
        System.out.println(hash);
    }
}
