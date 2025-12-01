package xyz.soda.slowfall.infra.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

/**
 * Lightweight auth filter for early development.
 * <p>
 * NOTE: This class is intentionally conservative: it will only bypass authentication
 * when the explicit property `app.security.dev-bypass` is true AND the request path
 * targets the dedicated dev-protected test endpoint prefix (/api/protected).
 * For all other requests the filter is a no-op and Spring Security handles authentication.
 */
public class DevBypassAuthFilter implements Filter {

    public static final String AUTHENTICATED_USER_ATTR = "authenticatedUser";
    public static final String DEV_USER_HEADER = "X-Dev-User";

    private final Environment env;

    /**
     * Create a new DevBypassAuthFilter backed by the provided {@link Environment}.
     *
     * @param env Spring environment used to read the 'app.security.dev-bypass' flag and active profiles
     */
    public DevBypassAuthFilter(Environment env) {
        this.env = env;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (!(request instanceof HttpServletRequest req) || !(response instanceof HttpServletResponse)) {
            chain.doFilter(request, response);
            return;
        }

        var existingAuth = SecurityContextHolder.getContext().getAuthentication();
        if (existingAuth instanceof JwtAuthenticationToken jwtAuth) {
            var jwt = jwtAuth.getToken();
            Instant exp = jwt.getExpiresAt();
            if (exp != null && exp.isBefore(Instant.now())) {
                SecurityContextHolder.clearContext();
                // Mark the request so we don't apply the dev bypass after clearing an expired token.
                // Without this marker the filter would see no authentication and inject a dev user,
                // which causes tests that expect an expired JWT to be treated as unauthorized to fail.
                req.setAttribute("xyz.soda.slowfall.security.EXPIRED_JWT", Boolean.TRUE);
            }
        }

        boolean devBypass = Boolean.parseBoolean(env.getProperty("app.security.dev-bypass", "false"));
        String uri = req.getRequestURI();

        // Do not override explicit auth provided by tests or clients. If an Authorization
        // header is present or SecurityContext already contains an authenticated principal,
        // let the normal security filters handle authentication/authorization.
        boolean hasAuthHeader = req.getHeader("Authorization") != null;
        boolean alreadyAuthenticated = SecurityContextHolder.getContext().getAuthentication() != null
                && SecurityContextHolder.getContext().getAuthentication().isAuthenticated();

        // Avoid applying dev bypass when an expired JWT was present on the request: tests expect
        // the expired token to result in an unauthorized response rather than silently granting dev auth.
        boolean expiredJwtPresent = Boolean.TRUE.equals(req.getAttribute("xyz.soda.slowfall.security.EXPIRED_JWT"));

        if (devBypass
                && uri != null
                && uri.startsWith("/api/protected")
                && !hasAuthHeader
                && !alreadyAuthenticated
                && !expiredJwtPresent) {
            String user = req.getHeader(DEV_USER_HEADER);
            if (user == null || user.isBlank()) {
                user = "dev";
            }
            req.setAttribute(AUTHENTICATED_USER_ATTR, user);

            var authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
            var auth = new UsernamePasswordAuthenticationToken(user, "N/A", authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);

            try {
                chain.doFilter(request, response);
            } finally {
                SecurityContextHolder.clearContext();
            }
            return;
        }

        // Otherwise don't interfere; let the security filter chain handle authentication.
        chain.doFilter(request, response);
    }
}
