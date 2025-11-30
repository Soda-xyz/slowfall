package xyz.soda.slowfall.infra.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

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

        // If a JwtAuthenticationToken has been injected by test helpers but the token is expired,
        // clear the SecurityContext so the request is treated as unauthenticated (returning 401).
        var existingAuth = SecurityContextHolder.getContext().getAuthentication();
        if (existingAuth instanceof JwtAuthenticationToken jwtAuth) {
            var jwt = jwtAuth.getToken();
            Instant exp = jwt.getExpiresAt();
            if (exp != null && exp.isBefore(Instant.now())) {
                SecurityContextHolder.clearContext();
                existingAuth = null;
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

        if (devBypass && uri != null && uri.startsWith("/api/protected") && !hasAuthHeader && !alreadyAuthenticated) {
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
