#!/usr/bin/env node

/**
 * Load testing script for performance evaluation
 */

const http = require("http");

class LoadTester {
    constructor(baseUrl, options = {}) {
        this.baseUrl = baseUrl;
        this.concurrency = options.concurrency || 10;
        this.requests = options.requests || 100;
        this.results = [];
    }

    async makeRequest(path) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const url = new URL(path, this.baseUrl);

            const req = http.get(url, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    const duration = Date.now() - start;
                    resolve({
                        status: res.statusCode,
                        duration,
                        size: data.length,
                        headers: res.headers,
                    });
                });
            });

            req.on("error", reject);
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error("Request timeout"));
            });
        });
    }

    async runTest() {
        console.log(
            `🚀 Starting load test: ${this.requests} requests, ${this.concurrency} concurrent`
        );

        const startTime = Date.now();
        const promises = [];

        for (let i = 0; i < this.requests; i++) {
            const promise = this.makeRequest("/api/products.json")
                .then((result) => {
                    this.results.push(result);
                    return result;
                })
                .catch((error) => {
                    this.results.push({ error: error.message, duration: 0 });
                    return { error: error.message };
                });

            promises.push(promise);

            // Control concurrency
            if (promises.length >= this.concurrency) {
                await Promise.all(promises);
                promises.length = 0;
            }
        }

        // Wait for remaining requests
        await Promise.all(promises);

        const totalTime = Date.now() - startTime;
        this.printResults(totalTime);
    }

    printResults(totalTime) {
        const successful = this.results.filter((r) => !r.error);
        const failed = this.results.filter((r) => r.error);
        const durations = successful.map((r) => r.duration);

        const stats = {
            total: this.results.length,
            successful: successful.length,
            failed: failed.length,
            totalTime: totalTime,
            requestsPerSecond: (
                (this.results.length / totalTime) *
                1000
            ).toFixed(2),
            averageResponseTime:
                durations.reduce((a, b) => a + b, 0) / durations.length || 0,
            minResponseTime: Math.min(...durations) || 0,
            maxResponseTime: Math.max(...durations) || 0,
            p95ResponseTime: this.percentile(durations, 0.95),
            p99ResponseTime: this.percentile(durations, 0.99),
        };

        console.log("\n📊 Load Test Results:");
        console.log("==================");
        console.log(`Total Requests: ${stats.total}`);
        console.log(`Successful: ${stats.successful}`);
        console.log(`Failed: ${stats.failed}`);
        console.log(`Total Time: ${stats.totalTime}ms`);
        console.log(`Requests/sec: ${stats.requestsPerSecond}`);
        console.log(
            `Average Response Time: ${stats.averageResponseTime.toFixed(2)}ms`
        );
        console.log(`Min Response Time: ${stats.minResponseTime}ms`);
        console.log(`Max Response Time: ${stats.maxResponseTime}ms`);
        console.log(`95th Percentile: ${stats.p95ResponseTime.toFixed(2)}ms`);
        console.log(`99th Percentile: ${stats.p99ResponseTime.toFixed(2)}ms`);

        if (failed.length > 0) {
            console.log("\n❌ Failed Requests:");
            failed.forEach((f) => console.log(`  - ${f.error}`));
        }
    }

    percentile(arr, p) {
        const sorted = arr.sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * p) - 1;
        return sorted[index] || 0;
    }
}

// Run load test
const tester = new LoadTester("http://localhost:3000", {
    concurrency: 10,
    requests: 100,
});

tester.runTest().catch(console.error);
