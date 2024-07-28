import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  value: 'view',
};

const viewModeSlice = createSlice({
  name: 'viewMode',
  initialState,
  reducers: {
    changeViewMode: (state, action) => {
      state.value = action.payload;
    },
  },
});

export const {changeViewMode} = viewModeSlice.actions;
export default viewModeSlice.reducer;
