import fs from "fs/promises";
import path from "path";

export default defineEventHandler(async (event) => {
    try {
        const dataPath = path.join(process.cwd(), "app/data/results.json");
        const data = await fs.readFile(dataPath, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("API Error:", error);
        throw createError({
            statusCode: 500,
            statusMessage: "Failed to load product data",
        });
    }
});
