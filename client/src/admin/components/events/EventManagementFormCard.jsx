import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import {
  BOOLEAN_SELECT_OPTIONS,
  COUNTRY_OPTIONS,
  DEFAULT_REWARD_ALLOCATION,
  EVENT_CATEGORY_OPTIONS,
  EVENT_LEVEL_OPTIONS,
  EVENT_STATUSES,
  INDIA_STATE_OPTIONS,
  STATUS_STYLES,
  formatCountValue,
  formatRewardAllocationValue
} from "./eventManagement.constants";
import { AdminMappedBadge } from "../ui/AdminUiPrimitives";

const ROUND_STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "SCHEDULED" },
  { value: "ONGOING", label: "ONGOING" },
  { value: "COMPLETED", label: "COMPLETED" },
  { value: "CANCELLED", label: "CANCELLED" }
];

const ROUND_MODE_OPTIONS = [
  { value: "ONLINE", label: "Online" },
  { value: "OFFLINE", label: "Offline" }
];

const REGISTRATION_MODE_OPTIONS = [
  { value: "TEAM", label: "Team" },
  { value: "INDIVIDUAL", label: "Individual Direct" }
];

const labelClass =
  "mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500";
const controlClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#0f6cbd] focus:ring-4 focus:ring-[#0f6cbd]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
const selectClass = `${controlClass} appearance-none pr-10`;
const textareaClass = `${controlClass} min-h-[108px] resize-y`;

function Section({
  children,
  title
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
        {title}
      </h3>
      {children}
    </section>
  );
}

function InputField({
  className = "",
  label,
  list,
  maxLength,
  min,
  onChange,
  placeholder,
  step,
  type = "text",
  value
}) {
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={controlClass}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        step={step}
        list={list}
      />
    </div>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <select value={value} onChange={onChange} className={selectClass}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
        </span>
      </div>
    </div>
  );
}

function TextAreaField({
  label,
  maxLength,
  onChange,
  placeholder,
  value
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        className={textareaClass}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </div>
  );
}

function ReadOnlyField({
  label,
  value
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700">
        {value || "-"}
      </div>
    </div>
  );
}

export default function EventManagementFormCard({
  editingId,
  form,
  hubOptions = [],
  onAddRound,
  onCancelEdit,
  onChangeField,
  onChangeRound,
  onRemoveRound,
  onReset,
  onSubmit,
  onToggleAllowedHub,
  saving
}) {
  const isIndia = String(form.country || "").trim().toLowerCase() === "india";
  const isIndividualRegistration = String(form.registration_mode || "").toUpperCase() === "INDIVIDUAL";
  const selectedAllowedHubIds = new Set(
    (Array.isArray(form.allowed_hub_ids) ? form.allowed_hub_ids : [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value))
  );
  const rewardsEnabled = form.eligible_for_rewards === "true";
  const rewardPreview = rewardsEnabled
    ? formatRewardAllocationValue({
        first_year_reward: form.first_year_reward,
        second_year_reward: form.second_year_reward,
        third_year_reward: form.third_year_reward,
        fourth_year_reward: form.fourth_year_reward
      }) || DEFAULT_REWARD_ALLOCATION
    : "-";
  const validRegistrationsLabel =
    editingId || String(form.applied_count || "").trim()
      ? formatCountValue(form.applied_count)
      : "Auto-tracked after a team reaches the minimum member count";
  const availableSlotsLabel = (() => {
    const maximumCount = Number(form.maximum_count);
    if (!Number.isFinite(maximumCount)) {
      return "Unlimited";
    }

    const validRegistrations = Number(form.applied_count);
    const usedCount = Number.isFinite(validRegistrations) ? validRegistrations : 0;
    return String(Math.max(0, maximumCount - usedCount));
  })();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            {editingId ? `Update Event Listing #${editingId}` : "Create Event Listing"}
          </h2>
          <AdminMappedBadge
            map={STATUS_STYLES}
            value={form.status}
            className="px-3 py-1 text-[10px]"
          />
        </div>

        <button
          type="button"
          onClick={onCancelEdit}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {editingId ? "Cancel Edit" : "Close"}
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Section title="Basic Details">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <InputField
              label="Event Code"
              value={form.event_code}
              onChange={(event) => onChangeField("event_code", event.target.value)}
              placeholder="HACK2026"
              maxLength={50}
            />

            <InputField
              label="Event Name"
              value={form.event_name}
              onChange={(event) => onChangeField("event_name", event.target.value)}
              placeholder="Hackathon 2026"
              maxLength={150}
            />

            <InputField
              label="Host / Organizer"
              value={form.event_organizer}
              onChange={(event) => onChangeField("event_organizer", event.target.value)}
              placeholder="AICTE, IEEE, Hackathon Team"
              maxLength={255}
            />

            <InputField
              label="Event Category"
              value={form.event_category}
              onChange={(event) => onChangeField("event_category", event.target.value)}
              placeholder="Choose category"
              list="event-category-options"
            />

            <InputField
              label="Event Level"
              value={form.event_level}
              onChange={(event) => onChangeField("event_level", event.target.value)}
              placeholder="Choose level"
              list="event-level-options"
            />

            <SelectField
              label="Status"
              value={form.status}
              onChange={(event) => onChangeField("status", event.target.value)}
              options={EVENT_STATUSES.map((status) => ({ value: status, label: status }))}
            />

            <SelectField
              label="Registration Mode"
              value={form.registration_mode}
              onChange={(event) => onChangeField("registration_mode", event.target.value)}
              options={REGISTRATION_MODE_OPTIONS}
            />

            <InputField
              label="Program / Competition"
              value={form.competition_name}
              onChange={(event) => onChangeField("competition_name", event.target.value)}
              placeholder="Smart India Hackathon"
              maxLength={255}
            />

            <InputField
              label="Competition Levels"
              type="number"
              min={0}
              step={1}
              value={form.total_level_of_competition}
              onChange={(event) =>
                onChangeField("total_level_of_competition", event.target.value)
              }
              placeholder="3"
            />

            <InputField
              label="Department"
              value={form.department}
              onChange={(event) => onChangeField("department", event.target.value)}
              placeholder="CSE"
              maxLength={120}
            />
          </div>
        </Section>

        <Section title="Location And Dates">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <InputField
              label="Event Location"
              value={form.location}
              onChange={(event) => onChangeField("location", event.target.value)}
              placeholder="Main Auditorium"
              maxLength={255}
            />

            <InputField
              label="Registration / Reference Link"
              value={form.registration_link}
              onChange={(event) => onChangeField("registration_link", event.target.value)}
              placeholder="https://example.com/event"
              maxLength={500}
            />

            <InputField
              label="Country"
              value={form.country}
              onChange={(event) => onChangeField("country", event.target.value)}
              placeholder="Choose country"
              list="event-country-options"
            />

            <InputField
              label={isIndia ? "State / Union Territory" : "State / Region"}
              value={form.state}
              onChange={(event) => onChangeField("state", event.target.value)}
              placeholder={isIndia ? "Choose state" : "Enter state or region"}
              list={isIndia ? "india-state-options" : undefined}
            />

            <InputField
              label="Event Start"
              type="date"
              value={form.start_date}
              onChange={(event) => onChangeField("start_date", event.target.value)}
            />

            <InputField
              label="Event End"
              type="date"
              value={form.end_date}
              onChange={(event) => onChangeField("end_date", event.target.value)}
            />

            <InputField
              label="Registration Start"
              type="date"
              value={form.registration_start_date}
              onChange={(event) =>
                onChangeField("registration_start_date", event.target.value)
              }
            />

            <InputField
              label="Registration End"
              type="date"
              value={form.registration_end_date}
              onChange={(event) =>
                onChangeField("registration_end_date", event.target.value)
              }
            />

            <InputField
              label="Participation Notes"
              value={form.selected_resources}
              onChange={(event) => onChangeField("selected_resources", event.target.value)}
              placeholder="Rules, submission notes, contact details, or required documents"
              maxLength={1000}
            />
          </div>
        </Section>

        <Section title="Participation">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isIndividualRegistration ? (
              <>
                <ReadOnlyField label="Min Members" value="1" />
                <ReadOnlyField label="Max Members" value="1" />
              </>
            ) : (
              <>
                <InputField
                  label="Min Members"
                  type="number"
                  min={1}
                  step={1}
                  value={form.min_members}
                  onChange={(event) => onChangeField("min_members", event.target.value)}
                  placeholder="3"
                />

                <InputField
                  label="Max Members"
                  type="number"
                  min={1}
                  step={1}
                  value={form.max_members}
                  onChange={(event) => onChangeField("max_members", event.target.value)}
                  placeholder="6"
                />
              </>
            )}

            <InputField
              label="Maximum Count"
              type="number"
              min={0}
              step={1}
              value={form.maximum_count}
              onChange={(event) => onChangeField("maximum_count", event.target.value)}
              placeholder="100"
            />

            <ReadOnlyField
              label="Valid Registrations"
              value={validRegistrationsLabel}
            />

            <ReadOnlyField
              label="Available Slots"
              value={availableSlotsLabel}
            />

            <SelectField
              label="Apply By Student"
              value={form.apply_by_student}
              onChange={(event) => onChangeField("apply_by_student", event.target.value)}
              options={BOOLEAN_SELECT_OPTIONS}
            />

            <SelectField
              label="Eligible For Rewards"
              value={form.eligible_for_rewards}
              onChange={(event) => onChangeField("eligible_for_rewards", event.target.value)}
              options={BOOLEAN_SELECT_OPTIONS}
            />

            <SelectField
              label="Within BIT"
              value={form.within_bit}
              onChange={(event) => onChangeField("within_bit", event.target.value)}
              options={BOOLEAN_SELECT_OPTIONS}
            />

            <SelectField
              label="Special Lab"
              value={form.related_to_special_lab}
              onChange={(event) =>
                onChangeField("related_to_special_lab", event.target.value)
              }
              options={BOOLEAN_SELECT_OPTIONS}
            />
          </div>

          {isIndividualRegistration ? (
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Students will register directly for this event. Each registration creates a single-person participant record automatically.
            </div>
          ) : null}
        </Section>

        <Section title="Hub Access">
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Leave this empty to allow any student who meets the hub quota. Select one or more hubs to restrict participation to active members of those hubs only.
            </p>

            {hubOptions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
                No active hubs are available yet. Create hubs first to use hub-based access.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {hubOptions.map((hub) => {
                  const hubId = Number(hub.team_id);
                  const selected = selectedAllowedHubIds.has(hubId);
                  const priorityLabel = String(hub.hub_priority || "")
                    .trim()
                    .toLowerCase();

                  return (
                    <button
                      key={hubId}
                      type="button"
                      onClick={() => onToggleAllowedHub?.(hubId)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        selected
                          ? "border-[#0f6cbd]/30 bg-[#0f6cbd]/8 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                          {hub.team_code || `Hub ${hubId}`}
                        </span>
                        {priorityLabel ? (
                          <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                            {priorityLabel}
                          </span>
                        ) : null}
                        {selected ? (
                          <span className="inline-flex rounded-full border border-[#0f6cbd]/20 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0f6cbd]">
                            Selected
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">
                        {hub.team_name || "-"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Only active members of this hub can participate when selected.
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Section>

        <Section title="Rounds">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Configure the stages students or teams move through so admin can track progress clearly.
            </p>
            <button
              type="button"
              onClick={onAddRound}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <AddRoundedIcon sx={{ fontSize: 18 }} />
              Add Round
            </button>
          </div>

          {form.rounds.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
              No stages configured yet. Add rounds like Screening, Semi Final, and Final.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {form.rounds.map((round, index) => (
                <div
                  key={`round-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f6cbd]">
                        Round {index + 1}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Define the mode, schedule, and details for this stage.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveRound(index)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <InputField
                      label="Round Name"
                      value={round.round_name}
                      onChange={(event) =>
                        onChangeRound(index, "round_name", event.target.value)
                      }
                      placeholder="Screening Round"
                      maxLength={150}
                    />

                    <InputField
                      label="Round Start Date"
                      type="date"
                      value={round.round_date}
                      onChange={(event) =>
                        onChangeRound(index, "round_date", event.target.value)
                      }
                    />

                    <InputField
                      label="Round End Date"
                      type="date"
                      value={round.round_end_date}
                      onChange={(event) =>
                        onChangeRound(index, "round_end_date", event.target.value)
                      }
                    />

                    <SelectField
                      label="Round Mode"
                      value={round.round_mode || "ONLINE"}
                      onChange={(event) =>
                        onChangeRound(index, "round_mode", event.target.value)
                      }
                      options={ROUND_MODE_OPTIONS}
                    />

                    <SelectField
                      label="Round Status"
                      value={round.status}
                      onChange={(event) =>
                        onChangeRound(index, "status", event.target.value)
                      }
                      options={ROUND_STATUS_OPTIONS}
                    />

                    <InputField
                      label="Start Time"
                      type="time"
                      value={round.start_time}
                      onChange={(event) =>
                        onChangeRound(index, "start_time", event.target.value)
                      }
                    />

                    <InputField
                      label="End Time"
                      type="time"
                      value={round.end_time}
                      onChange={(event) =>
                        onChangeRound(index, "end_time", event.target.value)
                      }
                    />

                    <InputField
                      label="Round Location"
                      value={round.location}
                      onChange={(event) =>
                        onChangeRound(index, "location", event.target.value)
                      }
                      placeholder="Seminar Hall 2"
                      maxLength={255}
                    />
                  </div>

                  <div className="mt-4">
                    <TextAreaField
                      label="Round Details"
                      value={round.description}
                      onChange={(event) =>
                        onChangeRound(index, "description", event.target.value)
                      }
                      placeholder="Explain what happens in this round, what teams submit, and how they get evaluated."
                      maxLength={1000}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {rewardsEnabled ? (
          <Section title="Rewards">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InputField
                label="Winner Reward"
                type="number"
                min={0}
                step={1}
                value={form.winner_rewards}
                onChange={(event) => onChangeField("winner_rewards", event.target.value)}
                placeholder="1000"
              />

              <InputField
                label="I Year Reward"
                type="number"
                min={0}
                step={1}
                value={form.first_year_reward}
                onChange={(event) => onChangeField("first_year_reward", event.target.value)}
                placeholder="400"
              />

              <InputField
                label="II Year Reward"
                type="number"
                min={0}
                step={1}
                value={form.second_year_reward}
                onChange={(event) => onChangeField("second_year_reward", event.target.value)}
                placeholder="400"
              />

              <InputField
                label="III Year Reward"
                type="number"
                min={0}
                step={1}
                value={form.third_year_reward}
                onChange={(event) => onChangeField("third_year_reward", event.target.value)}
                placeholder="600"
              />

              <InputField
                label="IV Year Reward"
                type="number"
                min={0}
                step={1}
                value={form.fourth_year_reward}
                onChange={(event) => onChangeField("fourth_year_reward", event.target.value)}
                placeholder="600"
              />

              <ReadOnlyField label="Reward Allocation" value={rewardPreview} />
            </div>
          </Section>
        ) : null}

        <Section title="Participation Notes">
          <TextAreaField
            label="Student-Facing Notes"
            value={form.description}
            onChange={(event) => onChangeField("description", event.target.value)}
            placeholder="Add notes that help students understand the opportunity, rules, and expectations."
            maxLength={1000}
          />
        </Section>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#0f6cbd] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0f6cbd]/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving..." : editingId ? "Update Listing" : "Create Listing"}
          </button>
        </div>
      </form>

      <datalist id="event-country-options">
        {COUNTRY_OPTIONS.map((country) => (
          <option key={country} value={country} />
        ))}
      </datalist>

      <datalist id="event-category-options">
        {EVENT_CATEGORY_OPTIONS.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <datalist id="event-level-options">
        {EVENT_LEVEL_OPTIONS.map((level) => (
          <option key={level} value={level} />
        ))}
      </datalist>

      <datalist id="india-state-options">
        {INDIA_STATE_OPTIONS.map((state) => (
          <option key={state} value={state} />
        ))}
      </datalist>
    </section>
  );
}
