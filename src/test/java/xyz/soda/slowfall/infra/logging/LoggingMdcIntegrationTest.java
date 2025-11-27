package xyz.soda.slowfall.infra.logging;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

public class LoggingMdcIntegrationTest {

    private final Logger rootLogger = (Logger) LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME);
    private final InMemoryAppender appender = new InMemoryAppender();

    @AfterEach
    public void teardown() {
        rootLogger.detachAppender(appender);
        appender.stop();
    }

    @Test
    public void requestLoggingFilter_populatesMDC_and_logsContainTraceAndUser() throws Exception {
        // Attach appender
        appender.setContext(rootLogger.getLoggerContext());
        appender.start();
        rootLogger.addAppender(appender);

        // Prepare filter and mock request
        RequestLoggingFilter filter = new RequestLoggingFilter();
        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();

        req.addHeader(RequestLoggingFilter.TRACE_ID_HEADER, "trace-abc");
        req.addHeader(RequestLoggingFilter.USER_ID_HEADER, "user-xyz");

        // Chain that logs something which should carry MDC
        FilterChain chain = new FilterChain() {
            @Override
            public void doFilter(ServletRequest request, ServletResponse response) {
                org.slf4j.Logger log = LoggerFactory.getLogger("test.capture");
                log.info("sample message");
            }
        };

        filter.doFilter(req, res, chain);

        List<ILoggingEvent> events = appender.getEvents();
        assertThat(events).isNotEmpty();

        ILoggingEvent last = events.get(events.size() - 1);
        Map<String, String> mdc = last.getMDCPropertyMap();
        assertThat(mdc.get(RequestLoggingFilter.TRACE_ID_KEY)).isEqualTo("trace-abc");
        assertThat(mdc.get(RequestLoggingFilter.USER_ID_KEY)).isEqualTo("user-xyz");
    }

    static class InMemoryAppender extends AppenderBase<ILoggingEvent> {
        private final List<ILoggingEvent> events = new ArrayList<>();

        @Override
        protected void append(ILoggingEvent eventObject) {
            events.add(eventObject);
        }

        List<ILoggingEvent> getEvents() {
            return events;
        }
    }
}

