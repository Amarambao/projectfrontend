export interface ResultDto {
    isSucceeded: boolean;
    error?: string | null;
}

export interface ResultDtoGeneric<T> extends ResultDto {
    data?: T | null;
}
