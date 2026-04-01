export const DEFAULT_PAGE_SIZE = 30;
export const PAGE_SIZE_OPTIONS = [30, 50, 100];

export const normalizePageSize = (value, fallback = DEFAULT_PAGE_SIZE) => {
  const parsed = Number(value);
  return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : fallback;
};
