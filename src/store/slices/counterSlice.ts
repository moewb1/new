import {
  createSlice,
  type PayloadAction,
  createAsyncThunk,
} from "@reduxjs/toolkit";

type CounterState = { value: number; loading: boolean };
const initialState: CounterState = { value: 0, loading: false };

// example async action
export const incrementAsync = createAsyncThunk(
  "counter/incrementAsync",
  async (amount: number) => {
    await new Promise((r) => setTimeout(r, 500));
    return amount;
  }
);

const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    addBy: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(incrementAsync.pending, (s) => {
      s.loading = true;
    })
      .addCase(incrementAsync.fulfilled, (s, a) => {
        s.loading = false;
        s.value += a.payload;
      })
      .addCase(incrementAsync.rejected, (s) => {
        s.loading = false;
      });
  },
});

export const { increment, decrement, addBy } = counterSlice.actions;
export default counterSlice.reducer;
