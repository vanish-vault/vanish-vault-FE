import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import * as authService from "@/src/services/auth";

interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  // track total uploads for current month
  filesUploadedThisMonth?: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const storedUser =
  typeof window !== "undefined" ? authService.getStoredUser() : null;

const initialState: AuthState = {
  user: storedUser,
  isLoading: false,
  error: null,
  isAuthenticated: !!storedUser,
};

export const signIn = createAsyncThunk(
  "auth/signIn",
  async ({ email, password }: { email: string; password: string }) => {
    const data = await authService.login({ identifier: email, password });
    const { user, accessToken, refreshToken } = data;
    authService.setAuthData(user, accessToken ?? null, refreshToken ?? null);
    return user as User;
  },
);

export const signUp = createAsyncThunk(
  "auth/signUp",
  async ({
    email,
    username,
    password,
  }: {
    email: string;
    password: string;
    username: string;
  }) => {
    const data = await authService.register({ email, username, password });
    const { user, accessToken, refreshToken } = data;
    authService.setAuthData(user, accessToken ?? null, refreshToken ?? null);
    return user as User;
  },
);

export const signInWithGoogle = createAsyncThunk(
  "auth/signInWithGoogle",
  async (idToken: string) => {
    const data = await authService.googleAuth(idToken);
    const { user, accessToken, refreshToken } = data;
    authService.setAuthData(user, accessToken ?? null, refreshToken ?? null);
    return user as User;
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signOut(state) {
      state.user = null;
      state.error = null;
      state.isAuthenticated = false;
      authService.clearAuthData();
    },
    clearError(state) {
      state.error = null;
    },
    // increment the monthly upload counter and persist to localStorage
    incrementFileUpload(state) {
      if (state.user) {
        state.user.filesUploadedThisMonth =
          (state.user.filesUploadedThisMonth ?? 0) + 1;
        // update local storage copy as well
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    setUserName(state, action: PayloadAction<string>) {
      if (state.user) {
        state.user.name = action.payload;
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: AuthState) => {
      state.isLoading = true;
      state.error = null;
    };
    const handleFulfilled = (state: AuthState, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.user = action.payload;
      // ensure the counter exists so we can increment later
      state.user.filesUploadedThisMonth = state.user.filesUploadedThisMonth ?? 0;
      state.isAuthenticated = true;
    };
    const handleRejected = (state: AuthState, action: any) => {
      state.isLoading = false;
      state.error = action.error.message ?? "Something went wrong";
    };

    builder
      .addCase(signIn.pending, handlePending)
      .addCase(signIn.fulfilled, handleFulfilled)
      .addCase(signIn.rejected, handleRejected)
      .addCase(signUp.pending, handlePending)
      .addCase(signUp.fulfilled, handleFulfilled)
      .addCase(signUp.rejected, handleRejected)
      .addCase(signInWithGoogle.pending, handlePending)
      .addCase(signInWithGoogle.fulfilled, handleFulfilled)
      .addCase(signInWithGoogle.rejected, handleRejected);
  },
});

export const { signOut, clearError, incrementFileUpload, setUserName } = authSlice.actions;
export default authSlice.reducer;
