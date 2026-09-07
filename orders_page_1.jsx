import React, { useState, useMemo, useRef, useEffect } from "react";
// npm install qrcode.react
import { QRCodeSVG } from "qrcode.react";
import {
  ShoppingCart,
  Box,
  Truck,
  Users,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Tag,
  PackageCheck,
  XCircle,
  Image as ImageIcon,
  ChevronDown,
  Sun,
  Moon,
  Calendar as CalendarIcon,
} from "lucide-react";

/* ---------------------------------- data ----------------------------------
   Dark mode uses Tailwind's `dark:` variant with the "class" strategy.
   Make sure tailwind.config.js has: darkMode: 'class'
------------------------------------------------------------------------- */

const STATUS_STYLES = {
  "Ожидает подтверждения": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
  "Подтверждён": "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30",
  "Ожидает отгрузки": "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30",
  "В пути": "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30",
  "Получен": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
  "Отменён до обработки": "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/40 dark:text-slate-400 dark:border-slate-600",
  "Отменён в процессе обработки": "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30",
};
const STATUS_LIST = Object.keys(STATUS_STYLES);

const SELLERS = ["ООО «Техно-Мир»", "ИП Смирнова А.В.", "TrendWear", "GreenLeaf Home", "Bee Store"];
const PVZ = [
  "ПВЗ СДЭК, г. Москва, ул. Профсоюзная, 45",
  "ПВЗ СДЭК, г. Санкт-Петербург, Невский пр-т, 102",
  "ПВЗ СДЭК, г. Казань, ул. Баумана, 12",
  "ПВЗ СДЭК, г. Новосибирск, Красный пр-т, 88",
];
const PRODUCTS = [
  { name: "Наушники беспроводные AirSound Pro", article: "AS-1042" },
  { name: "Термокружка 450 мл, сталь", article: "TK-0450" },
  { name: "Кроссовки беговые Stride X", article: "SX-221" },
  { name: "Настольная лампа LED «Луч»", article: "NL-77" },
  { name: "Рюкзак городской Urban 25L", article: "URB-25" },
  { name: "Набор кистей для макияжа, 12 шт.", article: "MK-012" },
  { name: "Коврик для йоги 6мм", article: "YG-006" },
  { name: "Органайзер для кабелей, 3 шт.", article: "OR-003" },
];

function pad(n) { return String(n).padStart(2, "0"); }
function fmtDateTime(d) {
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}/${pad(d.getHours())}.${pad(d.getMinutes())}`;
}
function fmtDate(d) {
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}
function fmtSum(n) {
  return n.toLocaleString("ru-RU") + " \u20BD";
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function genLabelCode(order) {
  const base = String(order.baseNumber).padStart(5, "0");
  const rand = String(Math.floor(Math.random() * 1e7)).padStart(7, "0");
  return `14${base}${rand}`;
}

const ECONOMICS_RATES = { commission: 0.12, acquiring: 0.025, logistics: 0.06 };
function computeEconomics(sum, cancelled) {
  const commission = cancelled ? 0 : Math.round(sum * ECONOMICS_RATES.commission);
  const acquiring = cancelled ? 0 : Math.round(sum * ECONOMICS_RATES.acquiring);
  const logistics = cancelled ? 0 : Math.round(sum * ECONOMICS_RATES.logistics);
  const totalExpenses = commission + acquiring + logistics;
  const payout = sum - totalExpenses;
  return { commission, acquiring, logistics, totalExpenses, payout };
}

/* ------------------------------ date range picker --------------------------- */

function pad2(n) { return String(n).padStart(2, "0"); }
function toISO(y, m, d) { return `${y}-${pad2(m + 1)}-${pad2(d)}`; }
function parseISO(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function fmtDMY(iso) { if (!iso) return ""; return fmtDate(parseISO(iso)); }

const MONTH_NAMES = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const TODAY_ISO = "2026-09-07"; // demo "current date" anchor — replace with a real today() in production

function buildMonthCells(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  return cells;
}

function MonthGrid({ monthDate, tempFrom, tempTo, onPick }) {
  const cells = buildMonthCells(monthDate);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  return (
    <div>
      <div className="text-center text-sm font-medium text-slate-800 dark:text-slate-100 mb-3">
        {MONTH_NAMES[month]} {year}
      </div>
      <div className="grid grid-cols-7 text-xs text-slate-400 dark:text-slate-500 mb-1">
        {WEEKDAYS.map((w) => <div key={w} className="w-9 h-6 flex items-center justify-center">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="w-9 h-9" />;
          const iso = toISO(year, month, day);
          const weekday = new Date(year, month, day).getDay();
          const isWeekend = weekday === 0 || weekday === 6;
          const isToday = iso === TODAY_ISO;
          const isStart = iso === tempFrom;
          const isEnd = iso === tempTo;
          const inRange = tempFrom && tempTo && iso > tempFrom && iso < tempTo;
          let cls = "w-9 h-9 flex items-center justify-center text-sm cursor-pointer select-none ";
          if (isStart || isEnd) cls += "bg-emerald-600 text-white rounded-full font-medium";
          else if (inRange) cls += "bg-emerald-50 dark:bg-emerald-500/10 text-slate-700 dark:text-slate-200";
          else if (isWeekend) cls += "text-red-500 dark:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" + (isToday ? " ring-1 ring-inset ring-slate-300 dark:ring-slate-600" : "");
          else cls += "text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" + (isToday ? " ring-1 ring-inset ring-slate-300 dark:ring-slate-600" : "");
          return (
            <button key={i} type="button" onClick={() => onPick(iso)} className={cls}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateRangePicker({ label, from, to, onApply }) {
  const [open, setOpen] = useState(false);
  const [base, setBase] = useState(() => startOfMonth(from ? parseISO(from) : parseISO(TODAY_ISO)));
  const [tempFrom, setTempFrom] = useState(from || null);
  const [tempTo, setTempTo] = useState(to || null);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function togglePicker() {
    if (!open) {
      setTempFrom(from || null);
      setTempTo(to || null);
      setBase(startOfMonth(from ? parseISO(from) : parseISO(TODAY_ISO)));
    }
    setOpen((o) => !o);
  }

  function pickDay(iso) {
    if (!tempFrom || tempTo) {
      setTempFrom(iso);
      setTempTo(null);
    } else if (iso < tempFrom) {
      setTempTo(tempFrom);
      setTempFrom(iso);
    } else {
      setTempTo(iso);
    }
  }

  function apply() {
    onApply(tempFrom || "", tempTo || tempFrom || "");
    setOpen(false);
  }
  function clear() {
    setTempFrom(null);
    setTempTo(null);
    onApply("", "");
    setOpen(false);
  }

  const displayLabel = from && to && from !== to ? `${fmtDMY(from)} – ${fmtDMY(to)}` : from ? fmtDMY(from) : "Выберите даты";

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={togglePicker}
        className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        <span className="min-w-0">
          <span className="block text-[10px] leading-tight text-slate-400 dark:text-slate-500">{label}</span>
          <span className={`block text-sm truncate ${from ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"}`}>{displayLabel}</span>
        </span>
        <CalendarIcon size={16} className="text-slate-400 shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-4 w-max">
          <div className="flex items-start gap-6">
            <button type="button" onClick={() => setBase(addMonths(base, -1))} className="mt-1 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
              <ChevronLeft size={16} />
            </button>
            <MonthGrid monthDate={base} tempFrom={tempFrom} tempTo={tempTo} onPick={pickDay} />
            <MonthGrid monthDate={addMonths(base, 1)} tempFrom={tempFrom} tempTo={tempTo} onPick={pickDay} />
            <button type="button" onClick={() => setBase(addMonths(base, 1))} className="mt-1 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={clear} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">Сбросить</button>
            <button type="button" onClick={apply} disabled={!tempFrom} className="h-8 px-4 rounded-lg bg-emerald-600 text-white text-xs font-medium disabled:opacity-40 hover:bg-emerald-700">Применить</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- mock data -------------------------------- */

function buildOrders() {
  const orders = [];
  const now = new Date(2026, 8, 7, 14, 30);
  let base = 1;
  let idx = 0;
  while (orders.length < 137) {
    const isComposite = base % 11 === 0;
    const partsCount = isComposite ? 2 : 1;
    for (let p = 1; p <= partsCount; p++) {
      const created = addDays(now, -Math.floor(idx / 3));
      created.setHours(9 + (idx % 9), (idx * 7) % 60);
      const shipDate = addDays(created, 2 + (idx % 3));
      const itemCount = 1 + (idx % 3);
      const items = [];
      for (let k = 0; k < itemCount; k++) {
        const prod = PRODUCTS[(idx + k) % PRODUCTS.length];
        const qty = 1 + ((idx + k) % 3);
        const price = 590 + ((idx * 137 + k * 211) % 4200);
        items.push({ id: `${base}-${p}-${k}`, name: prod.name, article: prod.article, qty, price });
      }
      const sum = items.reduce((s, it) => s + it.qty * it.price, 0);

      let status;
      const m = idx % 6;
      if (m === 0) status = "Ожидает подтверждения";
      else if (m === 1) status = "Подтверждён";
      else if (m === 2) status = "Ожидает отгрузки";
      else if (m === 3) status = "В пути";
      else if (m === 4) status = "Получен";
      else status = "Отменён до обработки";

      const history = [{ date: created, event: "Заказ создан", initiator: "Клиент" }];
      if (status !== "Ожидает подтверждения") history.push({ date: addDays(created, 0), event: "Подтверждён", initiator: "Селлер" });
      if (["Ожидает отгрузки", "В пути", "Получен"].includes(status)) history.push({ date: addDays(created, 1), event: "Готов к отгрузке", initiator: "Селлер" });
      if (["В пути", "Получен"].includes(status)) history.push({ date: addDays(created, 2), event: "Принят в ПВЗ отправителя", initiator: "Система (СДЭК)" });
      if (status === "Получен") history.push({ date: addDays(created, 4), event: "Получен клиентом", initiator: "Система (СДЭК)" });
      if (status === "Отменён до обработки") history.push({ date: addDays(created, 0), event: "Отменён до обработки", initiator: "Клиент" });

      orders.push({
        id: isComposite ? `${base}-${p}` : `${base}`,
        baseNumber: base,
        seller: SELLERS[(base + p) % SELLERS.length],
        createdAt: created,
        shipDate,
        deliveryDate: status === "Получен" ? addDays(created, 4) : null,
        pickupPoint: PVZ[idx % PVZ.length],
        status,
        items,
        sum,
        history,
        labelCode: null,
      });
      idx++;
    }
    base++;
  }
  return orders.slice(0, 137);
}

/* --------------------------------- pieces ---------------------------------- */

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium whitespace-nowrap ${STATUS_STYLES[status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
}

const DOT_COLORS = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  slate: "bg-slate-400",
};
const DOT_TEXT_COLORS = {
  emerald: "text-slate-700 dark:text-slate-200",
  amber: "text-slate-700 dark:text-slate-200",
  slate: "text-slate-400 dark:text-slate-500",
};
function StatusDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[color]}`} />
      <span className={`text-sm ${DOT_TEXT_COLORS[color]}`}>{label}</span>
    </span>
  );
}

function getSettlement(status) {
  if (status.startsWith("Отменён")) {
    return { serviceLabel: "Не удержано", serviceColor: "slate", payoutLabel: "Не начисляется", payoutColor: "slate" };
  }
  if (status === "Ожидает подтверждения") {
    return { serviceLabel: "Удержим позже", serviceColor: "amber", payoutLabel: "Ожидает перевода", payoutColor: "amber" };
  }
  if (status === "Получен") {
    return { serviceLabel: "Сумма удержана", serviceColor: "emerald", payoutLabel: "Переведён вам", payoutColor: "emerald" };
  }
  return { serviceLabel: "Сумма удержана", serviceColor: "emerald", payoutLabel: "Ожидает перевода", payoutColor: "amber" };
}
function genPaymentNo(order) {
  return String(770000 + order.baseNumber);
}
function genContractNo(order) {
  return `58${String(order.baseNumber).padStart(4, "0")}/26`;
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm px-4 py-3 rounded-lg shadow-lg z-50">
      {message}
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      aria-label="Переключить тему"
      className="relative w-14 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 transition-colors flex items-center px-1 shrink-0"
    >
      <span
        className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white dark:bg-slate-950 shadow flex items-center justify-center text-amber-500 dark:text-indigo-300 transition-transform duration-200 ${isDark ? "translate-x-6" : "translate-x-0"}`}
      >
        {isDark ? <Moon size={13} /> : <Sun size={13} />}
      </span>
    </button>
  );
}

/* ---------------------------------- app ------------------------------------ */

export default function OrdersPage() {
  const [orders, setOrders] = useState(buildOrders);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("details");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const [theme, setTheme] = useState("light");
  const [labelModalOpen, setLabelModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const [filters, setFilters] = useState({
    number: "",
    dateFrom: "",
    dateTo: "",
    shipFrom: "",
    shipTo: "",
    status: "",
  });

  const PAGE_SIZE = 50;

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filters.number && !o.id.includes(filters.number.trim())) return false;
      if (filters.status && o.status !== filters.status) return false;
      if (filters.dateFrom && o.createdAt < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && o.createdAt > new Date(filters.dateTo + "T23:59:59")) return false;
      if (filters.shipFrom && o.shipDate < new Date(filters.shipFrom)) return false;
      if (filters.shipTo && o.shipDate > new Date(filters.shipTo + "T23:59:59")) return false;
      return true;
    });
  }, [orders, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageOrders = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedOrder = orders.find((o) => o.id === selectedId) || null;

  function updateOrder(id, updater) {
    setOrders((prev) => prev.map((o) => (o.id === id ? updater(o) : o)));
  }

  function handleReadyToShip(o) {
    updateOrder(o.id, (ord) => ({
      ...ord,
      status: "Ожидает отгрузки",
      history: [...ord.history, { date: new Date(2026, 8, 7, 14, 30), event: "Готов к отгрузке", initiator: "Селлер" }],
    }));
    showToast("Статус изменён: «Ожидает отгрузки»");
  }

  function handleCancel(o) {
    const wasUnconfirmed = o.status === "Ожидает подтверждения";
    const newStatus = wasUnconfirmed ? "Отменён до обработки" : "Отменён в процессе обработки";
    updateOrder(o.id, (ord) => ({
      ...ord,
      status: newStatus,
      history: [...ord.history, { date: new Date(2026, 8, 7, 14, 30), event: newStatus, initiator: "Селлер" }],
    }));
    showToast(`Заказ отменён: «${newStatus}»`);
  }

  const handleLabel = (o) => {
    if (!o.labelCode) {
      const code = genLabelCode(o);
      updateOrder(o.id, (ord) => ({
        ...ord,
        labelCode: code,
        history: [...ord.history, { date: new Date(2026, 8, 7, 14, 30), event: "Ярлык сформирован", initiator: "Селлер" }],
      }));
    }
    setLabelModalOpen(true);
  };

  function resetFilters() {
    setFilters({ number: "", dateFrom: "", dateTo: "", shipFrom: "", shipTo: "", status: "" });
    setPage(1);
  }

  const hasActiveFilters = !!(filters.number || filters.dateFrom || filters.dateTo || filters.shipFrom || filters.shipTo || filters.status);

  const fieldCls =
    "h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* sidebar */}
      <aside className="w-56 shrink-0 sticky top-0 h-screen overflow-y-auto bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col py-6 px-3">
        <div className="px-3 mb-6 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">Кабинет продавца</div>
        <nav className="space-y-1">
          {[
            { icon: ShoppingCart, label: "Заказы", onClick: () => { setSelectedId(null); setTab("details"); } },
            { icon: Box, label: "Товары" },
            { icon: Truck, label: "Поставщики" },
            { icon: Users, label: "Клиенты" },
            { icon: Settings, label: "Настройки" },
          ].map(({ icon: Icon, label, onClick }) => {
            const active = label === "Заказы";
            return (
              <button
                key={label}
                onClick={onClick}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={17} strokeWidth={2} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto px-3 pt-4 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">{theme === "dark" ? "Тёмная" : "Светлая"} тема</span>
          <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === "light" ? "dark" : "light"))} />
        </div>
      </aside>

      {/* main */}
      <main className="flex-1 min-w-0 px-8 py-7">
        {selectedOrder ? (
          <OrderDetail
            order={selectedOrder}
            tab={tab}
            setTab={setTab}
            onBack={() => { setSelectedId(null); setTab("details"); }}
            onReadyToShip={handleReadyToShip}
            onCancel={handleCancel}
            onLabel={handleLabel}
            labelModalOpen={labelModalOpen}
            onCloseLabel={() => setLabelModalOpen(false)}
            onOpenProduct={() => showToast("Переход на карточку товара…")}
            onOpenPayment={() => showToast("Открытие платёжного поручения…")}
          />
        ) : (
          <>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-5">Заказы</h1>

            <div className="flex items-start gap-3 mb-5">
              <div className="grid grid-cols-4 gap-3 flex-1">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className={`${fieldCls} pl-9`}
                    placeholder="Поиск по номеру заказа"
                    value={filters.number}
                    onChange={(e) => { setFilters((f) => ({ ...f, number: e.target.value })); setPage(1); }}
                  />
                </div>

                <DateRangePicker
                  label="Создан"
                  from={filters.dateFrom}
                  to={filters.dateTo}
                  onApply={(f, t) => { setFilters((s) => ({ ...s, dateFrom: f, dateTo: t })); setPage(1); }}
                />

                <DateRangePicker
                  label="Отгрузка"
                  from={filters.shipFrom}
                  to={filters.shipTo}
                  onApply={(f, t) => { setFilters((s) => ({ ...s, shipFrom: f, shipTo: t })); setPage(1); }}
                />

                <div className="relative">
                  <select
                    className={`${fieldCls} appearance-none pr-8`}
                    value={filters.status}
                    onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
                  >
                    <option value="">Все статусы</option>
                    {STATUS_LIST.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                Сбросить фильтры
              </button>
            </div>

            {/* table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-left text-xs text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-3 font-medium">Номер заказа</th>
                    <th className="px-4 py-3 font-medium">Создан</th>
                    <th className="px-4 py-3 font-medium">Отгрузка</th>
                    <th className="px-4 py-3 font-medium">Статус</th>
                    <th className="px-4 py-3 font-medium text-right">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {pageOrders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedId(o.id)} className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline">
                          №{o.id}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{fmtDateTime(o.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{fmtDate(o.shipDate)}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-100">{fmtSum(o.sum)}</td>
                    </tr>
                  ))}
                  {pageOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500 text-sm">
                        Заказы не найдены
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            <div className="flex items-center justify-between mt-4 text-sm text-slate-500 dark:text-slate-400">
              <span>Найдено заказов: {filtered.length}</span>
              <div className="flex items-center gap-1">
                <button disabled={page === 1} onClick={() => setPage(1)} className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"><ChevronsLeft size={15} /></button>
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"><ChevronLeft size={15} /></button>
                <span className="px-3">{page} из {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"><ChevronRight size={15} /></button>
                <button disabled={page === totalPages} onClick={() => setPage(totalPages)} className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"><ChevronsRight size={15} /></button>
              </div>
            </div>
          </>
        )}
      </main>

      <Toast message={toast} />
    </div>
  );
}

/* ------------------------------ order detail -------------------------------- */

function OrderDetail({ order, tab, setTab, onBack, onReadyToShip, onCancel, onLabel, labelModalOpen, onCloseLabel, onOpenProduct, onOpenPayment }) {
  const canReadyToShip = order.status === "Ожидает подтверждения" || order.status === "Подтверждён";
  const canCancel = !order.status.startsWith("Отменён") && order.status !== "Получен" && order.status !== "В пути";
  const econ = computeEconomics(order.sum, order.status.startsWith("Отменён"));
  const isCancelled = order.status.startsWith("Отменён");
  const settlement = getSettlement(order.status);
  const paymentNo = genPaymentNo(order);
  const contractNo = genContractNo(order);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4">
        <ChevronLeft size={16} /> К списку заказов
      </button>

      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Заказ №{order.id}</h1>
          </div>
          <div className="mt-2"><StatusBadge status={order.status} /></div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => onLabel(order)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Tag size={15} /> Ярлык
          </button>
          <button
            onClick={() => canReadyToShip && onReadyToShip(order)}
            disabled={!canReadyToShip}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium ${
              canReadyToShip ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
            }`}
          >
            <PackageCheck size={15} /> Готов к отгрузке
          </button>
          <button
            onClick={() => canCancel && onCancel(order)}
            disabled={!canCancel}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border ${
              canCancel ? "border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10" : "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed"
            }`}
          >
            <XCircle size={15} /> Отменить
          </button>
        </div>
      </div>

      {/* items */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-left text-xs text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3 font-medium" colSpan={2}>Товар</th>
              <th className="px-4 py-3 font-medium text-right">Кол-во</th>
              <th className="px-4 py-3 font-medium text-right">Цена</th>
              <th className="px-4 py-3 font-medium text-right">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <td className="pl-4 py-3 w-14">
                  <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                    <ImageIcon size={18} />
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <button onClick={onOpenProduct} className="text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400 hover:underline text-left font-medium">
                    {it.name}
                  </button>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Артикул: {it.article}</div>
                </td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{it.qty}</td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{fmtSum(it.price)}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-100">{fmtSum(it.price * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <span className="text-sm text-slate-500 dark:text-slate-400 mr-3">Итого:</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{fmtSum(order.sum)}</span>
        </div>
      </div>

      {/* tabs */}
      <div className="mt-6 border-b border-slate-200 dark:border-slate-800 flex gap-6">
        {[
          { key: "details", label: "Детали" },
          { key: "economics", label: "Экономика заказа" },
          { key: "history", label: "История" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm -mb-px border-b-2 transition-colors ${
              tab === t.key ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 font-medium" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="py-6">
        {tab === "details" && (
          <div className="grid grid-cols-2 gap-x-10 gap-y-4 max-w-2xl text-sm">
            <Field label="Дата заказа" value={fmtDateTime(order.createdAt)} />
            <Field label="Дата отгрузки" value={fmtDate(order.shipDate)} />
            <Field label="Место получения" value={order.pickupPoint} />
            <Field label="Дата доставки" value={order.deliveryDate ? fmtDate(order.deliveryDate) : "—"} />
          </div>
        )}

        {tab === "economics" && (
          <div className="max-w-3xl space-y-8">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Начисления</h3>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 dark:text-slate-500">
                      <th className="px-4 py-2.5 font-normal">Договор {contractNo}</th>
                      <th className="px-4 py-2.5 font-normal">Статус платежа</th>
                      <th className="px-4 py-2.5 font-normal">№ платёжного поручения</th>
                      <th className="px-4 py-2.5 font-normal">Дата выплаты</th>
                      <th className="px-4 py-2.5 font-normal text-right">Сумма начисления</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 font-medium text-slate-800 dark:text-slate-100">
                      <td className="px-4 py-2.5" colSpan={4}>Итого</td>
                      <td className="px-4 py-2.5 text-right">{fmtSum(econ.payout)}</td>
                    </tr>
                    <tr className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-100">Платёж покупателя</td>
                      <td className="px-4 py-3"><StatusDot color={settlement.payoutColor} label={settlement.payoutLabel} /></td>
                      <td className="px-4 py-3">
                        <button onClick={onOpenPayment} className="text-emerald-700 dark:text-emerald-400 hover:underline">{paymentNo}</button>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{settlement.payoutColor === "amber" ? "—" : fmtDate(order.deliveryDate || order.shipDate)}</td>
                      <td className="px-4 py-3 text-right text-slate-800 dark:text-slate-100">{fmtSum(order.sum)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">Услуги маркетплейса</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Их сумма удерживается из платежа покупателя.</p>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 dark:text-slate-500">
                      <th className="px-4 py-2.5 font-normal">Услуги</th>
                      <th className="px-4 py-2.5 font-normal">Статус</th>
                      <th className="px-4 py-2.5 font-normal">№ платёжного поручения</th>
                      <th className="px-4 py-2.5 font-normal">Дата удержания</th>
                      <th className="px-4 py-2.5 font-normal text-right">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 font-medium text-slate-800 dark:text-slate-100">
                      <td className="px-4 py-2.5" colSpan={4}>Итого</td>
                      <td className="px-4 py-2.5 text-right">{fmtSum(econ.totalExpenses)}</td>
                    </tr>
                    {[
                      { label: "Комиссия за товарную категорию", note: isCancelled ? "Не начисляется при отмене заказа" : "12% от суммы заказа", amount: econ.commission },
                      { label: "Эквайринг", note: isCancelled ? "Не начисляется при отмене заказа" : "2,5% от суммы заказа", amount: econ.acquiring },
                      { label: "Логистика", note: isCancelled ? "Не начисляется при отмене заказа" : "6% от суммы заказа", amount: econ.logistics },
                    ].map((row) => (
                      <tr key={row.label} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-4 py-3">
                          <div className="text-slate-800 dark:text-slate-100">{row.label}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">{row.note}</div>
                        </td>
                        <td className="px-4 py-3"><StatusDot color={settlement.serviceColor} label={settlement.serviceLabel} /></td>
                        <td className="px-4 py-3">
                          <button onClick={onOpenPayment} className="text-emerald-700 dark:text-emerald-400 hover:underline">{paymentNo}</button>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{settlement.serviceColor === "amber" ? "—" : fmtDate(order.shipDate)}</td>
                        <td className="px-4 py-3 text-right text-slate-800 dark:text-slate-100">{fmtSum(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">К переводу поставщику после удержаний</span>
              <span className="text-base font-semibold text-emerald-700 dark:text-emerald-400">{fmtSum(econ.payout)}</span>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-left text-xs text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-2.5 font-medium">Дата/время</th>
                  <th className="px-4 py-2.5 font-medium">Событие</th>
                  <th className="px-4 py-2.5 font-medium">Инициатор</th>
                </tr>
              </thead>
              <tbody>
                {order.history.map((h, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDateTime(h.date)}</td>
                    <td className="px-4 py-2.5 text-slate-800 dark:text-slate-100">{h.event}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{h.initiator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {labelModalOpen && <LabelModal order={order} onClose={onCloseLabel} />}
    </div>
  );
}

function LabelModal({ order, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-80 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ярлык СДЭК</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <XCircle size={18} />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <div className="p-2 bg-white border border-slate-100 rounded-lg">
            <QRCodeSVG value={order.labelCode} size={176} fgColor="#0f172a" />
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Номер отправления</div>
          <div className="text-sm font-mono font-medium text-slate-800 dark:text-slate-100 tracking-wide">{order.labelCode}</div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-5 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div>Заказ №{order.id}</div>
          <div>{order.pickupPoint}</div>
          <div>Плановая отгрузка: {fmtDate(order.shipDate)}</div>
        </div>

        <button
          onClick={() => window.print && window.print()}
          className="w-full h-10 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
        >
          Скачать ярлык (PDF)
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">{label}</div>
      <div className="text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  );
}
