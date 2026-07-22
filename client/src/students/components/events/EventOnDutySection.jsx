import { useCallback, useEffect, useMemo, useState } from "react";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import {
  fetchTeamOnDutyRequests,
  submitTeamOnDutyRequest
} from "../../../service/onDuty.api";
import {
  OnDutyStatusBadge,
  calculateOnDutyRoundDays,
  formatOnDutyDate,
  formatOnDutyRoundDateRange,
  formatOnDutyTimeRange,
  getOnDutyUploadUrl
} from "../../../shared/components/OnDutyUi";

const readFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",").pop() : "";
      if (!base64) {
        reject(new Error("Failed to read the selected proof file"));
        return;
      }
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error("Failed to read the selected proof file"));
    };

    reader.readAsDataURL(file);
  });

export default function EventOnDutySection({
  canManage = false,
  group,
  event
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitBusyRoundId, setSubmitBusyRoundId] = useState(null);
  const [selectedFilesByRoundId, setSelectedFilesByRoundId] = useState({});

  const teamId = Number(group?.team_id) || null;

  const loadRequests = useCallback(async () => {
    if (!teamId) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const rows = await fetchTeamOnDutyRequests(teamId);
      setRequests(Array.isArray(rows) ? rows : []);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "Failed to load OD requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const offlineRounds = useMemo(
    () =>
      (Array.isArray(event?.rounds) ? event.rounds : []).filter(
        (round) => String(round?.round_mode || "").trim().toUpperCase() === "OFFLINE"
      ),
    [event?.rounds]
  );

  const requestsByRoundId = useMemo(
    () =>
      new Map(
        (Array.isArray(requests) ? requests : []).map((request) => [Number(request.round_id), request])
      ),
    [requests]
  );

  const handleSelectFile = (roundId, file) => {
    setSelectedFilesByRoundId((previousValue) => ({
      ...previousValue,
      [String(roundId)]: file || null
    }));
  };

  const handleSubmit = async (round) => {
    const roundId = Number(round?.round_id);
    if (!teamId || !roundId) return;

    const proofRequired = Number(round?.round_order) > 1;
    const file = selectedFilesByRoundId[String(roundId)] || null;

    setSubmitBusyRoundId(roundId);
    setError("");
    setSuccessMessage("");

    try {
      let proof = null;
      if (file) {
        const content_base64 = await readFileAsBase64(file);
        proof = {
          file_name: file.name,
          mime_type: file.type,
          content_base64
        };
      }

      if (proofRequired && !proof) {
        throw new Error("Shortlist proof is required from round 2 onward");
      }

      await submitTeamOnDutyRequest(teamId, {
        round_id: roundId,
        proof
      });

      setSelectedFilesByRoundId((previousValue) => ({
        ...previousValue,
        [String(roundId)]: null
      }));
      setSuccessMessage(`OD submitted for ${round?.round_name || `Round ${round?.round_order || ""}`}.`);
      await loadRequests();
    } catch (submitError) {
      setError(submitError?.response?.data?.message || submitError?.message || "Failed to submit OD");
    } finally {
      setSubmitBusyRoundId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            On Duty Support
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Submit OD round by round for offline stages only. Later rounds require shortlist proof,
            so unused OD days from future rounds cannot be claimed early.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
        >
          <RefreshRoundedIcon sx={{ fontSize: 18 }} />
          Refresh OD
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {!canManage ? (
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Only the captain or vice captain can submit OD requests for this event registration.
        </div>
      ) : null}

      {offlineRounds.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
          No offline rounds are configured for this event yet.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {offlineRounds.map((round) => {
            const request = requestsByRoundId.get(Number(round?.round_id)) || null;
            const roundId = Number(round?.round_id) || 0;
            const selectedFile = selectedFilesByRoundId[String(roundId)] || null;
            const proofRequired = Number(round?.round_order) > 1;
            const adminStatus = String(request?.admin_status || "").toUpperCase();
            const unlockedByProgress =
              (Number(group?.rounds_cleared) || 0) >= (Number(round?.round_order) || 1) - 1;
            const canSubmit =
              canManage &&
              unlockedByProgress &&
              (!request || ["REJECTED", "CANCELLED"].includes(adminStatus));

            return (
              <article
                key={round?.round_id || round?.round_order}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1754cf]">
                      Offline Round {round?.round_order || "-"}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      {round?.round_name || `Round ${round?.round_order || ""}`}
                    </h3>
                  </div>
                  <OnDutyStatusBadge
                    type="admin"
                    value={request?.admin_status || "Not Submitted"}
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Dates
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {formatOnDutyRoundDateRange(round)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Time
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {formatOnDutyTimeRange(round)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      OD Days
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {calculateOnDutyRoundDays(round) || "-"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Proof
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {proofRequired ? "Required" : "Not needed"}
                    </div>
                  </div>
                </div>

                {request ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Faculty
                      </div>
                      <div className="mt-2">
                        <OnDutyStatusBadge type="external" value={request.faculty_status} />
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        HOD
                      </div>
                      <div className="mt-2">
                        <OnDutyStatusBadge type="external" value={request.hod_status} />
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Admin
                      </div>
                      <div className="mt-2">
                        <OnDutyStatusBadge type="admin" value={request.admin_status} />
                      </div>
                    </div>
                  </div>
                ) : null}

                {request?.shortlist_proof_path ? (
                  <div className="mt-4">
                    <a
                      href={getOnDutyUploadUrl(request.shortlist_proof_path)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#1754cf] hover:underline"
                    >
                      <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
                      View uploaded proof
                    </a>
                  </div>
                ) : null}

                {!unlockedByProgress ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    This OD opens only after admin marks your team as cleared for the previous round.
                  </div>
                ) : null}

                {canSubmit ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div className="flex-1">
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {proofRequired ? "Shortlist Proof" : "Proof (Optional)"}
                        </label>
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(eventValue) =>
                            handleSelectFile(roundId, eventValue.target.files?.[0] || null)
                          }
                          className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          {proofRequired
                            ? "Upload the shortlist proof from the previous round to unlock this OD."
                            : "Round 1 OD can be submitted directly for the configured offline dates."}
                        </p>
                        {selectedFile ? (
                          <p className="mt-2 text-xs font-medium text-slate-600">
                            Selected: {selectedFile.name}
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSubmit(round)}
                        disabled={submitBusyRoundId === roundId}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1754cf] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <UploadFileRoundedIcon sx={{ fontSize: 18 }} />
                        {submitBusyRoundId === roundId
                          ? "Submitting..."
                          : request
                            ? "Resubmit OD"
                            : "Apply OD"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          OD History
        </h3>

        {loading ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Loading OD history...
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            No OD requests have been submitted for this registration yet.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-[920px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Round</th>
                  <th className="px-4 py-3 text-left font-semibold">OD Dates</th>
                  <th className="px-4 py-3 text-left font-semibold">Days</th>
                  <th className="px-4 py-3 text-left font-semibold">Faculty</th>
                  <th className="px-4 py-3 text-left font-semibold">HOD</th>
                  <th className="px-4 py-3 text-left font-semibold">Admin</th>
                  <th className="px-4 py-3 text-left font-semibold">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {requests.map((request) => (
                  <tr key={request.od_request_id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {request.round_name || `Round ${request.round_order || "-"}`}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Submitted by {request.requested_by_student_name || request.requested_by_student_id}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatOnDutyDate(request.requested_from_date)}
                      {request.requested_to_date &&
                      request.requested_to_date !== request.requested_from_date
                        ? ` to ${formatOnDutyDate(request.requested_to_date)}`
                        : ""}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{request.requested_day_count}</td>
                    <td className="px-4 py-3">
                      <OnDutyStatusBadge type="external" value={request.faculty_status} />
                    </td>
                    <td className="px-4 py-3">
                      <OnDutyStatusBadge type="external" value={request.hod_status} />
                    </td>
                    <td className="px-4 py-3">
                      <OnDutyStatusBadge type="admin" value={request.admin_status} />
                    </td>
                    <td className="px-4 py-3">
                      {request.shortlist_proof_path ? (
                        <a
                          href={getOnDutyUploadUrl(request.shortlist_proof_path)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1754cf] hover:underline"
                        >
                          <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
                          Open
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
