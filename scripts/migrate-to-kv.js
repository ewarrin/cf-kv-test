#!/usr/bin/env node

/**
 * Migration script to populate Cloudflare KV with product data
 * Run this script after deploying to Cloudflare to populate KV storage
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateToKV() {
    try {
        console.log("🚀 Starting KV migration...");

        // Read the local data file
        const dataPath = path.join(__dirname, "../app/data/oldresults.json");
        const data = await fs.readFile(dataPath, "utf-8");
        const productData = JSON.parse(data);

        console.log(
            `📊 Loaded ${productData.response.data.length} products from local file`
        );

        // In a real deployment, you would use the Cloudflare API or Wrangler CLI
        // For now, we'll create a script that can be run via Wrangler
        const wranglerScript = `
# Run this command to populate your KV store:
# wrangler kv:key put "products_data" --path="./app/data/oldresults.json" --namespace-id="YOUR_NAMESPACE_ID"

# Or use the Cloudflare API:
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/storage/kv/namespaces/YOUR_NAMESPACE_ID/values/products_data" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  --data-binary @./app/data/oldresults.json
        `;

        await fs.writeFile(
            path.join(__dirname, "kv-migration-commands.txt"),
            wranglerScript
        );

        console.log("✅ Migration script created!");
        console.log(
            "📝 Check kv-migration-commands.txt for the commands to run"
        );
        console.log(
            "🔧 You can also use the Cloudflare dashboard to upload the data"
        );
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrateToKV();
