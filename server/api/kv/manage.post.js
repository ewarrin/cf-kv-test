/**
 * KV Management API endpoint
 * Handles operations like populating KV storage, clearing cache, etc.
 */

import { defineEventHandler, getMethod, readBody, createError } from "h3";
import { useRuntimeConfig } from "#imports";
import { getCloudflareKV } from "../../utils/cloudflare";

export default defineEventHandler(async (event) => {
    // Only allow POST requests
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
        const { action } = body;

        const kv = await getCloudflareKV(kvNamespaceId);

        switch (action) {
            case "populate":
                // Populate KV with sample data (no local file dependency)
                try {
                    // Create sample product data for KV storage
                    const sampleData = {
                        response: {
                            status: "success",
                            description: "Sample product data",
                            data: [
                                {
                                    description: "Sample Product 1",
                                    mfgpartno: "SAMPLE001",
                                    pc_itempricecodeguid: "sample-001",
                                    uom: "EA",
                                    extendedprice: "10.00",
                                    imageurl: "",
                                    vendorpartno: "VENDOR001",
                                    vendorname: "Sample Vendor",
                                    pc_itempropertysetguid: "prop-001",
                                    longdescription:
                                        "This is a sample product for testing",
                                    vendorid: "123456",
                                    customerpartno: "CUST001",
                                    UNSPSC: "12345678",
                                    manufacturername: "Sample Manufacturer",
                                    expirydate: "",
                                },
                                {
                                    description: "Sample Product 2",
                                    mfgpartno: "SAMPLE002",
                                    pc_itempricecodeguid: "sample-002",
                                    uom: "EA",
                                    extendedprice: "20.00",
                                    imageurl: "",
                                    vendorpartno: "VENDOR002",
                                    vendorname: "Sample Vendor",
                                    pc_itempropertysetguid: "prop-002",
                                    longdescription:
                                        "This is another sample product for testing",
                                    vendorid: "123456",
                                    customerpartno: "CUST002",
                                    UNSPSC: "12345678",
                                    manufacturername: "Sample Manufacturer",
                                    expirydate: "",
                                },
                            ],
                        },
                    };

                    await kv.put("products_data", JSON.stringify(sampleData), {
                        expirationTtl: 86400, // Cache for 24 hours
                    });

                    return {
                        success: true,
                        message: `Successfully populated KV with ${sampleData.response.data.length} sample products`,
                        count: sampleData.response.data.length,
                    };
                } catch (error) {
                    throw createError({
                        statusCode: 500,
                        statusMessage: "Failed to populate KV storage",
                    });
                }

            case "clear":
                // Clear the KV cache
                await kv.delete("products_data");
                return {
                    success: true,
                    message: "KV cache cleared successfully",
                };

            case "status":
                // Check KV status
                const data = await kv.get("products_data");
                return {
                    success: true,
                    hasData: !!data,
                    message: data ? "KV contains cached data" : "KV is empty",
                };

            default:
                throw createError({
                    statusCode: 400,
                    statusMessage:
                        "Invalid action. Use 'populate', 'clear', or 'status'",
                });
        }
    } catch (error) {
        console.error("KV Management Error:", error);
        throw createError({
            statusCode: 500,
            statusMessage: "KV management operation failed",
        });
    }
});
