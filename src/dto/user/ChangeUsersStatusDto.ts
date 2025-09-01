export interface ChangeUsersStatusDto {
    requestedStatus: boolean;
    userIds: string[];
    roleName?: string | null;
}
