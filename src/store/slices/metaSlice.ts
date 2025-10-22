import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  fetchLanguages as fetchLanguagesService,
  fetchNationalities as fetchNationalitiesService,
  fetchServices as fetchServicesService,
  type Language,
  type Nationality,
  type Service,
} from "@/services/metaService";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface RequestState<T> {
  status: RequestStatus;
  error: string | null;
  data: T;
}

interface MetaState {
  services: RequestState<Service[]>;
  languages: RequestState<Language[]>;
  nationalities: RequestState<Nationality[]>;
}

const initialListState = <T>(): RequestState<T[]> => ({
  status: "idle",
  error: null,
  data: [],
});

const initialState: MetaState = {
  services: initialListState<Service>(),
  languages: initialListState<Language>(),
  nationalities: initialListState<Nationality>(),
};

const persist = <T>(key: string, value: T) => {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore storage errors silently */
  }
};

const loadPersisted = <T>(key: string): T | null => {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const persistedServices = loadPersisted<Service[]>("meta.services");
const persistedLanguages = loadPersisted<Language[]>("meta.languages");
const persistedNationalities = loadPersisted<Nationality[]>("meta.nationalities");

if (persistedServices) {
  initialState.services.data = persistedServices;
  initialState.services.status = "succeeded";
}
if (persistedLanguages) {
  initialState.languages.data = persistedLanguages;
  initialState.languages.status = "succeeded";
}
if (persistedNationalities) {
  initialState.nationalities.data = persistedNationalities;
  initialState.nationalities.status = "succeeded";
}

export const fetchServices = createAsyncThunk("meta/fetchServices", async () => {
  return await fetchServicesService();
});

export const fetchLanguages = createAsyncThunk("meta/fetchLanguages", async () => {
  return await fetchLanguagesService();
});

export const fetchNationalities = createAsyncThunk(
  "meta/fetchNationalities",
  async () => {
    return await fetchNationalitiesService();
  }
);

const metaSlice = createSlice({
  name: "meta",
  initialState,
  reducers: {
    hydrateServices(state, action: PayloadAction<Service[]>) {
      state.services = {
        status: "succeeded",
        error: null,
        data: action.payload,
      };
      persist("meta.services", action.payload);
    },
    hydrateLanguages(state, action: PayloadAction<Language[]>) {
      state.languages = {
        status: "succeeded",
        error: null,
        data: action.payload,
      };
      persist("meta.languages", action.payload);
    },
    hydrateNationalities(state, action: PayloadAction<Nationality[]>) {
      state.nationalities = {
        status: "succeeded",
        error: null,
        data: action.payload,
      };
      persist("meta.nationalities", action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.services.status = "loading";
        state.services.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.services.status = "succeeded";
        state.services.data = action.payload;
        state.services.error = null;
        persist("meta.services", action.payload);
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.services.status = "failed";
        state.services.error =
          (typeof action.error.message === "string" && action.error.message) ||
          "Unable to load services.";
      })
      .addCase(fetchLanguages.pending, (state) => {
        state.languages.status = "loading";
        state.languages.error = null;
      })
      .addCase(fetchLanguages.fulfilled, (state, action) => {
        state.languages.status = "succeeded";
        state.languages.data = action.payload;
        state.languages.error = null;
        persist("meta.languages", action.payload);
      })
      .addCase(fetchLanguages.rejected, (state, action) => {
        state.languages.status = "failed";
        state.languages.error =
          (typeof action.error.message === "string" && action.error.message) ||
          "Unable to load languages.";
      })
      .addCase(fetchNationalities.pending, (state) => {
        state.nationalities.status = "loading";
        state.nationalities.error = null;
      })
      .addCase(fetchNationalities.fulfilled, (state, action) => {
        state.nationalities.status = "succeeded";
        state.nationalities.data = action.payload;
        state.nationalities.error = null;
        persist("meta.nationalities", action.payload);
      })
      .addCase(fetchNationalities.rejected, (state, action) => {
        state.nationalities.status = "failed";
        state.nationalities.error =
          (typeof action.error.message === "string" && action.error.message) ||
          "Unable to load nationalities.";
      });
  },
});

export const {
  hydrateServices,
  hydrateLanguages,
  hydrateNationalities,
} = metaSlice.actions;

export default metaSlice.reducer;

export type { Service, Language, Nationality };
