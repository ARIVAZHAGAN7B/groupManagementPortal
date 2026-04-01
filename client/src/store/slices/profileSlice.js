import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getProfile } from "../../service/joinRequests.api";

const initialState = {
  profile: null,
  status: "idle",
  error: "",
  hasLoaded: false,
  loadedForUserId: null,
  lastFetchedAt: null
};

export const loadProfile = createAsyncThunk(
  "profile/load",
  async (arg = {}, { rejectWithValue }) => {
    try {
      const profile = await getProfile();
      return {
        profile: profile || null,
        userId: arg.userId || null
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load profile"
      );
    }
  },
  {
    condition: (arg = {}, { getState }) => {
      const force = Boolean(arg.force);
      const userId = arg.userId || null;
      const { status, hasLoaded, loadedForUserId } = getState().profile;

      if (!userId) return false;
      if (status === "loading") return false;
      if (!force && hasLoaded && loadedForUserId === userId) return false;
      return true;
    }
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    resetProfileState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProfile.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.profile = action.payload.profile;
        state.error = "";
        state.hasLoaded = true;
        state.loadedForUserId = action.payload.userId;
        state.lastFetchedAt = Date.now();
      })
      .addCase(loadProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "Failed to load profile";
        state.profile = null;
        state.hasLoaded = true;
      });
  }
});

export const { resetProfileState } = profileSlice.actions;
export default profileSlice.reducer;
