// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },
    modules: ["@nuxt/ui"], // Removed @nuxt/image for Cloudflare compatibility
    css: ["~/assets/css/main.css"],
    nitro: {
        preset: "cloudflare-pages",
        experimental: {
            wasm: true,
        },
        // Only externalize modules that are truly incompatible with Cloudflare Workers
        rollupConfig: {
            external: [
                "sharp", // Image processing library not available in CF Workers
            ],
        },
    },
    runtimeConfig: {
        // Private keys (only available on server-side)
        kvNamespaceId: process.env.KV_NAMESPACE_ID,
        // Public keys (exposed to client-side)
        public: {
            // Add any public config here if needed
        },
    },
});
