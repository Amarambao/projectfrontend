import type {ItemDescriptionElementDto} from "@/dto/customDescription/ItemDescriptionElementDto.ts";

export interface AddItemDto {
    inventoryId: string;
    itemId: string;
    customId?: string | null;
    itemDescription: ItemDescriptionElementDto[];
}
