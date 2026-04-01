import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchMyDashboardSummary, fetchStudentLeaderboards } from "../../service/eligibility.api";
import { fetchAdminGroupTierRequestNotifications } from "../../service/groupTierRequests.api";
import { fetchGroups } from "../../service/groups.api";
import { getMyJoinRequests, getProfile } from "../../service/joinRequests.api";
import { fetchAdminLeadershipNotifications } from "../../service/leadershipRequests.api";
import { fetchMyGroup } from "../../service/membership.api";
import { fetchCurrentPhase, fetchPhaseTargets } from "../../service/phase.api";

const toQueryError = (error, fallbackMessage) => ({
  error: {
    status: error?.response?.status || "CUSTOM_ERROR",
    data: error?.response?.data || null,
    message:
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallbackMessage
  }
});

const isAdminRole = (role) =>
  ["ADMIN", "SYSTEM_ADMIN"].includes(String(role || "").toUpperCase());

export const sharedApi = createApi({
  reducerPath: "sharedApi",
  baseQuery: fakeBaseQuery(),
  keepUnusedDataFor: 120,
  tagTypes: [
    "PhaseContext",
    "Profile",
    "StudentMembership",
    "AdminNotifications",
    "DashboardSummary",
    "GroupsDiscovery"
  ],
  endpoints: (builder) => ({
    getPhaseContext: builder.query({
      async queryFn() {
        try {
          const phase = await fetchCurrentPhase();
          const phaseTargets = phase?.phase_id
            ? await fetchPhaseTargets(phase.phase_id).catch(() => null)
            : null;

          return {
            data: {
              phase: phase || null,
              phaseTargets: phaseTargets || null
            }
          };
        } catch (error) {
          return toQueryError(error, "Failed to load phase context");
        }
      },
      providesTags: [{ type: "PhaseContext", id: "CURRENT" }]
    }),

    getProfile: builder.query({
      async queryFn() {
        try {
          const profile = await getProfile();
          return { data: profile || null };
        } catch (error) {
          return toQueryError(error, "Failed to load profile");
        }
      },
      providesTags: (result, error, arg) => [{ type: "Profile", id: arg?.userId || "ME" }]
    }),

    getStudentMembership: builder.query({
      async queryFn() {
        try {
          const data = await fetchMyGroup();
          return {
            data: {
              group: data?.group ?? null,
              rejoinDeadline: data?.rejoin_deadline ?? null
            }
          };
        } catch (error) {
          return toQueryError(error, "Failed to load group membership");
        }
      },
      providesTags: (result, error, arg) => [
        { type: "StudentMembership", id: arg?.userId || "ME" }
      ]
    }),

    getAdminNotifications: builder.query({
      async queryFn(arg = {}) {
        const userRole = String(arg?.userRole || "").toUpperCase();

        if (!isAdminRole(userRole)) {
          return {
            data: {
              leadership: null,
              groupTier: null
            }
          };
        }

        try {
          const [leadership, groupTier] = await Promise.all([
            fetchAdminLeadershipNotifications().catch(() => null),
            fetchAdminGroupTierRequestNotifications().catch(() => null)
          ]);

          return {
            data: {
              leadership: leadership || null,
              groupTier: groupTier || null
            }
          };
        } catch (error) {
          return toQueryError(error, "Failed to load admin notifications");
        }
      },
      providesTags: (result, error, arg) => [
        {
          type: "AdminNotifications",
          id: `${arg?.userId || "ME"}:${String(arg?.userRole || "").toUpperCase()}`
        }
      ]
    }),

    getDashboardSummary: builder.query({
      async queryFn() {
        try {
          const data = await fetchMyDashboardSummary();
          return { data: data || null };
        } catch (error) {
          return toQueryError(error, "Failed to load dashboard summary");
        }
      },
      providesTags: [{ type: "DashboardSummary", id: "ME" }]
    }),

    getGroupsDiscovery: builder.query({
      async queryFn(args = {}) {
        try {
          const [groups, leaderboardRows, myJoinRequests] = await Promise.all([
            fetchGroups({
              exclude_status: "FROZEN",
              ...args
            }),
            fetchStudentLeaderboards({
              include: "groups",
              exclude_group_status: "FROZEN"
            }).catch(() => null),
            getMyJoinRequests().catch(() => [])
          ]);

          return {
            data: {
              groups: Array.isArray(groups) ? groups : [],
              groupRankings: Array.isArray(leaderboardRows?.groups) ? leaderboardRows.groups : [],
              myJoinRequests: Array.isArray(myJoinRequests) ? myJoinRequests : [],
              rankingWarning: leaderboardRows
                ? ""
                : "Groups loaded, but ranking data is temporarily unavailable."
            }
          };
        } catch (error) {
          return toQueryError(error, "Failed to load groups");
        }
      },
      providesTags: [{ type: "GroupsDiscovery", id: "LIST" }]
    })
  })
});

export const {
  useGetAdminNotificationsQuery,
  useGetDashboardSummaryQuery,
  useGetGroupsDiscoveryQuery,
  useGetPhaseContextQuery,
  useGetProfileQuery,
  useGetStudentMembershipQuery
} = sharedApi;
