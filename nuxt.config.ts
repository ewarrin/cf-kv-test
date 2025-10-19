export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },
    modules: ["@nuxt/ui"],
    css: ["~/assets/css/main.css"],

    // Performance optimizations
    nitro: {
        preset: "cloudflare-pages",
        experimental: {
            wasm: true,
        },
        rollupConfig: {
            external: ["sharp"],
        },
        // Enable compression
        compressPublicAssets: true,
        // Optimize storage
        storage: {
            redis: {
                driver: "redis",
                /* redis connector options */
            },
        },
    },

    // Runtime config
    runtimeConfig: {
        kvNamespaceId: process.env.KV_NAMESPACE_ID,
        public: {},
    },

    // Performance optimizations
    experimental: {
        payloadExtraction: false, // Reduce bundle size
        inlineSSRStyles: false, // Better caching
    },

    // Build optimizations
    build: {
        transpile: ["@nuxt/ui"],
    },

    // Head optimizations
    app: {
        head: {
            meta: [
                {
                    name: "viewport",
                    content: "width=device-width, initial-scale=1",
                },
                { name: "format-detection", content: "telephone=no" },
            ],
            link: [
                { rel: "preconnect", href: "https://fonts.googleapis.com" },
                {
                    rel: "preconnect",
                    href: "https://fonts.gstatic.com",
                    crossorigin: "",
                },
            ],
        },
    },

    // Vite optimizations
    vite: {
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ["vue", "vue-router"],
                        ui: ["@nuxt/ui"],
                    },
                },
            },
        },
    },
});
