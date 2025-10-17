<script setup>
// Props: pass the entire payload or just data array
const props = defineProps({
    payload: { type: Object, required: true }, // the JSON you shared
});

const raw = computed(() =>
    Array.isArray(props.payload?.response?.data)
        ? props.payload.response.data
        : []
);
const q = ref("");
const sortBy = ref("relevance");
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
    let out = normalized.value;

    if (q.value?.trim()) {
        const terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
        out = out
            .map((item) => ({
                ...item,
                _score: terms.reduce(
                    (acc, t) => acc + (item._haystack.includes(t) ? 1 : 0),
                    0
                ),
            }))
            .filter((i) => i._score > 0);
    }

    if (onlyWithImages.value) {
        out = out.filter((i) => !!i.imageurl);
    }

    switch (sortBy.value) {
        case "description-asc":
            out = [...out].sort((a, b) =>
                (a.description || "").localeCompare(b.description || "")
            );
            break;
        case "manufacturer-asc":
            out = [...out].sort((a, b) =>
                (a.manufacturername || "").localeCompare(
                    b.manufacturername || ""
                )
            );
            break;
        case "has-image":
            out = [...out].sort(
                (a, b) => Number(!!b.imageurl) - Number(!!a.imageurl)
            );
            break;
        // relevance (default): if we computed _score, sort by it, otherwise leave order
        default:
            if (q.value?.trim()) {
                out = [...out].sort(
                    (a, b) => (b._score || 0) - (a._score || 0)
                );
            }
    }

    // reset page when filters change
    page.value = 1;
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
                of <strong>{{ filtered.length }}</strong> items
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
            <UCard
                v-for="item in paged"
                :key="item.pc_itempricecodeguid"
                class="flex flex-row gap-6 items-center p-4"
            >
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
                            <UIcon name="i-heroicons-photo" class="w-5 h-5" />
                            <span class="text-xs">No image</span>
                        </div>
                    </div>
                </NuxtLink>

                <!-- Product Details - Center (takes up remaining space) -->
                <div class="flex-1 min-w-0">
                    <div class="flex gap-2 justify-between items-start mb-2">
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
                            <span class="w-12 text-gray-400 shrink-0">MFG#</span
                            ><span class="truncate">{{ item.mfgpartno }}</span>
                        </div>
                        <div class="flex gap-1" v-if="item.customerpartno">
                            <span class="w-12 text-gray-400 shrink-0"
                                >Cust#</span
                            ><span class="truncate">{{
                                item.customerpartno
                            }}</span>
                        </div>
                        <div class="flex gap-1">
                            <span class="w-12 text-gray-400 shrink-0">Mfr</span
                            ><span class="truncate">{{
                                item.manufacturername
                            }}</span>
                        </div>
                        <div class="flex gap-1">
                            <span class="w-12 text-gray-400 shrink-0"
                                >Vendor</span
                            ><span class="truncate">{{ item.vendorname }}</span>
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
        </div>

        <!-- Pagination -->
        <div class="flex justify-center mt-6">
            <UPagination
                v-model="page"
                :page-count="pageCount"
                :total="filtered.length"
                :max="7"
            />
        </div>
    </UContainer>
</template>
