export interface InventoryCreateDto {
    inventoryType: string;
    description?: string | null;
    isPublic: boolean;
    itemNames: string[];
    tags: string[];
}
