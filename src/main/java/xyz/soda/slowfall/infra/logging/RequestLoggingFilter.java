package xyz.soda.slowfall.infra.logging;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * Servlet filter that extracts trace and user identifiers from HTTP headers
 * and places them into SLF4J MDC as `traceId` and `userId` for structured logging.
 * <p>
 * Headers checked (in order):
 * - X-Request-Id -> traceId
 * - X-Trace-Id   -> traceId (fallback)
 * - X-User-Id    -> userId
 * <p>
 * If traceId is absent, a UUID is generated. The filter ensures MDC is cleared
 * after the request completes.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RequestLoggingFilter implements Filter {

    public static final String TRACE_ID_HEADER = "X-Request-Id";
    public static final String TRACE_ID_HEADER_FALLBACK = "X-Trace-Id";
    public static final String USER_ID_HEADER = "X-User-Id";

    public static final String TRACE_ID_KEY = "traceId";
    public static final String USER_ID_KEY = "userId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        try {
            if (request instanceof HttpServletRequest http) {
                String traceId = http.getHeader(TRACE_ID_HEADER);
                if (traceId == null || traceId.isBlank()) {
                    traceId = http.getHeader(TRACE_ID_HEADER_FALLBACK);
                }
                if (traceId == null || traceId.isBlank()) {
                    traceId = UUID.randomUUID().toString();
                }

                String userId = http.getHeader(USER_ID_HEADER);

                MDC.put(TRACE_ID_KEY, traceId);
                if (userId != null && !userId.isBlank()) {
                    MDC.put(USER_ID_KEY, userId);
                }
            }

            chain.doFilter(request, response);
        } finally {
            // Clear MDC entries we set to avoid leaking between threads/requests
            MDC.remove(TRACE_ID_KEY);
            MDC.remove(USER_ID_KEY);
        }
    }
}

