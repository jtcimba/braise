import {combineReducers} from '@reduxjs/toolkit';
import viewModeReducer from './slices/viewModeSlice';

const rootReducer = combineReducers({
  viewMode: viewModeReducer,
});

export default rootReducer;
