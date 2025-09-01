import type {PaginationRequest} from "@/dto/general/PaginationRequest.ts";

export interface MessageRequestDto extends PaginationRequest {
    userId?: string | null;
    writtenAt?: string[] | null;
}
