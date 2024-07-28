import {configureStore} from '@reduxjs/toolkit';
import viewModeReducer from './features/viewModeSlice';

const store = configureStore({
  reducer: {
    viewMode: viewModeReducer,
  },
});

export default store;
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
