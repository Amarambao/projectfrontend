import type {IdAndStringDto} from "@/dto/general/IdAndStringDto.ts";

export interface ChangeUsersStatusDto {
    requestedStatus: boolean;
    userIdAndStamp: IdAndStringDto[];
    roleName?: string | null;
}
