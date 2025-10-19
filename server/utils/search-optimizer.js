/**
 * Search optimization utilities
 */

export class SearchOptimizer {
    constructor() {
        this.index = new Map();
        this.stopWords = new Set([
            "the",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
        ]);
    }

    buildIndex(products) {
        console.log("🔍 Building search index...");
        const start = performance.now();

        products.forEach((product) => {
            const searchableText = [
                product.description,
                product.mfgpartno,
                product.vendorname,
                product.manufacturername,
                product.longdescription,
            ]
                .join(" ")
                .toLowerCase();

            // Create searchable terms
            const terms = this.extractTerms(searchableText);
            terms.forEach((term) => {
                if (!this.index.has(term)) {
                    this.index.set(term, []);
                }
                this.index.get(term).push(product);
            });
        });

        const duration = performance.now() - start;
        console.log(`✅ Search index built in ${duration.toFixed(2)}ms`);
        return this.index;
    }

    extractTerms(text) {
        return text
            .split(/\s+/)
            .filter((term) => term.length > 2 && !this.stopWords.has(term))
            .map((term) => term.replace(/[^\w]/g, ""));
    }

    search(query, products, options = {}) {
        const { page = 1, pageSize = 24, sortBy = "relevance" } = options;
        const start = performance.now();

        const queryTerms = this.extractTerms(query.toLowerCase());
        const scoredProducts = new Map();

        // Score products based on term matches
        products.forEach((product) => {
            let score = 0;
            const searchableText = [
                product.description,
                product.mfgpartno,
                product.vendorname,
                product.manufacturername,
            ]
                .join(" ")
                .toLowerCase();

            queryTerms.forEach((term) => {
                if (searchableText.includes(term)) {
                    score += 1;
                    // Boost score for exact matches
                    if (product.description.toLowerCase().includes(term)) {
                        score += 2;
                    }
                    if (product.mfgpartno.toLowerCase().includes(term)) {
                        score += 3;
                    }
                }
            });

            if (score > 0) {
                scoredProducts.set(product, score);
            }
        });

        // Sort by score
        const sortedProducts = Array.from(scoredProducts.entries())
            .sort(([, a], [, b]) => b - a)
            .map(([product, score]) => ({ ...product, _score: score }));

        // Paginate
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedResults = sortedProducts.slice(startIndex, endIndex);

        const duration = performance.now() - start;
        console.log(`🔍 Search completed in ${duration.toFixed(2)}ms`);

        return {
            results: paginatedResults,
            total: sortedProducts.length,
            page,
            pageSize,
            totalPages: Math.ceil(sortedProducts.length / pageSize),
            sortBy,
            cached: false,
        };
    }
}

export const searchOptimizer = new SearchOptimizer();
