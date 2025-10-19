/**
 * Search API with KV caching
 * Caches search results in KV storage for better performance
 */

import {
    defineEventHandler,
    getMethod,
    readBody,
    createError,
    setHeader,
} from "h3";
import { useRuntimeConfig } from "#imports";
import { getCloudflareKV } from "../utils/cloudflare";

export default defineEventHandler(async (event) => {
    if (getMethod(event) !== "POST") {
        throw createError({
            statusCode: 405,
            statusMessage: "Method not allowed",
        });
    }

    try {
        const config = useRuntimeConfig();
        const kvNamespaceId = config.kvNamespaceId;

        if (!kvNamespaceId) {
            throw createError({
                statusCode: 500,
                statusMessage: "KV namespace not configured",
            });
        }

        const body = await readBody(event);
        const { query, page = 1, pageSize = 24, sortBy = "relevance" } = body;

        if (!query || !query.trim()) {
            throw createError({
                statusCode: 400,
                statusMessage: "Search query is required",
            });
        }

        // Set cache headers for better performance
        setHeader(event, "Cache-Control", "public, max-age=60, s-maxage=300"); // 1min browser, 5min CDN
        setHeader(event, "ETag", `"search-${query}-${page}-${pageSize}"`);

        const kv = await getCloudflareKV(kvNamespaceId);

        // Create a cache key based on search parameters
        const cacheKey = `search_${Buffer.from(
            JSON.stringify({ query, page, pageSize, sortBy })
        ).toString("base64")}`;

        // Try to get cached results first
        let cachedResults = await kv.get(cacheKey);

        if (cachedResults) {
            console.log("🎯 Returning cached search results");
            return JSON.parse(cachedResults);
        }

        // If no cache, get all products and filter
        console.log("📦 Fetching product data from KV storage...");
        let allProducts = await kv.get("products_data");

        if (!allProducts) {
            console.log("❌ No product data found in KV storage");
            throw createError({
                statusCode: 500,
                statusMessage: "No product data available in KV storage",
            });
        }

        console.log("✅ Successfully loaded product data from KV storage");
        allProducts = JSON.parse(allProducts);

        // Perform search filtering
        const products = allProducts.response.data;
        const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

        const filtered = products
            .map((item) => {
                const haystack = [
                    item.description,
                    item.longdescription,
                    item.mfgpartno,
                    item.vendorpartno,
                    item.vendorname,
                    item.manufacturername,
                    item.customerpartno,
                    item.UNSPSC,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                const score = searchTerms.reduce(
                    (acc, term) => acc + (haystack.includes(term) ? 1 : 0),
                    0
                );

                return { ...item, _score: score };
            })
            .filter((item) => item._score > 0)
            .sort((a, b) => {
                switch (sortBy) {
                    case "description-asc":
                        return (a.description || "").localeCompare(
                            b.description || ""
                        );
                    case "manufacturer-asc":
                        return (a.manufacturername || "").localeCompare(
                            b.manufacturername || ""
                        );
                    case "has-image":
                        return Number(!!b.imageurl) - Number(!!a.imageurl);
                    default: // relevance
                        return (b._score || 0) - (a._score || 0);
                }
            });

        // Paginate results
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedResults = filtered.slice(startIndex, endIndex);

        const result = {
            query,
            results: paginatedResults,
            total: filtered.length,
            page,
            pageSize,
            totalPages: Math.ceil(filtered.length / pageSize),
            sortBy,
            cached: false,
        };

        // Cache the results for 5 minutes
        await kv.put(cacheKey, JSON.stringify(result), {
            expirationTtl: 300, // 5 minutes
        });

        console.log(
            `🔍 Search completed: ${filtered.length} results for "${query}"`
        );
        return result;
    } catch (error) {
        console.error("Search API Error:", error);
        throw createError({
            statusCode: 500,
            statusMessage: "Search failed",
        });
    }
});
