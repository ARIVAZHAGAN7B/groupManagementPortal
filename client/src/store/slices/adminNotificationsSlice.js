import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchAdminGroupTierRequestNotifications } from "../../service/groupTierRequests.api";
import { fetchAdminLeadershipNotifications } from "../../service/leadershipRequests.api";

const initialState = {
  leadership: null,
  groupTier: null,
  status: "idle",
  error: "",
  hasLoaded: false,
  loadedForUserId: null,
  loadedForRole: null,
  lastFetchedAt: null
};

const isAdminRole = (role) =>
  ["ADMIN", "SYSTEM_ADMIN"].includes(String(role || "").toUpperCase());

export const loadAdminNotifications = createAsyncThunk(
  "adminNotifications/load",
  async (arg = {}, { rejectWithValue }) => {
    const userRole = String(arg.userRole || "").toUpperCase();

    if (!isAdminRole(userRole)) {
      return {
        leadership: null,
        groupTier: null,
        userId: arg.userId || null,
        userRole
      };
    }

    try {
      const [leadership, groupTier] = await Promise.all([
        fetchAdminLeadershipNotifications().catch(() => null),
        fetchAdminGroupTierRequestNotifications().catch(() => null)
      ]);

      return {
        leadership: leadership || null,
        groupTier: groupTier || null,
        userId: arg.userId || null,
        userRole
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load admin notifications"
      );
    }
  },
  {
    condition: (arg = {}, { getState }) => {
      const force = Boolean(arg.force);
      const userId = arg.userId || null;
      const userRole = String(arg.userRole || "").toUpperCase();
      const { status, hasLoaded, loadedForUserId, loadedForRole } = getState().adminNotifications;

      if (!userId) return false;
      if (status === "loading") return false;
      if (!force && hasLoaded && loadedForUserId === userId && loadedForRole === userRole) {
        return false;
      }
      return true;
    }
  }
);

const adminNotificationsSlice = createSlice({
  name: "adminNotifications",
  initialState,
  reducers: {
    resetAdminNotificationsState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAdminNotifications.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(loadAdminNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.leadership = action.payload.leadership;
        state.groupTier = action.payload.groupTier;
        state.error = "";
        state.hasLoaded = true;
        state.loadedForUserId = action.payload.userId;
        state.loadedForRole = action.payload.userRole;
        state.lastFetchedAt = Date.now();
      })
      .addCase(loadAdminNotifications.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload || action.error.message || "Failed to load admin notifications";
        state.leadership = null;
        state.groupTier = null;
        state.hasLoaded = true;
      });
  }
});

export const { resetAdminNotificationsState } = adminNotificationsSlice.actions;
export default adminNotificationsSlice.reducer;
