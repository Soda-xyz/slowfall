package xyz.soda.slowfall.infra.logging;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Opt-in annotation to enable method/class-level logging when the
 * LoggingAspect is configured to mode=ANNOTATED.
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface Loggable {
}

