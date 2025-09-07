import type {StoredItemGetLiteDto} from "@/dto/item/StoredItemGetLiteDto.ts";

export interface StoredItemGetAllDto {
    itemId: string;
    itemName: string;
    storedItemsId: StoredItemGetLiteDto[];
}