import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchCurrentPhase, fetchPhaseTargets } from "../../service/phase.api";

const initialState = {
  phase: null,
  phaseTargets: null,
  status: "idle",
  error: "",
  hasLoaded: false,
  lastFetchedAt: null
};

export const loadPhaseContext = createAsyncThunk(
  "phase/loadContext",
  async (_, { rejectWithValue }) => {
    try {
      const phase = await fetchCurrentPhase();
      let phaseTargets = null;

      if (phase?.phase_id) {
        phaseTargets = await fetchPhaseTargets(phase.phase_id).catch(() => null);
      }

      return {
        phase: phase || null,
        phaseTargets: phaseTargets || null
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load phase context"
      );
    }
  },
  {
    condition: (arg, { getState }) => {
      const force = Boolean(arg?.force);
      const { status, hasLoaded } = getState().phase;

      if (status === "loading") return false;
      if (!force && hasLoaded) return false;
      return true;
    }
  }
);

const phaseSlice = createSlice({
  name: "phase",
  initialState,
  reducers: {
    resetPhaseContext: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPhaseContext.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(loadPhaseContext.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.phase = action.payload.phase;
        state.phaseTargets = action.payload.phaseTargets;
        state.error = "";
        state.hasLoaded = true;
        state.lastFetchedAt = Date.now();
      })
      .addCase(loadPhaseContext.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "Failed to load phase context";
        state.phase = null;
        state.phaseTargets = null;
        state.hasLoaded = true;
      });
  }
});

export const { resetPhaseContext } = phaseSlice.actions;
export default phaseSlice.reducer;
