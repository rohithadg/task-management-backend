export const DEFAULT_PAGE_SIZE = 10;

export interface PaginatedResponse<T> {
  items: T[];
  lastKey?: string;
}

export interface PaginatedRequest {
  limit: number;
  lastKey?: string;
}
