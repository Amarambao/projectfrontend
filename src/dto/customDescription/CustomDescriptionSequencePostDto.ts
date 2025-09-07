import type {DescriptionElementDto} from "@/dto/customDescription/DescriptionElementDto.ts";

export interface CustomDescriptionSequencePostDto {
    inventoryId: string;
    itemId: string;
    sequence: DescriptionElementDto[];
}