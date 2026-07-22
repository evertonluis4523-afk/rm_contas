/* ============================================================
   Meus Gastos — lógica do app (PWA offline, sem dependências)
   Dados salvos localmente no aparelho (localStorage).
   ============================================================ */
"use strict";

/* ---------------- Constantes ---------------- */
const STORE_KEY = "meus-gastos:v1";

const DEFAULT_CATEGORIES = [
  // Despesas
  { id: "alimentacao", name: "Alimentação", icon: "🍽️", color: "#e5484d", type: "expense" },
  { id: "mercado",     name: "Mercado",     icon: "🛒", color: "#f76808", type: "expense" },
  { id: "transporte",  name: "Transporte",  icon: "🚗", color: "#f5a524", type: "expense" },
  { id: "moradia",     name: "Moradia",     icon: "🏠", color: "#0ea5e9", type: "expense" },
  { id: "contas",      name: "Contas",      icon: "🧾", color: "#6366f1", type: "expense" },
  { id: "saude",       name: "Saúde",       icon: "💊", color: "#ec4899", type: "expense" },
  { id: "lazer",       name: "Lazer",       icon: "🎮", color: "#8b5cf6", type: "expense" },
  { id: "educacao",    name: "Educação",    icon: "📚", color: "#14b8a6", type: "expense" },
  { id: "compras",     name: "Compras",     icon: "🛍️", color: "#eab308", type: "expense" },
  { id: "assinaturas", name: "Assinaturas", icon: "📺", color: "#a855f7", type: "expense" },
  { id: "pets",        name: "Pets",        icon: "🐾", color: "#84cc16", type: "expense" },
  { id: "outros",      name: "Outros",      icon: "📦", color: "#64748b", type: "expense" },
  // Receitas
  { id: "salario",     name: "Salário",     icon: "💰", color: "#1a936f", type: "income" },
  { id: "renda_extra", name: "Renda extra", icon: "✨", color: "#12b886", type: "income" },
  { id: "outros_r",    name: "Outros",      icon: "💵", color: "#10b981", type: "income" },
];

const METHODS = ["Pix", "Débito", "Crédito", "Dinheiro", "Boleto", "Transf."];

/* ---------------- Estado ---------------- */
let store = load();
let state = {
  tab: "home",
  viewMonth: monthKey(new Date()), // 'YYYY-MM'
  reportRange: "month",            // month | 6m | year
  editingId: null,
  draft: null,
};

/* ---------------- Persistência ---------------- */
function defaults() {
  return {
    version: 1,
    settings: { theme: "auto", monthlyBudget: null },
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    budgets: {},          // { catId: cents }
    tx: [],               // lançamentos
    recurring: [],        // gastos/receitas fixos
  };
}
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaults();
    const data = JSON.parse(raw);
    const base = defaults();
    return {
      ...base,
      ...data,
      settings: { ...base.settings, ...(data.settings || {}) },
      categories: data.categories && data.categories.length ? data.categories : base.categories,
      budgets: data.budgets || {},
      tx: Array.isArray(data.tx) ? data.tx : [],
      recurring: Array.isArray(data.recurring) ? data.recurring : [],
    };
  } catch (e) {
    return defaults();
  }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {}
}

/* ---------------- Helpers: dinheiro ---------------- */
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
function fmt(cents) { return BRL.format((cents || 0) / 100); }
function fmtShort(cents) {
  const v = (cents || 0) / 100;
  if (Math.abs(v) >= 1000) return "R$ " + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(".", ",") + "k";
  return "R$ " + v.toFixed(0);
}
function parseMoney(str) {
  if (str == null) return 0;
  let s = String(str).replace(/[^\d.,-]/g, "").trim();
  if (!s) return 0;
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = parseFloat(s);
  if (isNaN(n)) return 0;
  return Math.round(n * 100);
}

/* ---------------- Helpers: data ---------------- */
function monthKey(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
function ymd(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function parseDate(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTHS_ABBR = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const WEEK_ABBR = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
function monthTitle(key) { const [y, m] = key.split("-").map(Number); return MONTHS[m - 1] + " " + y; }
function shiftMonth(key, delta) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}
function dayHeading(dateStr) {
  const d = parseDate(dateStr);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return WEEK_ABBR[d.getDay()] + ", " + d.getDate() + " " + MONTHS_ABBR[d.getMonth()];
}

/* ---------------- Helpers: cores / dom ---------------- */
function tint(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function catById(id) { return store.categories.find((c) => c.id === id) || { name: "—", icon: "📦", color: "#64748b", type: "expense" }; }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])); }
const $ = (sel, root = document) => root.querySelector(sel);

/* ---------------- Seleção de dados ---------------- */
function txOfMonth(key) {
  return store.tx.filter((t) => t.date.slice(0, 7) === key).sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0));
}
function sum(list, type) { return list.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0); }
function byCategory(list, type) {
  const map = {};
  list.filter((t) => t.type === type).forEach((t) => { map[t.catId] = (map[t.catId] || 0) + t.amount; });
  return Object.entries(map).map(([catId, amount]) => ({ catId, amount })).sort((a, b) => b.amount - a.amount);
}

/* ============================================================
   RECORRÊNCIA — materializa gastos/receitas fixos do mês atual
   ============================================================ */
function materializeRecurring() {
  const now = new Date();
  const key = monthKey(now);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let changed = false;
  store.recurring.filter((r) => r.active).forEach((r) => {
    const exists = store.tx.some((t) => t.recurringId === r.id && t.date.slice(0, 7) === key);
    if (!exists) {
      const day = Math.min(r.day || 1, lastDay);
      store.tx.push({
        id: uid(), type: r.type, amount: r.amount, catId: r.catId,
        date: key + "-" + String(day).padStart(2, "0"),
        method: r.method, note: r.note, recurringId: r.id, ts: Date.now(),
      });
      changed = true;
    }
  });
  if (changed) save();
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* ============================================================
   RENDER — roteador
   ============================================================ */
function render() {
  $("#monthText").textContent = monthTitle(state.viewMonth);
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", b.dataset.tab === state.tab));
  const view = $("#view");
  if (state.tab === "home") view.innerHTML = viewHome();
  else if (state.tab === "reports") view.innerHTML = viewReports();
  else if (state.tab === "budgets") view.innerHTML = viewBudgets();
  else if (state.tab === "settings") view.innerHTML = viewSettings();
  view.scrollTop = 0;
  window.scrollTo(0, 0);
}

/* ---------------- Tela: Início ---------------- */
function viewHome() {
  const list = txOfMonth(state.viewMonth);
  const spent = sum(list, "expense");
  const income = sum(list, "income");
  const balance = income - spent;
  const budget = store.settings.monthlyBudget;

  let html = "";

  // Card resumo
  html += `<div class="summary">
    <div class="lbl">Gasto em ${esc(monthTitle(state.viewMonth))}</div>
    <div class="big mono">${fmt(spent)}</div>`;

  if (budget && budget > 0) {
    const pct = Math.min(100, Math.round((spent / budget) * 100));
    const cls = spent > budget ? "over" : spent > budget * 0.85 ? "warn" : "";
    html += `<div class="progress ${cls}"><span style="width:${pct}%"></span></div>
      <div class="progress-meta"><span>${pct}% do orçamento</span><span>Limite ${fmt(budget)}</span></div>`;
  }

  html += `<div class="summary-grid">
      <div class="stat"><div class="k"><span class="dot" style="background:var(--income)"></span>Receitas</div><div class="v income mono">${fmt(income)}</div></div>
      <div class="stat"><div class="k"><span class="dot" style="background:${balance >= 0 ? "var(--income)" : "var(--expense)"}"></span>Saldo</div><div class="v mono" style="color:${balance >= 0 ? "var(--income)" : "var(--expense)"}">${fmt(balance)}</div></div>
    </div>
  </div>`;

  // Alertas de cuidado (orçamentos estourados)
  const alerts = budgetAlerts(list).filter((a) => a.level !== "ok").slice(0, 2);
  if (alerts.length) {
    html += `<div class="section-title">Cuidados</div>`;
    alerts.forEach((a) => { html += alertRow(a); });
  }

  // Gastos por categoria (chips)
  const cats = byCategory(list, "expense");
  if (cats.length) {
    html += `<div class="section-title">Por categoria</div><div class="cat-scroll">`;
    cats.forEach(({ catId, amount }) => {
      const c = catById(catId);
      html += `<div class="cat-chip">
        <div class="ic" style="background:${tint(c.color, .16)};color:${c.color}">${c.icon}</div>
        <div class="nm">${esc(c.name)}</div>
        <div class="amt mono">${fmt(amount)}</div>
      </div>`;
    });
    html += `</div>`;
  }

  // Lançamentos
  html += `<div class="section-title row-between"><span>Lançamentos</span><span class="muted" style="text-transform:none;letter-spacing:0">${list.length}</span></div>`;
  if (!list.length) {
    html += emptyState("Nenhum lançamento neste mês", "Toque no + para registrar seu primeiro gasto.");
  } else {
    html += `<div class="tx-list">${renderTxList(list)}</div>`;
  }
  return html;
}

function renderTxList(list) {
  let html = "";
  let curDay = null;
  list.forEach((t) => {
    if (t.date !== curDay) {
      curDay = t.date;
      const dayList = list.filter((x) => x.date === curDay);
      const dayTotal = sum(dayList, "expense");
      html += `<div class="tx-day-head"><span>${esc(dayHeading(curDay))}</span><span class="mono">${dayTotal ? "−" + fmt(dayTotal) : ""}</span></div>`;
    }
    const c = catById(t.catId);
    const sign = t.type === "income" ? "+" : "−";
    html += `<div class="tx" data-edit="${t.id}">
      <div class="ic" style="background:${tint(c.color, .16)};color:${c.color}">${c.icon}</div>
      <div class="mid">
        <div class="t1">${esc(t.note || c.name)}</div>
        <div class="t2"><span>${esc(c.name)}</span>${t.method ? `<span class="pill">${esc(t.method)}</span>` : ""}${t.recurringId ? `<span class="pill">fixo</span>` : ""}</div>
      </div>
      <div class="val ${t.type} mono">${sign} ${fmt(t.amount)}</div>
    </div>`;
  });
  return html;
}

/* ---------------- Tela: Relatórios ---------------- */
function viewReports() {
  const list = txOfMonth(state.viewMonth);
  const spent = sum(list, "expense");
  const cats = byCategory(list, "expense");

  let html = `<div class="seg">
    <button data-range="month" class="${state.reportRange === "month" ? "on" : ""}">Mês</button>
    <button data-range="6m" class="${state.reportRange === "6m" ? "on" : ""}">6 meses</button>
    <button data-range="year" class="${state.reportRange === "year" ? "on" : ""}">Ano</button>
  </div>`;

  if (state.reportRange === "month") {
    // Comparação com mês anterior
    const prevKey = shiftMonth(state.viewMonth, -1);
    const prevSpent = sum(txOfMonth(prevKey), "expense");
    html += `<div class="card pad" style="margin-bottom:14px">
      <div class="row-between">
        <div><div class="lbl muted" style="font-size:12.5px;font-weight:600">Total de despesas</div>
        <div class="big mono" style="font-size:28px;font-weight:800">${fmt(spent)}</div></div>
        ${comparison(spent, prevSpent)}
      </div>
    </div>`;

    // Donut por categoria
    if (cats.length) {
      html += `<div class="section-title">Distribuição por categoria</div>
        <div class="card pad"><div class="donut-wrap">
          ${donut(cats, spent)}
          <div class="legend">${cats.map(({ catId, amount }) => {
            const c = catById(catId);
            const pct = spent ? Math.round((amount / spent) * 100) : 0;
            return `<div class="li"><span class="sw" style="background:${c.color}"></span><span class="ln">${esc(c.name)}</span><span class="lv mono">${fmt(amount)}</span><span class="lp">${pct}%</span></div>`;
          }).join("")}</div>
        </div></div>`;
    } else {
      html += emptyState("Sem despesas neste mês", "Os relatórios aparecem quando houver lançamentos.");
    }

    // Maiores gastos
    const top = list.filter((t) => t.type === "expense").sort((a, b) => b.amount - a.amount).slice(0, 5);
    if (top.length) {
      html += `<div class="section-title">Maiores gastos</div><div class="tx-list">`;
      top.forEach((t) => {
        const c = catById(t.catId);
        html += `<div class="tx" data-edit="${t.id}">
          <div class="ic" style="background:${tint(c.color, .16)};color:${c.color}">${c.icon}</div>
          <div class="mid"><div class="t1">${esc(t.note || c.name)}</div><div class="t2">${esc(dayHeading(t.date))} · ${esc(c.name)}</div></div>
          <div class="val mono">${fmt(t.amount)}</div>
        </div>`;
      });
      html += `</div>`;
    }
  } else {
    // Série mensal (6 ou 12 meses)
    const n = state.reportRange === "6m" ? 6 : 12;
    const series = [];
    for (let i = n - 1; i >= 0; i--) {
      const k = shiftMonth(state.viewMonth, -i);
      series.push({ key: k, expense: sum(txOfMonth(k), "expense"), income: sum(txOfMonth(k), "income") });
    }
    const totalExp = series.reduce((s, m) => s + m.expense, 0);
    const avg = Math.round(totalExp / n);
    html += `<div class="card pad" style="margin-bottom:14px">
      <div class="summary-grid" style="margin-top:0">
        <div class="stat"><div class="k">Total no período</div><div class="v mono">${fmt(totalExp)}</div></div>
        <div class="stat"><div class="k">Média mensal</div><div class="v mono">${fmt(avg)}</div></div>
      </div>
    </div>`;
    html += `<div class="section-title">Evolução das despesas</div><div class="card pad">${bars(series)}</div>`;

    // Categorias acumuladas no período
    const acc = {};
    series.forEach((m) => txOfMonth(m.key).filter((t) => t.type === "expense").forEach((t) => { acc[t.catId] = (acc[t.catId] || 0) + t.amount; }));
    const accList = Object.entries(acc).map(([catId, amount]) => ({ catId, amount })).sort((a, b) => b.amount - a.amount);
    if (accList.length) {
      html += `<div class="section-title">Categorias no período</div><div class="card pad"><div class="legend">`;
      accList.forEach(({ catId, amount }) => {
        const c = catById(catId);
        const pct = totalExp ? Math.round((amount / totalExp) * 100) : 0;
        html += `<div class="li"><span class="sw" style="background:${c.color}"></span><span class="ln">${esc(c.name)}</span><span class="lv mono">${fmt(amount)}</span><span class="lp">${pct}%</span></div>`;
      });
      html += `</div></div>`;
    }
  }

  // Exportar
  html += `<div class="mt-16"><button class="btn ghost" data-action="export"><svg viewBox="0 0 24 24"><path d="M12 3v13"/><path d="M7 12l5 5 5-5"/><path d="M5 21h14"/></svg>Exportar dados (JSON)</button></div>`;
  return html;
}

function comparison(cur, prev) {
  if (!prev) return `<span class="muted" style="font-size:12.5px">sem base anterior</span>`;
  const diff = cur - prev;
  const pct = Math.round((diff / prev) * 100);
  if (diff === 0) return `<span class="compare"><span class="tag" style="background:var(--surface-2);color:var(--ink-2)">0%</span></span>`;
  const up = diff > 0;
  return `<span class="compare"><span class="tag ${up ? "up" : "down"}">
    <svg viewBox="0 0 24 24">${up ? '<path d="M7 17L17 7"/><path d="M9 7h8v8"/>' : '<path d="M7 7l10 10"/><path d="M17 15V7h-8"/>'}</svg>
    ${Math.abs(pct)}%</span></span>`;
}

/* Gráfico donut (SVG) */
function donut(cats, total) {
  const r = 58, c = 2 * Math.PI * r, cx = 75, cy = 75;
  let off = 0;
  const segs = cats.map(({ catId, amount }) => {
    const cat = catById(catId);
    const frac = total ? amount / total : 0;
    const dash = frac * c;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${cat.color}" stroke-width="16"
      stroke-dasharray="${dash.toFixed(2)} ${(c - dash).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt"/>`;
    off += dash;
    return seg;
  }).join("");
  return `<div class="donut">
    <svg viewBox="0 0 150 150" width="150" height="150">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="16"/>
      ${segs}
    </svg>
    <div class="center"><div class="c1">${cats.length} categorias</div><div class="c2 mono">${fmtShort(total)}</div></div>
  </div>`;
}

/* Gráfico de barras mensais */
function bars(series) {
  const max = Math.max(1, ...series.map((m) => m.expense));
  const curKey = monthKey(new Date());
  return `<div class="bars">${series.map((m) => {
    const h = Math.round((m.expense / max) * 100);
    const [, mm] = m.key.split("-").map(Number);
    return `<div class="b ${m.key === curKey ? "cur" : ""}">
      <div class="bv">${m.expense ? fmtShort(m.expense).replace("R$ ", "") : ""}</div>
      <div class="col" style="height:${Math.max(2, h)}%"></div>
      <div class="bl">${MONTHS_ABBR[mm - 1]}</div>
    </div>`;
  }).join("")}</div>`;
}

/* ---------------- Tela: Cuidados / Orçamentos ---------------- */
function viewBudgets() {
  const list = txOfMonth(state.viewMonth);
  const spent = sum(list, "expense");
  const budget = store.settings.monthlyBudget;
  let html = "";

  // Orçamento geral do mês
  html += `<div class="section-title">Orçamento do mês</div>`;
  if (budget && budget > 0) {
    const pct = Math.min(100, Math.round((spent / budget) * 100));
    const cls = spent > budget ? "over" : spent > budget * 0.85 ? "warn" : "";
    const restante = budget - spent;
    html += `<div class="summary">
      <div class="row-between"><div class="lbl">Limite mensal</div><button class="edit-b" data-action="set-monthly" style="color:var(--accent);font-weight:700;font-size:12.5px">Editar</button></div>
      <div class="big mono" style="font-size:26px">${fmt(budget)}</div>
      <div class="progress ${cls}"><span style="width:${pct}%"></span></div>
      <div class="progress-meta"><span>Gasto ${fmt(spent)} · ${pct}%</span><span style="color:${restante < 0 ? "var(--expense)" : "var(--income)"}">${restante < 0 ? "Excedeu " + fmt(-restante) : "Resta " + fmt(restante)}</span></div>
    </div>`;
  } else {
    html += `<div class="card pad center">
      <p class="muted" style="margin:0 0 12px">Defina um limite mensal para acompanhar seus gastos e receber alertas.</p>
      <button class="btn primary" data-action="set-monthly" style="width:auto;margin:0 auto"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Definir limite</button>
    </div>`;
  }

  // Alertas
  const alerts = budgetAlerts(list);
  const active = alerts.filter((a) => a.level !== "ok");
  if (active.length) {
    html += `<div class="section-title">Alertas</div>`;
    active.forEach((a) => { html += alertRow(a); });
  }

  // Orçamentos por categoria
  html += `<div class="section-title row-between"><span>Limites por categoria</span></div>`;
  html += `<div class="list">`;
  const expenseCats = store.categories.filter((c) => c.type === "expense");
  expenseCats.forEach((c) => {
    const gasto = list.filter((t) => t.type === "expense" && t.catId === c.id).reduce((s, t) => s + t.amount, 0);
    const lim = store.budgets[c.id];
    let barHtml = "";
    if (lim && lim > 0) {
      const pct = Math.min(100, Math.round((gasto / lim) * 100));
      const cls = gasto > lim ? "over" : gasto > lim * 0.85 ? "warn" : "";
      barHtml = `<div class="progress ${cls}" style="margin-top:0"><span style="width:${pct}%"></span></div>`;
    }
    html += `<div class="budget-item" data-action="set-cat" data-cat="${c.id}">
      <div class="bh">
        <div class="ic" style="background:${tint(c.color, .16)};color:${c.color}">${c.icon}</div>
        <div class="nm">${esc(c.name)}</div>
        <div class="vals">${lim && lim > 0 ? `<b class="mono">${fmt(gasto)}</b> / ${fmt(lim)}` : `<span class="edit-b">Definir limite</span>`}</div>
      </div>
      ${barHtml}
    </div>`;
  });
  html += `</div>`;

  // Gastos fixos (recorrentes)
  html += `<div class="section-title">Gastos fixos (todo mês)</div>`;
  if (!store.recurring.length) {
    html += `<div class="card pad center muted" style="font-size:13.5px">Marque "Repetir todo mês" ao criar um lançamento para cadastrar contas fixas (aluguel, assinaturas...).</div>`;
  } else {
    html += `<div class="list">`;
    store.recurring.forEach((r) => {
      const c = catById(r.catId);
      html += `<div class="list-item">
        <div class="li-ic" style="background:${tint(c.color, .16)}"><span style="font-size:16px">${c.icon}</span></div>
        <div class="li-mid"><div class="li-t">${esc(r.note || c.name)}</div><div class="li-s">${esc(c.name)} · dia ${r.day} · ${r.type === "income" ? "receita" : "despesa"}</div></div>
        <div class="mono" style="font-weight:700;margin-right:6px">${fmt(r.amount)}</div>
        <button class="icon-btn" data-action="del-recurring" data-id="${r.id}" aria-label="Remover"><svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/></svg></button>
      </div>`;
    });
    html += `</div>`;
  }
  return html;
}

function budgetAlerts(list) {
  const alerts = [];
  const budget = store.settings.monthlyBudget;
  const spent = sum(list, "expense");
  if (budget && budget > 0) {
    if (spent > budget) alerts.push({ level: "over", title: "Orçamento do mês estourado", desc: `Você excedeu ${fmt(spent - budget)} do limite de ${fmt(budget)}.` });
    else if (spent > budget * 0.85) alerts.push({ level: "warn", title: "Perto do limite mensal", desc: `Restam apenas ${fmt(budget - spent)} do seu orçamento.` });
  }
  store.categories.filter((c) => c.type === "expense").forEach((c) => {
    const lim = store.budgets[c.id];
    if (!lim || lim <= 0) return;
    const g = list.filter((t) => t.type === "expense" && t.catId === c.id).reduce((s, t) => s + t.amount, 0);
    if (g > lim) alerts.push({ level: "over", title: `${c.name}: limite excedido`, desc: `${fmt(g)} de ${fmt(lim)} (${Math.round((g / lim) * 100)}%).` });
    else if (g > lim * 0.85) alerts.push({ level: "warn", title: `${c.name}: quase no limite`, desc: `${fmt(g)} de ${fmt(lim)} (${Math.round((g / lim) * 100)}%).` });
  });
  if (!alerts.length) alerts.push({ level: "ok", title: "Tudo sob controle", desc: "Seus gastos estão dentro dos limites definidos." });
  return alerts;
}
function alertRow(a) {
  const icons = {
    over: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
    warn: '<path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="9"/>',
    ok: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
  };
  return `<div class="alert ${a.level}">
    <svg class="ai" viewBox="0 0 24 24">${icons[a.level]}</svg>
    <div class="at"><b>${esc(a.title)}</b><br>${esc(a.desc)}</div>
  </div>`;
}

/* ---------------- Tela: Ajustes ---------------- */
function viewSettings() {
  const t = store.settings.theme;
  const count = store.tx.length;
  const first = store.tx.length ? store.tx.reduce((min, x) => x.date < min ? x.date : min, store.tx[0].date) : null;
  let html = "";

  html += `<div class="section-title">Aparência</div>
  <div class="list">
    <div class="list-item"><div class="li-ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></svg></div>
      <div class="li-mid"><div class="li-t">Tema</div><div class="li-s">Claro, escuro ou automático</div></div></div>
    <div class="list-item" style="padding-top:0"><div class="seg" style="margin:0;width:100%">
      <button data-theme-set="auto" class="${t === "auto" ? "on" : ""}">Auto</button>
      <button data-theme-set="light" class="${t === "light" ? "on" : ""}">Claro</button>
      <button data-theme-set="dark" class="${t === "dark" ? "on" : ""}">Escuro</button>
    </div></div>
  </div>`;

  html += `<div class="section-title">Orçamento</div>
  <div class="list">
    <div class="list-item" data-action="set-monthly">
      <div class="li-ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
      <div class="li-mid"><div class="li-t">Limite mensal</div><div class="li-s">${store.settings.monthlyBudget ? fmt(store.settings.monthlyBudget) : "Não definido"}</div></div>
      <div class="li-r"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></div>
    </div>
  </div>`;

  html += `<div class="section-title">Dados</div>
  <div class="list">
    <div class="list-item" data-action="export">
      <div class="li-ic"><svg viewBox="0 0 24 24"><path d="M12 3v13"/><path d="M7 12l5 5 5-5"/><path d="M5 21h14"/></svg></div>
      <div class="li-mid"><div class="li-t">Exportar backup</div><div class="li-s">${count} lançamento(s) em arquivo JSON</div></div>
      <div class="li-r"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></div>
    </div>
    <div class="list-item" data-action="import">
      <div class="li-ic"><svg viewBox="0 0 24 24"><path d="M12 21V8"/><path d="M7 12l5-5 5 5"/><path d="M5 3h14"/></svg></div>
      <div class="li-mid"><div class="li-t">Importar backup</div><div class="li-s">Restaurar de um arquivo JSON</div></div>
      <div class="li-r"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></div>
    </div>
    <div class="list-item" data-action="clear">
      <div class="li-ic"><svg viewBox="0 0 24 24" style="color:var(--expense)"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/></svg></div>
      <div class="li-mid"><div class="li-t" style="color:var(--expense)">Apagar tudo</div><div class="li-s">Remove todos os dados do aparelho</div></div>
    </div>
  </div>`;

  html += `<div class="section-title">Sobre</div>
  <div class="card pad muted" style="font-size:13px">
    <b style="color:var(--ink)">Meus Gastos</b> — controle de gastos mensais.<br>
    Todos os dados ficam salvos apenas neste aparelho, sem servidor ou internet.
    ${first ? `<br>Histórico desde ${esc(dayHeading(first) === "Hoje" || dayHeading(first) === "Ontem" ? monthTitle(first.slice(0, 7)) : monthTitle(first.slice(0, 7)))}.` : ""}
  </div>
  <input type="file" id="importFile" accept="application/json,.json" class="hidden">`;
  return html;
}

/* ---------------- Empty state ---------------- */
function emptyState(title, sub) {
  return `<div class="empty">
    <div class="em-ic"><svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 11h18"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>
    <h3>${esc(title)}</h3><p>${esc(sub)}</p>
  </div>`;
}

/* ============================================================
   BOTTOM SHEET — novo/editar lançamento
   ============================================================ */
function openTxSheet(editId) {
  let d;
  if (editId) {
    const t = store.tx.find((x) => x.id === editId);
    if (!t) return;
    d = { type: t.type, amount: t.amount, catId: t.catId, date: t.date, method: t.method || "", note: t.note || "", recurring: !!t.recurringId, id: t.id };
  } else {
    d = { type: "expense", amount: 0, catId: null, date: ymd(new Date()), method: "", note: "", recurring: false, id: null };
  }
  state.draft = d;
  renderTxSheet();
  showSheet();
}

function renderTxSheet() {
  const d = state.draft;
  const cats = store.categories.filter((c) => c.type === d.type);
  const amountStr = d.amount ? (d.amount / 100).toFixed(2).replace(".", ",") : "";

  const html = `<div class="bsheet">
    <div class="grab"></div>
    <div class="sheet-head">
      <h2>${d.id ? "Editar lançamento" : "Novo lançamento"}</h2>
      <button class="icon-btn" data-sheet="close" aria-label="Fechar"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
    </div>

    <div class="type-toggle">
      <button data-type="expense" class="${d.type === "expense" ? "on-expense" : ""}">Despesa</button>
      <button data-type="income" class="${d.type === "income" ? "on-income" : ""}">Receita</button>
    </div>

    <div class="amount-field">
      <span class="cur">R$</span>
      <input id="amountInput" class="${d.type}" inputmode="decimal" placeholder="0,00" value="${esc(amountStr)}" autocomplete="off">
    </div>

    <div class="field">
      <label>Categoria</label>
      <div class="cat-grid" id="catGrid">
        ${cats.map((c) => `<button class="cat-opt ${d.catId === c.id ? "on" : ""}" data-cat="${c.id}">
          <span class="ic" style="background:${tint(c.color, .16)};color:${c.color}">${c.icon}</span>
          <span class="nm">${esc(c.name)}</span>
        </button>`).join("")}
      </div>
    </div>

    <div class="field">
      <label>Data</label>
      <input type="date" class="input" id="dateInput" value="${esc(d.date)}">
    </div>

    <div class="field">
      <label>Forma de pagamento</label>
      <div class="chips" id="methodChips">
        ${METHODS.map((m) => `<button class="chip ${d.method === m ? "on" : ""}" data-method="${esc(m)}">${esc(m)}</button>`).join("")}
      </div>
    </div>

    <div class="field">
      <label>Descrição <span class="muted" style="font-weight:400">(opcional)</span></label>
      <textarea class="input" id="noteInput" placeholder="Ex.: Almoço, mercado da semana..." rows="2">${esc(d.note)}</textarea>
    </div>

    <div class="field">
      <div class="list-item" style="border:1px solid var(--line);border-radius:12px;padding:12px 14px" data-toggle="recurring">
        <div class="li-mid"><div class="li-t">Repetir todo mês</div><div class="li-s">Cria automaticamente como conta fixa</div></div>
        <div class="switch ${d.recurring ? "on" : ""}" id="recurringSwitch"></div>
      </div>
    </div>

    <div class="sheet-actions">
      ${d.id ? `<button class="btn danger" data-sheet="delete" style="flex:0 0 52px"><svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/></svg></button>` : ""}
      <button class="btn primary" data-sheet="save">${d.id ? "Salvar alterações" : "Adicionar"}</button>
    </div>
  </div>`;
  $("#sheetHost").innerHTML = html;
}

/* ---------------- Sheet genérico (input) ---------------- */
function openInputSheet({ title, label, placeholder, value, allowClear, onSave }) {
  const html = `<div class="bsheet">
    <div class="grab"></div>
    <div class="sheet-head"><h2>${esc(title)}</h2>
      <button class="icon-btn" data-sheet="close"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
    <div class="field"><label>${esc(label)}</label>
      <div class="amount-field" style="padding:0"><span class="cur">R$</span>
      <input id="genInput" class="expense" inputmode="decimal" placeholder="${esc(placeholder || "0,00")}" value="${esc(value || "")}" style="font-size:38px;color:var(--ink)"></div>
    </div>
    <div class="sheet-actions">
      ${allowClear ? `<button class="btn ghost" data-gen="clear">Remover</button>` : ""}
      <button class="btn primary" data-gen="save">Salvar</button>
    </div>
  </div>`;
  $("#sheetHost").innerHTML = html;
  showSheet();
  setTimeout(() => { const i = $("#genInput"); if (i) i.focus(); }, 120);
  $("#sheetHost")._onSave = onSave;
}

/* ============================================================
   SHEET host — abrir/fechar
   ============================================================ */
function showSheet() { $("#scrim").hidden = false; document.body.style.overflow = "hidden"; }
function closeSheet() {
  $("#sheetHost").innerHTML = "";
  $("#sheetHost")._onSave = null;
  $("#scrim").hidden = true;
  document.body.style.overflow = "";
}

/* ============================================================
   TOAST
   ============================================================ */
let toastTimer = null;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
}

/* ============================================================
   AÇÕES
   ============================================================ */
function saveTxFromSheet() {
  const d = state.draft;
  const amount = parseMoney($("#amountInput").value);
  if (!amount || amount <= 0) { toast("Informe um valor"); return; }
  if (!d.catId) { toast("Escolha uma categoria"); return; }
  const date = $("#dateInput").value || ymd(new Date());
  const note = $("#noteInput").value.trim();
  const method = d.method;
  const recurring = d.recurring;

  if (d.id) {
    const t = store.tx.find((x) => x.id === d.id);
    Object.assign(t, { type: d.type, amount, catId: d.catId, date, note, method });
    // ajuste da recorrência associada
    if (recurring && !t.recurringId) {
      const rid = uid();
      t.recurringId = rid;
      store.recurring.push({ id: rid, type: d.type, amount, catId: d.catId, day: parseDate(date).getDate(), method, note, active: true });
    } else if (recurring && t.recurringId) {
      const r = store.recurring.find((x) => x.id === t.recurringId);
      if (r) Object.assign(r, { type: d.type, amount, catId: d.catId, day: parseDate(date).getDate(), method, note });
    } else if (!recurring && t.recurringId) {
      store.recurring = store.recurring.filter((x) => x.id !== t.recurringId);
      delete t.recurringId;
    }
    toast("Lançamento atualizado");
  } else {
    const tx = { id: uid(), type: d.type, amount, catId: d.catId, date, note, method, ts: Date.now() };
    if (recurring) {
      const rid = uid();
      tx.recurringId = rid;
      store.recurring.push({ id: rid, type: d.type, amount, catId: d.catId, day: parseDate(date).getDate(), method, note, active: true });
    }
    store.tx.push(tx);
    toast(d.type === "income" ? "Receita adicionada" : "Gasto registrado");
  }
  save();
  closeSheet();
  render();
}

function deleteTx(id) {
  store.tx = store.tx.filter((t) => t.id !== id);
  save(); closeSheet(); render(); toast("Lançamento removido");
}

function setMonthlyBudget() {
  const cur = store.settings.monthlyBudget;
  openInputSheet({
    title: "Limite mensal", label: "Quanto pretende gastar por mês?",
    value: cur ? (cur / 100).toFixed(2).replace(".", ",") : "", allowClear: !!cur,
    onSave: (raw, clear) => {
      store.settings.monthlyBudget = clear ? null : (parseMoney(raw) || null);
      save(); render(); toast(clear ? "Limite removido" : "Limite definido");
    },
  });
}
function setCatBudget(catId) {
  const c = catById(catId);
  const cur = store.budgets[catId];
  openInputSheet({
    title: "Limite: " + c.name, label: "Limite mensal para " + c.name,
    value: cur ? (cur / 100).toFixed(2).replace(".", ",") : "", allowClear: !!cur,
    onSave: (raw, clear) => {
      if (clear) delete store.budgets[catId];
      else { const v = parseMoney(raw); if (v > 0) store.budgets[catId] = v; else delete store.budgets[catId]; }
      save(); render(); toast(clear ? "Limite removido" : "Limite definido");
    },
  });
}

function exportData() {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "meus-gastos-" + ymd(new Date()) + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Backup exportado");
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.tx)) throw new Error("inválido");
      const base = defaults();
      store = { ...base, ...data, settings: { ...base.settings, ...(data.settings || {}) },
        categories: data.categories && data.categories.length ? data.categories : base.categories,
        budgets: data.budgets || {}, tx: data.tx, recurring: data.recurring || [] };
      save(); applyTheme(); render(); toast("Backup importado");
    } catch (e) { toast("Arquivo inválido"); }
  };
  reader.readAsText(file);
}
function clearAll() {
  if (!confirm("Apagar TODOS os dados? Esta ação não pode ser desfeita.\n\nDica: exporte um backup antes.")) return;
  store = defaults(); save(); applyTheme(); render(); toast("Todos os dados foram apagados");
}

/* ---------------- Tema ---------------- */
function applyTheme() {
  const t = store.settings.theme;
  if (t === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
}

/* ============================================================
   EVENTOS
   ============================================================ */
// Navegação de mês
$("#prevMonth").addEventListener("click", () => { state.viewMonth = shiftMonth(state.viewMonth, -1); render(); });
$("#nextMonth").addEventListener("click", () => { state.viewMonth = shiftMonth(state.viewMonth, 1); render(); });
$("#monthLabel").addEventListener("click", () => { state.viewMonth = monthKey(new Date()); render(); toast("Mês atual"); });

// Tabs
$("#tabbar").addEventListener("click", (e) => {
  const b = e.target.closest(".tab"); if (!b) return;
  state.tab = b.dataset.tab; render();
});

// FAB
$("#fab").addEventListener("click", () => openTxSheet(null));

// Cliques dentro da view (delegação)
$("#view").addEventListener("click", (e) => {
  const edit = e.target.closest("[data-edit]");
  if (edit) { openTxSheet(edit.dataset.edit); return; }

  const range = e.target.closest("[data-range]");
  if (range) { state.reportRange = range.dataset.range; render(); return; }

  const themeSet = e.target.closest("[data-theme-set]");
  if (themeSet) { store.settings.theme = themeSet.dataset.themeSet; save(); applyTheme(); render(); return; }

  const delRec = e.target.closest("[data-action='del-recurring']");
  if (delRec) { store.recurring = store.recurring.filter((r) => r.id !== delRec.dataset.id); save(); render(); toast("Gasto fixo removido"); return; }

  const catBudget = e.target.closest("[data-action='set-cat']");
  if (catBudget) { setCatBudget(catBudget.dataset.cat); return; }

  const act = e.target.closest("[data-action]");
  if (act) {
    const a = act.dataset.action;
    if (a === "set-monthly") setMonthlyBudget();
    else if (a === "export") exportData();
    else if (a === "clear") clearAll();
    else if (a === "import") { const f = $("#importFile"); if (f) f.click(); }
    return;
  }
});

// Input de importação (delegado no document, pois é recriado)
document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "importFile" && e.target.files[0]) importData(e.target.files[0]);
});

// Scrim fecha sheet
$("#scrim").addEventListener("click", closeSheet);

// Eventos dentro do sheet host (delegação)
$("#sheetHost").addEventListener("click", (e) => {
  const host = $("#sheetHost");

  // Sheet genérico (orçamentos)
  const gen = e.target.closest("[data-gen]");
  if (gen) {
    if (gen.dataset.gen === "clear") { if (host._onSave) host._onSave("", true); closeSheet(); }
    else { const v = $("#genInput") ? $("#genInput").value : ""; if (host._onSave) host._onSave(v, false); closeSheet(); }
    return;
  }

  if (e.target.closest("[data-sheet='close']")) { closeSheet(); return; }
  if (e.target.closest("[data-sheet='save']")) { saveTxFromSheet(); return; }
  if (e.target.closest("[data-sheet='delete']")) {
    if (confirm("Remover este lançamento?")) deleteTx(state.draft.id);
    return;
  }

  const type = e.target.closest("[data-type]");
  if (type) {
    state.draft.type = type.dataset.type;
    // se categoria não pertence ao novo tipo, limpa
    const c = state.draft.catId ? catById(state.draft.catId) : null;
    if (!c || c.type !== state.draft.type) state.draft.catId = null;
    // preserva valor digitado
    const cur = $("#amountInput"); if (cur) state.draft.amount = parseMoney(cur.value);
    renderTxSheet();
    return;
  }

  const cat = e.target.closest("[data-cat]");
  if (cat) {
    state.draft.catId = cat.dataset.cat;
    const cur = $("#amountInput"); if (cur) state.draft.amount = parseMoney(cur.value);
    state.draft.note = $("#noteInput") ? $("#noteInput").value : state.draft.note;
    state.draft.date = $("#dateInput") ? $("#dateInput").value : state.draft.date;
    renderTxSheet();
    return;
  }

  const method = e.target.closest("[data-method]");
  if (method) {
    const m = method.dataset.method;
    state.draft.method = state.draft.method === m ? "" : m;
    const cur = $("#amountInput"); if (cur) state.draft.amount = parseMoney(cur.value);
    state.draft.note = $("#noteInput") ? $("#noteInput").value : state.draft.note;
    state.draft.date = $("#dateInput") ? $("#dateInput").value : state.draft.date;
    renderTxSheet();
    return;
  }

  if (e.target.closest("[data-toggle='recurring']")) {
    state.draft.recurring = !state.draft.recurring;
    const cur = $("#amountInput"); if (cur) state.draft.amount = parseMoney(cur.value);
    state.draft.note = $("#noteInput") ? $("#noteInput").value : state.draft.note;
    state.draft.date = $("#dateInput") ? $("#dateInput").value : state.draft.date;
    renderTxSheet();
    return;
  }
});

/* ============================================================
   INIT
   ============================================================ */
function init() {
  applyTheme();
  materializeRecurring();
  render();
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
}
init();
