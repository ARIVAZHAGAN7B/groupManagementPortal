import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchEventById } from "../../../service/events.api";
import EventSummaryPanel from "../../../students/components/events/EventSummaryPanel";
import {
  getEventDateRangeLabel,
  getEventMemberLimitLabel,
  getEventRegistrationDateRangeLabel,
  getNormalizedExternalUrl
} from "../../../students/components/events/events.constants";

function StatTile({ label, value }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value || "-"}</p>
    </div>
  );
}

export default function EventDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const row = await fetchEventById(id);
      setEvent(row || null);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "Failed to load event details");
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const registrationLink = useMemo(
    () => getNormalizedExternalUrl(event?.registration_link),
    [event?.registration_link]
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Loading event details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Event not found.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-5 md:px-6">
      <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              Event Details
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {event.event_name || "-"}
            </h1>
            <p className="mt-2 text-base font-medium text-slate-600">
              {event.event_code || "-"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/event-management")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
              Back
            </button>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
            >
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              Refresh
            </button>
            {registrationLink ? (
              <a
                href={registrationLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-4 py-2 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12"
              >
                <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
                Registration
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Event Dates" value={getEventDateRangeLabel(event)} />
          <StatTile label="Registration" value={getEventRegistrationDateRangeLabel(event)} />
          <StatTile label="Member Limits" value={getEventMemberLimitLabel(event)} />
          <StatTile label="Registered Groups" value={String(Number(event.team_count) || 0)} />
        </div>

        <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
      </section>

      <EventSummaryPanel
        event={event}
        eyebrow="Selected Event"
        title="Event Overview"
        groupCount={event.team_count}
      />
    </div>
  );
}
