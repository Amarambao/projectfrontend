import type {CustomIdElementEnum} from "@/dto/enum/CustomIdElementEnum.ts";

export interface CustomIdElementDto {
    elementType: CustomIdElementEnum;
    fixedTextValue?: string | null;
}
