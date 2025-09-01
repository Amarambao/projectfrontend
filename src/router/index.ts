import {createRouter, createWebHistory} from 'vue-router'
import UserInfo from "@/components/user/UserInfo.vue";
import UsersTable from "@/components/user/UsersTable.vue";
import InventoryInfo from "@/components/Inventory/InventoryInfo.vue";
import InventoriesTable from "@/components/Inventory/InventoriesTable.vue";


const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: InventoriesTable,
            meta: {requiresAuth: false},
            props: {userId: null, isCreator: null},
        },
        {
            path: '/Inventory/:id',
            component: InventoryInfo,
            meta: {requiresAuth: false},
            props: true,
        },
        {
            path: '/users',
            component: UsersTable,
            meta: {requiresAuth: false},
            props: {inventoryId: null, isIncluded: false},
        },
        {
            path: '/user/:id',
            component: UserInfo,
            meta: {requiresAuth: false},
            props: true,
        },
    ]
})

export default router

