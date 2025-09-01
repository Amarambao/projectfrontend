import type {CustomIdElementDto} from "@/dto/customId/CustomIdElementDto.ts";

export interface CustomIdModifyDto {
    inventoryId: string;
    itemId: string;
    sequence: CustomIdElementDto[];
}
