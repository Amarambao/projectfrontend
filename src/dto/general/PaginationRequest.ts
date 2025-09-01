export interface PaginationRequest {
    page: number;
    returnCount: number;
    inventoryId?: string | null;
    searchValue?: string | null;
}
