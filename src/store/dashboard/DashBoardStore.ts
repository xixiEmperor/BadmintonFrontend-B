import { createSlice } from "@reduxjs/toolkit";
import type { statisticsData } from "@/components/dashBoard/types/returnData";

const dashBoardSlice = createSlice({
  name: 'dashBoard',
  initialState: {
    dashBoardData: {} as statisticsData,
  },
  reducers: {
    setDashBoardData: (state, action) => {
      state.dashBoardData = action.payload;
    },
  },
});

export const { setDashBoardData } = dashBoardSlice.actions;

export default dashBoardSlice.reducer;