<script setup>
import SearchResults from "~/components/search/SearchResults.vue";
import data from "../../data/results.json";

// Pass the imported data as payload
const payload = data;
</script>

<template>
    <SearchResults
        :payload="payload"
        @add="(line) => console.log('add to cart', line)"
    />
</template>
