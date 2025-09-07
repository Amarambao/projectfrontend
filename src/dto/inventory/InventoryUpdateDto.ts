export interface InventoryUpdateDto {
    inventoryId: string;
    isPublic: boolean;
    name?: string | null;
    description?: string | null;
    concurrencyStamp: string;
}
