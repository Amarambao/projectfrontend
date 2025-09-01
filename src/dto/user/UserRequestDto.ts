import type {PaginationRequest} from "@/dto/general/PaginationRequest.ts";

export interface UserRequestDto extends PaginationRequest {
    isIncluded: boolean;
}