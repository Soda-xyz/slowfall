package xyz.soda.slowfall.infra.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.util.matcher.RequestMatcher;

/**
 * RequestMatcher that returns true when the current request should be ignored by CSRF
 * processing because the user is not authenticated (or is the anonymous token).
 * <p>
 * This lets unauthenticated requests proceed to authentication handling (returning 401)
 * rather than being blocked by CSRF (403). Authenticated requests will still be
 * subject to CSRF protection.
 */
public class IgnoreCsrfIfAnonymousRequestMatcher implements RequestMatcher {

    @Override
    public boolean matches(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return true; // no authentication -> ignore CSRF
        return auth instanceof AnonymousAuthenticationToken; // anonymous -> ignore CSRF
// authenticated -> enforce CSRF
    }
}

