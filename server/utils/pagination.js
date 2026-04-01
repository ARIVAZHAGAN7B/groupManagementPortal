const toPositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parsePaginationQuery = (query = {}, options = {}) => {
  const defaultPage = toPositiveInteger(options.defaultPage, 1);
  const defaultLimit = toPositiveInteger(options.defaultLimit, 30);
  const maxLimit = toPositiveInteger(options.maxLimit, 200);
  const requested =
    query?.page !== undefined ||
    query?.limit !== undefined ||
    String(query?.paginate || "").toLowerCase() === "true";

  const page = toPositiveInteger(query?.page, defaultPage);
  const limit = Math.min(maxLimit, toPositiveInteger(query?.limit, defaultLimit));

  return {
    enabled: requested,
    page,
    limit,
    offset: (page - 1) * limit
  };
};

const buildPaginatedResponse = ({ items = [], total = 0, page = 1, limit = 30 }) => {
  const normalizedTotal = Math.max(0, Number(total) || 0);
  const normalizedLimit = Math.max(1, Number(limit) || 1);
  const totalPages = Math.max(1, Math.ceil(normalizedTotal / normalizedLimit));
  const normalizedPage = Math.min(Math.max(1, Number(page) || 1), totalPages);

  return {
    items,
    total: normalizedTotal,
    page: normalizedPage,
    limit: normalizedLimit,
    total_pages: totalPages,
    has_next_page: normalizedPage < totalPages,
    has_previous_page: normalizedPage > 1
  };
};

module.exports = {
  parsePaginationQuery,
  buildPaginatedResponse
};
