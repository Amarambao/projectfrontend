import type {StoredItemDto} from "@/dto/item/StoredItemDto.ts";

export interface StoredItemGetAllDto {
    itemName: string;
    itemIds: StoredItemDto[];
}