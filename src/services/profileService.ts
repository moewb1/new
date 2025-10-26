import { apiClient, extractErrorMessage } from "./apiClient";

export type ProfileType = "provider" | "consumer";
export type PersonType = "individual" | "company";

export interface ProfileDetailsPayload {
  fname: string;
  lname: string;
  dob: string;
  email: string;
  dial_code: string;
  phone_number: string;
  type: PersonType;
  bio?: string | null;
  nationality_id: number | string;
}

export interface AddressPayload {
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  building?: string | null;
  apartment?: string | null;
  country_code: string;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  active?: number | boolean;
}

export interface BankAccountPayload {
  iban: string;
  bank_name: string;
  account_holder_name: string;
}

export interface CreateProfileRequest {
  type: ProfileType;
  profile: ProfileDetailsPayload;
  address: AddressPayload;
  bank_account?: BankAccountPayload;
  kyc_doc_type: string;
  service_ids?: Array<number>;
  language_ids?: Array<number>;
  profile_picture_img?: File | Blob;
  standing_img?: File | Blob;
  sitten_img?: File | Blob;
  kyc_document?: File | Blob;
}

export interface CreateProfileResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export interface ProfileResponse {
  user: {
    id: number;
    fname: string;
    lname: string;
    email: string;
    dial_code: string;
    phone_number: string;
    type: PersonType;
    dob: string | null;
    status: string | null;
    needed_changes?: string | null;
    company_name?: string | null;
    rejection_reason?: string | null;
    approved_at?: string | null;
    rejected_at?: string | null;
    role?: ProfileType;
    active?: number;
    bio?: string | null;
    nationality?: {
      id: number;
      name: string;
      code: string;
      default_multiplier_percent?: string;
      active?: number;
    } | null;
    addresses?: Array<{
      id: number;
      line1: string;
      line2?: string | null;
      city?: string | null;
      state?: string | null;
      building?: string | null;
      apartment?: string | null;
      country_code?: string | null;
      postal_code?: string | null;
      latitude?: string | null;
      longitude?: string | null;
    }>;
    bank_account?: {
      iban: string;
      bank_name: string;
      account_holder_name: string;
    } | null;
    images?: Array<{
      id: number;
      file_name: string;
      slug?: string | null;
      normal_url?: string | null;
      thumb_url?: string | null;
      thumb_plus_url?: string | null;
    }>;
    kyc_documents?: Array<{
      id: number;
      doc_type: string;
      path: string;
      active?: number;
    }>;
    service_ids?: number[];
    language_ids?: number[];
  };
  has_profile: boolean;
}

function appendJSON(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  formData.append(key, typeof value === "string" ? value : JSON.stringify(value));
}

export async function createOrUpdateProfile(
  payload: CreateProfileRequest
): Promise<CreateProfileResponse> {
  const formData = new FormData();
  formData.append("type", payload.type);
  appendJSON(formData, "profile", payload.profile);
  appendJSON(formData, "address", payload.address);
  appendJSON(formData, "kyc_doc_type", payload.kyc_doc_type);

  if (payload.bank_account) {
    appendJSON(formData, "bank_account", payload.bank_account);
  }

  if (payload.service_ids && payload.service_ids.length > 0) {
    appendJSON(formData, "service_ids", payload.service_ids);
  }

  if (payload.language_ids && payload.language_ids.length > 0) {
    appendJSON(formData, "language_ids", payload.language_ids);
  }

  if (payload.profile_picture_img) {
    formData.append("profile_picture_img", payload.profile_picture_img);
  }

  if (payload.standing_img) {
    formData.append("standing_img", payload.standing_img);
  }

  if (payload.sitten_img) {
    formData.append("sitten_img", payload.sitten_img);
  }

  if (payload.kyc_document) {
    formData.append("kyc_document", payload.kyc_document);
  }

  try {
    const { data } = await apiClient.post<CreateProfileResponse>("/profile/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function fetchProfile(): Promise<ProfileResponse> {
  try {
    const { data } = await apiClient.get<{ success: boolean; data: ProfileResponse }>("/profile");
    if (!data || typeof data !== "object" || data.success !== true || !data.data) {
      throw new Error("Unexpected profile response.");
    }
    return data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
