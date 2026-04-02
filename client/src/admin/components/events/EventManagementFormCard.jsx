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
  formatRewardAllocationValue
} from "./eventManagement.constants";
import { AdminMappedBadge } from "../ui/AdminUiPrimitives";

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
  onCancelEdit,
  onChangeField,
  onReset,
  onSubmit,
  saving
}) {
  const isIndia = String(form.country || "").trim().toLowerCase() === "india";
  const rewardsEnabled = form.eligible_for_rewards === "true";
  const rewardPreview = rewardsEnabled
    ? formatRewardAllocationValue({
        first_year_reward: form.first_year_reward,
        second_year_reward: form.second_year_reward,
        third_year_reward: form.third_year_reward,
        fourth_year_reward: form.fourth_year_reward
      }) || DEFAULT_REWARD_ALLOCATION
    : "-";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            {editingId ? `Update Event #${editingId}` : "Create Event"}
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
              label="Event Organizer"
              value={form.event_organizer}
              onChange={(event) => onChangeField("event_organizer", event.target.value)}
              placeholder="IEEE Student Branch"
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

            <InputField
              label="Competition Name"
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
              label="Web Link"
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
              label="Selected Resources"
              value={form.selected_resources}
              onChange={(event) => onChangeField("selected_resources", event.target.value)}
              placeholder="Projector, Auditorium, Judges"
              maxLength={1000}
            />
          </div>
        </Section>

        <Section title="Participation">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

            <InputField
              label="Maximum Count"
              type="number"
              min={0}
              step={1}
              value={form.maximum_count}
              onChange={(event) => onChangeField("maximum_count", event.target.value)}
              placeholder="100"
            />

            <InputField
              label="Applied Count"
              type="number"
              min={0}
              step={1}
              value={form.applied_count}
              onChange={(event) => onChangeField("applied_count", event.target.value)}
              placeholder="25"
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

        <Section title="Description">
          <TextAreaField
            label="Event Description"
            value={form.description}
            onChange={(event) => onChangeField("description", event.target.value)}
            placeholder="Enter event description"
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
            {saving ? "Saving..." : editingId ? "Update Event" : "Create Event"}
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
