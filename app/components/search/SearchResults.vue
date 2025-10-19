<script setup>
// Props: search results from API and search query
const props = defineProps({
    searchResults: { type: Object, required: true }, // API response from search endpoint
    searchQuery: { type: String, default: "" }, // search query from parent
});

const raw = computed(() =>
    Array.isArray(props.searchResults?.results)
        ? props.searchResults.results
        : []
);

const q = ref(props.searchQuery);
const sortBy = ref("relevance");

// Watch for changes in search query prop
watch(
    () => props.searchQuery,
    (newQuery) => {
        q.value = newQuery;
    }
);
const sortOptions = [
    { label: "Relevance", value: "relevance" },
    { label: "Description (A→Z)", value: "description-asc" },
    { label: "Manufacturer (A→Z)", value: "manufacturer-asc" },
    { label: "Has Image first", value: "has-image" },
];
const onlyWithImages = ref(false);

const page = ref(1);
const pageSize = ref(24);
const pageStart = computed(() => (page.value - 1) * pageSize.value);
const pageCount = computed(() =>
    Math.ceil(filtered.value.length / pageSize.value)
);

const normalized = computed(() =>
    raw.value.map((r) => ({
        ...r,
        // normalize a bit for search/sort
        _haystack: [
            r.description,
            r.longdescription,
            r.mfgpartno,
            r.vendorpartno,
            r.vendorname,
            r.manufacturername,
            r.customerpartno,
            r.UNSPSC,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase(),
    }))
);

const filtered = computed(() => {
    // Since the API already handles filtering and sorting, we just need to handle local filters
    let out = normalized.value;

    // Apply local filters (like images only)
    if (onlyWithImages.value) {
        out = out.filter((i) => !!i.imageurl);
    }

    // If we need to re-sort locally (for different sort options), we can do that here
    // For now, we'll trust the API sorting since it's more efficient
    return out;
});

const paged = computed(() =>
    filtered.value.slice(pageStart.value, pageStart.value + pageSize.value)
);

function currency(v) {
    const n = Number(v);
    return Number.isFinite(n)
        ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
        : v;
}

// Quick view
const showQuickView = ref(false);
const selected = ref(null);
function openQuickView(item) {
    selected.value = item;
    showQuickView.value = true;
}

// Cart action (stub – emit or call your store)
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

<!-- components/SearchResults.vue -->
<template>
    <UContainer class="py-6">
        <!-- Controls -->
        <div
            class="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div class="flex gap-2 items-center w-full sm:w-auto">
                <UInput
                    v-model="q"
                    placeholder="Search description, MFG#, vendor…"
                    class="w-full sm:w-96"
                />
                <UButton color="gray" variant="soft" @click="q = ''"
                    >Clear</UButton
                >
            </div>

            <div class="flex gap-2 items-center">
                <USelect v-model="sortBy" :options="sortOptions" class="w-48" />
                <USelect
                    v-model="pageSize"
                    :options="[12, 24, 48]"
                    class="w-24"
                />
            </div>
        </div>

        <!-- Result meta -->
        <div class="flex justify-between items-center mb-2">
            <p class="text-sm text-gray-500">
                Showing <strong>{{ pageStart + 1 }}</strong
                >–<strong>{{
                    Math.min(pageStart + pageSize, filtered.length)
                }}</strong>
                of
                <strong>{{
                    searchResults?.totalResults || filtered.length
                }}</strong>
                items
                <span
                    v-if="searchResults?.cached"
                    class="ml-2 text-xs text-green-600"
                    >(cached)</span
                >
            </p>
            <div class="flex gap-2 items-center">
                <UBadge v-if="q" color="gray" variant="soft">Filtered</UBadge>
                <UBadge v-if="onlyWithImages" color="primary" variant="soft"
                    >Images only</UBadge
                >
            </div>
        </div>

        <!-- Horizontal Layout with Image Left, Details Center, Actions Right -->
        <div class="space-y-4">
            <Transition
                v-for="(item, index) in paged"
                :key="item.pc_itempricecodeguid"
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 transform translate-y-2"
                enter-to-class="opacity-100 transform translate-y-0"
                :style="{ 'transition-delay': `${index * 50}ms` }"
            >
                <UCard class="flex flex-row gap-6 items-center p-4">
                    <!-- Image Section - Far Left -->
                    <NuxtLink
                        :to="`/product/${item.pc_itempricecodeguid}`"
                        class="shrink-0"
                    >
                        <div
                            class="flex overflow-hidden justify-center items-center w-24 h-20 bg-gray-50 rounded-lg transition-colors cursor-pointer hover:bg-gray-100"
                        >
                            <img
                                v-if="item.imageurl"
                                :src="item.imageurl"
                                :alt="item.description"
                                class="object-contain w-full h-full"
                                @error="item.imageurl = ''"
                            />
                            <div
                                v-else
                                class="flex flex-col gap-1 justify-center items-center text-gray-400"
                            >
                                <UIcon
                                    name="i-heroicons-photo"
                                    class="w-5 h-5"
                                />
                                <span class="text-xs">No image</span>
                            </div>
                        </div>
                    </NuxtLink>

                    <!-- Product Details - Center (takes up remaining space) -->
                    <div class="flex-1 min-w-0">
                        <div
                            class="flex gap-2 justify-between items-start mb-2"
                        >
                            <NuxtLink
                                :to="`/product/${item.pc_itempricecodeguid}`"
                                class="text-lg font-medium transition-colors line-clamp-2 hover:text-blue-600"
                            >
                                {{ item.description }}
                            </NuxtLink>
                            <UBadge color="gray" variant="subtle">{{
                                item.uom || "EA"
                            }}</UBadge>
                        </div>

                        <div
                            class="grid grid-cols-3 gap-4 mb-3 text-sm text-gray-600"
                        >
                            <div class="flex gap-1">
                                <span class="w-12 text-gray-400 shrink-0"
                                    >MFG#</span
                                ><span class="truncate">{{
                                    item.mfgpartno
                                }}</span>
                            </div>
                            <div class="flex gap-1" v-if="item.customerpartno">
                                <span class="w-12 text-gray-400 shrink-0"
                                    >Cust#</span
                                ><span class="truncate">{{
                                    item.customerpartno
                                }}</span>
                            </div>
                            <div class="flex gap-1">
                                <span class="w-12 text-gray-400 shrink-0"
                                    >Mfr</span
                                ><span class="truncate">{{
                                    item.manufacturername
                                }}</span>
                            </div>
                            <div class="flex gap-1">
                                <span class="w-12 text-gray-400 shrink-0"
                                    >Vendor</span
                                ><span class="truncate">{{
                                    item.vendorname
                                }}</span>
                            </div>
                            <div class="flex gap-1" v-if="item.UNSPSC">
                                <span class="w-12 text-gray-400 shrink-0"
                                    >UNSPSC</span
                                ><span class="truncate">{{ item.UNSPSC }}</span>
                            </div>
                        </div>

                        <div class="text-lg font-semibold">
                            {{
                                item.extendedprice
                                    ? currency(item.extendedprice)
                                    : "Contact for price"
                            }}
                        </div>
                    </div>

                    <!-- Action Buttons - Far Right -->
                    <div class="flex flex-col gap-2 items-end shrink-0">
                        <div class="flex gap-2 items-center">
                            <UButton
                                size="sm"
                                icon="i-heroicons-eye"
                                variant="ghost"
                                color="gray"
                                :to="`/product/${item.pc_itempricecodeguid}`"
                            >
                                Details
                            </UButton>
                            <UButton
                                size="sm"
                                icon="i-heroicons-shopping-cart"
                                @click="addToCart(item)"
                            >
                                Add to Cart
                            </UButton>
                        </div>
                    </div>
                </UCard>
            </Transition>
        </div>

        <!-- Pagination -->
        <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 transform translate-y-2"
            enter-to-class="opacity-100 transform translate-y-0"
        >
            <div v-if="pageCount > 1" class="flex justify-center mt-6">
                <UPagination
                    v-model="page"
                    :page-count="pageCount"
                    :total="filtered.length"
                    :max="7"
                />
            </div>
        </Transition>
    </UContainer>
</template>
