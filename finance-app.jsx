import { useState, useEffect, useRef, useCallback, useMemo } from “react”;

/* ─────────────────────────────────────────────────────────────────────────────
DESIGN SYSTEM — iOS 26 “Liquid Glass”
Palette: pure black base, white/neutral glass layers, azure accent
Typography: “Instrument Serif” display + “DM Sans” UI
Motion: spring physics, 60fps CSS transitions
───────────────────────────────────────────────────────────────────────────── */

const DS = {
// Glass layers
glass0: “rgba(255,255,255,0.03)”,
glass1: “rgba(255,255,255,0.06)”,
glass2: “rgba(255,255,255,0.09)”,
glass3: “rgba(255,255,255,0.13)”,
glassHover: “rgba(255,255,255,0.16)”,
// Borders
border0: “rgba(255,255,255,0.06)”,
border1: “rgba(255,255,255,0.10)”,
border2: “rgba(255,255,255,0.15)”,
// Text
textPrimary: “rgba(255,255,255,0.95)”,
textSecondary: “rgba(255,255,255,0.50)”,
textTertiary: “rgba(255,255,255,0.28)”,
// Accent — cool azure, not vibrant
accent: “#4A9EFF”,
accentDim: “rgba(74,158,255,0.15)”,
accentBorder: “rgba(74,158,255,0.25)”,
// Semantic
positive: “#34C759”,
positiveGlass: “rgba(52,199,89,0.12)”,
negative: “#FF453A”,
negativeGlass: “rgba(255,69,58,0.12)”,
neutral: “rgba(255,255,255,0.40)”,
// Radius
r_sm: 12,
r_md: 18,
r_lg: 24,
r_xl: 32,
r_full: 999,
};

/* ─── Utils ─────────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (n) =>
new Intl.NumberFormat(“de-DE”, { style: “currency”, currency: “EUR”, minimumFractionDigits: 2 }).format(n || 0);
const fmtShort = (n) => {
if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + “k”;
return n.toFixed(0);
};
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthOf = (d) => (d || todayStr()).slice(0, 7);
const dayLabel = (d) => {
const days = [“Sun”, “Mon”, “Tue”, “Wed”, “Thu”, “Fri”, “Sat”];
return days[new Date(d + “T12:00:00”).getDay()];
};

/* ─── Local Storage ─────────────────────────────────────────────────────── */
function usePersist(key, init) {
const [v, setV] = useState(() => {
try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; }
catch { return init; }
});
const set = useCallback((x) => setV((p) => {
const n = typeof x === “function” ? x(p) : x;
localStorage.setItem(key, JSON.stringify(n));
return n;
}), [key]);
return [v, set];
}

/* ─── Seed Data ─────────────────────────────────────────────────────────── */
const SEED_ACCOUNTS = [
{ id: “a1”, name: “Tatra banka”, type: “Checking”, balance: 1240.50, color: “#4A9EFF”, iban: “SK89 1100 0000 0026 2981 7232” },
{ id: “a2”, name: “Slovenská sporiteľňa”, type: “Savings”, balance: 3820.00, color: “#34C759”, iban: “SK31 0900 0000 0051 8742 7541” },
{ id: “a3”, name: “365.bank”, type: “Checking”, balance: 540.25, color: “#FFD60A”, iban: “SK12 3650 0000 0100 1234 5678” },
{ id: “a4”, name: “Revolut”, type: “Digital”, balance: 187.30, color: “#BF5AF2”, iban: “GB29 REVO 0099 6912 3456 78” },
];

const SEED_TXS = [
{ id: “t1”, accountId: “a1”, amount: -24.50, category: “Food”, label: “Billa Supermarket”, date: todayStr() },
{ id: “t2”, accountId: “a4”, amount: -9.99, category: “Subscriptions”, label: “Spotify”, date: todayStr() },
{ id: “t3”, accountId: “a1”, amount: 850.00, category: “Income”, label: “Salary”, date: todayStr() },
{ id: “t4”, accountId: “a3”, amount: -3.80, category: “Transport”, label: “MHD Pass”, date: todayStr() },
{ id: “t5”, accountId: “a2”, amount: 200.00, category: “Transfer”, label: “Savings transfer”, date: todayStr() },
{ id: “t6”, accountId: “a1”, amount: -67.20, category: “Shopping”, label: “Zara”, date: todayStr() },
{ id: “t7”, accountId: “a4”, amount: -18.40, category: “Food”, label: “McDonald’s”, date: todayStr() },
{ id: “t8”, accountId: “a1”, amount: -45.00, category: “Utilities”, label: “Slovak Telekom”, date: todayStr() },
];

const SEED_GOALS = [
{ id: “g1”, label: “Sony Camera”, target: 1200, saved: 480, color: “#4A9EFF” },
{ id: “g2”, label: “Emergency Fund”, target: 3000, saved: 1850, color: “#34C759” },
{ id: “g3”, label: “Interrail Trip”, target: 600, saved: 120, color: “#BF5AF2” },
];

const CATEGORIES = [“Food”, “Transport”, “Shopping”, “Subscriptions”, “Utilities”, “Health”, “Entertainment”, “Income”, “Transfer”, “Other”];

/* ─── SVG Icon Library ──────────────────────────────────────────────────── */
const Icon = ({ name, size = 20, color = “currentColor”, strokeWidth = 1.6 }) => {
const s = { width: size, height: size, flexShrink: 0 };
const p = { fill: “none”, stroke: color, strokeWidth, strokeLinecap: “round”, strokeLinejoin: “round” };
const icons = {
home: <svg style={s} viewBox=“0 0 24 24” {…p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
wallet: <svg style={s} viewBox=“0 0 24 24” {…p}><rect x="2" y="5" width="20" height="15" rx="3"/><path d="M16 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/><path d="M2 10h20"/></svg>,
arrowUpDown: <svg style={s} viewBox=“0 0 24 24” {…p}><line x1="12" y1="2" x2="12" y2="22"/><polyline points="18 8 12 2 6 8"/><polyline points="6 16 12 22 18 16"/></svg>,
target: <svg style={s} viewBox=“0 0 24 24” {…p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
barChart: <svg style={s} viewBox=“0 0 24 24” {…p}><rect x="2" y="14" width="4" height="8"/><rect x="10" y="8" width="4" height="14"/><rect x="18" y="3" width="4" height="19"/></svg>,
plus: <svg style={s} viewBox=“0 0 24 24” {…p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
chevronRight: <svg style={s} viewBox=“0 0 24 24” {…p}><polyline points="9 18 15 12 9 6"/></svg>,
chevronDown: <svg style={s} viewBox=“0 0 24 24” {…p}><polyline points="6 9 12 15 18 9"/></svg>,
x: <svg style={s} viewBox=“0 0 24 24” {…p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
arrowDown: <svg style={s} viewBox=“0 0 24 24” {…p}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
arrowUp: <svg style={s} viewBox=“0 0 24 24” {…p}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
edit: <svg style={s} viewBox=“0 0 24 24” {…p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
trash: <svg style={s} viewBox=“0 0 24 24” {…p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
check: <svg style={s} viewBox=“0 0 24 24” {…p}><polyline points="20 6 9 17 4 12"/></svg>,
trendingUp: <svg style={s} viewBox=“0 0 24 24” {…p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
download: <svg style={s} viewBox=“0 0 24 24” {…p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
bank: <svg style={s} viewBox=“0 0 24 24” {…p}><path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2L2 7h20L12 2z"/></svg>,
// category icons
food: <svg style={s} viewBox=“0 0 24 24” {…p}><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
transport: <svg style={s} viewBox=“0 0 24 24” {…p}><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
shopping: <svg style={s} viewBox=“0 0 24 24” {…p}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
subscription: <svg style={s} viewBox=“0 0 24 24” {…p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
income: <svg style={s} viewBox=“0 0 24 24” {…p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
};
return icons[name] || icons.bank;
};

const categoryIcon = (cat) => {
const m = { Food: “food”, Transport: “transport”, Shopping: “shopping”, Subscriptions: “subscription”, Income: “income” };
return m[cat] || “bank”;
};

/* ─── Glassmorphism Primitives ─────────────────────────────────────────── */
const glass = (level = 1, extra = {}) => ({
background: [DS.glass0, DS.glass1, DS.glass2, DS.glass3][level] || DS.glass1,
backdropFilter: “blur(40px) saturate(180%)”,
WebkitBackdropFilter: “blur(40px) saturate(180%)”,
border: `1px solid ${[DS.border0, DS.border1, DS.border2][Math.min(level, 2)]}`,
…extra,
});

/* ─── Reusable Components ──────────────────────────────────────────────── */

// Pill Tag
const Pill = ({ children, color, small }) => (
<span style={{
display: “inline-flex”, alignItems: “center”,
padding: small ? “2px 8px” : “3px 10px”,
borderRadius: DS.r_full,
fontSize: small ? 10 : 11,
fontWeight: 600, letterSpacing: “0.03em”,
background: color ? `${color}18` : DS.glass2,
color: color || DS.textSecondary,
border: `1px solid ${color ? `${color}30` : DS.border1}`,
}}>{children}</span>
);

// Sheet Modal (slides up from bottom)
const Sheet = ({ open, onClose, title, children }) => {
const [visible, setVisible] = useState(false);
const [mounted, setMounted] = useState(false);
useEffect(() => {
if (open) { setMounted(true); requestAnimationFrame(() => setVisible(true)); }
else { setVisible(false); const t = setTimeout(() => setMounted(false), 320); return () => clearTimeout(t); }
}, [open]);
if (!mounted) return null;
return (
<div
onClick={onClose}
style={{
position: “fixed”, inset: 0, zIndex: 200,
background: visible ? “rgba(0,0,0,0.55)” : “rgba(0,0,0,0)”,
backdropFilter: visible ? “blur(4px)” : “none”,
transition: “all 0.3s ease”,
display: “flex”, alignItems: “flex-end”, justifyContent: “center”,
}}
>
<div
onClick={(e) => e.stopPropagation()}
style={{
width: “100%”, maxWidth: 480,
…glass(2),
background: “rgba(16,16,20,0.94)”,
borderRadius: `${DS.r_xl}px ${DS.r_xl}px 0 0`,
padding: “0 0 env(safe-area-inset-bottom, 16px)”,
maxHeight: “88vh”, overflowY: “auto”,
transform: visible ? “translateY(0)” : “translateY(100%)”,
transition: “transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)”,
boxShadow: “0 -20px 60px rgba(0,0,0,0.5)”,
}}
>
{/* Handle */}
<div style={{ display: “flex”, justifyContent: “center”, padding: “12px 0 4px” }}>
<div style={{ width: 36, height: 5, borderRadius: 3, background: DS.glass3 }} />
</div>
{/* Header */}
<div style={{ display: “flex”, alignItems: “center”, justifyContent: “space-between”, padding: “12px 24px 20px” }}>
<span style={{ fontSize: 17, fontWeight: 600, color: DS.textPrimary, letterSpacing: “-0.02em” }}>{title}</span>
<button onClick={onClose} style={{ …btnReset, width: 30, height: 30, borderRadius: “50%”, background: DS.glass2, display: “flex”, alignItems: “center”, justifyContent: “center”, color: DS.textSecondary }}>
<Icon name="x" size={16} />
</button>
</div>
<div style={{ padding: “0 20px 24px” }}>{children}</div>
</div>
</div>
);
};

const btnReset = { background: “none”, border: “none”, cursor: “pointer”, padding: 0, outline: “none”, display: “flex”, alignItems: “center”, justifyContent: “center” };

// Form Input
const Input = ({ label, …props }) => (

  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: DS.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>{label}</label>}
    <input {...props} style={{
      width: "100%", boxSizing: "border-box",
      background: DS.glass1, border: `1px solid ${DS.border1}`,
      borderRadius: DS.r_md, padding: "13px 16px",
      color: DS.textPrimary, fontSize: 15, outline: "none",
      fontFamily: "inherit", letterSpacing: "-0.01em",
      transition: "border-color 0.2s",
      ...props.style,
    }}
    onFocus={(e) => { e.target.style.borderColor = DS.accentBorder; if (props.onFocus) props.onFocus(e); }}
    onBlur={(e) => { e.target.style.borderColor = DS.border1; if (props.onBlur) props.onBlur(e); }}
    />
  </div>
);

// Select Field
const SelectField = ({ label, options, value, onChange }) => (

  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: DS.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>{label}</label>}
    <select value={value} onChange={onChange} style={{
      width: "100%", background: DS.glass1, border: `1px solid ${DS.border1}`,
      borderRadius: DS.r_md, padding: "13px 16px", color: DS.textPrimary,
      fontSize: 15, outline: "none", fontFamily: "inherit", appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
    }}>
      {options.map((o) => <option key={o.value || o} value={o.value || o} style={{ background: "#1a1a22" }}>{o.label || o}</option>)}
    </select>
  </div>
);

// Primary Button
const Button = ({ children, onClick, variant = “primary”, small, style: s = {} }) => (
<button onClick={onClick} style={{
…btnReset,
width: small ? “auto” : “100%”,
padding: small ? “9px 18px” : “15px 20px”,
borderRadius: DS.r_lg,
fontSize: small ? 13 : 15,
fontWeight: 600, letterSpacing: “-0.01em”,
fontFamily: “inherit”,
justifyContent: “center”,
transition: “all 0.15s ease”,
…(variant === “primary” ? {
background: “rgba(255,255,255,0.95)”, color: “#000”,
} : variant === “accent” ? {
background: `linear-gradient(135deg, ${DS.accent}, #2B8FFF)`, color: “#fff”,
} : variant === “danger” ? {
background: DS.negativeGlass, color: DS.negative, border: `1px solid rgba(255,69,58,0.2)`,
} : {
background: DS.glass2, color: DS.textSecondary, border: `1px solid ${DS.border1}`,
}),
…s,
}}>{children}</button>
);

/* ─── Progress Ring ─────────────────────────────────────────────────────── */
const ProgressRing = ({ pct, size = 56, color, strokeWidth = 4 }) => {
const r = (size - strokeWidth * 2) / 2;
const circ = 2 * Math.PI * r;
const dash = (pct / 100) * circ;
return (
<svg width={size} height={size} style={{ transform: “rotate(-90deg)” }}>
<circle cx={size / 2} cy={size / 2} r={r} fill=“none” stroke={DS.glass2} strokeWidth={strokeWidth} />
<circle cx={size / 2} cy={size / 2} r={r} fill=“none” stroke={color} strokeWidth={strokeWidth}
strokeDasharray={`${dash} ${circ}`} strokeLinecap=“round”
style={{ transition: “stroke-dasharray 1s cubic-bezier(0.34, 1.56, 0.64, 1)” }} />
</svg>
);
};

/* ─── Mini Sparkline ────────────────────────────────────────────────────── */
const Sparkline = ({ data, color = DS.accent, height = 40, width = 100 }) => {
if (!data || data.length < 2) return <div style={{ width, height }} />;
const max = Math.max(…data, 0.01), min = Math.min(…data, 0);
const range = max - min || 1;
const step = width / (data.length - 1);
const pts = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(” “);
const area = `${pts} ${(data.length - 1) * step},${height} 0,${height}`;
return (
<svg width={width} height={height} style={{ overflow: “visible” }}>
<defs>
<linearGradient id={`sg-${color}`} x1=“0” y1=“0” x2=“0” y2=“1”>
<stop offset="0%" stopColor={color} stopOpacity="0.3" />
<stop offset="100%" stopColor={color} stopOpacity="0" />
</linearGradient>
</defs>
<polygon points={area} fill={`url(#sg-${color})`} />
<polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
</svg>
);
};

/* ─── Bar Chart ─────────────────────────────────────────────────────────── */
const BarChart = ({ data, height = 140 }) => {
const max = Math.max(…data.map((d) => d.value), 1);
return (
<div style={{ display: “flex”, alignItems: “flex-end”, gap: 6, height, paddingTop: 12 }}>
{data.map((d, i) => {
const barH = Math.max(4, (d.value / max) * (height - 28));
return (
<div key={i} style={{ flex: 1, display: “flex”, flexDirection: “column”, alignItems: “center”, gap: 6 }}>
<div style={{ width: “100%”, height: barH, borderRadius: “6px 6px 2px 2px”, background: d.active
? `linear-gradient(180deg, ${DS.accent} 0%, rgba(74,158,255,0.4) 100%)`
: DS.glass2, transition: “height 0.6s cubic-bezier(0.34,1.2,0.64,1)”, position: “relative”, overflow: “hidden” }}>
{d.active && <div style={{ position: “absolute”, inset: 0, background: “linear-gradient(180deg, rgba(255,255,255,0.1), transparent)” }} />}
</div>
<span style={{ fontSize: 10, color: d.active ? DS.accent : DS.textTertiary, fontWeight: d.active ? 700 : 400, letterSpacing: “0.01em” }}>{d.label}</span>
</div>
);
})}
</div>
);
};

/* ─── Category Breakdown ────────────────────────────────────────────────── */
const CATEGORY_COLORS = {
Food: “#FF9F0A”, Transport: “#30D158”, Shopping: “#BF5AF2”,
Subscriptions: “#4A9EFF”, Utilities: “#64D2FF”, Health: “#FF6961”,
Entertainment: “#FF375F”, Income: “#34C759”, Transfer: “#636366”, Other: “#8E8E93”,
};

/* ──────────────────────────────────────────────────────────────────────────
MAIN APPLICATION
────────────────────────────────────────────────────────────────────────── */
export default function App() {
const [accounts, setAccounts] = usePersist(“lg_accounts”, SEED_ACCOUNTS);
const [transactions, setTxs] = usePersist(“lg_txs”, SEED_TXS);
const [goals, setGoals] = usePersist(“lg_goals”, SEED_GOALS);
const [tab, setTab] = useState(“home”);
const [mounted, setMounted] = useState(false);

useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

const addTx = (tx) => {
const newTx = { …tx, id: uid(), date: todayStr() };
setTxs((p) => [newTx, …p]);
if (tx.amount) {
setAccounts((p) => p.map((a) => a.id === tx.accountId ? { …a, balance: +(a.balance + tx.amount).toFixed(2) } : a));
}
};
const deleteTx = (id) => {
const tx = transactions.find((t) => t.id === id);
if (tx) setAccounts((p) => p.map((a) => a.id === tx.accountId ? { …a, balance: +(a.balance - tx.amount).toFixed(2) } : a));
setTxs((p) => p.filter((t) => t.id !== id));
};
const updateAccount = (id, patch) => setAccounts((p) => p.map((a) => a.id === id ? { …a, …patch } : a));
const addAccount = (acc) => setAccounts((p) => […p, { …acc, id: uid() }]);
const deleteAccount = (id) => setAccounts((p) => p.filter((a) => a.id !== id));
const updateGoal = (id, patch) => setGoals((p) => p.map((g) => g.id === id ? { …g, …patch } : g));
const addGoal = (g) => setGoals((p) => […p, { …g, id: uid() }]);
const deleteGoal = (id) => setGoals((p) => p.filter((g) => g.id !== id));

const navItems = [
{ id: “home”, icon: “home”, label: “Overview” },
{ id: “accounts”, icon: “wallet”, label: “Accounts” },
{ id: “txs”, icon: “arrowUpDown”, label: “Activity” },
{ id: “goals”, icon: “target”, label: “Goals” },
{ id: “analytics”, icon: “barChart”, label: “Insights” },
];

return (
<>
<style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=Instrument+Serif:ital@0;1&display=swap'); *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; } html, body { background: #080810; height: 100%; overscroll-behavior: none; } body { font-family: 'DM Sans', sans-serif; color: ${DS.textPrimary}; } input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; } input::placeholder { color: ${DS.textTertiary}; } select option { background: #111118; } ::-webkit-scrollbar { display: none; } scrollbar-width: none; @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to   { opacity: 1; transform: translateY(0); } } @keyframes scalePop { from { transform: scale(0.92); opacity: 0; } to   { transform: scale(1); opacity: 1; } } .fade-up { animation: fadeSlideUp 0.5s cubic-bezier(0.34,1.1,0.64,1) both; } .scale-pop { animation: scalePop 0.4s cubic-bezier(0.34,1.2,0.64,1) both; }`}</style>

```
  {/* ── Global background ── */}
  <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "#080810", overflow: "hidden" }}>
    {/* Ambient orbs */}
    <div style={{ position: "absolute", top: -120, left: -80, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,158,255,0.08) 0%, transparent 70%)", filter: "blur(1px)" }} />
    <div style={{ position: "absolute", top: 40, right: -100, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(191,90,242,0.06) 0%, transparent 70%)" }} />
    <div style={{ position: "absolute", bottom: 100, left: 20, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,199,89,0.05) 0%, transparent 70%)" }} />
    {/* Noise texture */}
    <svg style={{ position: "absolute", inset: 0, opacity: 0.025, width: "100%", height: "100%" }}>
      <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  </div>

  {/* ── App shell ── */}
  <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
    {/* ── Content area ── */}
    <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 80 }}>
      <div style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.4s" }}>
        {tab === "home" && <HomeTab accounts={accounts} transactions={transactions} totalBalance={totalBalance} addTx={addTx} />}
        {tab === "accounts" && <AccountsTab accounts={accounts} updateAccount={updateAccount} addAccount={addAccount} deleteAccount={deleteAccount} />}
        {tab === "txs" && <ActivityTab transactions={transactions} accounts={accounts} addTx={addTx} deleteTx={deleteTx} />}
        {tab === "goals" && <GoalsTab goals={goals} updateGoal={updateGoal} addGoal={addGoal} deleteGoal={deleteGoal} />}
        {tab === "analytics" && <AnalyticsTab transactions={transactions} accounts={accounts} />}
      </div>
    </div>

    {/* ── Tab Bar ── */}
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "0 16px 12px", zIndex: 100 }}>
      <div style={{ ...glass(2), background: "rgba(12,12,18,0.88)", borderRadius: DS.r_xl, display: "flex", padding: "10px 6px 10px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
        {navItems.map((item) => {
          const active = tab === item.id;
          return (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              ...btnReset, flex: 1, flexDirection: "column", gap: 4,
              padding: "6px 4px",
              borderRadius: DS.r_md,
              background: active ? DS.glass2 : "none",
              transition: "background 0.2s",
            }}>
              <Icon name={item.icon} size={21} color={active ? DS.accent : DS.textTertiary} strokeWidth={active ? 2 : 1.5} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? DS.accent : DS.textTertiary, letterSpacing: "0.02em", transition: "color 0.2s" }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
</>
```

);
}

/* ════════════════════════════════════════════════════════════════════════════
HOME TAB
════════════════════════════════════════════════════════════════════════════ */
function HomeTab({ accounts, transactions, totalBalance, addTx }) {
const [showAddTx, setShowAddTx] = useState(false);
const thisMonth = monthOf(todayStr());
const monthTxs = transactions.filter((t) => monthOf(t.date) === thisMonth);
const income = monthTxs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
const spent = Math.abs(monthTxs.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));
const recent = transactions.slice(0, 6);

// Sparkline data (last 7 days balance proxy)
const last7 = Array.from({ length: 7 }, (_, i) => {
const d = new Date(); d.setDate(d.getDate() - (6 - i));
return d.toISOString().slice(0, 10);
});
const sparkData = last7.map((d) =>
totalBalance + transactions.filter((t) => t.date > d).reduce((s, t) => s - t.amount, 0)
);

return (
<div style={{ padding: “0 16px” }}>
{/* ── Hero Balance Card ── */}
<div className=“fade-up” style={{ marginTop: 56, marginBottom: 20 }}>
<div style={{ …glass(1), borderRadius: DS.r_xl, padding: “28px 24px 24px”, position: “relative”, overflow: “hidden” }}>
{/* Glass shimmer highlight */}
<div style={{ position: “absolute”, top: 0, left: 0, right: 0, height: 1, background: “linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)” }} />
{/* Ambient glow */}
<div style={{ position: “absolute”, top: -40, right: -40, width: 160, height: 160, borderRadius: “50%”, background: `radial-gradient(circle, rgba(74,158,255,0.12), transparent 70%)` }} />

```
      <div style={{ position: "relative" }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: DS.textTertiary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Total Balance</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 48, color: DS.textPrimary, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {fmt(totalBalance).replace("€", "")}
          </span>
          <span style={{ fontSize: 22, color: DS.textSecondary, fontWeight: 300, marginBottom: 4 }}>€</span>
        </div>
        <p style={{ fontSize: 13, color: DS.positive, fontWeight: 500, marginBottom: 20 }}>
          +{fmt(income - spent)} this month
        </p>

        {/* Sparkline */}
        <div style={{ marginBottom: 20 }}>
          <Sparkline data={sparkData} color={DS.accent} height={50} width={280} />
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Income", val: income, color: DS.positive, icon: "arrowUp" },
            { label: "Expenses", val: spent, color: DS.negative, icon: "arrowDown" },
          ].map((s) => (
            <div key={s.label} style={{ ...glass(1), borderRadius: DS.r_md, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${s.color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={s.icon} size={15} color={s.color} />
              </div>
              <div>
                <p style={{ fontSize: 10, color: DS.textTertiary, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: DS.textPrimary, letterSpacing: "-0.02em" }}>{fmt(s.val)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>

  {/* ── Account Strip ── */}
  <div className="fade-up" style={{ animationDelay: "0.06s" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <span style={{ fontSize: 16, fontWeight: 600, color: DS.textPrimary, letterSpacing: "-0.02em" }}>Accounts</span>
    </div>
    <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, marginBottom: 20, scrollSnapType: "x mandatory" }}>
      {accounts.map((acc) => (
        <div key={acc.id} style={{ ...glass(1), borderRadius: DS.r_lg, padding: "16px 18px", minWidth: 160, flexShrink: 0, scrollSnapAlign: "start", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${acc.color}20, transparent 70%)` }} />
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${acc.color}20`, border: `1px solid ${acc.color}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Icon name="bank" size={14} color={acc.color} />
          </div>
          <p style={{ fontSize: 11, color: DS.textTertiary, fontWeight: 500, marginBottom: 3 }}>{acc.name}</p>
          <p style={{ fontSize: 17, fontWeight: 600, color: DS.textPrimary, letterSpacing: "-0.02em" }}>{fmt(acc.balance)}</p>
          <Pill color={acc.color} small>{acc.type}</Pill>
        </div>
      ))}
    </div>
  </div>

  {/* ── Recent Activity ── */}
  <div className="fade-up" style={{ animationDelay: "0.12s", marginBottom: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <span style={{ fontSize: 16, fontWeight: 600, color: DS.textPrimary, letterSpacing: "-0.02em" }}>Recent</span>
      <button onClick={() => {}} style={{ ...btnReset, fontSize: 13, color: DS.accent, fontWeight: 500 }}>See all</button>
    </div>
    <div style={{ ...glass(1), borderRadius: DS.r_lg, overflow: "hidden" }}>
      {recent.map((tx, i) => (
        <TxRow key={tx.id} tx={tx} last={i === recent.length - 1} />
      ))}
    </div>
  </div>

  {/* FAB */}
  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
    <button onClick={() => setShowAddTx(true)} style={{
      ...btnReset, width: 52, height: 52, borderRadius: "50%",
      background: DS.textPrimary, color: "#000",
      boxShadow: "0 4px 20px rgba(255,255,255,0.15)",
      transition: "transform 0.15s, box-shadow 0.15s",
    }}>
      <Icon name="plus" size={22} color="#000" />
    </button>
  </div>

  <AddTxSheet open={showAddTx} onClose={() => setShowAddTx(false)} accounts={[]} onAdd={addTx} />
</div>
```

);
}

/* ════════════════════════════════════════════════════════════════════════════
TRANSACTION ROW
════════════════════════════════════════════════════════════════════════════ */
function TxRow({ tx, last, onDelete }) {
const catColor = CATEGORY_COLORS[tx.category] || DS.neutral;
return (
<div style={{
display: “flex”, alignItems: “center”, gap: 14,
padding: “14px 16px”,
borderBottom: last ? “none” : `1px solid ${DS.border0}`,
transition: “background 0.15s”,
}}>
<div style={{ width: 40, height: 40, borderRadius: 14, background: `${catColor}14`, border: `1px solid ${catColor}20`, display: “flex”, alignItems: “center”, justifyContent: “center”, flexShrink: 0 }}>
<Icon name={categoryIcon(tx.category)} size={17} color={catColor} />
</div>
<div style={{ flex: 1, minWidth: 0 }}>
<p style={{ fontSize: 14, fontWeight: 500, color: DS.textPrimary, letterSpacing: “-0.01em”, marginBottom: 2, overflow: “hidden”, textOverflow: “ellipsis”, whiteSpace: “nowrap” }}>{tx.label}</p>
<div style={{ display: “flex”, gap: 6, alignItems: “center” }}>
<Pill small>{tx.category}</Pill>
<span style={{ fontSize: 11, color: DS.textTertiary }}>{tx.date}</span>
</div>
</div>
<div style={{ textAlign: “right”, flexShrink: 0 }}>
<p style={{ fontSize: 15, fontWeight: 600, color: tx.amount >= 0 ? DS.positive : DS.textPrimary, letterSpacing: “-0.02em” }}>
{tx.amount >= 0 ? “+” : “”}{fmt(tx.amount)}
</p>
{onDelete && (
<button onClick={() => onDelete(tx.id)} style={{ …btnReset, fontSize: 11, color: DS.textTertiary, marginTop: 2 }}>
<Icon name="trash" size={12} />
</button>
)}
</div>
</div>
);
}

/* ════════════════════════════════════════════════════════════════════════════
ADD TRANSACTION SHEET
════════════════════════════════════════════════════════════════════════════ */
function AddTxSheet({ open, onClose, accounts: accProp, onAdd, allAccounts }) {
const accounts = allAccounts || accProp;
const [form, setForm] = useState({ accountId: “”, amount: “”, label: “”, category: “Food”, type: “expense” });
useEffect(() => {
if (accounts.length && !form.accountId) setForm((p) => ({ …p, accountId: accounts[0]?.id || “” }));
}, [accounts, open]);

const submit = () => {
if (!form.amount || !form.accountId) return;
const amt = parseFloat(form.amount) * (form.type === “expense” ? -1 : 1);
onAdd({ accountId: form.accountId, amount: amt, label: form.label || form.category, category: form.category });
onClose();
setForm({ accountId: accounts[0]?.id || “”, amount: “”, label: “”, category: “Food”, type: “expense” });
};

return (
<Sheet open={open} onClose={onClose} title="New Transaction">
{/* Type Toggle */}
<div style={{ display: “flex”, gap: 8, marginBottom: 20, …glass(1), borderRadius: DS.r_md, padding: 4 }}>
{[“expense”, “income”].map((t) => (
<button key={t} onClick={() => setForm((p) => ({ …p, type: t }))} style={{
…btnReset, flex: 1, padding: “10px 0”, borderRadius: DS.r_sm, fontSize: 14, fontWeight: 500,
background: form.type === t ? (t === “expense” ? DS.negativeGlass : DS.positiveGlass) : “none”,
color: form.type === t ? (t === “expense” ? DS.negative : DS.positive) : DS.textTertiary,
border: form.type === t ? `1px solid ${t === "expense" ? "rgba(255,69,58,0.25)" : "rgba(52,199,89,0.25)"}` : “1px solid transparent”,
transition: “all 0.2s”,
}}>
{t === “expense” ? “Expense” : “Income”}
</button>
))}
</div>
<Input label=“Amount (€)” type=“number” placeholder=“0.00” value={form.amount} onChange={(e) => setForm((p) => ({ …p, amount: e.target.value }))} />
<Input label=“Description” placeholder=“What was this for?” value={form.label} onChange={(e) => setForm((p) => ({ …p, label: e.target.value }))} />
<SelectField label=“Category” value={form.category} onChange={(e) => setForm((p) => ({ …p, category: e.target.value }))} options={CATEGORIES} />
{accounts.length > 0 && (
<SelectField label=“Account” value={form.accountId} onChange={(e) => setForm((p) => ({ …p, accountId: e.target.value }))} options={accounts.map((a) => ({ value: a.id, label: a.name }))} />
)}
<div style={{ height: 16 }} />
<Button onClick={submit} variant="primary">Add Transaction</Button>
</Sheet>
);
}

/* ════════════════════════════════════════════════════════════════════════════
ACCOUNTS TAB
════════════════════════════════════════════════════════════════════════════ */
function AccountsTab({ accounts, updateAccount, addAccount, deleteAccount }) {
const [editAcc, setEditAcc] = useState(null);
const [showAdd, setShowAdd] = useState(false);
const [form, setForm] = useState({});

const openEdit = (acc) => { setForm({ …acc, balance: String(acc.balance) }); setEditAcc(acc); };
const saveEdit = () => {
updateAccount(editAcc.id, { …form, balance: parseFloat(form.balance) || 0 });
setEditAcc(null);
};

const [addForm, setAddForm] = useState({ name: “”, type: “Checking”, balance: “”, color: DS.accent });
const submitAdd = () => {
if (!addForm.name) return;
addAccount({ name: addForm.name, type: addForm.type, balance: parseFloat(addForm.balance) || 0, color: addForm.color, iban: “” });
setShowAdd(false); setAddForm({ name: “”, type: “Checking”, balance: “”, color: DS.accent });
};

const COLORS = [DS.accent, DS.positive, “#BF5AF2”, “#FFD60A”, “#FF6961”, “#64D2FF”];

return (
<div style={{ padding: “0 16px” }}>
<div className=“fade-up” style={{ marginTop: 56, marginBottom: 20, display: “flex”, justifyContent: “space-between”, alignItems: “center” }}>
<div>
<p style={{ fontSize: 12, color: DS.textTertiary, fontWeight: 500, letterSpacing: “0.08em”, textTransform: “uppercase”, marginBottom: 4 }}>Manage</p>
<h1 style={{ fontFamily: “‘Instrument Serif’, serif”, fontSize: 32, letterSpacing: “-0.03em” }}>Accounts</h1>
</div>
<Button onClick={() => setShowAdd(true)} variant=“ghost” small>
<div style={{ display: “flex”, alignItems: “center”, gap: 6 }}><Icon name="plus" size={16} />Add</div>
</Button>
</div>

```
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {accounts.map((acc, i) => (
      <div key={acc.id} className="fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
        <div style={{ ...glass(1), borderRadius: DS.r_lg, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden", cursor: "pointer" }}
          onClick={() => openEdit(acc)}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${acc.color}12, transparent 70%)`, pointerEvents: "none" }} />
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `${acc.color}15`, border: `1px solid ${acc.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="bank" size={20} color={acc.color} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: DS.textPrimary, letterSpacing: "-0.01em", marginBottom: 3 }}>{acc.name}</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Pill color={acc.color} small>{acc.type}</Pill>
              {acc.iban && <span style={{ fontSize: 10, color: DS.textTertiary, fontFamily: "monospace" }}>{acc.iban.slice(-8)}</span>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: DS.textPrimary, letterSpacing: "-0.02em" }}>{fmt(acc.balance)}</p>
            <Icon name="chevronRight" size={14} color={DS.textTertiary} />
          </div>
        </div>
      </div>
    ))}
  </div>

  {/* Edit Sheet */}
  <Sheet open={!!editAcc} onClose={() => setEditAcc(null)} title={editAcc?.name || ""}>
    <Input label="Account Name" value={form.name || ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
    <Input label="Balance (€)" type="number" value={form.balance || ""} onChange={(e) => setForm((p) => ({ ...p, balance: e.target.value }))} />
    <SelectField label="Type" value={form.type || "Checking"} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} options={["Checking", "Savings", "Digital", "Investment"]} />
    <Input label="IBAN (optional)" value={form.iban || ""} onChange={(e) => setForm((p) => ({ ...p, iban: e.target.value }))} />
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: DS.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Accent Color</label>
      <div style={{ display: "flex", gap: 10 }}>
        {COLORS.map((c) => (
          <button key={c} onClick={() => setForm((p) => ({ ...p, color: c }))} style={{ ...btnReset, width: 30, height: 30, borderRadius: "50%", background: c, border: form.color === c ? `2px solid white` : `2px solid transparent`, transform: form.color === c ? "scale(1.15)" : "scale(1)", transition: "all 0.2s" }} />
        ))}
      </div>
    </div>
    <div style={{ display: "flex", gap: 10 }}>
      <Button onClick={saveEdit} variant="primary" style={{ flex: 1 }}>Save Changes</Button>
      <Button onClick={() => { deleteAccount(editAcc.id); setEditAcc(null); }} variant="danger" style={{ flex: 0, padding: "15px 18px" }}><Icon name="trash" size={16} /></Button>
    </div>
  </Sheet>

  {/* Add Sheet */}
  <Sheet open={showAdd} onClose={() => setShowAdd(false)} title="New Account">
    <Input label="Bank Name" placeholder="e.g. My Bank" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} />
    <Input label="Initial Balance (€)" type="number" placeholder="0.00" value={addForm.balance} onChange={(e) => setAddForm((p) => ({ ...p, balance: e.target.value }))} />
    <SelectField label="Type" value={addForm.type} onChange={(e) => setAddForm((p) => ({ ...p, type: e.target.value }))} options={["Checking", "Savings", "Digital", "Investment"]} />
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: DS.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Accent Color</label>
      <div style={{ display: "flex", gap: 10 }}>
        {COLORS.map((c) => (
          <button key={c} onClick={() => setAddForm((p) => ({ ...p, color: c }))} style={{ ...btnReset, width: 30, height: 30, borderRadius: "50%", background: c, border: addForm.color === c ? `2px solid white` : `2px solid transparent`, transform: addForm.color === c ? "scale(1.15)" : "scale(1)", transition: "all 0.2s" }} />
        ))}
      </div>
    </div>
    <Button onClick={submitAdd} variant="primary">Add Account</Button>
  </Sheet>
</div>
```

);
}

/* ════════════════════════════════════════════════════════════════════════════
ACTIVITY TAB
════════════════════════════════════════════════════════════════════════════ */
function ActivityTab({ transactions, accounts, addTx, deleteTx }) {
const [showAdd, setShowAdd] = useState(false);
const [filter, setFilter] = useState(“All”);

const filtered = filter === “All” ? transactions : transactions.filter((t) => t.category === filter);
const grouped = {};
filtered.forEach((t) => { const k = t.date; if (!grouped[k]) grouped[k] = []; grouped[k].push(t); });
const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

return (
<div style={{ padding: “0 16px” }}>
<div className=“fade-up” style={{ marginTop: 56, marginBottom: 20, display: “flex”, justifyContent: “space-between”, alignItems: “center” }}>
<div>
<p style={{ fontSize: 12, color: DS.textTertiary, fontWeight: 500, letterSpacing: “0.08em”, textTransform: “uppercase”, marginBottom: 4 }}>History</p>
<h1 style={{ fontFamily: “‘Instrument Serif’, serif”, fontSize: 32, letterSpacing: “-0.03em” }}>Activity</h1>
</div>
<Button onClick={() => setShowAdd(true)} variant=“ghost” small>
<div style={{ display: “flex”, alignItems: “center”, gap: 6 }}><Icon name="plus" size={16} />Add</div>
</Button>
</div>

```
  {/* Category filter pills */}
  <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
    {["All", ...CATEGORIES].map((cat) => (
      <button key={cat} onClick={() => setFilter(cat)} style={{
        ...btnReset, padding: "7px 14px", borderRadius: DS.r_full, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0,
        background: filter === cat ? DS.textPrimary : DS.glass1,
        color: filter === cat ? "#000" : DS.textSecondary,
        border: `1px solid ${filter === cat ? "transparent" : DS.border1}`,
        transition: "all 0.2s",
      }}>{cat}</button>
    ))}
  </div>

  {/* Transaction list */}
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    {sortedDates.map((date) => (
      <div key={date}>
        <p style={{ fontSize: 12, color: DS.textTertiary, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
          {date === todayStr() ? "Today" : date}
        </p>
        <div style={{ ...glass(1), borderRadius: DS.r_lg, overflow: "hidden" }}>
          {grouped[date].map((tx, i) => (
            <TxRow key={tx.id} tx={tx} last={i === grouped[date].length - 1} onDelete={deleteTx} />
          ))}
        </div>
      </div>
    ))}
  </div>

  <AddTxSheet open={showAdd} onClose={() => setShowAdd(false)} allAccounts={accounts} onAdd={addTx} />
</div>
```

);
}

/* ════════════════════════════════════════════════════════════════════════════
GOALS TAB
════════════════════════════════════════════════════════════════════════════ */
function GoalsTab({ goals, updateGoal, addGoal, deleteGoal }) {
const [showAdd, setShowAdd] = useState(false);
const [editGoal, setEditGoal] = useState(null);
const [depositGoal, setDepositGoal] = useState(null);
const [depositAmt, setDepositAmt] = useState(””);
const [form, setForm] = useState({});
const [addForm, setAddForm] = useState({ label: “”, target: “”, saved: “0”, color: DS.accent });
const COLORS = [DS.accent, DS.positive, “#BF5AF2”, “#FFD60A”, “#FF6961”, “#FF9F0A”];

const doDeposit = () => {
const amt = parseFloat(depositAmt) || 0;
if (!amt) return;
updateGoal(depositGoal.id, { saved: Math.min(depositGoal.target, depositGoal.saved + amt) });
setDepositGoal(null); setDepositAmt(””);
};

const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
const totalTarget = goals.reduce((s, g) => s + g.target, 0);

return (
<div style={{ padding: “0 16px” }}>
<div className=“fade-up” style={{ marginTop: 56, marginBottom: 20 }}>
<p style={{ fontSize: 12, color: DS.textTertiary, fontWeight: 500, letterSpacing: “0.08em”, textTransform: “uppercase”, marginBottom: 4 }}>Track</p>
<h1 style={{ fontFamily: “‘Instrument Serif’, serif”, fontSize: 32, letterSpacing: “-0.03em”, marginBottom: 20 }}>Goals</h1>

```
    {/* Overall progress */}
    <div style={{ ...glass(1), borderRadius: DS.r_lg, padding: "18px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
      <ProgressRing pct={Math.round((totalSaved / totalTarget) * 100) || 0} size={64} color={DS.accent} strokeWidth={5} />
      <div>
        <p style={{ fontSize: 11, color: DS.textTertiary, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Overall Progress</p>
        <p style={{ fontSize: 22, fontWeight: 600, color: DS.textPrimary, letterSpacing: "-0.02em" }}>{fmt(totalSaved)} <span style={{ fontSize: 14, color: DS.textTertiary, fontWeight: 400 }}>of {fmt(totalTarget)}</span></p>
      </div>
    </div>

    {/* Goal cards */}
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
      {goals.map((g, i) => {
        const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
        const remaining = Math.max(0, g.target - g.saved);
        return (
          <div key={g.id} className="fade-up" style={{ animationDelay: `${i * 0.06}s`, ...glass(1), borderRadius: DS.r_lg, padding: "20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -30, right: -20, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle, ${g.color}15, transparent 70%)` }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: DS.textPrimary, letterSpacing: "-0.01em", marginBottom: 4 }}>{g.label}</p>
                <p style={{ fontSize: 13, color: DS.textSecondary }}>
                  {fmt(g.saved)} <span style={{ color: DS.textTertiary }}>/ {fmt(g.target)}</span>
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: g.color, letterSpacing: "-0.02em" }}>{pct}%</span>
                <button onClick={() => { setForm({ ...g, target: String(g.target), saved: String(g.saved) }); setEditGoal(g); }} style={{ ...btnReset, color: DS.textTertiary }}><Icon name="edit" size={15} /></button>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 5, background: DS.glass2, borderRadius: DS.r_full, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${g.color}80, ${g.color})`, borderRadius: DS.r_full, transition: "width 0.9s cubic-bezier(0.34,1.2,0.64,1)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: DS.textTertiary }}>{fmt(remaining)} to go</span>
              <Button onClick={() => setDepositGoal(g)} variant="ghost" small><div style={{ display: "flex", gap: 6, alignItems: "center" }}><Icon name="plus" size={14} /> Add funds</div></Button>
            </div>
          </div>
        );
      })}
    </div>

    <Button onClick={() => setShowAdd(true)} variant="ghost">
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><Icon name="plus" size={16} /> New Goal</div>
    </Button>
  </div>

  {/* Edit goal sheet */}
  <Sheet open={!!editGoal} onClose={() => setEditGoal(null)} title="Edit Goal">
    <Input label="Goal Name" value={form.label || ""} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} />
    <Input label="Target (€)" type="number" value={form.target || ""} onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))} />
    <Input label="Already Saved (€)" type="number" value={form.saved || ""} onChange={(e) => setForm((p) => ({ ...p, saved: e.target.value }))} />
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: DS.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Color</label>
      <div style={{ display: "flex", gap: 10 }}>
        {COLORS.map((c) => <button key={c} onClick={() => setForm((p) => ({ ...p, color: c }))} style={{ ...btnReset, width: 28, height: 28, borderRadius: "50%", background: c, border: form.color === c ? `2px solid white` : `2px solid transparent`, transform: form.color === c ? "scale(1.2)" : "scale(1)", transition: "all 0.2s" }} />)}
      </div>
    </div>
    <div style={{ display: "flex", gap: 10 }}>
      <Button onClick={() => { updateGoal(editGoal.id, { ...form, target: parseFloat(form.target) || 0, saved: parseFloat(form.saved) || 0 }); setEditGoal(null); }} style={{ flex: 1 }}>Save</Button>
      <Button onClick={() => { deleteGoal(editGoal.id); setEditGoal(null); }} variant="danger" style={{ flex: 0, padding: "15px 18px" }}><Icon name="trash" size={16} /></Button>
    </div>
  </Sheet>

  {/* Add goal sheet */}
  <Sheet open={showAdd} onClose={() => setShowAdd(false)} title="New Goal">
    <Input label="Goal Name" placeholder="e.g. MacBook Pro" value={addForm.label} onChange={(e) => setAddForm((p) => ({ ...p, label: e.target.value }))} />
    <Input label="Target (€)" type="number" placeholder="1000" value={addForm.target} onChange={(e) => setAddForm((p) => ({ ...p, target: e.target.value }))} />
    <Input label="Already Saved (€)" type="number" placeholder="0" value={addForm.saved} onChange={(e) => setAddForm((p) => ({ ...p, saved: e.target.value }))} />
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: DS.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Color</label>
      <div style={{ display: "flex", gap: 10 }}>
        {COLORS.map((c) => <button key={c} onClick={() => setAddForm((p) => ({ ...p, color: c }))} style={{ ...btnReset, width: 28, height: 28, borderRadius: "50%", background: c, border: addForm.color === c ? `2px solid white` : `2px solid transparent`, transform: addForm.color === c ? "scale(1.2)" : "scale(1)", transition: "all 0.2s" }} />)}
      </div>
    </div>
    <Button onClick={() => { if (!addForm.label || !addForm.target) return; addGoal({ label: addForm.label, target: parseFloat(addForm.target) || 0, saved: parseFloat(addForm.saved) || 0, color: addForm.color }); setShowAdd(false); setAddForm({ label: "", target: "", saved: "0", color: DS.accent }); }}>Create Goal</Button>
  </Sheet>

  {/* Deposit sheet */}
  <Sheet open={!!depositGoal} onClose={() => { setDepositGoal(null); setDepositAmt(""); }} title={`Add to ${depositGoal?.label}`}>
    <Input label="Amount (€)" type="number" placeholder="0.00" value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)} />
    <Button onClick={doDeposit}>Add Funds</Button>
  </Sheet>
</div>
```

);
}

/* ════════════════════════════════════════════════════════════════════════════
ANALYTICS TAB
════════════════════════════════════════════════════════════════════════════ */
function AnalyticsTab({ transactions, accounts }) {
const [period, setPeriod] = useState(“month”);

const thisMonth = monthOf(todayStr());
const filtered = useMemo(() => {
if (period === “month”) return transactions.filter((t) => monthOf(t.date) === thisMonth);
const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
return transactions.filter((t) => new Date(t.date) >= cutoff);
}, [transactions, period, thisMonth]);

const spent = filtered.filter((t) => t.amount < 0);
const income = filtered.filter((t) => t.amount > 0);
const totalSpent = Math.abs(spent.reduce((s, t) => s + t.amount, 0));
const totalIncome = income.reduce((s, t) => s + t.amount, 0);
const saved = totalIncome - totalSpent;

// Category breakdown
const catTotals = {};
spent.forEach((t) => { catTotals[t.category] = (catTotals[t.category] || 0) + Math.abs(t.amount); });
const catArr = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

// Bar chart — last 7 days spending
const last7 = Array.from({ length: 7 }, (_, i) => {
const d = new Date(); d.setDate(d.getDate() - (6 - i));
return d.toISOString().slice(0, 10);
});
const barData = last7.map((date) => ({
label: dayLabel(date),
value: Math.abs(transactions.filter((t) => t.date === date && t.amount < 0).reduce((s, t) => s + t.amount, 0)),
active: date === todayStr(),
}));

// Export
const exportCSV = () => {
const hdr = “Date,Account,Label,Category,Amount\n”;
const rows = transactions.map((t) => {
const acc = accounts.find((a) => a.id === t.accountId);
return `${t.date},${acc?.name || ""},${t.label},${t.category},${t.amount}`;
}).join(”\n”);
const a = document.createElement(“a”); a.href = URL.createObjectURL(new Blob([hdr + rows], { type: “text/csv” })); a.download = “transactions.csv”; a.click();
};

return (
<div style={{ padding: “0 16px” }}>
<div className=“fade-up” style={{ marginTop: 56, marginBottom: 20 }}>
<p style={{ fontSize: 12, color: DS.textTertiary, fontWeight: 500, letterSpacing: “0.08em”, textTransform: “uppercase”, marginBottom: 4 }}>Insights</p>
<h1 style={{ fontFamily: “‘Instrument Serif’, serif”, fontSize: 32, letterSpacing: “-0.03em”, marginBottom: 20 }}>Analytics</h1>

```
    {/* Period toggle */}
    <div style={{ ...glass(1), borderRadius: DS.r_md, padding: 4, display: "flex", gap: 4, marginBottom: 20 }}>
      {["week", "month"].map((p) => (
        <button key={p} onClick={() => setPeriod(p)} style={{
          ...btnReset, flex: 1, padding: "9px 0", borderRadius: DS.r_sm, fontSize: 13, fontWeight: 500,
          background: period === p ? DS.glass3 : "none",
          color: period === p ? DS.textPrimary : DS.textTertiary,
          border: period === p ? `1px solid ${DS.border2}` : "1px solid transparent",
          transition: "all 0.2s",
        }}>{p === "week" ? "This Week" : "This Month"}</button>
      ))}
    </div>

    {/* Summary cards */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
      {[
        { label: "Spent", val: totalSpent, color: DS.negative },
        { label: "Income", val: totalIncome, color: DS.positive },
        { label: "Saved", val: Math.max(0, saved), color: DS.accent },
      ].map((s) => (
        <div key={s.label} style={{ ...glass(1), borderRadius: DS.r_md, padding: "14px 12px" }}>
          <p style={{ fontSize: 10, color: DS.textTertiary, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>{fmt(s.val)}</p>
        </div>
      ))}
    </div>

    {/* Bar chart */}
    <div style={{ ...glass(1), borderRadius: DS.r_lg, padding: "20px", marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: DS.textPrimary, letterSpacing: "-0.01em", marginBottom: 4 }}>Daily Spending</p>
      <p style={{ fontSize: 12, color: DS.textTertiary, marginBottom: 4 }}>Last 7 days</p>
      <BarChart data={barData} />
    </div>

    {/* Category breakdown */}
    {catArr.length > 0 && (
      <div style={{ ...glass(1), borderRadius: DS.r_lg, padding: "20px", marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: DS.textPrimary, letterSpacing: "-0.01em", marginBottom: 16 }}>By Category</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {catArr.map(([cat, val]) => {
            const pct = Math.round((val / totalSpent) * 100);
            const color = CATEGORY_COLORS[cat] || DS.neutral;
            return (
              <div key={cat}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: DS.textSecondary, fontWeight: 500 }}>{cat}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 12, color: DS.textTertiary }}>{pct}%</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: DS.textPrimary }}>{fmt(val)}</span>
                  </div>
                </div>
                <div style={{ height: 3, background: DS.glass2, borderRadius: DS.r_full }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: DS.r_full, transition: "width 0.8s cubic-bezier(0.34,1.2,0.64,1)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* Export */}
    <div style={{ ...glass(1), borderRadius: DS.r_lg, padding: "18px 20px", marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: DS.textPrimary, marginBottom: 12 }}>Export Data</p>
      <Button onClick={exportCSV} variant="ghost">
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><Icon name="download" size={16} /> Export as CSV</div>
      </Button>
    </div>
  </div>
</div>
```

);
}
