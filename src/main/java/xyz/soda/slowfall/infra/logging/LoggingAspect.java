package xyz.soda.slowfall.infra.logging;

import jakarta.annotation.PostConstruct;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.*;
import java.util.stream.Collectors;

@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    // Enabled flag (default true)
    @Value("${app.logging.aspect.enabled:true}")
    private boolean enabled;

    // Mode: ALL, SERVICES, ANNOTATED (default SERVICES)
    @Value("${app.logging.aspect.mode:SERVICES}")
    private String mode;

    // Log level for entry/exit (DEBUG or INFO)
    @Value("${app.logging.aspect.level:DEBUG}")
    private String level;

    // Comma-separated list of package prefixes to exclude (optional)
    @Value("${app.logging.aspect.exclude-packages:}")
    private String excludePackagesProp;

    private List<String> excludePackages = Collections.emptyList();

    @PostConstruct
    public void init() {
        if (excludePackagesProp != null && !excludePackagesProp.isBlank()) {
            excludePackages = Arrays.stream(excludePackagesProp.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }
        log.debug("LoggingAspect initialized: enabled={}, mode={}, level={}, excludePackages={}", enabled, mode, level, excludePackages);
    }

    /**
     * Pointcut: capture public methods in the application's base package. We decide at runtime
     * whether to actually emit logs based on configuration (mode, exclusions, annotations).
     */
    @Around("execution(public * xyz.soda.slowfall..*(..))")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        if (!enabled) {
            return joinPoint.proceed();
        }

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Class<?> declaringType = signature.getDeclaringType();
        String className = declaringType.getSimpleName();
        String classPackage = declaringType.getName();
        String methodName = signature.getName();

        // Exclude configured packages
        for (String prefix : excludePackages) {
            if (classPackage.startsWith(prefix)) {
                return joinPoint.proceed();
            }
        }

        boolean shouldLog = false;
        String modeUpper = mode == null ? "" : mode.toUpperCase().trim();

        switch (modeUpper) {
            case "ALL":
                shouldLog = true;
                break;
            case "SERVICES":
                // Log only service layer classes by convention (package contains '.service.')
                shouldLog = classPackage.contains(".service.") || classPackage.endsWith(".service");
                break;
            case "ANNOTATED":
                shouldLog = isAnnotated(joinPoint, signature);
                break;
            default:
                // Unknown mode -> default to SERVICES
                shouldLog = classPackage.contains(".service.") || classPackage.endsWith(".service");
                break;
        }

        if (!shouldLog) {
            return joinPoint.proceed();
        }

        Object[] args = joinPoint.getArgs();
        Method method = signature.getMethod();

        String argSummary = formatArguments(args);
        boolean isInfo = "INFO".equalsIgnoreCase(level);

        if (isInfo) {
            log.info("Entering {}.{}() with arguments = {}", className, methodName, argSummary);
        } else {
            log.debug("Entering {}.{}() with arguments = {}", className, methodName, argSummary);
        }

        try {
            Object result = joinPoint.proceed();
            String resultSummary = formatResult(result);
            if (isInfo) {
                log.info("Exiting {}.{}() with result = {}", className, methodName, resultSummary);
            } else {
                log.debug("Exiting {}.{}() with result = {}", className, methodName, resultSummary);
            }
            return result;
        } catch (Throwable ex) {
            log.error("Exception in {}.{}() with cause = {}", className, methodName, ex.getMessage(), ex);
            throw ex;
        }
    }

    private boolean isAnnotated(ProceedingJoinPoint joinPoint, MethodSignature signature) {
        Method method = signature.getMethod();
        Class<?> declaringType = signature.getDeclaringType();

        // Check method-level annotation
        if (method.isAnnotationPresent(Loggable.class)) {
            return true;
        }

        // Check class-level annotation
        return declaringType.isAnnotationPresent(Loggable.class);
    }

    /**
     * Produce a safe, concise representation of method arguments.
     * - Primitive and String types are shown directly
     * - Collections/arrays show type and size
     * - Large objects are truncated (toString limited)
     * - Known noisy/sensitive types are elided
     */
    private String formatArguments(Object[] args) {
        if (args == null || args.length == 0) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < args.length; i++) {
            sb.append(formatArg(args[i]));
            if (i < args.length - 1) sb.append(", ");
        }
        sb.append("]");
        return sb.toString();
    }

    private String formatArg(Object arg) {
        if (arg == null) return "null";
        // Avoid logging servlet requests/responses, streams, or multipart files
        if (arg instanceof jakarta.servlet.ServletRequest) return "<ServletRequest>";
        if (arg instanceof jakarta.servlet.ServletResponse) return "<ServletResponse>";
        if (arg instanceof java.io.InputStream) return "<InputStream>";
        if (arg instanceof java.io.Reader) return "<Reader>";
        // Spring MultipartFile (if on classpath)
        try {
            if (arg.getClass().getName().equals("org.springframework.web.multipart.MultipartFile"))
                return "<MultipartFile>";
        } catch (Exception ignored) {
        }

        if (arg.getClass().isArray()) {
            int length = java.lang.reflect.Array.getLength(arg);
            return arg.getClass().getComponentType().getSimpleName() + "[](" + length + ")";
        }
        if (arg instanceof Collection) {
            return arg.getClass().getSimpleName() + "(size=" + ((Collection<?>) arg).size() + ")";
        }
        if (arg instanceof Map) {
            return arg.getClass().getSimpleName() + "(size=" + ((Map<?, ?>) arg).size() + ")";
        }

        String s = arg.toString();
        // Truncate long toString outputs to avoid huge logs
        int max = 200;
        if (s.length() > max) {
            return s.substring(0, max) + "...(" + s.length() + " chars)";
        }
        return s;
    }

    private String formatResult(Object result) {
        if (result == null) return "null";
        // Keep result summary short
        if (result.getClass().isArray()) {
            return "Array(" + java.lang.reflect.Array.getLength(result) + ")";
        }
        if (result instanceof Collection) {
            return result.getClass().getSimpleName() + "(size=" + ((Collection<?>) result).size() + ")";
        }
        String s = result.toString();
        int max = 300;
        if (s.length() > max) return s.substring(0, max) + "...(" + s.length() + " chars)";
        return s;
    }
}
