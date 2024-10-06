import { createSlice } from "@reduxjs/toolkit";

const initialAuthState = {
  user: null,
  token: null
};


export const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,
  reducers: {
    setLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    setLogout: (state) => {
      state.user = null;
      state.token = null;
    }
  },
});



export const { setLogin, setLogout } = authSlice.actions;

export const authReducer = authSlice.reducer;