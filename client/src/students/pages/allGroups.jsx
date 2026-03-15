import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStudentLeaderboards } from "../../service/eligibility.api";
import { fetchGroups } from "../../service/groups.api";
import { getMyJoinRequests, applyJoinRequest } from "../../service/joinRequests.api";
import { fetchMyGroup } from "../../service/membership.api";
import AllGroupsDesktopTable from "../components/allGroups/AllGroupsDesktopTable";
import AllGroupsHero from "../components/allGroups/AllGroupsHero";
import AllGroupsMobileCards from "../components/allGroups/AllGroupsMobileCards";
import { hasRank } from "../components/allGroups/allGroups.constants";

const toGroupRankMap = (groups = []) => {
  const map = new Map();

  for (const row of Array.isArray(groups) ? groups : []) {
    const groupId = row?.group_id;
    if (groupId === null || groupId === undefined) continue;

    map.set(String(groupId), {
      group_rank: hasRank(row?.rank) ? Number(row.rank) : null,
      active_member_count:
        row?.active_member_count === null || row?.active_member_count === undefined
          ? null
          : Number(row.active_member_count),
      total_base_points:
        row?.total_base_points === null || row?.total_base_points === undefined
          ? null
          : Number(row.total_base_points)
    });
  }

  return map;
};

const TIER_SORT_ORDER = ["A", "B", "C", "D"];

const createDefaultSortState = () => ({
  key: null,
  direction: null
});

const getGroupPointsValue = (group) => {
  if (group?.total_base_points !== null && group?.total_base_points !== undefined) {
    const totalBasePoints = Number(group.total_base_points);
    return Number.isFinite(totalBasePoints) ? totalBasePoints : null;
  }

  if (group?.total_points !== null && group?.total_points !== undefined) {
    const totalPoints = Number(group.total_points);
    return Number.isFinite(totalPoints) ? totalPoints : null;
  }

  return null;
};

const getNumericSortValue = (group, key) => {
  switch (key) {
    case "captainPoints": {
      const captainPoints = Number(group?.captain_points);
      return Number.isFinite(captainPoints) ? captainPoints : null;
    }
    case "points":
      return getGroupPointsValue(group);
    case "rank":
      return hasRank(group?.group_rank) ? Number(group.group_rank) : null;
    case "vacancies": {
      const vacancies = Number(group?.vacancies);
      return Number.isFinite(vacancies) ? vacancies : null;
    }
    default:
      return null;
  }
};

const compareNullableNumbers = (aValue, bValue, direction = "asc") => {
  const aIsValid = Number.isFinite(aValue);
  const bIsValid = Number.isFinite(bValue);

  if (aIsValid && bIsValid) {
    if (aValue === bValue) return 0;
    return direction === "desc" ? bValue - aValue : aValue - bValue;
  }

  if (aIsValid !== bIsValid) {
    return aIsValid ? -1 : 1;
  }

  return 0;
};

const compareTierValues = (aGroup, bGroup, direction = "asc") => {
  const aTier = String(aGroup?.tier || "").toUpperCase();
  const bTier = String(bGroup?.tier || "").toUpperCase();
  const aHasTier = aTier.length > 0;
  const bHasTier = bTier.length > 0;

  if (aHasTier && bHasTier) {
    const aIndex = TIER_SORT_ORDER.indexOf(aTier);
    const bIndex = TIER_SORT_ORDER.indexOf(bTier);
    const aRank = aIndex === -1 ? TIER_SORT_ORDER.length : aIndex;
    const bRank = bIndex === -1 ? TIER_SORT_ORDER.length : bIndex;

    if (aRank !== bRank) {
      return direction === "desc" ? bRank - aRank : aRank - bRank;
    }

    const textCompare = aTier.localeCompare(bTier);
    if (textCompare !== 0) {
      return direction === "desc" ? -textCompare : textCompare;
    }
  }

  if (aHasTier !== bHasTier) {
    return aHasTier ? -1 : 1;
  }

  return 0;
};

const compareGroupNames = (aGroup, bGroup) =>
  String(aGroup?.group_name || "").localeCompare(String(bGroup?.group_name || ""));

export default function AllGroups() {
  const nav = useNavigate();

  const [groups, setGroups] = useState([]);
  const [groupRankings, setGroupRankings] = useState([]);
  const [myGroup, setMyGroup] = useState(null);
  const [myJoinRequests, setMyJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [rankingWarning, setRankingWarning] = useState("");
  const [joinBusyGroupId, setJoinBusyGroupId] = useState(null);

  const [groupQuery, setGroupQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [eligibilityFilter, setEligibilityFilter] = useState("ALL");
  const [captainFilter, setCaptainFilter] = useState("");
  const [rankFilter, setRankFilter] = useState("ALL");
  const [vacancyFilter, setVacancyFilter] = useState("ALL");
  const [pointsMinFilter, setPointsMinFilter] = useState("");
  const [acceptingFilter, setAcceptingFilter] = useState("ALL");
  const [sortState, setSortState] = useState(() => createDefaultSortState());
  const hasActiveSort = Boolean(sortState.key) && Boolean(sortState.direction);
  const canResetFilters =
    String(groupQuery || "").trim().length > 0 ||
    tierFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    eligibilityFilter !== "ALL" ||
    String(captainFilter || "").trim().length > 0 ||
    rankFilter !== "ALL" ||
    vacancyFilter !== "ALL" ||
    String(pointsMinFilter || "").trim().length > 0 ||
    acceptingFilter !== "ALL" ||
    hasActiveSort;

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    setRankingWarning("");

    try {
      const [groupRows, leaderboardRows, myGroupRes, myRequestRows] = await Promise.all([
        fetchGroups({ exclude_status: "FROZEN" }),
        fetchStudentLeaderboards({
          include: "groups",
          exclude_group_status: "FROZEN"
        }).catch(() => null),
        fetchMyGroup().catch(() => ({ group: null })),
        getMyJoinRequests().catch(() => [])
      ]);

      setGroups(Array.isArray(groupRows) ? groupRows : []);
      setMyGroup(myGroupRes?.group ?? null);
      setMyJoinRequests(Array.isArray(myRequestRows) ? myRequestRows : []);

      if (leaderboardRows) {
        setGroupRankings(Array.isArray(leaderboardRows?.groups) ? leaderboardRows.groups : []);
      } else {
        setGroupRankings([]);
        setRankingWarning("Groups loaded, but ranking data is temporarily unavailable.");
      }
    } catch (e) {
      setErr(e?.response?.data?.error || e?.response?.data?.message || "Failed to load groups");
      setGroups([]);
      setGroupRankings([]);
      setMyGroup(null);
      setMyJoinRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groupRankMap = useMemo(
    () => toGroupRankMap(groupRankings),
    [groupRankings]
  );

  const pendingRequestGroupIdSet = useMemo(() => {
    const set = new Set();

    for (const row of myJoinRequests) {
      if (String(row?.status || "").toUpperCase() === "PENDING") {
        const groupId = Number(row?.group_id);
        if (Number.isFinite(groupId)) set.add(groupId);
      }
    }

    return set;
  }, [myJoinRequests]);

  const mergedGroups = useMemo(
    () =>
      (Array.isArray(groups) ? groups : []).map((group) => {
        const groupRanking = groupRankMap.get(String(group.group_id)) || {};

        return {
          ...group,
          captain_name: group?.captain_name || group?.leader_name || null,
          captain_points:
            group?.captain_points === null || group?.captain_points === undefined
              ? null
              : Number(group.captain_points),
          ...groupRanking,
          active_member_count:
            groupRanking.active_member_count ??
            (group?.active_member_count === null || group?.active_member_count === undefined
              ? null
              : Number(group.active_member_count)),
          total_base_points:
            groupRanking.total_base_points ??
            (group?.total_points === null || group?.total_points === undefined
              ? null
              : Number(group.total_points))
        };
      }),
    [groups, groupRankMap]
  );

  const tierOptions = useMemo(
    () => TIER_SORT_ORDER,
    []
  );

  const statusOptions = useMemo(
    () => ["ACTIVE", "INACTIVE"],
    []
  );

  const eligibilityOptions = useMemo(
    () => ["ELIGIBLE", "NOT_ELIGIBLE", "NOT_EVALUATED"],
    []
  );

  const rankOptions = useMemo(
    () => ["RANKED", "UNRANKED"],
    []
  );

  const onNumericSort = useCallback((key) => {
    setSortState((prev) => {
      if (prev.key !== key || !prev.direction) {
        return {
          key,
          direction: "asc"
        };
      }

      if (prev.direction === "asc") {
        return {
          key,
          direction: "desc"
        };
      }

      return createDefaultSortState();
    });
  }, []);

  const onTierHeaderClick = useCallback(() => {
    const availableTiers = tierOptions.filter(Boolean);

    if (tierFilter !== "ALL") {
      const currentIndex = availableTiers.indexOf(tierFilter);
      const nextTier = currentIndex >= 0 ? availableTiers[currentIndex + 1] : availableTiers[0];

      if (nextTier) {
        setSortState(createDefaultSortState());
        setTierFilter(nextTier);
        return;
      }

      setTierFilter("ALL");
      setSortState(createDefaultSortState());
      return;
    }

    if (sortState.key !== "tier" || sortState.direction !== "asc") {
      setSortState({
        key: "tier",
        direction: "asc"
      });
      return;
    }

    if (availableTiers.length > 0) {
      setSortState(createDefaultSortState());
      setTierFilter(availableTiers[0]);
      return;
    }

    setSortState(createDefaultSortState());
  }, [sortState.direction, sortState.key, tierFilter, tierOptions]);

  const onStatusHeaderClick = useCallback(() => {
    setStatusFilter((prev) => {
      if (prev === "ALL") return "ACTIVE";
      if (prev === "ACTIVE") return "INACTIVE";
      return "ALL";
    });
  }, []);

  const filtered = useMemo(() => {
    const groupSearch = String(groupQuery || "").trim().toLowerCase();
    const captainSearch = String(captainFilter || "").trim().toLowerCase();
    const minPointsValue = String(pointsMinFilter || "").trim();
    const minPoints =
      minPointsValue.length > 0 && Number.isFinite(Number(minPointsValue))
        ? Number(minPointsValue)
        : null;

    const filteredRows = mergedGroups
      .map((group, index) => ({ group, index }))
      .filter(({ group }) => {
        if (tierFilter !== "ALL" && String(group.tier || "").toUpperCase() !== tierFilter) {
          return false;
        }

        if (statusFilter !== "ALL" && String(group.status || "").toUpperCase() !== statusFilter) {
          return false;
        }

        const eligibilityStatus = String(group.current_phase_eligibility_status || "").toUpperCase();
        if (eligibilityFilter !== "ALL" && eligibilityStatus !== eligibilityFilter) {
          return false;
        }

        if (rankFilter === "RANKED" && !hasRank(group.group_rank)) {
          return false;
        }

        if (rankFilter === "UNRANKED" && hasRank(group.group_rank)) {
          return false;
        }

        const vacancies =
          group?.vacancies === null || group?.vacancies === undefined
            ? null
            : Number(group.vacancies);
        if (vacancyFilter === "HAS_VACANCY" && !(Number.isFinite(vacancies) && vacancies > 0)) {
          return false;
        }
        if (vacancyFilter === "FULL" && !(Number.isFinite(vacancies) && vacancies === 0)) {
          return false;
        }

        const accepting = group?.accepting_applications === true;
        if (acceptingFilter === "YES" && !accepting) {
          return false;
        }
        if (acceptingFilter === "NO" && accepting) {
          return false;
        }

        if (groupSearch) {
          const groupHaystack = [group.group_id, group.group_code, group.group_name]
            .map((value) => String(value || "").toLowerCase())
            .join(" ");

          if (!groupHaystack.includes(groupSearch)) {
            return false;
          }
        }

        if (captainSearch) {
          const captainHaystack = [group.captain_name]
            .map((value) => String(value || "").toLowerCase())
            .join(" ");

          if (!captainHaystack.includes(captainSearch)) {
            return false;
          }
        }

        if (minPoints !== null) {
          const groupPoints =
            group?.total_base_points !== null && group?.total_base_points !== undefined
              ? Number(group.total_base_points)
              : group?.total_points !== null && group?.total_points !== undefined
                ? Number(group.total_points)
                : null;

          if (!Number.isFinite(groupPoints) || groupPoints < minPoints) {
            return false;
          }
        }

        return true;
      });

    if (!sortState.key || !sortState.direction) {
      return filteredRows.map(({ group }) => group);
    }

    return filteredRows
      .sort((aRow, bRow) => {
        const a = aRow.group;
        const b = bRow.group;
        const primarySort =
          sortState.key === "tier"
            ? compareTierValues(a, b, sortState.direction)
            : compareNullableNumbers(
                getNumericSortValue(a, sortState.key),
                getNumericSortValue(b, sortState.key),
                sortState.direction
              );

        if (primarySort !== 0) {
          return primarySort;
        }

        const rankFallback = compareNullableNumbers(
          getNumericSortValue(a, "rank"),
          getNumericSortValue(b, "rank"),
          "asc"
        );

        if (rankFallback !== 0) {
          return rankFallback;
        }

        const nameFallback = compareGroupNames(a, b);
        if (nameFallback !== 0) {
          return nameFallback;
        }

        return aRow.index - bRow.index;
      })
      .map(({ group }) => group);
  }, [
    acceptingFilter,
    captainFilter,
    eligibilityFilter,
    groupQuery,
    mergedGroups,
    pointsMinFilter,
    rankFilter,
    sortState.direction,
    sortState.key,
    statusFilter,
    tierFilter,
    vacancyFilter
  ]);

  const resolveJoinAction = useCallback(
    (group) => {
      const groupId = Number(group?.group_id);
      const currentGroupId = Number(myGroup?.group_id);
      const isCurrentGroup =
        Number.isFinite(groupId) &&
        Number.isFinite(currentGroupId) &&
        groupId === currentGroupId;
      const hasPending = pendingRequestGroupIdSet.has(groupId);
      const isBusy = joinBusyGroupId === groupId;
      const isActiveGroup = String(group?.status || "").toUpperCase() === "ACTIVE";
      const vacancies = Number(group?.vacancies);
      const hasVacancy = Number.isFinite(vacancies) ? vacancies > 0 : false;
      const accepting = group?.accepting_applications === true;

      if (isBusy) {
        return {
          disabled: true,
          label: "Joining...",
          title: "Submitting your join request"
        };
      }

      if (isCurrentGroup) {
        return {
          disabled: true,
          label: "Current",
          title: "This is your current group"
        };
      }

      if (Number.isFinite(currentGroupId) && currentGroupId > 0) {
        return {
          disabled: true,
          label: "Join",
          title: "Leave your current group before requesting another one"
        };
      }

      if (hasPending) {
        return {
          disabled: true,
          label: "Requested",
          title: "Your join request is already pending for this group"
        };
      }

      if (!isActiveGroup) {
        return {
          disabled: true,
          label: "Join",
          title: "Only active groups can accept join requests"
        };
      }

      if (!accepting || !hasVacancy) {
        return {
          disabled: true,
          label: "Join",
          title: !accepting
            ? "This group is not accepting applications"
            : "This group has no vacancies"
        };
      }

      return {
        disabled: false,
        label: "Join",
        title: "Send join request"
      };
    },
    [joinBusyGroupId, myGroup?.group_id, pendingRequestGroupIdSet]
  );

  const onJoin = useCallback(
    async (group) => {
      const joinAction = resolveJoinAction(group);
      if (joinAction.disabled || !group?.group_id) return;

      const ok = window.confirm(
        `Send join request to ${group.group_name || group.group_code || "this group"}?`
      );
      if (!ok) return;

      setJoinBusyGroupId(Number(group.group_id));
      setActionErr("");

      try {
        await applyJoinRequest(group.group_id);
        await load();
      } catch (e) {
        setActionErr(e?.response?.data?.message || "Failed to send join request");
      } finally {
        setJoinBusyGroupId(null);
      }
    },
    [load, resolveJoinAction]
  );

  const resetFilters = useCallback(async () => {
    setGroupQuery("");
    setTierFilter("ALL");
    setStatusFilter("ALL");
    setEligibilityFilter("ALL");
    setCaptainFilter("");
    setRankFilter("ALL");
    setVacancyFilter("ALL");
    setPointsMinFilter("");
    setAcceptingFilter("ALL");
    setSortState(createDefaultSortState());
    await load();
  }, [load]);

  const filterProps = useMemo(
    () => ({
      acceptingFilter,
      captainFilter,
      canReset: canResetFilters,
      eligibilityFilter,
      eligibilityOptions,
      groupQuery,
      onCaptainChange: (e) => setCaptainFilter(e.target.value),
      onCaptainSort: () => onNumericSort("captainPoints"),
      onAcceptingChange: (e) => setAcceptingFilter(e.target.value),
      onEligibilityChange: (e) => setEligibilityFilter(e.target.value),
      onGroupQueryChange: (e) => setGroupQuery(e.target.value),
      onPointsMinChange: (e) => setPointsMinFilter(e.target.value),
      onPointsSort: () => onNumericSort("points"),
      onRankChange: (e) => setRankFilter(e.target.value),
      onRankSort: () => onNumericSort("rank"),
      onReset: resetFilters,
      onStatusChange: (e) => setStatusFilter(e.target.value),
      onStatusHeaderClick,
      onTierChange: (e) => setTierFilter(e.target.value),
      onTierHeaderClick,
      onVacancyChange: (e) => setVacancyFilter(e.target.value),
      onVacancySort: () => onNumericSort("vacancies"),
      pointsMinFilter,
      rankFilter,
      rankOptions,
      resultCount: filtered.length,
      sortState,
      statusFilter,
      statusOptions,
      tierFilter,
      tierOptions,
      totalCount: mergedGroups.length,
      vacancyFilter
    }),
    [
      acceptingFilter,
      captainFilter,
      canResetFilters,
      eligibilityFilter,
      eligibilityOptions,
      filtered.length,
      groupQuery,
      mergedGroups.length,
      onNumericSort,
      onStatusHeaderClick,
      onTierHeaderClick,
      pointsMinFilter,
      rankFilter,
      rankOptions,
      resetFilters,
      sortState,
      statusFilter,
      statusOptions,
      tierFilter,
      tierOptions,
      vacancyFilter
    ]
  );

  if (loading && groups.length === 0 && !err) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
          Loading groups...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl space-y-4 p-4 md:p-6">
      <AllGroupsHero
        loading={loading}
        onRefresh={load}
      />

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{err}</div>
      ) : null}

      {actionErr ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {actionErr}
        </div>
      ) : null}

      {rankingWarning ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          {rankingWarning}
        </div>
      ) : null}

      <AllGroupsMobileCards
        filterProps={filterProps}
        rows={filtered}
        onJoin={onJoin}
        onView={(groupId) => nav(`/groups/${groupId}`)}
        resolveJoinAction={resolveJoinAction}
      />
      <AllGroupsDesktopTable
        filterProps={filterProps}
        rows={filtered}
        onJoin={onJoin}
        onView={(groupId) => nav(`/groups/${groupId}`)}
        resolveJoinAction={resolveJoinAction}
      />
    </div>
  );
}
