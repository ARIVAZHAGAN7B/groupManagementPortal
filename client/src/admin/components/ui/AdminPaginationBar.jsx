import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  normalizePageSize
} from "../../../shared/constants/pagination";

export default function AdminPaginationBar({
  loading = false,
  page = 1,
  pageCount = 1,
  limit = DEFAULT_PAGE_SIZE,
  shownCount = 0,
  totalCount = 0,
  itemLabel = "records",
  onPageChange,
  onLimitChange
}) {
  if (totalCount <= 0) return null;

  const normalizedLimit = normalizePageSize(limit);
  const singularLabel = itemLabel.endsWith("s") ? itemLabel.slice(0, -1) : itemLabel;
  const totalLabel = totalCount === 1 ? singularLabel : itemLabel;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Showing {shownCount} of {totalCount} {totalLabel}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Page {page} of {pageCount}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="min-w-[6.5rem] px-3 text-center text-xs font-semibold text-slate-500">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              disabled={loading || page >= pageCount}
              onClick={() => onPageChange?.(page + 1)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>

          <div className="flex items-center gap-2 sm:pl-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Rows
            </span>
            <div className="flex items-center gap-2">
              {PAGE_SIZE_OPTIONS.map((value) => {
                const selected = normalizedLimit === value;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    disabled={loading}
                    onClick={() => onLimitChange?.(value)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      selected
                        ? "border-[#1754cf] bg-[#1754cf] text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
