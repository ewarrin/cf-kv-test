/**
 * Cloudflare KV utility functions
 * Provides a unified interface for accessing Cloudflare KV storage
 */

// Global store for development (persists across requests)
if (!globalThis.__DEV_KV_STORE) {
    globalThis.__DEV_KV_STORE = new Map();
}

// KV cache for better performance
const kvCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCloudflareKV(namespaceId) {
    // In a real Cloudflare Workers/Pages environment, this would use the actual KV binding
    if (typeof globalThis.PRODUCTS_KV !== "undefined") {
        // In Cloudflare Workers/Pages environment
        return globalThis.PRODUCTS_KV;
    }

    // For development, use real KV storage via Wrangler
    const { execSync } = await import("child_process");

    const realKV = {
        async get(key) {
            console.log(`🔑 KV GET: ${key}`);

            // Check cache first
            const cacheKey = `${namespaceId}:${key}`;
            const cached = kvCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                console.log(`📦 KV GET result: found (cached)`);
                return cached.value;
            }

            try {
                const result = execSync(
                    `npx wrangler kv key get "${key}" --namespace-id="${namespaceId}" --remote`,
                    { encoding: "utf-8", stdio: "pipe" }
                );
                console.log(
                    `📦 KV GET result: ${result ? "found" : "not found"}`
                );

                // Cache the result
                if (result) {
                    kvCache.set(cacheKey, {
                        value: result,
                        timestamp: Date.now(),
                    });
                }

                return result || null;
            } catch (error) {
                console.log(`📦 KV GET result: not found`);
                return null;
            }
        },

        async put(key, value, options = {}) {
            console.log(
                `💾 KV PUT: ${key} (${
                    options.expirationTtl
                        ? `TTL: ${options.expirationTtl}s`
                        : "no expiration"
                })`
            );
            try {
                // Write to a temp file first
                const fs = await import("fs/promises");
                const path = await import("path");
                const tempFile = path.join(process.cwd(), "temp-kv-data.json");
                await fs.writeFile(tempFile, value);

                execSync(
                    `npx wrangler kv key put "${key}" --path="${tempFile}" --namespace-id="${namespaceId}" --remote`,
                    { encoding: "utf-8", stdio: "pipe" }
                );

                // Clean up temp file
                await fs.unlink(tempFile);
                return true;
            } catch (error) {
                console.error("KV PUT error:", error);
                return false;
            }
        },

        async delete(key) {
            console.log(`🗑️ KV DELETE: ${key}`);
            try {
                execSync(
                    `npx wrangler kv key delete "${key}" --namespace-id="${namespaceId}" --remote`,
                    { encoding: "utf-8", stdio: "pipe" }
                );
                return true;
            } catch (error) {
                console.error("KV DELETE error:", error);
                return false;
            }
        },
    };

    return realKV;
}
