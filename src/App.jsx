import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Recycle,
  Wifi,
  WifiOff,
  IndianRupee,
  PackageCheck,
  Package,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  MapPin,
  Wallet,
  Sparkles,
  Scale,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Design tokens — bright, minimal, white space, single bold green accent
// (matches the reference site's look) — one palette used everywhere.
// ---------------------------------------------------------------------------
const T = {
  bg: "#FFFFFF",
  bgSoft: "#F6F9F6",
  ink: "#132018",
  muted: "#6E7A73",
  mutedLight: "#9AA69F",
  green: "#189A4E",
  greenDark: "#0E7A3D",
  greenTint: "#E7F7EC",
  line: "#EAEEE9",
  shadow: "0 1px 3px rgba(19,32,24,0.04), 0 8px 24px rgba(19,32,24,0.05)",
  offline: "#C6564A",
};

// ---------------------------------------------------------------------------
const MATERIALS = {
  METAL: { label: "Metal", desc: "Cans, scrap, foil", rate: 45, unitG: [12, 60], count: [1, 6], icon: "🥫" },
  GLASS: { label: "Glass", desc: "Bottles & jars", rate: 3, unitG: [150, 480], count: [1, 3], icon: "🍾" },
  PLASTIC: { label: "Plastic", desc: "Bottles & containers", rate: 8, unitG: [12, 38], count: [1, 6], icon: "🧴" },
  RUBBER: { label: "Rubber", desc: "Tyres, soles, scrap", rate: 12, unitG: [60, 260], count: [1, 3], icon: "🛞" },
  JUTE: { label: "Jute", desc: "Sacks & fibre", rate: 6, unitG: [100, 350], count: [1, 3], icon: "🧺" },
};

const MACHINES = [
  { id: "RVM-001", location: "T Nagar Mall", isThisMachine: true },
  { id: "RVM-002", location: "Besant Nagar Beach" },
  { id: "RVM-003", location: "Anna University" },
  { id: "RVM-004", location: "Velachery Metro" },
  { id: "RVM-005", location: "Marina Beach" },
];

const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fmtKg = (g) => (g / 1000).toFixed(3);
const fmtMoney = (v) => `\u20b9${v.toFixed(2)}`;

function makeTransaction(machineId, materialKey, weightG, reward) {
  return {
    id: `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    machineId,
    materialKey,
    weightG,
    reward,
    ts: Date.now(),
  };
}

function randomWeightFor(materialKey) {
  const def = MATERIALS[materialKey];
  const n = Math.floor(rand(def.count[0], def.count[1] + 1));
  let total = 0;
  for (let i = 0; i < n; i++) total += rand(def.unitG[0], def.unitG[1]);
  return total;
}

// Weighted random pick — mirrors realistic deposit mix (plastic most common).
const MATERIAL_WEIGHTS = [
  ["PLASTIC", 34],
  ["METAL", 24],
  ["GLASS", 16],
  ["JUTE", 14],
  ["RUBBER", 12],
];
function detectRandomMaterial() {
  const total = MATERIAL_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of MATERIAL_WEIGHTS) {
    if (r < w) return key;
    r -= w;
  }
  return MATERIAL_WEIGHTS[0][0];
}

// Each processing step, and which point in the sequence it "reveals" (material at IDENTIFYING, weight at WEIGHING).
const PROCESSING_STEPS = ["Detecting item", "Identifying material", "Weighing", "Calculating your reward"];

// ---------------------------------------------------------------------------
export default function App() {
  const [view, setView] = useState("kiosk"); // 'kiosk' | 'dashboard'

  const [machineStatus, setMachineStatus] = useState(() =>
    Object.fromEntries(MACHINES.map((m) => [m.id, m.id === "RVM-002" ? "offline" : "online"]))
  );
  const [transactions, setTransactions] = useState([]);
  const [sessionReward, setSessionReward] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

  const [screen, setScreen] = useState("idle"); // 'idle' | 'processing' | 'result'
  const [detectedMaterial, setDetectedMaterial] = useState(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [liveWeightG, setLiveWeightG] = useState(0);
  const [result, setResult] = useState(null);

  const timers = useRef([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const startDeposit = useCallback(() => {
    clearTimers();
    setScreen("processing");
    setStepIndex(-1);
    setDetectedMaterial(null);
    setLiveWeightG(0);

    // The "sensor reading" is decided now, but only revealed to the UI as
    // each processing step completes — this is what a real capacitive +
    // inductive sensor pass, then a load-cell reading, would look like.
    const materialKey = detectRandomMaterial();
    const weightG = randomWeightFor(materialKey);
    const reward = (weightG / 1000) * MATERIALS[materialKey].rate;

    PROCESSING_STEPS.forEach((_, i) => {
      const t = setTimeout(() => {
        setStepIndex(i);
        if (i === 1) setDetectedMaterial(materialKey); // "Identifying material" step
        if (i === 2) setLiveWeightG(weightG); // "Weighing" step
      }, i * 700);
      timers.current.push(t);
    });

    const finishT = setTimeout(() => {
      const tx = makeTransaction("RVM-001", materialKey, weightG, reward);
      setTransactions((prev) => [tx, ...prev].slice(0, 200));
      setSessionReward((s) => s + reward);
      setSessionCount((c) => c + 1);
      setResult({ materialKey, weightG, reward });
      setScreen("result");
    }, PROCESSING_STEPS.length * 700 + 500);
    timers.current.push(finishT);
  }, []);

  useEffect(() => {
    if (screen !== "idle") return;
    const onKey = (e) => {
      if (e.key === "Enter") startDeposit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, startDeposit]);

  const depositAnother = () => {
    setResult(null);
    setScreen("idle");
  };

  const finishSession = () => {
    setResult(null);
    setSessionReward(0);
    setSessionCount(0);
    setScreen("idle");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const candidates = MACHINES.filter((m) => !m.isThisMachine && machineStatus[m.id] === "online");
      if (candidates.length === 0) return;
      const machine = pick(candidates);
      const materialKey = pick(["PLASTIC", "PLASTIC", "METAL", "GLASS", "JUTE", "RUBBER"]);
      const weightG = randomWeightFor(materialKey);
      const reward = (weightG / 1000) * MATERIALS[materialKey].rate;
      const tx = makeTransaction(machine.id, materialKey, weightG, reward);
      setTransactions((prev) => [tx, ...prev].slice(0, 200));
    }, rand(5000, 9000));
    return () => clearInterval(interval);
  }, [machineStatus]);

  const toggleMachine = (id) => {
    if (id === "RVM-001") return;
    setMachineStatus((prev) => ({ ...prev, [id]: prev[id] === "online" ? "offline" : "online" }));
  };

  const stats = useMemo(() => {
    const totalWasteKg = transactions.reduce((s, t) => s + t.weightG, 0) / 1000;
    const totalReward = transactions.reduce((s, t) => s + t.reward, 0);
    const byMachine = {};
    MACHINES.forEach((m) => (byMachine[m.id] = { kg: 0, reward: 0 }));
    transactions.forEach((t) => {
      const row = byMachine[t.machineId];
      row.kg += t.weightG / 1000;
      row.reward += t.reward;
    });
    return { totalWasteKg, totalReward, byMachine, deposits: transactions.length };
  }, [transactions]);

  return (
    <div className="w-full min-h-screen flex flex-col" style={{ backgroundColor: T.bg, fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      <TopNav view={view} setView={setView} />
      {view === "kiosk" ? (
        <Kiosk
          screen={screen}
          startDeposit={startDeposit}
          stepIndex={stepIndex}
          detectedMaterial={detectedMaterial}
          liveWeightG={liveWeightG}
          result={result}
          sessionReward={sessionReward}
          sessionCount={sessionCount}
          depositAnother={depositAnother}
          finishSession={finishSession}
        />
      ) : (
        <Dashboard stats={stats} machineStatus={machineStatus} toggleMachine={toggleMachine} transactions={transactions} />
      )}
    </div>
  );
}

function TopNav({ view, setView }) {
  return (
    <div className="flex items-center justify-between px-5 sm:px-10 py-5 sticky top-0 z-10" style={{ backgroundColor: T.bg }}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: T.green }}>
          <Recycle size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <div className="font-bold text-base tracking-tight" style={{ color: T.ink }}>
          GreenLoop
        </div>
      </div>
      <div className="flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: T.bgSoft }}>
        {[
          { id: "kiosk", label: "Kiosk" },
          { id: "dashboard", label: "City Dashboard" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors"
            style={{
              backgroundColor: view === t.id ? T.green : "transparent",
              color: view === t.id ? "#fff" : T.muted,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KIOSK
// ---------------------------------------------------------------------------
function Kiosk(props) {
  const { screen, sessionReward, sessionCount } = props;
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-14">
      <div className="w-full max-w-lg">
        {sessionCount > 0 && screen !== "result" && (
          <div
            className="flex items-center justify-between px-5 py-2.5 rounded-full mb-6 text-sm font-semibold"
            style={{ backgroundColor: T.greenTint, color: T.greenDark }}
          >
            <span className="flex items-center gap-1.5">
              <Wallet size={15} /> This visit: {sessionCount} item{sessionCount > 1 ? "s" : ""}
            </span>
            <span>{fmtMoney(sessionReward)} earned</span>
          </div>
        )}

        {screen === "idle" && <IdleScreen {...props} />}
        {screen === "processing" && <ProcessingScreen {...props} />}
        {screen === "result" && <ResultScreen {...props} />}
      </div>
    </div>
  );
}

function IdleScreen({ startDeposit }) {
  return (
    <div className="rounded-3xl p-8 sm:p-12 flex flex-col items-center text-center" style={{ backgroundColor: "#fff", boxShadow: T.shadow }}>
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6" style={{ backgroundColor: T.greenTint }}>
        ♻️
      </div>
      <div className="text-2xl sm:text-[32px] font-extrabold tracking-tight leading-tight mb-2" style={{ color: T.ink }}>
        Place your item in the machine
      </div>
      <div className="text-sm mb-8 max-w-xs" style={{ color: T.muted }}>
        Our sensors detect the material and weigh it automatically — no need to tell us what it is.
      </div>

      <button
        onClick={startDeposit}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-transform active:scale-[0.98]"
        style={{ backgroundColor: T.green, color: "#fff" }}
      >
        Insert Item <ArrowRight size={18} />
      </button>
      <div className="text-[11px] mt-3" style={{ color: T.mutedLight }}>
        Accepts metal, glass, plastic, rubber, and jute
      </div>
    </div>
  );
}

function ProcessingScreen({ stepIndex, detectedMaterial, liveWeightG }) {
  const def = detectedMaterial ? MATERIALS[detectedMaterial] : null;
  return (
    <div className="rounded-3xl p-10 sm:p-12 flex flex-col items-center text-center" style={{ backgroundColor: "#fff", boxShadow: T.shadow }}>
      <div className="relative w-24 h-24 mb-7 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: T.greenTint, opacity: 0.7 }} />
        <div className="relative w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-all" style={{ backgroundColor: T.greenTint }}>
          {def ? def.icon : "📦"}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-1 text-sm font-semibold" style={{ color: T.ink }}>
        <Scale size={16} color={T.green} />
        {def ? `Identified: ${def.label}` : "Reading your item"}
      </div>
      {liveWeightG > 0 && (
        <div className="text-xs font-mono mb-5" style={{ color: T.muted }}>
          {fmtKg(liveWeightG)} kg
        </div>
      )}
      {liveWeightG === 0 && <div className="mb-5" />}

      <div className="flex flex-col gap-3 w-full max-w-xs text-left">
        {PROCESSING_STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: i <= stepIndex ? T.green : T.bgSoft,
                border: i > stepIndex ? `1.5px solid ${T.line}` : "none",
              }}
            >
              {i <= stepIndex && <CheckCircle2 size={13} color="#fff" />}
            </div>
            <span className="text-sm font-medium" style={{ color: i <= stepIndex ? T.ink : T.mutedLight }}>
              {step}
              {i === stepIndex ? "\u2026" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultScreen({ result, depositAnother, finishSession, sessionReward, sessionCount }) {
  const def = MATERIALS[result.materialKey];
  return (
    <div className="rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center" style={{ backgroundColor: "#fff", boxShadow: T.shadow }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: T.greenTint }}>
        <Sparkles size={26} color={T.green} />
      </div>
      <div className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: T.muted }}>
        Thank you for recycling
      </div>
      <div className="text-5xl font-extrabold mb-2" style={{ color: T.green }}>
        {fmtMoney(result.reward)}
      </div>
      <div className="text-sm mb-8" style={{ color: T.muted }}>
        {def.icon} {def.label} &middot; {fmtKg(result.weightG)} kg deposited
      </div>

      <div className="w-full flex flex-col gap-3">
        <button
          onClick={depositAnother}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
          style={{ backgroundColor: T.green, color: "#fff" }}
        >
          <PackageCheck size={17} /> Recycle another item
        </button>
        <button
          onClick={finishSession}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
          style={{ backgroundColor: "#fff", color: T.ink, border: `1.5px solid ${T.line}` }}
        >
          <RotateCcw size={16} /> Finish &amp; collect {fmtMoney(sessionReward)}
        </button>
      </div>
      {sessionCount > 1 && (
        <div className="text-[11px] mt-3" style={{ color: T.muted }}>
          {sessionCount} items recycled this visit
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------
function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: "#fff", boxShadow: T.shadow }}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest mb-1.5" style={{ color: T.muted }}>
        {icon} {label}
      </div>
      <div className="text-xl font-extrabold" style={{ color: T.ink }}>
        {value}
      </div>
    </div>
  );
}

function Dashboard({ stats, machineStatus, toggleMachine, transactions }) {
  const onlineCount = Object.values(machineStatus).filter((s) => s === "online").length;

  const machineBarData = MACHINES.map((m) => ({
    name: m.id.replace("RVM-", ""),
    kg: Number((stats.byMachine[m.id]?.kg || 0).toFixed(3)),
    fill: m.isThisMachine ? T.green : "#C9D6CD",
  }));

  return (
    <div className="flex-1 px-4 sm:px-10 py-4 sm:py-6 flex flex-col gap-5" style={{ backgroundColor: T.bgSoft }}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Wifi size={12} />} label="Machines Online" value={`${onlineCount}/${MACHINES.length}`} />
        <StatCard icon={<Package size={12} />} label="Total Waste" value={`${stats.totalWasteKg.toFixed(2)} kg`} />
        <StatCard icon={<IndianRupee size={12} />} label="Rewards Paid" value={fmtMoney(stats.totalReward)} />
        <StatCard icon={<CheckCircle2 size={12} />} label="Deposits" value={stats.deposits} />
      </div>

      <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "#fff", boxShadow: T.shadow }}>
        <div className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ color: T.muted }}>
          Waste Collected by Machine (kg)
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={machineBarData}>
            <CartesianGrid stroke={T.line} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke={T.muted} fontSize={11} tickLine={false} axisLine={{ stroke: T.line }} />
            <YAxis stroke={T.muted} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "#fff", border: `1px solid ${T.line}`, fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="kg" radius={[6, 6, 0, 0]}>
              {machineBarData.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {MACHINES.map((m) => {
          const online = machineStatus[m.id] === "online";
          const row = stats.byMachine[m.id] || { kg: 0, reward: 0 };
          return (
            <div
              key={m.id}
              className="rounded-2xl p-4 flex items-center justify-between"
              style={{ backgroundColor: "#fff", boxShadow: T.shadow, border: m.isThisMachine ? `1.5px solid ${T.green}` : "none" }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleMachine(m.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: T.bgSoft }}
                  title={m.isThisMachine ? "Kiosk machine" : "Tap to toggle online/offline"}
                >
                  {online ? <Wifi size={16} color={T.green} /> : <WifiOff size={16} color={T.offline} />}
                </button>
                <div>
                  <div className="font-bold text-sm flex items-center gap-1.5" style={{ color: T.ink }}>
                    {m.id}
                    {m.isThisMachine && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: T.greenTint, color: T.greenDark }}>
                        THIS KIOSK
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] flex items-center gap-1" style={{ color: T.muted }}>
                    <MapPin size={10} /> {m.location}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-sm" style={{ color: T.green }}>
                  {fmtMoney(row.reward)}
                </div>
                <div className="text-[11px]" style={{ color: T.muted }}>
                  {row.kg.toFixed(2)} kg
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "#fff", boxShadow: T.shadow }}>
        <div className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: T.muted }}>
          Recent Deposits — All Machines
        </div>
        <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
          {transactions.length === 0 && (
            <div className="text-sm py-6 text-center" style={{ color: T.muted }}>
              No deposits yet — use the Kiosk tab to make one.
            </div>
          )}
          {transactions.slice(0, 12).map((t) => {
            const mat = MATERIALS[t.materialKey];
            return (
              <div key={t.id} className="flex items-center justify-between text-xs px-3 py-2.5 rounded-xl" style={{ backgroundColor: T.bgSoft }}>
                <span className="font-semibold w-16" style={{ color: T.ink }}>
                  {t.machineId}
                </span>
                <span className="w-20" style={{ color: T.muted }}>
                  {mat.icon} {mat.label}
                </span>
                <span className="w-16 text-right" style={{ color: T.muted }}>
                  {fmtKg(t.weightG)} kg
                </span>
                <span className="w-16 text-right font-bold" style={{ color: T.green }}>
                  {fmtMoney(t.reward)}
                </span>
                <span className="w-16 text-right hidden sm:block" style={{ color: T.mutedLight }}>
                  {new Date(t.ts).toLocaleTimeString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
