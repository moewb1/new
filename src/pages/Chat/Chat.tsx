import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Chat.css";

/* ---------- Theme (brand) ---------- */
const COLORS = {
  bg: "linear-gradient(120deg, #f6f7f5, #f5f6f2)",
  accent: "rgb(169, 174, 155)",
  accentSoft: "rgba(169,174,155,.18)",
  pill: "rgba(169,174,155,.2)",
  white: "#ffffff",
  ink: "rgba(0,0,0,.92)",
  muted: "rgba(0,0,0,.56)",
  line: "rgba(0,0,0,.08)",
};

/* ---------- Types ---------- */
type Conv = { id: string; name: string; online?: boolean };
type Msg  = { id: string; author: "me" | "them"; text: string; ts: number };
type ChatState = {
  conversations: Conv[];
  messages: Record<string, Msg[]>;
  activeId: string;
  reads: Record<string, number>;
};

const STORAGE_KEY = "chat.state.v3";

/* ---------- Seed data ---------- */
const now = Date.now();
const SEED_CONVS: Conv[] = [
  { id: "c-rita",  name: "Rita S.",     online: true  },
  { id: "c-blue",  name: "Blue Events", online: false },
  { id: "c-azure", name: "Azure Mall",  online: false },
  { id: "c-cafe",  name: "Café Latté",  online: true  }
];
const SEED_MSGS: Record<string, Msg[]> = {
  "c-rita": [
    { id: "m1", author: "them", text: "Hey! Are you available tomorrow?",       ts: now - 1000 * 60 * 60 * 20 },
    { id: "m2", author: "me",   text: "Hi Rita! Yes, morning works for me.",    ts: now - 1000 * 60 * 60 * 19 },
    { id: "m3", author: "them", text: "Perfect. 9:30am?",                        ts: now - 1000 * 60 * 45 }
  ],
  "c-blue": [
    { id: "m4", author: "them", text: "Thanks for applying to Event Hostess.",   ts: now - 1000 * 60 * 60 * 30 }
  ],
  "c-azure": [],
  "c-cafe": []
};

/* ---------- Utils ---------- */
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const timeStr = (ts: number) => {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const dayLabel = (ts: number) => {
  const d = new Date(ts), t = new Date(), y = new Date();
  y.setDate(t.getDate() - 1);
  if (sameDay(d, t)) return "Today";
  if (sameDay(d, y)) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0,2).map(p => p[0]?.toUpperCase() || "").join("") || "U";

function avatarURL(name: string, id: string) {
  const seed = Array.from(id).reduce((a,c)=>a+c.charCodeAt(0),0);
  const angle = (seed % 120) + 15;
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <defs>
      <linearGradient id="g" gradientTransform="rotate(${angle})">
        <stop offset="0%" stop-color="${COLORS.accent}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${COLORS.accent}" stop-opacity="0.75"/>
      </linearGradient>
    </defs>
    <rect width="96" height="96" rx="24" fill="url(#g)"/>
    <text x="50%" y="54%" text-anchor="middle"
      font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial"
      font-size="36" font-weight="800" fill="#fff">${initials(name)}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function loadState(): ChatState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.conversations && parsed?.messages) return { reads: {}, ...parsed };
    }
  } catch {}
  const state: ChatState = {
    conversations: SEED_CONVS,
    messages: SEED_MSGS,
    activeId: SEED_CONVS[0].id,
    reads: {}
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

const unreadIn = (msgs: Msg[], readTs?: number) =>
  msgs.filter(m => m.author === "them" && m.ts > (readTs || 0)).length;

/* ---------- Component ---------- */
export default function Chat() {
  const navigate = useNavigate();
  const [{ conversations, messages, activeId, reads }, setState] = useState<ChatState>(loadState);
  const [search, setSearch] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<number | null>(null);

  // CSS vars + full-height fix
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", COLORS.accent);
    document.documentElement.style.setProperty("--line", COLORS.line);
    document.documentElement.style.setProperty("--ink", COLORS.ink);
    document.documentElement.style.setProperty("--muted", COLORS.muted);
    const setVh = () => document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations, messages, activeId, reads }));
  }, [conversations, messages, activeId, reads]);

  // Auto scroll
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeId, messages[activeId], isTyping]);

  useEffect(() => () => {
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
  }, []);

  const activeConv = useMemo(() => conversations.find(c => c.id === activeId), [conversations, activeId]);
  const convMsgs  = useMemo(() => (messages[activeId] || []).sort((a,b)=>a.ts-b.ts), [messages, activeId]);
  const filteredConvs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? conversations.filter(c => c.name.toLowerCase().includes(q)) : conversations;
  }, [conversations, search]);

  function markRead(id: string) {
    setState(s => ({ ...s, reads: { ...s.reads, [id]: Date.now() } }));
  }

  function setActive(id: string) {
    setState(s => ({ ...s, activeId: id }));
    setIsTyping(false);
    if (typingTimer.current) { window.clearTimeout(typingTimer.current); typingTimer.current = null; }
    setTimeout(() => markRead(id), 80);
    setDrawerOpen(false);
  }

  function pushMessage(id: string, msg: Msg) {
    setState(s => ({
      ...s,
      messages: { ...s.messages, [id]: [ ...(s.messages[id] || []), msg ] }
    }));
  }

  function generateReply(text: string, name: string) {
    const t = text.toLowerCase();
    if (/hello|hi|hey/.test(t)) return `Hi! 👋 This is ${name}. Thanks for your message.`;
    if (/tomorrow|today|time|when/.test(t)) return `I can do tomorrow afternoon. Does 3pm work?`;
    if (/price|rate|cost|aed/.test(t)) return `Our usual rate is AED 50/hr. Let me know if that suits you.`;
    if (/where|location|address/.test(t)) return `We’re near Downtown. I’ll share the exact address closer to time.`;
    return `Got it! I’ll get back to you shortly.`;
  }

  function onSend(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const input = form.querySelector("input[name='msg']") as HTMLInputElement;
    const content = input.value.trim();
    if (!content) return;

    pushMessage(activeId, { id: `m-${Date.now()}`, author: "me", text: content, ts: Date.now() });
    input.value = "";
    setIsTyping(true);

    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      const reply = generateReply(content, activeConv?.name || "Contact");
      pushMessage(activeId, { id: `m-${Date.now()}-r`, author: "them", text: reply, ts: Date.now() });
      setIsTyping(false);
      setTimeout(() => markRead(activeId), 250);
    }, 1000);
  }

  // Render message nodes with date separators + tails
  const nodes = useMemo(() => {
    const out: React.ReactNode[] = [];
    let last = "";
    for (const m of convMsgs) {
      const label = dayLabel(m.ts);
      if (label !== last) {
        last = label;
        out.push(
          <div className="neo-date" key={`sep-${label}-${m.ts}`} aria-label={label}>
            <span>{label}</span>
          </div>
        );
      }
      const mine = m.author === "me";
      out.push(
        <div key={m.id} className={`neo-msg ${mine ? "mine" : "theirs"}`}>
          {!mine && activeConv ? (
            <img src={avatarURL(activeConv.name, activeConv.id)} alt="" className="neo-avatar tiny" />
          ) : <span className="neo-spacer" />}
          <div className={`neo-bubble ${mine ? "is-mine" : "is-theirs"}`}>
            <div className="neo-text">{m.text}</div>
            <div className="neo-meta">{timeStr(m.ts)}</div>
          </div>
        </div>
      );
    }
    if (isTyping) {
      out.push(
        <div className="neo-msg theirs" key="typing">
          {activeConv && <img src={avatarURL(activeConv.name, activeConv.id)} alt="" className="neo-avatar tiny" />}
          <div className="neo-bubble is-theirs typing">
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        </div>
      );
    }
    return out;
  }, [convMsgs, isTyping, activeConv]);

  const totalUnread = useMemo(() => {
    let n = 0;
    for (const id of Object.keys(messages)) n += unreadIn(messages[id], reads[id]);
    return n;
  }, [messages, reads]);

  useEffect(() => {
    try { localStorage.setItem("chat.unread.total", String(totalUnread)); } catch {}
  }, [totalUnread]);

  return (
    <div className="neo-root">
      {/* App shell */}
      <div className="neo-app">
        {/* Rail / Drawer */}
        <aside className={`neo-rail ${drawerOpen ? "open" : ""}`}>
          <header className="rail-head">
            <button className="icon ghost"onClick={() => navigate(-1)} aria-label="Back">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z" />
              </svg>
            </button>
            <div className="rail-title">
              <div className="t1">Messages</div>
              <div className="t2">Total {totalUnread>0 && <span className="pill">{totalUnread}</span>}</div>
            </div>
          </header>

          <div className="rail-search">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M10 2a8 8 0 0 1 5.657 13.657l4.343 4.343-1.414 1.414-4.343-4.343A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 .001 12.001A6 6 0 0 0 10 4z" fill="currentColor"/>
            </svg>
            <input
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              placeholder="Search"
              aria-label="Search conversations"
            />
          </div>

          <div className="rail-list">
            {filteredConvs.map(c => {
              const list = messages[c.id] || [];
              const lastMsg = list[list.length - 1];
              const unreadCnt = unreadIn(list, reads[c.id]);
              return (
                <button key={c.id}
                  className={`rail-item ${c.id===activeId ? "active" : ""}`}
                  onClick={()=>setActive(c.id)}
                >
                  <div className="rail-left">
                    <span className={`presence ${c.online ? "on" : "off"}`} />
                    <img className="neo-avatar" src={avatarURL(c.name, c.id)} alt="" />
                  </div>
                  <div className="rail-main">
                    <div className="row1">
                      <span className="name">{c.name}</span>
                      <span className="time">{lastMsg ? timeStr(lastMsg.ts) : ""}</span>
                    </div>
                    <div className="row2">
                      <span className="preview">{lastMsg ? lastMsg.text : "Start the conversation"}</span>
                      {unreadCnt>0 && <span className="pill">{unreadCnt}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Thread */}
        <main className="neo-thread">
          <header className="neo-topbar">
            <button className="icon only-mobile" onClick={()=>setDrawerOpen(true)} aria-label="Open conversations">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/></svg>
            </button>

            {activeConv && (
              <>
                <img className="neo-avatar" src={avatarURL(activeConv.name, activeConv.id)} alt="" />
                <div className="who">
                  <div className="t1">{activeConv.name}</div>
                  <div className="t2">
                    <span className={`dot-pres ${activeConv.online ? "on" : "off"}`} />
                    {activeConv.online ? "Online" : "Offline"}
                  </div>
                </div>
              </>
            )}

            <div className="top-actions">
              <button className="icon ghost" aria-label="Search in chat">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M10 2a8 8 0 0 1 5.657 13.657l4.343 4.343-1.414 1.414-4.343-4.343A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 .001 12.001A6 6 0 0 0 10 4z"/>
                </svg>
              </button>
              <button className="icon ghost only-desktop" onClick={() => navigate("/home")} aria-label="Back">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z"/></svg>
              </button>
            </div>
          </header>

          <section className="neo-scroll" ref={listRef}>
            <div className="neo-stream">{nodes}</div>
          </section>

          <footer className="neo-composer">
            <form className="composer-form" onSubmit={onSend}>
              <button type="button" className="icon ghost" aria-label="Add attachment">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.5 6a4.5 4.5 0 0 0-9 0v7a3.5 3.5 0 1 0 7 0V7a2.5 2.5 0 1 0-5 0v6a1.5 1.5 0 1 0 3 0V7h2v6a3.5 3.5 0 1 1-7 0V6a5.5 5.5 0 1 1 11 0v7h-2V6z"/></svg>
              </button>
              <input
                name="msg"
                type="text"
                placeholder="Write a message…"
                autoComplete="off"
                aria-label="Write a message"
              />
              <button className="send" aria-label="Send">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
                </svg>
              </button>
            </form>
          </footer>
        </main>
      </div>

      {/* Drawer backdrop */}
      <div className={`neo-backdrop ${drawerOpen ? "open" : ""}`} onClick={()=>setDrawerOpen(false)} />
    </div>
  );
}
