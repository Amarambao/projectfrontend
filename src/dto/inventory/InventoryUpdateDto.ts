export interface InventoryUpdateDto {
    inventoryId: string;
    isPublic: boolean;
    name?: string | null;
    description?: string | null;
    tags?: string[];
}
