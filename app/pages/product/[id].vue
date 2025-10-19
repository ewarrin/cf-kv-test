<script setup>
// Get the product ID from the route
const route = useRoute();
const productId = route.params.id;

// Load the product data from the API
const { data: productData, error } = await $fetch("/api/products.json");

if (error || !productData) {
    throw createError({
        statusCode: 500,
        statusMessage: "No product data received",
    });
}

// Check if the data structure is different than expected
let products = [];
if (productData.response && productData.response.data) {
    products = productData.response.data;
} else if (Array.isArray(productData)) {
    products = productData;
} else {
    console.log("Unexpected data structure:", productData);
    throw createError({
        statusCode: 500,
        statusMessage: "Unexpected data structure",
    });
}

const product = products.find(
    (item) => item.pc_itempricecodeguid === productId
);

if (!product) {
    throw createError({
        statusCode: 404,
        statusMessage: "Product not found",
    });
}

// Set page title
useHead({
    title: `${product.description} - Product Details`,
});

// Currency formatting
function currency(v) {
    const n = Number(v);
    return Number.isFinite(n)
        ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
        : v;
}

// Cart functionality
const emit = defineEmits(["add"]);
function addToCart(item) {
    emit("add", {
        id: item.pc_itempricecodeguid,
        sku: item.mfgpartno,
        description: item.description,
        uom: item.uom || "EA",
        price: item.extendedprice || null,
        image: item.imageurl || null,
    });
}
</script>

<template>
    <UContainer class="py-6">
        <!-- Breadcrumb -->
        <nav class="flex mb-6" aria-label="Breadcrumb">
            <ol class="inline-flex items-center space-x-1 md:space-x-3">
                <li class="inline-flex items-center">
                    <NuxtLink
                        to="/"
                        class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                    >
                        <UIcon name="i-heroicons-home" class="mr-2 w-4 h-4" />
                        Home
                    </NuxtLink>
                </li>
                <li>
                    <div class="flex items-center">
                        <UIcon
                            name="i-heroicons-chevron-right"
                            class="w-4 h-4 text-gray-400"
                        />
                        <NuxtLink
                            to="/"
                            class="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
                            >Products</NuxtLink
                        >
                    </div>
                </li>
                <li aria-current="page">
                    <div class="flex items-center">
                        <UIcon
                            name="i-heroicons-chevron-right"
                            class="w-4 h-4 text-gray-400"
                        />
                        <span
                            class="ml-1 text-sm font-medium text-gray-500 md:ml-2"
                            >Product Details</span
                        >
                    </div>
                </li>
            </ol>
        </nav>

        <!-- Product Details -->
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <!-- Product Image -->
            <div class="space-y-4">
                <div
                    class="overflow-hidden bg-gray-50 rounded-lg aspect-square"
                >
                    <img
                        v-if="product.imageurl"
                        :src="product.imageurl"
                        :alt="product.description"
                        class="object-contain w-full h-full"
                        @error="product.imageurl = ''"
                    />
                    <div
                        v-else
                        class="flex flex-col gap-2 justify-center items-center h-full text-gray-400"
                    >
                        <UIcon name="i-heroicons-photo" class="w-16 h-16" />
                        <span class="text-lg">No image available</span>
                    </div>
                </div>
            </div>

            <!-- Product Information -->
            <div class="space-y-6">
                <!-- Product Title and Badge -->
                <div class="flex gap-4 justify-between items-start">
                    <h1 class="text-3xl font-bold text-gray-900">
                        {{ product.description }}
                    </h1>
                    <UBadge color="blue" variant="subtle" size="lg">
                        {{ product.uom || "EA" }}
                    </UBadge>
                </div>

                <!-- Price -->
                <div class="text-2xl font-bold text-gray-900">
                    {{
                        product.extendedprice
                            ? currency(product.extendedprice)
                            : "Contact for price"
                    }}
                </div>

                <!-- Product Specifications -->
                <div class="space-y-4">
                    <h2 class="text-xl font-semibold text-gray-900">
                        Product Specifications
                    </h2>
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div
                            class="flex justify-between py-2 border-b border-gray-200"
                        >
                            <span class="font-medium text-gray-600"
                                >Manufacturer Part #</span
                            >
                            <span class="text-gray-900">{{
                                product.mfgpartno
                            }}</span>
                        </div>
                        <div
                            class="flex justify-between py-2 border-b border-gray-200"
                            v-if="product.customerpartno"
                        >
                            <span class="font-medium text-gray-600"
                                >Customer Part #</span
                            >
                            <span class="text-gray-900">{{
                                product.customerpartno
                            }}</span>
                        </div>
                        <div
                            class="flex justify-between py-2 border-b border-gray-200"
                        >
                            <span class="font-medium text-gray-600"
                                >Manufacturer</span
                            >
                            <span class="text-gray-900">{{
                                product.manufacturername
                            }}</span>
                        </div>
                        <div
                            class="flex justify-between py-2 border-b border-gray-200"
                        >
                            <span class="font-medium text-gray-600"
                                >Vendor</span
                            >
                            <span class="text-gray-900">{{
                                product.vendorname
                            }}</span>
                        </div>
                        <div
                            class="flex justify-between py-2 border-b border-gray-200"
                            v-if="product.UNSPSC"
                        >
                            <span class="font-medium text-gray-600"
                                >UNSPSC</span
                            >
                            <span class="text-gray-900">{{
                                product.UNSPSC
                            }}</span>
                        </div>
                        <div
                            class="flex justify-between py-2 border-b border-gray-200"
                        >
                            <span class="font-medium text-gray-600"
                                >Vendor Part #</span
                            >
                            <span class="text-gray-900">{{
                                product.vendorpartno
                            }}</span>
                        </div>
                    </div>
                </div>

                <!-- Long Description -->
                <div
                    class="space-y-2"
                    v-if="
                        product.longdescription &&
                        product.longdescription !== product.description
                    "
                >
                    <h2 class="text-xl font-semibold text-gray-900">
                        Description
                    </h2>
                    <p class="text-gray-700">{{ product.longdescription }}</p>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-4 pt-6">
                    <UButton
                        size="lg"
                        icon="i-heroicons-shopping-cart"
                        @click="addToCart(product)"
                        class="flex-1"
                    >
                        Add to Cart
                    </UButton>
                    <UButton
                        size="lg"
                        variant="outline"
                        icon="i-heroicons-heart"
                        class="px-6"
                    >
                        Save
                    </UButton>
                </div>

                <!-- Additional Info -->
                <div class="p-4 bg-gray-50 rounded-lg">
                    <h3 class="mb-2 font-semibold text-gray-900">Need Help?</h3>
                    <p class="mb-3 text-sm text-gray-600">
                        Contact our sales team for pricing, availability, and
                        technical specifications.
                    </p>
                    <div class="flex gap-2">
                        <UButton
                            size="sm"
                            variant="ghost"
                            icon="i-heroicons-phone"
                        >
                            Call Sales
                        </UButton>
                        <UButton
                            size="sm"
                            variant="ghost"
                            icon="i-heroicons-envelope"
                        >
                            Email
                        </UButton>
                    </div>
                </div>
            </div>
        </div>
    </UContainer>
</template>
