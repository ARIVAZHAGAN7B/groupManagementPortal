import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import { WorkspaceFilterBar } from "../../../shared/components/WorkspaceInlineFilters";
import {
  TeamDesktopTableShell
} from "../teams/TeamDesktopTableControls";
import TeamPageDetailTile from "../teams/TeamPageDetailTile";
import { formatDateTime, formatLabel } from "../teams/teamPage.utils";
import {
  REQUEST_TYPE_META,
  RequestTypePill
} from "./requestCenter.utils";

export default function RequestCenterMyRequests({
  canReset,
  loading,
  myQuery,
  myStatusFilter,
  myStatusOptions,
  myTypeFilter,
  myTypeOptions,
  onReset,
  rows,
  setMyQuery,
  setMyStatusFilter,
  setMyTypeFilter
}) {
  if (loading) {
    return <div className="px-4 py-12 text-center text-sm text-slate-500">Loading request records...</div>;
  }

  if (rows.length === 0) {
    return <div className="px-4 py-12 text-center text-sm text-slate-500">No requests found for the current filters.</div>;
  }

  return (
    <>
      <div className="space-y-3 p-4 lg:hidden">
        {rows.map((row) => {
          const meta = REQUEST_TYPE_META[row.typeKey] || REQUEST_TYPE_META.GROUP_JOIN;

          return (
            <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-900">{row.title}</h2>
                </div>
                <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <RequestTypePill typeKey={row.typeKey} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TeamPageDetailTile label="Scope" value={row.scopeLabel} />
                <TeamPageDetailTile label="Destination" value={row.title} />
                <TeamPageDetailTile label="Submitted" value={formatDateTime(row.requestDate)} />
                <TeamPageDetailTile label={meta.detailLabel} value={row.detailValue} />
                <TeamPageDetailTile label="Decision By" value={row.decisionBy} />
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Decision Reason
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {row.decisionReason || "No decision reason yet."}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <TeamDesktopTableShell
        canReset={canReset}
        onReset={onReset}
        toolbar={
          <WorkspaceFilterBar
            fields={[
              {
                key: "query",
                type: "search",
                label: "Search",
                value: myQuery,
                placeholder: "Search by group, event, type, status, or decision",
                onChangeValue: setMyQuery
              },
              {
                key: "type",
                type: "select",
                label: "Request Type",
                value: myTypeFilter,
                onChangeValue: setMyTypeFilter,
                wrapperClassName: "w-full sm:w-[220px]",
                options: [
                  { value: "ALL", label: "All request types" },
                  ...myTypeOptions
                    .filter((option) => option !== "ALL")
                    .map((option) => ({
                      value: option,
                      label: REQUEST_TYPE_META[option]?.label || option
                    }))
                ]
              },
              {
                key: "status",
                type: "select",
                label: "Status",
                value: myStatusFilter,
                onChangeValue: setMyStatusFilter,
                wrapperClassName: "w-full sm:w-[180px]",
                options: [
                  { value: "ALL", label: "All statuses" },
                  ...myStatusOptions
                    .filter((option) => option !== "ALL")
                    .map((option) => ({
                      value: option,
                      label: formatLabel(option)
                    }))
                ]
              }
            ]}
            onReset={onReset}
            hasActiveFilters={canReset}
            showReset={false}
          />
        }
      >
        <div className="overflow-x-auto overflow-y-visible rounded-2xl">
          <table className="min-w-[1220px] w-full text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Type</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Destination</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Scope</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Detail</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Submitted</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Status</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Decision By</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="px-3 py-2.5">
                    <RequestTypePill typeKey={row.typeKey} />
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-900">{row.title}</td>
                  <td className="px-3 py-2.5 text-slate-600">{row.scopeLabel}</td>
                  <td className="px-3 py-2.5 text-slate-700">{row.detailValue}</td>
                  <td className="px-3 py-2.5 text-slate-700">{formatDateTime(row.requestDate)}</td>
                  <td className="px-3 py-2.5">
                    <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">{row.decisionBy}</td>
                  <td className="px-3 py-2.5 text-slate-600">
                    <p className="max-w-[240px] leading-5">{row.decisionReason || "No decision reason yet."}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TeamDesktopTableShell>
    </>
  );
}
