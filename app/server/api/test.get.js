export default defineEventHandler(async (event) => {
    return {
        message: "API is working!",
        timestamp: new Date().toISOString(),
    };
});
