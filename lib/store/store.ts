import { configureStore } from "@reduxjs/toolkit";

import { baseApi } from "@/lib/api/baseApi";
import { viewModeSlice } from "@/lib/store/viewModeSlice";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    [viewModeSlice.name]: viewModeSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
