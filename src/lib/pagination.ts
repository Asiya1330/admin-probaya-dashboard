export const PAGE_SIZE = 20;

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const getRange = (page: number): { from: number; to: number } => {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * PAGE_SIZE;
  return { from, to: from + PAGE_SIZE - 1 };
};

export const buildPaginatedResult = <T>(
  data: T[],
  total: number,
  page: number,
): PaginatedResult<T> => {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return {
    data,
    total,
    page: Math.max(1, page),
    pageSize: PAGE_SIZE,
    totalPages,
  };
};

export const parsePageParam = (value: string | undefined): number => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
};
