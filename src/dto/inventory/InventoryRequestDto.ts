import type {PaginationRequest} from "@/dto/general/PaginationRequest.ts";

export interface InventoryRequestDto extends PaginationRequest {
    userId?: string | null;
    isCreator?: boolean | null;
}
