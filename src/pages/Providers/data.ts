export type ProviderBase = {
  id: string;
  name: string;
  avatar: string;
  serviceIds: string[];
  rating?: number;
  jobsCompleted?: number;
};

export type Coords = { latitude: number; longitude: number };

export type ProviderDetails = ProviderBase & {
  bio?: string;
  address?: string;
  coords?: Coords;
  nationality?: string;
  nationalityCode?: string;
  preferredLanguage?: string;
  fullBodyPhoto?: string;
  gallery?: string[];
};

export type ServiceInfo = {
  id: string;
  title: string;
  image: string;
  description: string;
  hourlyRateMinor: number;
};

export const SERVICE_CATALOG: Record<string, ServiceInfo> = {
  s1: {
    id: "s1",
    title: "Deep Cleaning",
    image: "https://images.unsplash.com/photo-1581579186989-2c4cc11d029c?q=80&w=1200&auto=format&fit=crop",
    description: "Thorough cleaning for apartments and villas, including bathrooms, kitchens, and living spaces.",
    hourlyRateMinor: 12000,
  },
  s2: {
    id: "s2",
    title: "Home Painting",
    image: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop",
    description: "Interior wall prep, priming, and finishing for residential spaces with low-odor paints.",
    hourlyRateMinor: 15000,
  },
  s3: {
    id: "s3",
    title: "Plumbing",
    image: "https://images.unsplash.com/photo-1581579186989-f1a8b5bf4d95?q=80&w=1200&auto=format&fit=crop",
    description: "Leak fixes, fixture replacements, and general home plumbing maintenance.",
    hourlyRateMinor: 14000,
  },
  s4: {
    id: "s4",
    title: "AC Maintenance",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop",
    description: "Filter changes, gas top-ups, and performance tuning for AC units.",
    hourlyRateMinor: 16000,
  },
};

export const SERVICE_LABELS = Object.fromEntries(
  Object.entries(SERVICE_CATALOG).map(([id, info]) => [id, info.title])
);

export const STATIC_PROVIDERS: Record<string, ProviderDetails> = {
  p1: {
    id: "p1",
    name: "Mariam Farouk",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
    serviceIds: ["s1", "s4"],
    rating: 4.9,
    jobsCompleted: 68,
    bio: "Detail-oriented home-services professional specializing in Deep Cleaning and AC Maintenance. Known for punctuality and clear communication.",
    address: "Business Bay, Dubai, UAE",
    coords: { latitude: 25.19213, longitude: 55.27289 },
    nationality: "Egyptian",
    nationalityCode: "EG",
    preferredLanguage: "Arabic",
    fullBodyPhoto: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1526312426976-f4d754fa9bd6?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1581579186989-2c4cc11d029c?q=80&w=800&auto=format&fit=crop",
    ],
  },
  p2: {
    id: "p2",
    name: "Ali Khan",
    avatar:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=800&auto=format&fit=crop",
    serviceIds: ["s2", "s3"],
    rating: 4.7,
    jobsCompleted: 54,
    bio: "Skilled handyman focused on Home Painting and Plumbing. Clean finishes, tidy work area, and honest timelines.",
    address: "JLT, Dubai, UAE",
    coords: { latitude: 25.0741, longitude: 55.14493 },
    nationality: "Pakistani",
    nationalityCode: "PK",
    preferredLanguage: "Urdu",
    fullBodyPhoto: "https://images.unsplash.com/photo-1524504388940-1b0ed8f83a32?q=80&w=800&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1520975928316-46ec9046de02?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544717305-996b815c338c?q=80&w=800&auto=format&fit=crop",
    ],
  },
  p3: {
    id: "p3",
    name: "Jasmin Patel",
    avatar:
      "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?q=80&w=800&auto=format&fit=crop",
    serviceIds: ["s1", "s2"],
    rating: 4.8,
    jobsCompleted: 72,
    bio: "Residential cleaning and repainting specialist. Friendly service, great eye for detail, and flexible scheduling.",
    address: "Al Barsha, Dubai, UAE",
    coords: { latitude: 25.10633, longitude: 55.20356 },
    nationality: "Indian",
    nationalityCode: "IN",
    preferredLanguage: "English",
    fullBodyPhoto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1524504388940-9f1255a1e392?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
    ],
  },
  p4: {
    id: "p4",
    name: "Omar Haddad",
    avatar:
      "https://images.unsplash.com/photo-1541534401786-2077eed87a72?q=80&w=800&auto=format&fit=crop",
    serviceIds: ["s3", "s4"],
    rating: 4.6,
    jobsCompleted: 48,
    bio: "Certified AC maintenance and plumbing technician for apartments and villas.",
    address: "Deira, Dubai, UAE",
    coords: { latitude: 25.2708, longitude: 55.30952 },
    nationality: "Jordanian",
    nationalityCode: "JO",
    preferredLanguage: "Arabic",
    fullBodyPhoto: "https://images.unsplash.com/photo-1504593811423-6dd665756598?q=80&w=800&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1520975928316-46ec9046de02?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544005313-9e5c0f0d3d1c?q=80&w=800&auto=format&fit=crop",
    ],
  },
};

export const PROVIDER_AVAILABILITY: Record<string, Array<{ date: string; slots: string[] }>> = {
  p1: [
    { date: "2025-09-20", slots: ["09:00", "13:00", "16:00"] },
    { date: "2025-09-21", slots: ["10:00", "14:00"] },
  ],
  p2: [
    { date: "2025-09-22", slots: ["11:00", "15:00"] },
    { date: "2025-09-23", slots: ["09:30", "12:30", "18:00"] },
  ],
  p3: [
    { date: "2025-09-21", slots: ["08:00", "13:30"] },
    { date: "2025-09-24", slots: ["10:00", "17:00"] },
  ],
  p4: [
    { date: "2025-09-19", slots: ["09:00", "12:00", "19:00"] },
    { date: "2025-09-22", slots: ["08:30", "14:00"] },
  ],
};
