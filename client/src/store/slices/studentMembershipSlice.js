import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchMyGroup } from "../../service/membership.api";

const initialState = {
  group: null,
  rejoinDeadline: null,
  status: "idle",
  error: "",
  hasLoaded: false,
  loadedForUserId: null,
  lastFetchedAt: null
};

export const loadStudentMembership = createAsyncThunk(
  "studentMembership/load",
  async (arg = {}, { rejectWithValue }) => {
    try {
      const data = await fetchMyGroup();
      return {
        group: data?.group ?? null,
        rejoinDeadline: data?.rejoin_deadline ?? null,
        userId: arg.userId || null
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load group membership"
      );
    }
  },
  {
    condition: (arg = {}, { getState }) => {
      const force = Boolean(arg.force);
      const userId = arg.userId || null;
      const { status, hasLoaded, loadedForUserId } = getState().studentMembership;

      if (!userId) return false;
      if (status === "loading") return false;
      if (!force && hasLoaded && loadedForUserId === userId) return false;
      return true;
    }
  }
);

const studentMembershipSlice = createSlice({
  name: "studentMembership",
  initialState,
  reducers: {
    resetStudentMembershipState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStudentMembership.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(loadStudentMembership.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.group = action.payload.group;
        state.rejoinDeadline = action.payload.rejoinDeadline;
        state.error = "";
        state.hasLoaded = true;
        state.loadedForUserId = action.payload.userId;
        state.lastFetchedAt = Date.now();
      })
      .addCase(loadStudentMembership.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload || action.error.message || "Failed to load group membership";
        state.group = null;
        state.rejoinDeadline = null;
        state.hasLoaded = true;
      });
  }
});

export const { resetStudentMembershipState } = studentMembershipSlice.actions;
export default studentMembershipSlice.reducer;
