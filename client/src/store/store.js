import { configureStore } from "@reduxjs/toolkit";
import { sharedApi } from "./api/sharedApi";
import adminNotificationsReducer from "./slices/adminNotificationsSlice";
import phaseReducer from "./slices/phaseSlice";
import profileReducer from "./slices/profileSlice";
import studentMembershipReducer from "./slices/studentMembershipSlice";

export const store = configureStore({
  reducer: {
    adminNotifications: adminNotificationsReducer,
    phase: phaseReducer,
    profile: profileReducer,
    studentMembership: studentMembershipReducer,
    [sharedApi.reducerPath]: sharedApi.reducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sharedApi.middleware)
});

export default store;
