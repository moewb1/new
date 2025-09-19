import { useEffect, useMemo, useState } from "react";
import styles from "./Home.module.css";
import { useNavigate } from "react-router-dom";
import {
  CONSUMER_JOBS_UPDATED_EVENT,
  getConsumerJobsSummary,
  type DemoJobSummary,
} from "@/data/demoJobs";

type FilterKey = "All" | "Active" | "Completed";

const FILTERS: FilterKey[] = ["All", "Active", "Completed"];

const FALLBACK_IMAGES: Record<string, string> = {
  cleaning:
    "https://media.istockphoto.com/id/654153664/photo/cleaning-service-sponges-chemicals-and-mop.jpg?s=612x612&w=0&k=20&c=vHQzKbz7L8oEKEp5oQzfx8rwsOMAV3pHTV_1VPZsREA=",
  default:
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop",
};

const statusCopy: Record<DemoJobSummary["status"], { label: string; tone: "active" | "completed" | "draft" | "closed" }> = {
  open: { label: "Active", tone: "active" },
  in_progress: { label: "In progress", tone: "active" },
  completed: { label: "Completed", tone: "completed" },
  closed: { label: "Closed", tone: "closed" },
  draft: { label: "Draft", tone: "draft" },
};

const isActiveStatus = (status: DemoJobSummary["status"]) => status === "open" || status === "in_progress";
const isCompletedStatus = (status: DemoJobSummary["status"]) => status === "completed" || status === "closed";

export default function MyJobs() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("All");
  const [jobs, setJobs] = useState<DemoJobSummary[]>(() => getConsumerJobsSummary());

  useEffect(() => {
    const refresh = () => setJobs(getConsumerJobsSummary());

    refresh();
    window.addEventListener(CONSUMER_JOBS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(CONSUMER_JOBS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesQuery = !query || job.title.toLowerCase().includes(query);
      const status = job.status;
      const matchesFilter =
        filter === "All"
          ? true
          : filter === "Active"
          ? isActiveStatus(status)
          : isCompletedStatus(status);
      return matchesQuery && matchesFilter;
    });
  }, [jobs, q, filter]);

  return (
    <section className={styles.wrapper}>
      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <div className={styles.greeting}>My Jobs</div>
            <div className={styles.roleBadge}>Consumer</div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.secondaryBtn} onClick={()=>navigate("/jobs/post")}>Post Job</button>
          </div>
        </div>
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <input className={styles.searchInput} placeholder='Search by title (e.g. "Barista")' value={q} onChange={e=>setQ(e.target.value)} />
          </div>
        </div>
        <div className="filters" style={{marginTop:8, display:'flex', gap:8, flexWrap:'wrap'}}>
          {FILTERS.map(f => (
            <button key={f} className={`${styles.catChip} ${filter===f?styles.catChipActive:""}`} onClick={()=>setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className={`${styles.jobsGrid} ${styles.centeredGrid}`}>
        {filtered.map((job) => {
          const status = statusCopy[job.status] ?? statusCopy.open;
          return (
            <article key={job.id} className={styles.jobCard}>
              <div className={styles.jobImgWrap}>
                <img
                  className={styles.jobImg}
                  src={job.image || FALLBACK_IMAGES[job.category] || FALLBACK_IMAGES.default}
                  alt=""
                />
                <span className={`${styles.statusBadge} ${styles[`status_${status.tone}`]}`}>
                  {status.label}
                </span>
                {job.rateLabel && <span className={styles.priceBadge}>{job.rateLabel}</span>}
              </div>
              <div className={styles.jobBody}>
                <h3 className={styles.jobTitle}>{job.title}</h3>
                <p className={styles.jobMeta}>
                  {job.appliedCount ?? 0} applied • {job.capacity ?? 0} capacity
                </p>
                {job.postedAt && (
                  <div className={styles.ratingRow}>
                    <span style={{ fontWeight: 800, opacity: 0.7 }}>Posted</span>
                    <span style={{ fontWeight: 900 }}>{job.postedAt}</span>
                  </div>
                )}
              </div>
              <div className={styles.jobActions}>
                <button className={styles.secondaryBtn} onClick={() => navigate(`/jobs/${job.id}`)}>
                  View
                </button>
              </div>
            </article>
          );
        })}
        {filtered.length===0 && (
          <div className={styles.emptyState}>No jobs found. Try a different filter.</div>
        )}
      </div>
    </section>
  );
}
