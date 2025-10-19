import { defineEventHandler, createError } from "h3";
import { useRuntimeConfig } from "#imports";
import { getCloudflareKV } from "../utils/cloudflare";

export default defineEventHandler(async (event) => {
    try {
        const config = useRuntimeConfig();
        const kvNamespaceId = config.kvNamespaceId;

        if (!kvNamespaceId) {
            throw createError({
                statusCode: 500,
                statusMessage: "KV namespace not configured",
            });
        }

        // Get KV namespace
        const kv = await getCloudflareKV(kvNamespaceId);

        // Try to get cached data first
        console.log("📦 Fetching product data from KV storage...");
        let data = await kv.get("products_data");

        if (!data) {
            console.log("❌ No product data found in KV storage");
            throw createError({
                statusCode: 500,
                statusMessage: "No product data available in KV storage",
            });
        }

        console.log("✅ Successfully loaded product data from KV storage");
        // Parse the cached data
        data = JSON.parse(data);

        return data;
    } catch (error) {
        console.error("API Error:", error);
        throw createError({
            statusCode: 500,
            statusMessage: "Failed to load product data",
        });
    }
});
