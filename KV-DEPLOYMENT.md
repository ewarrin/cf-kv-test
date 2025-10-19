# Cloudflare KV Deployment Guide

This guide will help you deploy your Nuxt app to Cloudflare with KV storage for search results.

## Prerequisites

1. Cloudflare account
2. Wrangler CLI installed: `npm install -g wrangler`
3. Your app deployed to Cloudflare

## Step 1: Create KV Namespace

```bash
# Create a KV namespace for your products
wrangler kv:namespace create "PRODUCTS_KV"

# Create a preview namespace for development
wrangler kv:namespace create "PRODUCTS_KV" --preview
```

## Step 2: Update wrangler.toml

1. Open `wrangler.toml`
2. Replace `your-kv-namespace-id-here` with your actual namespace ID
3. Replace `your-preview-kv-namespace-id` with your preview namespace ID

## Step 3: Set Environment Variables

```bash
# Set the KV namespace ID as an environment variable
wrangler secret put KV_NAMESPACE_ID
# Enter your namespace ID when prompted
```

## Step 4: Deploy Your App

```bash
# Deploy to Cloudflare
wrangler deploy
```

## Step 5: Populate KV Storage

After deployment, populate your KV storage with product data:

```bash
# Method 1: Using the API endpoint
curl -X POST https://your-app.your-domain.workers.dev/api/kv/manage \
  -H "Content-Type: application/json" \
  -d '{"action":"populate"}'

# Method 2: Using Wrangler CLI
wrangler kv:key put "products_data" --path="./app/data/results.json" --namespace-id="YOUR_NAMESPACE_ID"
```

## Step 6: Verify KV Storage

```bash
# Check if data was stored
curl -X POST https://your-app.your-domain.workers.dev/api/kv/manage \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}'
```

## API Endpoints

### Products API
- `GET /api/products.json` - Get all products (uses KV cache)

### KV Management API
- `POST /api/kv/manage` - Manage KV storage
  - `{"action":"populate"}` - Populate KV with local data
  - `{"action":"clear"}` - Clear KV cache
  - `{"action":"status"}` - Check KV status

### Search API
- `POST /api/search` - Search products with KV caching
  ```json
  {
    "query": "screw",
    "page": 1,
    "pageSize": 24,
    "sortBy": "relevance"
  }
  ```

## Caching Strategy

1. **Product Data**: Cached for 24 hours
2. **Search Results**: Cached for 5 minutes
3. **Fallback**: Falls back to local file if KV is empty

## Performance Benefits

- ⚡ **Faster Response Times**: KV storage is faster than file system
- 🌍 **Global Edge Caching**: Data cached at Cloudflare edge locations
- 💰 **Cost Effective**: KV storage is very affordable
- 🔄 **Automatic Fallback**: Falls back to local file if needed

## Monitoring

Check your Cloudflare dashboard to monitor:
- KV storage usage
- Request volume
- Performance metrics

## Troubleshooting

### KV Not Working
1. Check if namespace ID is correct in `wrangler.toml`
2. Verify environment variable `KV_NAMESPACE_ID` is set
3. Check Cloudflare dashboard for KV namespace status

### Data Not Loading
1. Run the populate command to load data into KV
2. Check the status endpoint to verify data is stored
3. Check browser network tab for API errors

### Search Not Working
1. Verify search API endpoint is accessible
2. Check if products data is loaded in KV
3. Test with a simple search query first
