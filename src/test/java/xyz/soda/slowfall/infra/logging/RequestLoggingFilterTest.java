package xyz.soda.slowfall.infra.logging;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

/**
 * Unit tests for RequestLoggingFilter ensuring MDC is populated and cleared correctly.
 */
public class RequestLoggingFilterTest {

    /**
     * When request headers are present the filter should populate MDC during the chain
     * and clear the values after the chain completes.
     *
     * @throws IOException if IO errors occur while running the filter
     * @throws ServletException if servlet errors occur while running the filter
     */
    @Test
    public void whenHeadersPresent_mdcContainsValues_and_clearedAfter() throws IOException, ServletException {
        RequestLoggingFilter filter = new RequestLoggingFilter();

        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = new FilterChain() {
            @Override
            public void doFilter(ServletRequest request, ServletResponse response) {
                // Inside chain, MDC should contain values
                assertThat(MDC.get(RequestLoggingFilter.TRACE_ID_KEY)).isEqualTo("trace-123");
                assertThat(MDC.get(RequestLoggingFilter.USER_ID_KEY)).isEqualTo("user-456");
            }
        };

        req.addHeader(RequestLoggingFilter.TRACE_ID_HEADER, "trace-123");
        req.addHeader(RequestLoggingFilter.USER_ID_HEADER, "user-456");

        filter.doFilter(req, res, chain);

        // After filter chain completes, MDC should not contain the keys
        assertThat(MDC.get(RequestLoggingFilter.TRACE_ID_KEY)).isNull();
        assertThat(MDC.get(RequestLoggingFilter.USER_ID_KEY)).isNull();
    }

    /**
     * When headers are missing the filter should generate a trace id and still clear MDC after.
     *
     * @throws IOException if IO errors occur while running the filter
     * @throws ServletException if servlet errors occur while running the filter
     */
    @Test
    public void whenHeadersMissing_mdcHasGeneratedTraceId_and_clearedAfter() throws IOException, ServletException {
        RequestLoggingFilter filter = new RequestLoggingFilter();

        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = (request, response) -> {
            String traceId = MDC.get(RequestLoggingFilter.TRACE_ID_KEY);
            assertThat(traceId).isNotNull();
            assertThat(traceId).isNotEmpty();
            // userId should not be set
            assertThat(MDC.get(RequestLoggingFilter.USER_ID_KEY)).isNull();
        };

        filter.doFilter(req, res, chain);

        // After filter chain completes, MDC should not contain the keys
        assertThat(MDC.get(RequestLoggingFilter.TRACE_ID_KEY)).isNull();
        assertThat(MDC.get(RequestLoggingFilter.USER_ID_KEY)).isNull();
    }
}
