export interface AddItemDto {
    inventoryId: string;
    itemType: string;
    customId?: string | null;
}
