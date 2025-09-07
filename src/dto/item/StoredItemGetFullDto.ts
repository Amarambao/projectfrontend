import type {ItemDescriptionElementDto} from "@/dto/customDescription/ItemDescriptionElementDto.ts";

export interface StoredItemGetFullDto {
    id: string;
    customId: string;
    creatorId: string;
    creatorName: string;
    createdAt: string;
    description: ItemDescriptionElementDto[];
}