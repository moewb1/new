export type DemoJobStatus = "open" | "in_progress" | "completed" | "closed" | "draft";
export type DemoApplicationStatus = "pending" | "accepted" | "rejected";

export type DemoService = {
  id: string;
  label: string;
  durationMinutes?: number;
  providersRequired?: number;
  allowedCountries?: string[];
  priceMinor?: number;
  hourlyRateMinor?: number;
};

export type DemoProvider = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  jobsCompleted: number;
  bio?: string;
  address?: string;
  coords?: { lat: number; lng: number };
};

export type DemoApplication = {
  id: string;
  provider: DemoProvider;
  priceMinor: number;
  currency: string;
  submittedAt: string;
  status: DemoApplicationStatus;
  note?: string;
  decisionAt?: string;
  countryCode?: string;
  service: DemoService;
};

export type DemoJob = {
  id: string;
  title: string;
  category: string;
  status: DemoJobStatus;
  rateLabel: string;
  capacity: number;
  postedAt: string;
  description: string;
  schedule: { fromISO: string; toISO: string };
  priceMinor: number;
  currency: string;
  address: string;
  addressCountryCode?: string;
  locationLink?: string;
  coords: { lat: number; lng: number };
  image: string;
  services: DemoService[];
  applications: DemoApplication[];
  awardedApplicationId?: string;
};

export type DemoJobSummary = {
  id: string;
  title: string;
  category: string;
  status: DemoJobStatus;
  rateLabel: string;
  postedAt: string;
  image: string;
  capacity: number;
  appliedCount: number;
};

const STORAGE_KEY = "demo.consumer.jobs.v1";
const SUMMARY_KEY = "jobs.mine";
export const CONSUMER_JOBS_UPDATED_EVENT = "consumer-jobs:updated";

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const PROVIDERS: Record<string, DemoProvider> = {
  p1: {
    id: "p1",
    name: "Mariam Farouk",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
    rating: 4.9,
    jobsCompleted: 68,
    bio: "Detail-oriented home-services professional specialising in deep cleaning and AC maintenance. Known for punctuality, friendly communication, and leaving spaces guest-ready.",
    address: "Business Bay, Dubai, UAE",
    coords: { lat: 25.19213, lng: 55.27289 },
  },
  p2: {
    id: "p2",
    name: "Ali Khan",
    avatar:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=800&auto=format&fit=crop",
    rating: 4.7,
    jobsCompleted: 54,
    bio: "Skilled electrician focused on safe repairs and tidy finishes. Brings the right tools and keeps you updated during the job.",
    address: "JLT, Dubai, UAE",
    coords: { lat: 25.0741, lng: 55.14493 },
  },
  p3: {
    id: "p3",
    name: "Jasmin Patel",
    avatar:
      "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?q=80&w=800&auto=format&fit=crop",
    rating: 4.8,
    jobsCompleted: 72,
    bio: "Residential cleaning and repainting specialist. Friendly service, flexible scheduling, and an eye for detail.",
    address: "Al Barsha, Dubai, UAE",
    coords: { lat: 25.10633, lng: 55.20356 },
  },
  p4: {
    id: "p4",
    name: "Omar Haddad",
    avatar:
      "https://images.unsplash.com/photo-1541534401786-2077eed87a72?q=80&w=800&auto=format&fit=crop",
    rating: 4.6,
    jobsCompleted: 48,
    bio: "Certified AC maintenance and plumbing technician for apartments and villas. Transparent estimates and preventive maintenance tips included.",
    address: "Deira, Dubai, UAE",
    coords: { lat: 25.2708, lng: 55.30952 },
  },
};

const SERVICES: Record<string, DemoService[]> = {
  cleaning: [
    { id: "s1", label: "Deep Cleaning", durationMinutes: 180 },
    { id: "s2", label: "Bathrooms", durationMinutes: 120 },
    { id: "s3", label: "Kitchen Detailing", durationMinutes: 90 },
  ],
  electrical: [
    { id: "s4", label: "Socket Repair", durationMinutes: 90 },
    { id: "s5", label: "Breaker Check", durationMinutes: 60 },
  ],
  barista: [
    { id: "s6", label: "Coffee Bar Setup", durationMinutes: 180 },
    { id: "s7", label: "Latte Art Station", durationMinutes: 120 },
  ],
  painting: [
    { id: "s8", label: "Wall Prep", durationMinutes: 240 },
    { id: "s9", label: "Accent Wall", durationMinutes: 180 },
  ],
  plumbing: [
    { id: "s10", label: "Kitchen Sink", durationMinutes: 120 },
    { id: "s11", label: "Leak Inspection", durationMinutes: 90 },
  ],
  ac: [
    { id: "s12", label: "Filter Replacement", durationMinutes: 75 },
    { id: "s13", label: "Full Unit Service", durationMinutes: 150 },
  ],
};

const FALLBACK_IMAGES: Record<string, string> = {
  cleaning:
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop",
  electrical:
    "https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1200,f_auto,q_auto/3767939/697466_425384.jpeg",
  barista:
    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop",
  painting:
    "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop",
  plumbing:
    "https://www.icominc.com/wp-content/uploads/2021/08/TA9Q9bV3Z81nZRooviZz51Y4bpnXIdBt1623180634.jpg",
  ac:
    "https://www.moltocare.ae/wp-content/uploads/2022/06/best-AC-maintenance-company-in-Dubai.jpg",
  default:
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop",
};

const JOBS_SEED: DemoJob[] = [
  {
    id: "j1",
    title: "House Cleaners",
    category: "cleaning",
    status: "open",
    rateLabel: "5,000/hr",
    capacity: 3,
    postedAt: "20 Aug, 2023",
    description:
      "We need a dependable cleaning crew for a 2BR apartment. Supplies available on site; focus on floors, bathrooms, and kitchen detailing.",
    schedule: {
      fromISO: "2025-09-18T09:00:00.000Z",
      toISO: "2025-09-18T12:00:00.000Z",
    },
    priceMinor: 26000,
    currency: "AED",
    address: "Jumeirah Beach Residence, Dubai, UAE",
    coords: { lat: 25.078, lng: 55.133 },
    image: FALLBACK_IMAGES.cleaning,
    services: [
      { ...SERVICES.cleaning[0], providersRequired: 3, priceMinor: 26000 },
      { ...SERVICES.cleaning[1], providersRequired: 2, priceMinor: 22000 },
      { ...SERVICES.cleaning[2], providersRequired: 1, priceMinor: 18000 },
    ],
    applications: [
      {
        id: "app_8071",
        provider: PROVIDERS.p1,
        priceMinor: 26000,
        currency: "AED",
        submittedAt: "2025-09-12T10:05:00.000Z",
        status: "pending",
        note: "Happy to help. I bring my own equipment and eco-safe products. Timing is flexible if needed.",
        countryCode: "AE",
        service: SERVICES.cleaning[0],
      },
      {
        id: "app_8072",
        provider: PROVIDERS.p3,
        priceMinor: 28000,
        currency: "AED",
        submittedAt: "2025-09-12T13:40:00.000Z",
        status: "pending",
        note: "Can include carpet shampoo if required. Team of two available for faster turnaround.",
        countryCode: "IN",
        service: SERVICES.cleaning[1],
      },
    ],
  },
  {
    id: "j2",
    title: "Electrical Help",
    category: "electrical",
    status: "in_progress",
    rateLabel: "3,000/hr",
    capacity: 5,
    postedAt: "21 Aug, 2023",
    description:
      "Assistance needed for replacing light fixtures and checking breaker panel in a 3BR apartment. Tools provided.",
    schedule: {
      fromISO: "2025-09-21T11:00:00.000Z",
      toISO: "2025-09-21T14:00:00.000Z",
    },
    priceMinor: 24000,
    currency: "AED",
    address: "Dubai Marina, Dubai, UAE",
    coords: { lat: 25.0805, lng: 55.141 },
    image: FALLBACK_IMAGES.electrical,
    services: [
      { ...SERVICES.electrical[0], providersRequired: 2, priceMinor: 24000 },
      { ...SERVICES.electrical[1], providersRequired: 1, priceMinor: 15000 },
    ],
    applications: [
      {
        id: "app_5501",
        provider: PROVIDERS.p2,
        priceMinor: 24000,
        currency: "AED",
        submittedAt: "2025-09-11T09:15:00.000Z",
        status: "accepted",
        decisionAt: "2025-09-11T10:45:00.000Z",
        note: "Can start Sunday morning. I will bring replacement sockets in case they are needed.",
        countryCode: "SA",
        service: SERVICES.electrical[0],
      },
    ],
    awardedApplicationId: "app_5501",
  },
  {
    id: "j4",
    title: "Home Painting",
    category: "painting",
    status: "open",
    rateLabel: "12,000/hr",
    capacity: 6,
    postedAt: "23 Aug, 2023",
    description:
      "Repaint living room and corridor with a light neutral tone. Furniture will be covered beforehand.",
    schedule: {
      fromISO: "2025-09-28T08:30:00.000Z",
      toISO: "2025-09-28T15:30:00.000Z",
    },
    priceMinor: 48000,
    currency: "AED",
    address: "Downtown Dubai, Dubai, UAE",
    coords: { lat: 25.1972, lng: 55.2744 },
    image: FALLBACK_IMAGES.painting,
    services: [
      { ...SERVICES.painting[0], providersRequired: 4, priceMinor: 36000 },
      { ...SERVICES.painting[1], providersRequired: 3, priceMinor: 32000 },
    ],
    applications: [
      {
        id: "app_9042",
        provider: PROVIDERS.p3,
        priceMinor: 50000,
        currency: "AED",
        submittedAt: "2025-09-15T16:25:00.000Z",
        status: "pending",
        note: "We can finish in one day with a team of two. Includes paint and cleanup.",
        countryCode: "AE",
        service: SERVICES.painting[1],
      },
    ],
  },
  {
    id: "j5",
    title: "Plumbing – Kitchen Sink",
    category: "plumbing",
    status: "completed",
    rateLabel: "8,000/hr",
    capacity: 1,
    postedAt: "24 Aug, 2023",
    description:
      "Fix a clogged kitchen sink and check for any leaks under the counter. Replace trap if required.",
    schedule: {
      fromISO: "2025-09-05T07:00:00.000Z",
      toISO: "2025-09-05T09:30:00.000Z",
    },
    priceMinor: 18000,
    currency: "AED",
    address: "Arabian Ranches, Dubai, UAE",
    coords: { lat: 25.045, lng: 55.279 },
    image: FALLBACK_IMAGES.plumbing,
    services: [
      { ...SERVICES.plumbing[0], providersRequired: 1, priceMinor: 18000 },
      { ...SERVICES.plumbing[1], providersRequired: 1, priceMinor: 12000 },
    ],
    applications: [
      {
        id: "app_4410",
        provider: PROVIDERS.p4,
        priceMinor: 18000,
        currency: "AED",
        submittedAt: "2025-08-28T08:45:00.000Z",
        status: "accepted",
        decisionAt: "2025-08-29T09:05:00.000Z",
        note: "Job completed. Replaced the trap and flushed the line.",
        countryCode: "OM",
        service: SERVICES.plumbing[0],
      },
    ],
    awardedApplicationId: "app_4410",
  },
  {
    id: "j6",
    title: "AC Maintenance",
    category: "ac",
    status: "open",
    rateLabel: "10,000/hr",
    capacity: 4,
    postedAt: "25 Aug, 2023",
    description:
      "Service two split AC units ahead of the weekend. Focus on filter cleaning and gas top-up if needed.",
    schedule: {
      fromISO: "2025-09-30T06:00:00.000Z",
      toISO: "2025-09-30T10:00:00.000Z",
    },
    priceMinor: 32000,
    currency: "AED",
    address: "Palm Jumeirah, Dubai, UAE",
    coords: { lat: 25.1103, lng: 55.1389 },
    image: FALLBACK_IMAGES.ac,
    services: [
      { ...SERVICES.ac[0], providersRequired: 2, priceMinor: 16000 },
      { ...SERVICES.ac[1], providersRequired: 2, priceMinor: 28000 },
    ],
    applications: [],
  },
];

const toSummary = (job: DemoJob): DemoJobSummary => ({
  id: job.id,
  title: job.title,
  category: job.category,
  status: job.status,
  rateLabel: job.rateLabel,
  postedAt: job.postedAt,
  image: job.image,
  capacity: job.capacity,
  appliedCount: job.applications.length,
});

const dispatchUpdate = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSUMER_JOBS_UPDATED_EVENT));
};

const persist = (jobs: DemoJob[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    localStorage.setItem(SUMMARY_KEY, JSON.stringify(jobs.map(toSummary)));
  } catch {
    /* ignore */
  }
};

const readJobsFromStorage = (): DemoJob[] => {
  if (typeof window === "undefined") return deepClone(JOBS_SEED);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoJob[];
      if (Array.isArray(parsed) && parsed.length) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  const seeded = deepClone(JOBS_SEED);
  persist(seeded);
  return seeded;
};

const getJobsMutable = (): DemoJob[] => {
  const jobs = readJobsFromStorage();
  return Array.isArray(jobs) ? jobs : deepClone(JOBS_SEED);
};

const getJobsReadonly = (): DemoJob[] => deepClone(readJobsFromStorage());

export const getConsumerJobsSummary = (): DemoJobSummary[] =>
  getJobsReadonly().map(toSummary);

export const getJobById = (id: string): DemoJob | null => {
  const job = getJobsReadonly().find((j) => j.id === id) || null;
  return job ? deepClone(job) : null;
};

export const getApplicationById = (
  applicationId: string
): { job: DemoJob; application: DemoApplication } | null => {
  const jobs = getJobsReadonly();
  for (const job of jobs) {
    const found = job.applications.find((app) => app.id === applicationId);
    if (found) {
      return { job: deepClone(job), application: deepClone(found) };
    }
  }
  return null;
};

export const updateApplicationStatus = (
  jobId: string,
  applicationId: string,
  status: DemoApplicationStatus
): { job: DemoJob; application: DemoApplication } | null => {
  const jobs = getJobsMutable();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) {
    return null;
  }
  const application = job.applications.find((app) => app.id === applicationId);
  if (!application) {
    return null;
  }

  application.status = status;
  application.decisionAt = new Date().toISOString();

  if (status === "accepted") {
    job.awardedApplicationId = applicationId;
    if (job.status === "open") job.status = "in_progress";
  } else if (status === "rejected") {
    if (job.awardedApplicationId === applicationId) {
      delete job.awardedApplicationId;
    }
    if (job.status === "in_progress") {
      job.status = "open";
    }
  }

  persist(jobs);
  dispatchUpdate();

  return {
    job: deepClone(job),
    application: deepClone(application),
  };
};

export const getProviderById = (id: string): DemoProvider | null =>
  PROVIDERS[id] ? deepClone(PROVIDERS[id]) : null;

type CountryMeta = {
  name: string;
  currency: string;
  symbol: string;
  rateMinor: number;
};

const COUNTRY_META: Record<string, CountryMeta> = {
  AE: { name: "United Arab Emirates", currency: "AED", symbol: "AED", rateMinor: 12000 },
  SA: { name: "Saudi Arabia", currency: "SAR", symbol: "SAR", rateMinor: 10500 },
  QA: { name: "Qatar", currency: "QAR", symbol: "QAR", rateMinor: 9800 },
  KW: { name: "Kuwait", currency: "KWD", symbol: "KWD", rateMinor: 8500 },
  BH: { name: "Bahrain", currency: "BHD", symbol: "BHD", rateMinor: 9000 },
  OM: { name: "Oman", currency: "OMR", symbol: "OMR", rateMinor: 8800 },
};

type CreateJobServiceInput = {
  id: string;
  label: string;
  providersRequired: number;
  allowedCountries: string[];
  priceMinor?: number;
  hourlyRateMinor?: number;
  durationMinutes?: number;
};

export type CreateJobInput = {
  title: string;
  description: string;
  category: string;
  image?: string;
  schedule: { fromISO: string; toISO: string };
  address: {
    line1: string;
    city: string;
    state: string;
    building?: string;
    apartment?: string;
    countryCode: string;
    latitude: number;
    longitude: number;
    mapLink?: string;
  };
  services: CreateJobServiceInput[];
};

const formatPostedLabel = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
};

const randomImageForCategory = (category: string) => {
  const map: Record<string, string> = {
    cleaning:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop",
    barista:
      "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop",
    hostess:
      "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?q=80&w=1200&auto=format&fit=crop",
    security:
      "https://images.unsplash.com/photo-1544473244-f6895e69ad8b?q=80&w=1200&auto=format&fit=crop",
    driver:
      "https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=1200&auto=format&fit=crop",
    electrical:
      "https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1200,f_auto,q_auto/3767939/697466_425384.jpeg",
    painting:
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop",
    plumbing:
      "https://www.icominc.com/wp-content/uploads/2021/08/TA9Q9bV3Z81nZRooviZz51Y4bpnXIdBt1623180634.jpg",
    ac:
      "https://www.moltocare.ae/wp-content/uploads/2022/06/best-AC-maintenance-company-in-Dubai.jpg",
  };
  return map[category] || FALLBACK_IMAGES.default;
};

export const createConsumerJob = (input: CreateJobInput): DemoJob => {
  const jobs = getJobsMutable();
  const id = `cj-${Date.now()}`;
  const now = new Date();
  const countryMeta = COUNTRY_META[input.address.countryCode] || COUNTRY_META.AE;
  const scheduleStart = new Date(input.schedule.fromISO);
  const scheduleEnd = new Date(input.schedule.toISO);
  const scheduleDurationMinutes = Math.max(
    60,
    Math.round((scheduleEnd.getTime() - scheduleStart.getTime()) / 60000)
  );

  const servicesWithPricing = input.services.map((svc) => {
    const durationHours = Math.max(1, (svc.durationMinutes ?? 60) / 60);
    const hourlyRate = svc.hourlyRateMinor ?? 0;
    const derivedPrice = Math.round(hourlyRate * durationHours * svc.providersRequired);
    const priceMinor = svc.priceMinor ?? derivedPrice;
    return {
      id: svc.id,
      label: svc.label,
      durationMinutes: scheduleDurationMinutes,
      providersRequired: svc.providersRequired,
      allowedCountries: svc.allowedCountries,
      priceMinor,
      hourlyRateMinor: svc.hourlyRateMinor,
    } satisfies DemoService;
  });

  const totalPriceMinor = servicesWithPricing.reduce((acc, svc) => acc + (svc.priceMinor ?? 0), 0);
  const rateLabel = totalPriceMinor
    ? `${countryMeta.symbol} ${(totalPriceMinor / 100).toLocaleString("en-US", {
        minimumFractionDigits: 0,
      })}/job`
    : "Budget TBD";

  const job: DemoJob = {
    id,
    title: input.title,
    category: input.category,
    status: "open",
    rateLabel,
    capacity: servicesWithPricing.reduce((acc, svc) => acc + (svc.providersRequired ?? 0), 0),
    postedAt: formatPostedLabel(now.toISOString()),
    description: input.description,
    schedule: input.schedule,
    priceMinor: totalPriceMinor,
    currency: countryMeta.currency,
    address: `${input.address.line1}, ${input.address.city}, ${input.address.state}, ${countryMeta.name}`,
    addressCountryCode: input.address.countryCode,
    locationLink: input.address.mapLink,
    coords: { lat: input.address.latitude, lng: input.address.longitude },
    image: input.image || randomImageForCategory(input.category),
    services: servicesWithPricing,
    applications: [],
  };

  jobs.unshift(job);
  persist(jobs);
  dispatchUpdate();
  return deepClone(job);
};

export const getCountryMeta = (code: string) => COUNTRY_META[code] || COUNTRY_META.AE;

export const listCountryMeta = () =>
  Object.entries(COUNTRY_META).map(([code, meta]) => ({ code, ...meta }));
