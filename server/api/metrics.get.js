/**
 * Performance metrics API
 */

import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler(async (event) => {
    setHeader(event, "Content-Type", "application/json");
    setHeader(event, "Cache-Control", "no-cache");

    const metrics = {
        timestamp: new Date().toISOString(),
        performance: {
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            nodeVersion: process.version,
        },
        cache: {
            kvCache: globalThis.__DEV_KV_STORE?.size || 0,
            // Add more cache metrics here
        },
        requests: {
            total: globalThis.requestCount || 0,
            averageResponseTime: globalThis.averageResponseTime || 0,
        },
    };

    return metrics;
});
