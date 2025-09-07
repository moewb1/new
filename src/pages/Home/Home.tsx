import React, { useEffect, useMemo, useState } from "react";
import styles from "./Home.module.css";
import { useNavigate } from "react-router-dom";

/* ------------------ Types ------------------ */
type SavedLocation = { lat: number; lng: number; address?: string };
type Profile = {
  role?: "provider" | "consumer";
  name?: string;
  firstName?: string;
  lastName?: string;
};
type Job = {
  id: string;
  title: string;
  category: string;   // must match a category key
  consumerName: string;
  image?: string;     // optional (we have fallbacks)
};
type Notif = { id: string; title: string; body: string; timeISO: string; unread?: boolean };

/* ------------------ Constants ------------------ */
const CATEGORIES: { key: string; label: string }[] = [
  { key: "all",          label: "All" },
  { key: "cleaning",     label: "Cleaning" },
  { key: "waitress",     label: "Waitress" },
  { key: "security",     label: "Security" },
  { key: "hostess",      label: "Hostess" },
  { key: "driver",       label: "Driver" },
  { key: "babysitting",  label: "Babysitting" },
  { key: "chef",         label: "Chef" },
  { key: "barista",      label: "Barista" },
  { key: "event_planner",label: "Event Planner" },
  { key: "merchandise",  label: "Merchandise" },
];

/** Category image fallbacks */
const FALLBACK_IMAGES: Record<string, string> = {
  cleaning:
    "https://media.istockphoto.com/id/654153664/photo/cleaning-service-sponges-chemicals-and-mop.jpg?s=612x612&w=0&k=20&c=vHQzKbz7L8oEKEp5oQzfx8rwsOMAV3pHTV_1VPZsREA=",
  barista:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop",
  hostess:
    "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?q=80&w=1200&auto=format&fit=crop",
  security:
    "https://images.unsplash.com/photo-1544473244-f6895e69ad8b?q=80&w=1200&auto=format&fit=crop",
  driver:
    "https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=1200&auto=format&fit=crop",
  babysitting:
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?q=80&w=1200&auto=format&fit=crop",
  chef:
    "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
  event_planner:
    "https://images.unsplash.com/photo-1521335629791-ce4aec67dd53?q=80&w=1200&auto=format&fit=crop",
  merchandise:
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop",
  waitress:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
  default:
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop",
};

/* ------------------ Icons (inline SVG) ------------------ */
const Icon = {
  // UI
  Search: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M10 2a8 8 0 1 1 5.293 13.707l4 4-1.414 1.414-4-4A8 8 0 0 1 10 2zm0 2a6 6 0 1 0 0 12A6 6 0 0 0 10 4z"/>
    </svg>
  ),
  Bell: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 2a6 6 0 0 0-6 6v3.586l-1.707 1.707A1 1 0 0 0 5 15h14a1 1 0 0 0 .707-1.707L18 11.586V8a6 6 0 0 0-6-6zm0 20a3 3 0 0 0 2.995-2.824L15 19h-6a3 3 0 0 0 2.824 2.995L12 22z"/>
    </svg>
  ),
  Location: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
    </svg>
  ),
  User: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-5.33 0-8 2.667-8 6v2h16v-2c0-3.333-2.67-6-8-6z"/>
    </svg>
  ),
  Doc: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1.5V8h4.5"/>
      <path d="M7 12h10M7 16h10M7 20h6"/>
    </svg>
  ),
  Chat: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M3 4h18v12H8l-5 5V4z"/>
      <path d="M7 8h10M7 12h7"/>
    </svg>
  ),
  Star: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 .587l3.668 7.431L24 9.75l-6 5.848L19.335 24 12 20.018 4.665 24 6 15.598 0 9.75l8.332-1.732z"/>
    </svg>
  ),
  ChevronRight: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M9 18l6-6-6-6"/>
    </svg>
  ),
  CreditCard: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
    </svg>
  ),
  ShieldCheck: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 2l8 3v6c0 5.25-3.438 9.977-8 11-4.562-1.023-8-5.75-8-11V5l8-3z"/>
      <path d="M8 12l2 2 4-4"/>
    </svg>
  ),
  Logout: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 21V3a2 2 0 0 0-2-2h-6"/>
    </svg>
  ),

  // Category pictos
  Shield: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 2l8 3v6c0 5.25-3.438 9.977-8 11-4.562-1.023-8-5.75-8-11V5l8-3z"/>
    </svg>
  ),
  Calendar: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M6 2h2v2h8V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2zM4 10h16M8 14h4"/>
    </svg>
  ),
  Bag: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M6 8h12l1.5 12A2 2 0 0 1 17.5 22h-11A2 2 0 0 1 4.5 20L6 8z"/>
      <path d="M8 8V6a4 4 0 0 1 8 0v2"/>
    </svg>
  ),
  Car: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M3 13l2-6h14l2 6v6h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3v-6zM7 13h10M5 17h2m10 0h2"/>
    </svg>
  ),
  Coffee: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M4 8h13a4 4 0 1 1 0 8H4a6 6 0 0 1-6-6 6 6 0 0 1 6-6z" transform="translate(2 2)"/>
      <path d="M18 10h2a2 2 0 1 1 0 4h-2" />
    </svg>
  ),
  Cloche: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 6a2 2 0 1 1 0 4 8 8 0 0 0-8 8h16a8 8 0 0 0-8-8z"/>
      <path d="M2 18h20"/>
    </svg>
  ),
  Broom: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M3 17l4-4 8 8-4 2-5-3-3-3z"/><path d="M14 6l4-4 2 2-4 4"/>
      <path d="M12 8l6 6"/>
    </svg>
  ),
  Hat: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M4 12c0-3 3-5 8-5s8 2 8 5v3H4v-3z"/><path d="M2 18h20"/>
    </svg>
  ),
  Heart: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 21s-8-5.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-8 11-8 11z"/>
    </svg>
  ),
  IdCard: (props: any) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2"/>
      <path d="M13 10h5M13 13h5M13 16h3"/>
    </svg>
  ),
};

/* Category icon resolver */
function CategoryIcon({ catKey, className }: { catKey: string; className?: string }) {
  switch (catKey) {
    case "cleaning": return <Icon.Broom className={className} />;
    case "barista": return <Icon.Coffee className={className} />;
    case "hostess": return <Icon.IdCard className={className} />;
    case "security": return <Icon.Shield className={className} />;
    case "driver": return <Icon.Car className={className} />;
    case "babysitting": return <Icon.Heart className={className} />;
    case "chef": return <Icon.Hat className={className} />;
    case "event_planner": return <Icon.Calendar className={className} />;
    case "merchandise": return <Icon.Bag className={className} />;
    case "waitress": return <Icon.Cloche className={className} />;
    default: return <Icon.Bag className={className} />;
  }
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}
function dayBucketLabel(d: Date) {
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yest)) return "Yesterday";
  // e.g. "Mar 3"
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ago(mins: number) {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

/* ------------------ Helpers ------------------ */
function getGreeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function hashString(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seededRandom(seed: string) {
  let x = hashString(seed) || 123456789;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return ((x >>> 0) % 10000) / 10000;
  };
}
function relTime(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  return `${days}d ago`;
}

/** Price baselines by category (AED/hr) */
const PRICE_BASE: Record<string, [number, number]> = {
  cleaning: [35, 65],
  barista: [30, 55],
  hostess: [40, 80],
  security: [45, 85],
  driver: [40, 90],
  babysitting: [35, 70],
  chef: [70, 160],
  event_planner: [90, 190],
  merchandise: [30, 55],
  waitress: [30, 55],
  default: [35, 75],
};

function getNationalityCode(): string {
  try {
    const s = localStorage.getItem("kyc.identity");
    const obj = s ? JSON.parse(s) : null;
    return obj?.nationalityCode || "AE";
  } catch {
    return "AE";
  }
}
function computePriceAED(category: string, nationalityCode: string, seedKey: string) {
  const [min, max] = PRICE_BASE[category] || PRICE_BASE.default;
  const rnd = seededRandom(`${seedKey}:${nationalityCode}`)();
  const natMul = 0.9 + ((hashString(nationalityCode) % 21) / 100); // 0.9..1.1
  const val = Math.round((min + rnd * (max - min)) * natMul);
  return Math.max(min, Math.min(max, val));
}
function computeRating(category: string, nationalityCode: string, seedKey: string) {
  const rnd = seededRandom(`R:${seedKey}:${category}:${nationalityCode}`)();
  const val = 3.8 + rnd * 1.2; // 3.8–5.0
  return Math.round(val * 10) / 10;
}

/** Pick a name if none is stored */
function getDisplayName(profile: Profile) {
  if (profile?.name) return profile.name;
  const composed = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  if (composed) return composed;
  const KEY = "profile.generatedName";
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const pool = ["Alex","Maya","Rami","Luna","Omar","Layla","Zain","Mira","Sam","Yara","Adel","Nour","Khaled","Rita","Hadi"];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  localStorage.setItem(KEY, pick);
  return pick;
}

/* ------------------ Component ------------------ */
export default function Home() {
  const navigate = useNavigate();

  const profile = useMemo<Profile>(() => {
    try { return JSON.parse(localStorage.getItem("profile") || "{}") as Profile; }
    catch { return {}; }
  }, []);
  const role = profile?.role || null;
  const displayName = getDisplayName(profile);

  const location = useMemo<SavedLocation | null>(() => {
    try {
      const s = localStorage.getItem("location");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  }, []);

  /* Notifications state (drawer + items) */
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
/* ------------------ Notifications state ------------------ */
const NOTIF_KEY = "notifications";

const SEED_NOTIFS: Notif[] = [
  { id: "n1",  title: "Application received", body: "Blue Events viewed your profile.",         timeISO: ago(12),   unread: true  },
  { id: "n2",  title: "Chat message",         body: "Rita S.: Are you available tomorrow?",    timeISO: ago(35),   unread: true  },
  { id: "n3",  title: "New job near you",     body: "House Cleaners needed in Downtown.",      timeISO: ago(90),   unread: true  },
  { id: "n4",  title: "Interview confirmed",  body: "Azure Mall confirmed 3pm slot.",          timeISO: ago(140),  unread: false },
  { id: "n5",  title: "Payout processed",     body: "AED 420 sent to your bank.",              timeISO: ago(220),  unread: false },
  { id: "n6",  title: "Profile approved",     body: "Your identity verification is complete.", timeISO: ago(300),  unread: false },
  { id: "n7",  title: "New job near you",     body: "Private Driver at Marina.",               timeISO: ago(380),  unread: true  },
  { id: "n8",  title: "Chat message",         body: "Café Latté: Thanks for applying!",        timeISO: ago(460),  unread: false },
  { id: "n9",  title: "Application update",   body: "Blue Events moved you to shortlist.",     timeISO: ago(600),  unread: true  },
  { id: "n10", title: "Schedule reminder",    body: "Event Hostess shift starts at 6pm.",      timeISO: ago(800),  unread: false },
  { id: "n11", title: "New review",           body: "You received a 5★ from Azure Mall.",      timeISO: ago(1100), unread: false },
  { id: "n12", title: "New job near you",     body: "Barista (morning) at JBR.",               timeISO: ago(1300), unread: true  },
  { id: "n13", title: "Application received", body: "Family Haddad saw your profile.",         timeISO: ago(1500), unread: false },
  { id: "n14", title: "Chat message",         body: "H. Mansour: Can you drive manual?",       timeISO: ago(2100), unread: false },
  { id: "n15", title: "Identity needed",      body: "Upload a copy of Emirates ID.",           timeISO: ago(2600), unread: false },
  { id: "n16", title: "Tips",                 body: "Stand out: add certifications.",          timeISO: ago(3200), unread: false },
  { id: "n17", title: "New job near you",     body: "Night Security at City Walk.",            timeISO: ago(3800), unread: true  },
  { id: "n18", title: "Application update",   body: "Café Latté declined your application.",   timeISO: ago(4100), unread: false },
  { id: "n19", title: "Payment method",       body: "Add a backup bank account.",              timeISO: ago(4700), unread: false },
  { id: "n20", title: "Chat message",         body: "Recruiter: Can you start Friday?",        timeISO: ago(5200), unread: true  },
  { id: "n21", title: "New job near you",     body: "Event Planner Assistant (weekend).",      timeISO: ago(5800), unread: false },
  { id: "n22", title: "System",               body: "We’ve updated our Terms.",                timeISO: ago(8000), unread: false },
];

function loadNotifsFromStorage(): Notif[] {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Accept both {items:[...]} and bare array legacy shapes
      const items: any = Array.isArray(parsed?.items) ? parsed.items
                    : Array.isArray(parsed)          ? parsed
                    : [];
      if (Array.isArray(items) && items.length > 0) return items as Notif[];
    }
  } catch {
    /* ignore */
  }
  // Seed if nothing/empty/invalid
  localStorage.setItem(NOTIF_KEY, JSON.stringify({ items: SEED_NOTIFS }));
  return SEED_NOTIFS;
}

const [notifs, setNotifs] = useState<Notif[]>(loadNotifsFromStorage);

const persistNotifs = (items: Notif[]) => {
  setNotifs(items);
  try {
    localStorage.setItem(NOTIF_KEY, JSON.stringify({ items }));
  } catch {}
};

const unread = useMemo(() => notifs.filter(n => n.unread).length, [notifs]);

const markAllRead = () => persistNotifs(notifs.map(n => ({ ...n, unread: false })));

  // tabs now live on a separate line under header
  const [notifTab, setNotifTab] = useState<"all" | "unread">("all");

  const filtered = useMemo(
    () => (notifTab === "all" ? notifs : notifs.filter(n => n.unread)),
    [notifs, notifTab]
  );

  // sorting
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.timeISO).getTime() - new Date(a.timeISO).getTime()),
    [filtered]
  );

  // 🔢 pagination
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  useEffect(() => { setPage(1); }, [notifTab]);                         // reset when switching tabs
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = useMemo(() => sorted.slice(start, start + PAGE_SIZE), [sorted, start]);

  const toggleNotifRead = (id: string) => {
    persistNotifs(notifs.map(n => (n.id === id ? { ...n, unread: !n.unread } : n)));
  };

  // Seed jobs (or read from LS)
  const [jobs] = useState<Job[]>(() => {
    try {
      const fromLS = JSON.parse(localStorage.getItem("jobs") || "[]");
      if (Array.isArray(fromLS) && fromLS.length) return fromLS;
    } catch {}
    return [
      { id: "j1", title: "House Cleaners", category: "cleaning",  consumerName: "Rita S." },
      { id: "j2", title: "Barista for Morning Shift", category: "barista", consumerName: "Café Latté" },
      { id: "j3", title: "Event Hostess", category: "hostess",   consumerName: "Blue Events" },
      { id: "j4", title: "Night Security", category: "security",  consumerName: "Azure Mall" },
      { id: "j5", title: "Private Driver", category: "driver",    consumerName: "H. Mansour" },
      { id: "j6", title: "Babysitter (Weekend)", category: "babysitting", consumerName: "Family Haddad" },
    ];
  });

  // UI state
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  // Live filtering (instant)
  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchCategory = activeCategory === "all" ? true : j.category === activeCategory;
      const matchQ = !q || j.title.toLowerCase().includes(q) || j.consumerName.toLowerCase().includes(q);
      return matchCategory && matchQ;
    });
  }, [jobs, query, activeCategory]);

  const greeting = getGreeting();
  const nationalityCode = getNationalityCode();

  const goQuick = (path: string) => navigate(path);

  // Logout
  const logout = () => {
    try {
      // Clear common auth/profile keys safely
      ["profile", "auth.token", "auth.refresh"].forEach((k) => localStorage.removeItem(k));
    } catch {}
    setProfileDrawerOpen(false);
    setNotifDrawerOpen(false);
    navigate("/", { replace: true });
  };

  // Close drawers on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileDrawerOpen(false);
        setNotifDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section className={styles.wrapper}>
      {/* Decorative header with darker circles */}
      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.helloBlock}>
            <div className={styles.greetingLine}>
              <span className={styles.greeting}>{greeting},</span>
              <span className={styles.name}>{displayName}</span>
              {role ? <span className={styles.roleBadge}>{role}</span> : null}
            </div>

            <button
              className={styles.locationPill}
              onClick={() => navigate("/profile/location")}
              title={location?.address ? location.address : "Set location"}
            >
              <Icon.Location className={styles.locIcon} />
              <span className={styles.locationText}>
                {location?.address || "Set your location"}
              </span>
            </button>
          </div>

          <div className={styles.headerButtons}>
            <button
              className={styles.bellBtn}
              onClick={() => setNotifDrawerOpen(true)}
              aria-label="Open notifications"
              title="Notifications"
            >
              <Icon.Bell className={styles.bellIcon} />
              {unread > 0 && <span className={styles.unreadDot} aria-hidden="true" />}
            </button>

            <button
              className={styles.avatarBtn}
              aria-label="Open profile"
              onClick={() => setProfileDrawerOpen(true)}
              title="Profile"
            >
              <span className={styles.avatarLetter}>
                {displayName?.[0]?.toUpperCase() || "U"}
              </span>
            </button>
          </div>
        </div>

        {/* Search (live) */}
        <div className={styles.centerRow}>
          <div className={styles.searchRow} role="search" aria-label="Search jobs">
            <div className={styles.searchBox}>
              <Icon.Search className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Search jobs, categories, or consumers…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                inputMode="search"
                enterKeyHint="search"
                aria-label="Search jobs"
              />
            </div>
            <button
              className={styles.searchBtn}
              onClick={() => {/* filtering is already live */}}
            >
              Search
            </button>
          </div>
        </div>

        {/* Quick groups */}
        <div className={styles.centerRow}>
          <div className={styles.quickRow} role="navigation" aria-label="Quick actions">
            <button className={styles.quickCard} onClick={() => goQuick("/auth/BookingApplications")}>
              <Icon.Doc className={styles.quickIcon} />
              <span className={styles.quickText}>Booking Applications</span>
            </button>
            <button className={styles.quickCard} onClick={() => goQuick("/chat")}>
              <Icon.Chat className={styles.quickIcon} />
              <span className={styles.quickText}>Chat</span>
            </button>
            <button className={styles.quickCard} onClick={() => setProfileDrawerOpen(true)}>
              <Icon.User className={styles.quickIcon} />
              <span className={styles.quickText}>Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className={styles.centerRow}>
        <div className={styles.catBar} role="tablist" aria-label="Categories">
          <div className={styles.catScroller}>
            {CATEGORIES.map((c) => {
              const active = c.key === activeCategory;
              return (
                <button
                  key={c.key}
                  role="tab"
                  aria-selected={active}
                  className={`${styles.catChip} ${active ? styles.catChipActive : ""}`}
                  onClick={() => setActiveCategory(c.key)}
                >
                  {c.key !== "all" && (
                    <CategoryIcon catKey={c.key} className={styles.catIcon} />
                  )}
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Jobs */}
      <div className={styles.centerRow}>
        <div className={styles.jobsHeader}>
          <h2 className={styles.h2}>Latest Jobs</h2>
          <span className={styles.jobsCount}>
            {filteredJobs.length} result{filteredJobs.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className={`${styles.jobsGrid} ${styles.centeredGrid}`}>
        {filteredJobs.map((job) => {
          const fallback = FALLBACK_IMAGES[job.category] || FALLBACK_IMAGES.default;
          const price = computePriceAED(job.category, nationalityCode, job.id);
          const rating = computeRating(job.category, nationalityCode, job.id);
          const label = CATEGORIES.find(c => c.key === job.category)?.label || job.category;

          return (
            <article key={job.id} className={styles.jobCard}>
              <div className={styles.jobImgWrap}>
                <img
                  src={job.image || fallback}
                  alt=""
                  className={styles.jobImg}
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = fallback; }}
                />
                <span className={styles.jobCategory}>
                  <CategoryIcon catKey={job.category} className={styles.badgeIcon} />
                  {label}
                </span>
                <span className={styles.priceBadge}>AED {price}/hr</span>
              </div>

              <div className={styles.jobBody}>
                <h3 className={styles.jobTitle}>{job.title}</h3>
                <p className={styles.jobMeta}>by <b>{job.consumerName}</b></p>
                <div className={styles.ratingRow} aria-label={`Rating ${rating} out of 5`}>
                  <Icon.Star className={styles.star} />
                  <span className={styles.ratingText}>{rating.toFixed(1)}</span>
                </div>
              </div>

              <div className={styles.jobActions}>
                {role === "provider" ? (
                  <button className={styles.primaryBtn} onClick={() => navigate(`/jobs/${job.id}`)}>
                    Apply
                  </button>
                ) : (
                  <button className={styles.secondaryBtn} onClick={() => navigate(`/jobs/${job.id}`)}>
                    View
                  </button>
                )}
              </div>
            </article>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className={styles.emptyState}>
            <p>No jobs match your filter.</p>
          </div>
        )}
      </div>

      {/* Profile Drawer */}
      {profileDrawerOpen && (
        <>
          <div className={styles.drawerOverlay} onClick={() => setProfileDrawerOpen(false)} />
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Profile">
            <div className={styles.drawerHeader}>
              <button className={styles.drawerClose} onClick={() => setProfileDrawerOpen(false)} aria-label="Close">×</button>
              <div className={styles.drawerAvatar}>
                {displayName?.[0]?.toUpperCase() || "U"}
              </div>
              <div className={styles.drawerTitle}>
                <div className={styles.drawerName}>{displayName}</div>
                {role ? <div className={styles.drawerRole}>{role}</div> : null}
              </div>
            </div>

            <div className={styles.drawerBody}>
              {/* Hero */}
              <div className={styles.drawerHero}>
                <div className={styles.avatarXL}>{displayName?.[0]?.toUpperCase() || "U"}</div>
                <div className={styles.heroText}>
                  <div className={styles.heroName}>{displayName}</div>
                  <div className={styles.heroRole}>{role || "—"}</div>
                </div>
              </div>

              {/* Stats */}
              <div className={styles.statGrid}>
                <div className={styles.statCard}><div className={styles.statLabel}>Rating</div><div className={styles.statValue}>4.7</div></div>
                <div className={styles.statCard}><div className={styles.statLabel}>Jobs</div><div className={styles.statValue}>32</div></div>
                <div className={styles.statCard}><div className={styles.statLabel}>Response</div><div className={styles.statValue}>~15m</div></div>
              </div>

              {/* Primary actions */}
              <div className={styles.actionRow}>
                <button className={styles.drawerBtn} onClick={() => { setProfileDrawerOpen(false); navigate("/profile"); }}>
                  Open Profile
                </button>
                <button className={styles.drawerBtnSecondary} onClick={() => { setProfileDrawerOpen(false); navigate("/profile/location"); }}>
                  Edit Location
                </button>
              </div>

              {/* Navigation list */}
              <div className={styles.listGroup}>
                <button className={styles.listItem} onClick={() => { setProfileDrawerOpen(false); navigate("/auth/BankDetails"); }}>
                  <span className={styles.listIcon}><Icon.CreditCard /></span>
                  <span className={styles.listText}>Bank Details</span>
                  <Icon.ChevronRight className={styles.chev} />
                </button>

                {role === "provider" && (
                  <button className={styles.listItem} onClick={() => { setProfileDrawerOpen(false); navigate("/auth/ProviderServices"); }}>
                    <span className={styles.listIcon}><Icon.Bag /></span>
                    <span className={styles.listText}>My Services</span>
                    <Icon.ChevronRight className={styles.chev} />
                  </button>
                )}

                <button className={styles.listItem} onClick={() => { setProfileDrawerOpen(false); navigate("/auth/IdentityOnboarding"); }}>
                  <span className={styles.listIcon}><Icon.ShieldCheck /></span>
                  <span className={styles.listText}>Identity & Documents</span>
                  <Icon.ChevronRight className={styles.chev} />
                </button>

                <button className={styles.listItem} onClick={() => { setProfileDrawerOpen(false); navigate("/settings"); }}>
                  <span className={styles.listIcon}><Icon.User /></span>
                  <span className={styles.listText}>Account Settings</span>
                  <Icon.ChevronRight className={styles.chev} />
                </button>

                <button className={`${styles.listItem} ${styles.listDanger}`} onClick={logout}>
                  <span className={styles.listIcon}><Icon.Logout /></span>
                  <span className={styles.listText}>Log out</span>
                  <Icon.ChevronRight className={styles.chev} />
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Notifications Drawer */}
  {notifDrawerOpen && (
    <>
      <div className={styles.drawerOverlay} onClick={() => setNotifDrawerOpen(false)} />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Notifications">
        <div className={`${styles.drawerHeader} ${styles.notifHeader}`}>
          <button className={styles.drawerClose} onClick={() => setNotifDrawerOpen(false)} aria-label="Close">×</button>
          <div className={styles.drawerIconWrap}><Icon.Bell className={styles.drawerIcon} /></div>
          <div className={styles.drawerTitle}>
            <div className={styles.drawerName}>Notifications</div>
            <div className={styles.drawerRole} aria-live="polite">{unread} unread</div>
          </div>
          {/* keep only the primary action fixed in header */}
          <button
            className={styles.headerPrimary}
            onClick={markAllRead}
            disabled={!unread}
            title={unread ? "Mark all as read" : "No unread notifications"}
          >
            Mark all as read
          </button>
        </div>

        {/* Body scrolls under header */}
        <div className={styles.drawerBody}>
          {/* TOP: tabs only (keep sticky) */}
          <div className={styles.notifToolbar}>
            <div className={styles.segment} role="tablist" aria-label="Notification tabs">
              <button
                className={`${styles.segmentBtn} ${notifTab === "all" ? styles.segmentActive : ""}`}
                onClick={() => setNotifTab("all")}
                role="tab"
                aria-selected={notifTab === "all"}
              >
                All
              </button>
              <button
                className={`${styles.segmentBtn} ${notifTab === "unread" ? styles.segmentActive : ""}`}
                onClick={() => setNotifTab("unread")}
                role="tab"
                aria-selected={notifTab === "unread"}
              >
                Unread ({unread})
              </button>
            </div>
          </div>

          {/* LIST */}
          <ul className={styles.notifList} role="list">
            {pageItems.length === 0 ? (
              <li className={styles.emptyState}>No notifications.</li>
            ) : (
              (() => {
                let lastLabel = "";
                return pageItems.flatMap((n, idx) => {
                  const label = dayBucketLabel(new Date(n.timeISO));
                  const needHeader = label !== lastLabel;
                  lastLabel = label;

                  const isMsg = /chat|message/i.test(n.title);
                  const isJob = /job|application|apply/i.test(n.title);

                  const headerNode = needHeader
                    ? [
                        <li
                          key={`h-${label}-${idx}`}
                          className={`${styles.groupHeader} ${styles.notifGroupHeader}`}
                          role="separator"
                          aria-label={label}
                        >
                          {label}
                        </li>,
                      ]
                    : [];

                  return [
                    ...headerNode,
                    <li
                      key={n.id}
                      className={`${styles.notifItem} ${n.unread ? styles.notifUnread : ""}`}
                    >
                      <div className={styles.notifIconWrap}>
                        {isMsg ? (
                          <Icon.Chat className={styles.notifIcon} />
                        ) : isJob ? (
                          <Icon.Doc className={styles.notifIcon} />
                        ) : (
                          <Icon.Bell className={styles.notifIcon} />
                        )}
                      </div>

                      <div className={styles.notifMain}>
                        <div className={styles.notifTitleRow}>
                          <span className={styles.notifTitle}>{n.title}</span>
                          {n.unread && <span className={styles.unreadPill}>NEW</span>}
                        </div>
                        <p className={styles.notifBody} title={n.body}>{n.body}</p>

                        <div className={styles.notifMetaRow}>
                          <time className={styles.notifTime}>{relTime(n.timeISO)}</time>
                          <button
                            className={styles.notifToggle}
                            onClick={() => toggleNotifRead(n.id)}
                          >
                            {n.unread ? "Mark read" : "Mark unread"}
                          </button>
                        </div>
                      </div>

                      <button
                        className={styles.notifCTA}
                        onClick={() => { setNotifDrawerOpen(false); /* navigate if needed */ }}
                        aria-label="Open notification"
                      >
                        Open
                      </button>
                    </li>,
                  ];
                });
              })()
            )}
          </ul>

          {/* BOTTOM: sticky pager (new) */}
          <div className={styles.notifFooter}>
            <div className={styles.pager}>
              <button
                className={styles.pageBtn}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Prev
              </button>
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              <button
                className={styles.pageBtn}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )}

    </section>
  );
}
