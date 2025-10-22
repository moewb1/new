import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/slices/authSlice";
import counterReducer from "@/store/slices/counterSlice";
import metaReducer from "@/store/slices/metaSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    meta: metaReducer,
  },
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
