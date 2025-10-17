<script setup>
// import Search from "~/components/search/Search.vue";
import Search from "../app/components/search/Search.vue";
</script>

<template>
    <div>
        <NuxtRouteAnnouncer />
        <UApp>
            <UHeader title="CF KV">
                <template #right>
                    <UColorModeButton />
                </template>
            </UHeader>
            <div class="container p-8 mx-auto">
                <NuxtPage />
            </div>
        </UApp>
    </div>
</template>
