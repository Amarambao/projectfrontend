import type {CustomDescriptionFieldEnum} from "@/dto/enum/CustomDescriptionFieldEnum.ts";

export interface DescriptionElementDto {
    name: string;
    descriptionType: CustomDescriptionFieldEnum;
}