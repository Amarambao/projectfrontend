export interface UpdateUserMainInfoDto {
    id: string;
    fullName?: string | null;
    userName?: string | null;
    email?: string | null;
    concurrencyStamp: string;
}