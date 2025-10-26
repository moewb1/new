import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { AuthRole } from "@/utils/auth";
import { apiClient, extractErrorMessage } from "@/services/apiClient";

type Role = AuthRole;

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface RequestState<T = unknown> {
  status: RequestStatus;
  error: string | null;
  data: T | null;
}

interface SignupPayload {
  fname: string;
  lname: string;
  email: string;
  password: string;
  role?: Role;
}

interface VerifyOtpPayload {
  email: string;
  otp: string;
  fname?: string;
  lname?: string;
  password?: string;
  role?: Role;
}

interface ResendOtpPayload {
  email: string;
  fname: string;
  lname: string;
}

interface LoginPayload {
  email: string;
  password: string;
  role?: Role;
  fname?: string;
  lname?: string;
}

interface LogoutPayload {
  email: string;
  otp: string;
}

interface AuthSliceState {
  signup: RequestState;
  verifyOtp: RequestState;
  resendOtp: RequestState;
  login: RequestState;
  logout: RequestState;
  signupForm: SignupPayload | null;
  loginForm: LoginPayload | null;
}

const initialRequestState = (): RequestState => ({
  status: "idle",
  error: null,
  data: null,
});

const initialState: AuthSliceState = {
  signup: initialRequestState(),
  verifyOtp: initialRequestState(),
  resendOtp: initialRequestState(),
  login: initialRequestState(),
  logout: initialRequestState(),
  signupForm: null,
  loginForm: null,
};

export const signup = createAsyncThunk(
  "auth/signup",
  async (payload: SignupPayload, { rejectWithValue }) => {
    try {
      console.log("[auth/signup] payload:", payload);
      const { data } = await apiClient.post("/auth/signup", payload);
      return data;
    } catch (error) {
      console.error("[auth/signup] request failed", error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (payload: VerifyOtpPayload, { rejectWithValue }) => {
    try {
      console.log("[auth/verify-otp] payload:", payload);
      const { data } = await apiClient.post("/auth/verify-otp", payload);
      return data;
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const response = (error as { response?: { data?: unknown; status?: number } }).response;
        console.error("[auth/verify-otp] response:", response?.status, response?.data);
      }
      console.error("[auth/verify-otp] request failed", error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async (payload: ResendOtpPayload, { rejectWithValue }) => {
    try {
      console.log("[auth/resend-otp] payload:", payload);
      const { data } = await apiClient.post("/auth/resend-otp", payload);
      return data;
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const response = (error as { response?: { data?: unknown; status?: number } }).response;
        console.error("[auth/resend-otp] response:", response?.status, response?.data);
      }
      console.error("[auth/resend-otp] request failed", error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      console.log("[auth/login] payload:", payload);
      const { data } = await apiClient.post("/auth/login", payload);
      return data;
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const response = (error as { response?: { data?: unknown; status?: number } }).response;
        console.error("[auth/login] response:", response?.status, response?.data);
      }
      console.error("[auth/login] request failed", error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (payload: LogoutPayload, { rejectWithValue }) => {
    try {
      console.log("[auth/logout] payload:", payload);
      const { data } = await apiClient.post("/auth/logout", payload);
      return data;
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const response = (error as { response?: { data?: unknown; status?: number } }).response;
        console.error("[auth/logout] response:", response?.status, response?.data);
      }
      console.error("[auth/logout] request failed", error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSignupForm(state, action: PayloadAction<SignupPayload | null>) {
      state.signupForm = action.payload;
    },
    setLoginForm(state, action: PayloadAction<LoginPayload | null>) {
      state.loginForm = action.payload;
    },
    resetAuthRequests(state) {
      state.signup = initialRequestState();
      state.verifyOtp = initialRequestState();
      state.resendOtp = initialRequestState();
      state.login = initialRequestState();
      state.logout = initialRequestState();
      state.signupForm = null;
      state.loginForm = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signup.pending, (state, action) => {
        state.signup = { status: "loading", error: null, data: null };
        state.signupForm = action.meta.arg;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.signup = { status: "succeeded", error: null, data: action.payload };
      })
      .addCase(signup.rejected, (state, action) => {
        state.signup = {
          status: "failed",
          error:
            (typeof action.payload === "string" && action.payload) ||
            action.error.message ||
            "Unable to sign up.",
          data: null,
        };
      })
      .addCase(verifyOtp.pending, (state) => {
        state.verifyOtp = { status: "loading", error: null, data: null };
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.verifyOtp = {
          status: "succeeded",
          error: null,
          data: action.payload,
        };
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.verifyOtp = {
          status: "failed",
          error:
            (typeof action.payload === "string" && action.payload) ||
            action.error.message ||
            "Unable to verify OTP.",
          data: null,
        };
      })
      .addCase(resendOtp.pending, (state) => {
        state.resendOtp = { status: "loading", error: null, data: null };
      })
      .addCase(resendOtp.fulfilled, (state, action) => {
        state.resendOtp = {
          status: "succeeded",
          error: null,
          data: action.payload,
        };
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.resendOtp = {
          status: "failed",
          error:
            (typeof action.payload === "string" && action.payload) ||
            action.error.message ||
            "Unable to resend OTP.",
          data: null,
        };
      })
      .addCase(login.pending, (state, action) => {
        state.login = { status: "loading", error: null, data: null };
        state.loginForm = action.meta.arg;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.login = { status: "succeeded", error: null, data: action.payload };
      })
      .addCase(login.rejected, (state, action) => {
        state.login = {
          status: "failed",
          error:
            (typeof action.payload === "string" && action.payload) ||
            action.error.message ||
            "Unable to log in.",
          data: null,
        };
      })
      .addCase(logout.pending, (state, action) => {
        state.logout = { status: "loading", error: null, data: null };
      })
      .addCase(logout.fulfilled, (state, action) => {
        state.logout = { status: "succeeded", error: null, data: action.payload };
      })
      .addCase(logout.rejected, (state, action) => {
        state.logout = {
          status: "failed",
          error:
            (typeof action.payload === "string" && action.payload) ||
            action.error.message ||
            "Unable to log out.",
          data: null,
        };
      });
  },
});

export const { setSignupForm, setLoginForm, resetAuthRequests } = authSlice.actions;
export default authSlice.reducer;
export type {
  SignupPayload,
  VerifyOtpPayload,
  ResendOtpPayload,
  LoginPayload,
  LogoutPayload,
};
