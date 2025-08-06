import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import dashBoardReducer from "./dashboard/DashBoardStore";

const store = configureStore({
  reducer: {
    dashBoard: dashBoardReducer,
  },
});

// 定义一个类型：获取store的getState方法的返回值类型，返回的类型是一个对象（一个store的树形结构）
type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export default store;