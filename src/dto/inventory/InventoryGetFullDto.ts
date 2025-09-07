export interface InventoryGetFullDto {
    id: string;
    isPublic: boolean;
    name: string;
    description?: string | null;
    creatorId: string;
    creatorName: string;
    tags: string[];
    concurrencyStamp: string;
}
