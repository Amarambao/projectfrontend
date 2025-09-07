import type {CustomDescriptionFieldEnum} from "@/dto/enum/CustomDescriptionFieldEnum.ts";

export interface ItemDescriptionElementDto {
    descriptionType: CustomDescriptionFieldEnum;
    shortTextValue?: string | null;
    longTextValue?: string | null;
    hlinkValue?: string | null;
    numberValue?: number | null;
    boolValue?: boolean | null;
}
