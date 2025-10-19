/**
 * Performance monitoring utilities
 */

export class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
    }

    startTimer(name) {
        this.metrics.set(name, {
            start: performance.now(),
            end: null,
            duration: null,
        });
    }

    endTimer(name) {
        const metric = this.metrics.get(name);
        if (metric) {
            metric.end = performance.now();
            metric.duration = metric.end - metric.start;
            console.log(`⏱️ ${name}: ${metric.duration.toFixed(2)}ms`);
        }
    }

    getMetrics() {
        return Object.fromEntries(this.metrics);
    }

    reset() {
        this.metrics.clear();
    }
}

export function createPerformanceMiddleware() {
    return defineEventHandler(async (event) => {
        const monitor = new PerformanceMonitor();
        monitor.startTimer("request");

        // Add performance headers
        setHeader(event, "X-Response-Time", "0ms");

        // Store monitor in event context for use in handlers
        event.context.performance = monitor;

        return monitor;
    });
}

export function logPerformance(event, operation) {
    if (event.context?.performance) {
        event.context.performance.endTimer(operation);
    }
}
