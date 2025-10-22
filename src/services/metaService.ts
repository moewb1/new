import { apiClient, extractErrorMessage } from "./apiClient";

export interface ServiceMedia {
  id: number;
  file_name: string;
  slug: string | null;
  normal_url: string | null;
  thumb_url: string | null;
  thumb_plus_url: string | null;
}

export interface Service {
  id: number;
  name: string;
  description: string | null;
  min_duration_hrs: number;
  base_hourly_rate: string;
  app_profit_percent: string;
  discount_percent: string;
  active: number;
  image?: ServiceMedia | null;
}

export interface Language {
  id: number;
  name: string;
  code?: string | null;
  active?: number;
}

export interface Nationality {
  id: number;
  name: string;
  code: string;
  default_multiplier_percent?: string;
  active?: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

async function get<T>(url: string): Promise<T> {
  try {
    const { data } = await apiClient.get<ApiResponse<T>>(url);
    if (data && typeof data === "object" && "data" in data) {
      return (data as ApiResponse<T>).data;
    }
    throw new Error("Unexpected response format.");
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function fetchServices(): Promise<Service[]> {
  return get<Service[]>("/services");
}

export async function fetchLanguages(): Promise<Language[]> {
  return get<Language[]>("/languages");
}

export async function fetchNationalities(): Promise<Nationality[]> {
  return get<Nationality[]>("/nationalities");
}
