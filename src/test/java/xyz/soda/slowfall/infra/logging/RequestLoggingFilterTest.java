package xyz.soda.slowfall.infra.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

public class RequestLoggingFilterTest {

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

    @Test
    public void whenHeadersMissing_mdcHasGeneratedTraceId_and_clearedAfter() throws IOException, ServletException {
        RequestLoggingFilter filter = new RequestLoggingFilter();

        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = new FilterChain() {
            @Override
            public void doFilter(ServletRequest request, ServletResponse response) {
                String traceId = MDC.get(RequestLoggingFilter.TRACE_ID_KEY);
                assertThat(traceId).isNotNull();
                assertThat(traceId).isNotEmpty();
                // userId should not be set
                assertThat(MDC.get(RequestLoggingFilter.USER_ID_KEY)).isNull();
            }
        };

        filter.doFilter(req, res, chain);

        // After filter chain completes, MDC should not contain the keys
        assertThat(MDC.get(RequestLoggingFilter.TRACE_ID_KEY)).isNull();
        assertThat(MDC.get(RequestLoggingFilter.USER_ID_KEY)).isNull();
    }
}
