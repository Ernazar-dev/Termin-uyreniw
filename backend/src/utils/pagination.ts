import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants';
import type { PaginationQuery } from '../types';

export const toPagination = (page?: number, pageSize?: number): PaginationQuery => ({
  page: Math.max(1, page ?? 1),
  pageSize: Math.min(MAX_PAGE_SIZE, Math.max(1, pageSize ?? DEFAULT_PAGE_SIZE)),
});

export const toSkipTake = ({ page, pageSize }: PaginationQuery) => ({
  skip: (page - 1) * pageSize,
  take: pageSize,
});
