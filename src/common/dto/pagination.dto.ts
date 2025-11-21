export class PaginationRequestDto {
  page?: number = 1;
  limit?: number = 10;
}

export class PaginationResponseDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
