<script setup>
import SearchResults from "~/components/search/SearchResults.vue";
import data from "../../data/results.json";

// Pass the imported data as payload
const payload = data;

// Search functionality
const searchQuery = ref("");
const showResults = ref(false);

const handleSearch = () => {
    if (searchQuery.value.trim()) {
        showResults.value = true;
    }
};

const clearSearch = () => {
    searchQuery.value = "";
    showResults.value = false;
};
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Search Header -->
        <div
            class="bg-white border-b shadow-sm transition-all duration-300"
            :class="{ 'shadow-md': showResults }"
        >
            <UContainer class="py-6">
                <div
                    class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div class="flex gap-2 items-center w-full sm:w-auto">
                        <UInput
                            v-model="searchQuery"
                            placeholder="Search products, part numbers, descriptions..."
                            class="w-full sm:w-96"
                            @keyup.enter="handleSearch"
                        />
                        <UButton
                            color="primary"
                            @click="handleSearch"
                            :disabled="!searchQuery.trim()"
                        >
                            Search
                        </UButton>
                        <UButton
                            v-if="showResults"
                            color="gray"
                            variant="soft"
                            @click="clearSearch"
                        >
                            Clear
                        </UButton>
                    </div>
                </div>
            </UContainer>
        </div>

        <!-- Search Results -->
        <Transition
            enter-active-class="transition-all duration-500 ease-out"
            enter-from-class="opacity-0 transform translate-y-4"
            enter-to-class="opacity-100 transform translate-y-0"
            leave-active-class="transition-all duration-300 ease-in"
            leave-from-class="opacity-100 transform translate-y-0"
            leave-to-class="opacity-0 transform translate-y-4"
        >
            <div v-if="showResults">
                <SearchResults
                    :payload="payload"
                    :search-query="searchQuery"
                    @add="(line) => console.log('add to cart', line)"
                />
            </div>
        </Transition>

        <!-- Initial State -->
        <Transition
            enter-active-class="transition-all duration-500 ease-out"
            enter-from-class="opacity-0 transform scale-95"
            enter-to-class="opacity-100 transform scale-100"
            leave-active-class="transition-all duration-300 ease-in"
            leave-from-class="opacity-100 transform scale-100"
            leave-to-class="opacity-0 transform scale-95"
        >
            <div
                v-if="!showResults"
                class="flex flex-col justify-center items-center py-20"
            >
                <UIcon
                    name="i-heroicons-magnifying-glass"
                    class="mb-4 w-16 h-16 text-gray-300"
                />
                <h2 class="mb-2 text-xl font-semibold text-gray-600">
                    Search Products
                </h2>
                <p class="max-w-md text-center text-gray-500">
                    Enter a search term above to find products, part numbers, or
                    descriptions
                </p>
            </div>
        </Transition>
    </div>
</template>
