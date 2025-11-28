package xyz.soda.slowfall.infra.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Lightweight auth filter for early development.
 * <p>
 * NOTE: This class is no longer auto-registered as a servlet filter. It should be
 * added explicitly into the Spring Security filter chain by calling
 * `http.addFilterBefore(devBypassAuthFilter, SecurityContextPersistenceFilter. Class)`
 * in `SecurityConfig` so the ordering is correct and the SecurityContext isn't overwritten.
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

    /**
     * Filter implementation that either populates a simple development Authentication when
     * the dev-bypass mode is enabled or performs a minimal Authorization header check
     * for production-like behavior.
     *
     * <p>When dev-bypass is active, this method:
     * <ul>
     *   <li>sets a request attribute named {@link #AUTHENTICATED_USER_ATTR} with the username,</li>
     *   <li>sets a basic {@link UsernamePasswordAuthenticationToken} on the {@link SecurityContextHolder},</li>
     *   <li>and clears the SecurityContext after the request completes.</li>
     * </ul>
     *
     * @param request  the current servlet request
     * @param response the current servlet response
     * @param chain    the filter chain to continue processing the request
     * @throws IOException      if an I/O error occurs during processing
     * @throws ServletException if a servlet error occurs during processing
     */
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (!(request instanceof HttpServletRequest req) || !(response instanceof HttpServletResponse res)) {
            chain.doFilter(request, response);
            return;
        }

        boolean devBypass = Boolean.parseBoolean(env.getProperty("app.security.dev-bypass", "false"));
        // treat explicit `dev` profile as dev bypass as well
        String[] active = env.getActiveProfiles();
        if (Arrays.asList(active).contains("dev")) {
            devBypass = true;
        }

        if (devBypass) {
            String user = req.getHeader(DEV_USER_HEADER);
            if (user == null || user.isBlank()) {
                user = "dev";
            }
            // make the user visible to controllers/filters via request attribute
            req.setAttribute(AUTHENTICATED_USER_ATTR, user);

            // Populate Spring Security context with a simple Authentication so code relying on
            // SecurityContextHolder / @AuthenticationPrincipal continues to work in dev.
            var authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
            var auth = new UsernamePasswordAuthenticationToken(user, "N/A", authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);

            try {
                chain.doFilter(request, response);
            } finally {
                // clear the security context after request
                SecurityContextHolder.clearContext();
            }
            return;
        }

        // Production-like simple enforcement: require a Bearer token header
        String authHeader = req.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json;charset=UTF-8");
            res.getWriter().write("{\"error\":\"unauthorized\"}");
            return;
        }

        // For this lightweight approach we don't validate the token here. In a real app
        // you should validate JWTs or delegate to Spring Security / an OIDC provider.
        req.setAttribute(AUTHENTICATED_USER_ATTR, "tokenUser");

        chain.doFilter(request, response);
    }
}
