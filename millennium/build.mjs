// Generates millennium/index.html.
//
// The app is built so every control works with CSS alone — hidden radios and
// checkboxes drive tab switching, the Add button, row deletion, the currency
// symbol and the toggle switches. JavaScript is a progressive enhancement that
// only adds number formatting, saving and toasts. Some preview panes refuse to
// run scripts; there the app still works.

import { writeFileSync } from "node:fs";

const SLOTS = 12;          // blank rows the Add button can reveal
const DEFAULTS = [
  { name: "Salary — Northwind Ltd", meta: "Incoming transfer", num: "3\u00a0200,00", inbound: true },
  { name: "Carrefour",              meta: "Groceries",         num: "48,20",    inbound: false },
  { name: "Spotify",                meta: "Subscription",      num: "10,99",    inbound: false },
  { name: "Uber",                   meta: "Transport",         num: "14,60",    inbound: false, day: "Yesterday" },
  { name: "Ana Ribeiro",            meta: "Split — dinner",    num: "26,00",    inbound: true,  day: "Yesterday" },
  { name: "Apple",                  meta: "iCloud storage",    num: "2,99",     inbound: false, day: "Yesterday" }
];

const CURRENCIES = [
  { id: "eur", sym: "€",   label: "Euro" },
  { id: "usd", sym: "$",   label: "US dollar" },
  { id: "gbp", sym: "£",   label: "Pound" },
  { id: "chf", sym: "CHF", label: "Franc" },
  { id: "pln", sym: "zł",  label: "Złoty" }
];

const initials = (s) => {
  const parts = s.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (!parts.length) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0]).toUpperCase();
};

const icon = (paths, extra = "") =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"${extra}>${paths.map((d) => `<path d="${d}"/>`).join("")}</svg>`;

const ICONS = {
  up:       ["M12 19V5", "m5 12 7-7 7 7"],
  down:     ["M12 5v14", "m19 12-7 7-7-7"],
  card:     ["M2 7.5A2.5 2.5 0 0 1 4.5 5h15A2.5 2.5 0 0 1 22 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 16.5Z", "M2 10h20"],
  swap:     ["M3 8h14l-3-3", "M21 16H7l3 3"],
  home:     ["m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"],
  bell:     ["M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8", "M13.7 21a2 2 0 0 1-3.4 0"],
  person:   ["M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z", "M4 21c0-4 3.5-6 8-6s8 2 8 6"],
  plus:     ["M12 5v14", "M5 12h14"],
  reset:    ["M3 12a9 9 0 1 0 3-6.7", "M3 4v5h5"],
  lock:     ["M6 11h12v9H6Z", "M9 11V8a3 3 0 0 1 6 0v3"],
  wifi:     ["M5 12a10 10 0 0 1 14 0", "M8.5 15.5a5 5 0 0 1 7 0", "M12 19h.01"],
  globe:    ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M3 12h18", "M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"],
  calendar: ["M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z", "M4 10h16", "M8 3v4", "M16 3v4"],
  euro:     ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M15 9.2a3.4 3.4 0 0 0-2.8-1.4c-2.4 0-3.9 1.8-3.9 4.2s1.5 4.2 3.9 4.2A3.4 3.4 0 0 0 15 14.8", "M7.4 11.2h4.4", "M7.4 13.6h4.4"],
  shield:   ["M12 3 5 6v6c0 4.2 2.8 7.6 7 9 4.2-1.4 7-4.8 7-9V6Z"],
  face:     ["M4 8V6a2 2 0 0 1 2-2h2", "M16 4h2a2 2 0 0 1 2 2v2", "M20 16v2a2 2 0 0 1-2 2h-2", "M8 20H6a2 2 0 0 1-2-2v-2", "M9 10v1.5", "M15 10v1.5", "M9.5 15a3.5 3.5 0 0 0 5 0"]
};

/* ---------- rows ---------- */

// `n` is the row's global index; slot rows start hidden until their checkbox is on.
function txRow(n, { name, meta, num, inbound, slot }) {
  return `
        <div class="tx r-${n}${slot ? " is-slot" : ""}">
          <span class="tx-avatar${inbound ? " in" : ""}" data-k="av-${n}">${initials(name)}</span>
          <span class="tx-body">
            <span class="tx-name" contenteditable="true" spellcheck="false" data-k="nm-${n}">${name}</span>
            <span class="tx-meta" contenteditable="true" spellcheck="false" data-k="mt-${n}">${meta}</span>
          </span>
          <span class="tx-amt${inbound ? " in" : ""}">
            <button type="button" class="tx-sign" data-k="sg-${n}" title="Switch between money in and out">${inbound ? "+" : "−"}</button><span class="cur"></span><span class="tx-num" contenteditable="true" spellcheck="false" inputmode="text" data-k="am-${n}">${num}</span>
          </span>
          <label class="tx-del" for="del-${n}" title="Remove"><span aria-hidden="true">×</span><span class="sr-only">Remove transaction</span></label>
        </div>`;
}

function ledger() {
  const today = DEFAULTS.filter((d) => !d.day);
  const yest = DEFAULTS.filter((d) => d.day === "Yesterday");
  const slots = Array.from({ length: SLOTS }, (_, i) =>
    txRow(DEFAULTS.length + i + 1, { name: "New payment", meta: "Tap to edit", num: "0,00", inbound: false, slot: true })
  );

  return `
      <p class="day-label">Today</p>
      <div class="ledger">${slots.join("")}${today.map((d, i) => txRow(i + 1, d)).join("")}
      </div>
      <p class="day-label">Yesterday</p>
      <div class="ledger">${yest.map((d, i) => txRow(today.length + i + 1, d)).join("")}
      </div>`;
}

/* ---------- generated state rules ---------- */

function stateRules() {
  const out = [];
  out.push("/* Reveal a blank row when its slot is switched on. */");
  for (let i = 1; i <= SLOTS; i++) {
    out.push(`  #slot-${i}:checked ~ main .r-${DEFAULTS.length + i} { display: flex; }`);
  }
  out.push("");
  out.push("  /* Exactly one Add label shows at a time — stacking translucent copies");
  out.push("     would pile their backgrounds into a solid block. Each press hides the");
  out.push("     current label and reveals the next, so these hide rules come after. */");
  for (let i = 1; i < SLOTS; i++) {
    out.push(`  #slot-${i}:checked ~ main label[for="slot-${i + 1}"] { display: inline-flex; }`);
  }
  out.push("");
  for (let i = 1; i <= SLOTS; i++) {
    out.push(`  #slot-${i}:checked ~ main label[for="slot-${i}"] { display: none; }`);
  }
  out.push("");
  out.push("  /* Deleting wins over revealing, so these rules come last. */");
  for (let i = 1; i <= DEFAULTS.length + SLOTS; i++) {
    out.push(`  #del-${i}:checked ~ main .r-${i} { display: none; }`);
  }
  out.push("");
  out.push("  /* The currency symbol is drawn from CSS so one radio changes them all. */");
  for (const c of CURRENCIES) {
    out.push(`  #cur-${c.id}:checked ~ main .cur::after, #cur-${c.id}:checked ~ main .cur-lg::after { content: "${c.sym}"; }`);
  }
  return out.join("\n");
}

function tabRules() {
  const tabs = ["home", "cards", "pay", "you"];
  return tabs
    .map(
      (t) =>
        `  #tab-${t}:checked ~ main .screen-${t} { display: block; }\n` +
        `  #tab-${t}:checked ~ .nav label[for="tab-${t}"] { color: var(--gold); }\n` +
        `  #tab-${t}:focus-visible ~ .nav label[for="tab-${t}"] { outline: 2px solid var(--gold); outline-offset: 3px; }`
    )
    .join("\n");
}

function actRules() {
  return ["transfer", "request", "pay", "swap"]
    .map(
      (a) =>
        `  #act-${a}:checked ~ main .sheet-${a} { display: flex; }\n` +
        `  #act-${a}:checked ~ main label[for="act-${a}"] { border-color: rgba(233,199,132,.5); background: rgba(233,199,132,.1); }`
    )
    .join("\n");
}

/* ---------- pieces ---------- */

const action = (id, label, ico) => `
        <label class="action" for="act-${id}">
          ${icon(ICONS[ico])}
          <span>${label}</span>
        </label>`;

const sheet = (id, title, body) => `
      <div class="sheet sheet-${id}">
        <div class="sheet-body">
          <p class="sheet-title">${title}</p>
          <p class="sheet-text">${body}</p>
        </div>
        <label class="sheet-close" for="act-none" title="Close"><span aria-hidden="true">×</span><span class="sr-only">Close</span></label>
      </div>`;

const bar = (label, pct, amount, tone) => `
        <div class="bar-row">
          <div class="bar-head">
            <span class="bar-name">${label}</span>
            <span class="bar-val"><span class="cur"></span>${amount}</span>
          </div>
          <div class="bar-track"><span class="bar-fill${tone ? " " + tone : ""}" style="width:${pct}%"></span></div>
        </div>`;

const toggle = (id, label, note, on) => `
        <label class="switch">
          <input type="checkbox" id="${id}" data-k="${id}"${on ? " checked" : ""} />
          <span class="switch-text">
            <span class="switch-label">${label}</span>
            <span class="switch-note">${note}</span>
          </span>
          <span class="track" aria-hidden="true"><span class="knob"></span></span>
        </label>`;

const person = (name, note) => `
        <div class="person">
          <span class="person-av">${initials(name)}</span>
          <span class="person-name" contenteditable="true" spellcheck="false" data-k="p-${initials(name)}-${note}">${name}</span>
          <span class="person-note">${note}</span>
        </div>`;

const row = (ico, label, value) => `
        <div class="list-row">
          <span class="list-ico">${icon(ICONS[ico])}</span>
          <span class="list-label">${label}</span>
          <span class="list-value">${value}</span>
        </div>`;

/* ---------- page ---------- */

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#07080B" />
<title>Millennium</title>
<style>
  :root {
    --ink:       #07080B;
    --raise:     #101219;
    --raise-2:   #171A23;
    --line:      #232734;
    --line-soft: #1B1E28;
    --text:      #F4F5F9;
    --muted:     #868CA0;
    --faint:     #5B6074;
    --gold:      #E9C784;
    --gold-deep: #C9A25C;
    --mint:      #4FD6A0;
    --coral:     #FF6F6F;
    --plum-a:    #1C2140;
    --plum-b:    #3C2F63;

    --r-lg: 24px;
    --r-md: 16px;
    --r-sm: 10px;
    --shell: 470px;
  }

  * { box-sizing: border-box; }

  html { -webkit-text-size-adjust: 100%; }

  body {
    margin: 0;
    background: var(--ink);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    display: flex;
    justify-content: center;
    min-height: 100vh;
  }

  .sr-only {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0 0 0 0); white-space: nowrap; border: 0;
  }

  /* State inputs stay focusable for keyboard use but never take up space. */
  .state {
    position: absolute;
    opacity: 0;
    width: 1px; height: 1px;
    margin: 0;
    pointer-events: none;
  }

  .app {
    width: 100%;
    max-width: var(--shell);
    position: relative;
    padding: 0 18px calc(100px + env(safe-area-inset-bottom));
  }

  /* Kept inside the box: clipping this glow with overflow:hidden would also
     clip the fixed nav, which paints it as a ghost at the top of the page. */
  .app::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 300px;
    background: radial-gradient(70% 90% at 50% -10%, rgba(233,199,132,.16), rgba(233,199,132,0) 72%);
    pointer-events: none;
  }

  main { position: relative; }
  .screen { display: none; animation: fade .22s ease both; }
  @keyframes fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

  /* ---------- header ---------- */
  .topbar { display: flex; align-items: center; gap: 12px; padding: 20px 0 22px; }

  .avatar {
    width: 44px; height: 44px; border-radius: 50%;
    display: grid; place-items: center; flex: none;
    background: linear-gradient(140deg, var(--plum-a), var(--plum-b));
    border: 1px solid rgba(255,255,255,.1);
    font-size: 15px; font-weight: 600;
  }

  .who { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .eyebrow { font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase; color: var(--faint); }
  .who-name {
    font-size: 16px; font-weight: 600; letter-spacing: -.01em;
    outline: none; border-radius: 6px; padding: 1px 4px; margin-left: -4px;
    max-width: 210px; white-space: nowrap; overflow: hidden;
  }
  .grow { flex: 1; }

  .round {
    width: 38px; height: 38px; border-radius: 50%; flex: none;
    border: 1px solid var(--line); background: var(--raise); color: var(--text);
    display: grid; place-items: center; cursor: pointer;
    transition: background .16s ease, border-color .16s ease;
  }
  .round:hover { background: var(--raise-2); border-color: #2D3242; }
  .round svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 1.7; }

  .js-only { display: none; }
  .js .js-only { display: grid; }

  /* ---------- balance ---------- */
  .balance { text-align: center; padding: 6px 0 20px; }
  .balance-label { font-size: 10.5px; letter-spacing: .2em; text-transform: uppercase; color: var(--faint); margin: 0 0 14px; }

  .amount-row {
    display: inline-flex; align-items: baseline; justify-content: center; gap: 2px;
    padding: 6px 14px; border-radius: var(--r-md);
    border: 1px solid transparent; cursor: text; max-width: 100%;
    transition: border-color .18s ease, background .18s ease;
  }
  .amount-row:hover { border-color: var(--line-soft); background: rgba(255,255,255,.02); }
  .amount-row:focus-within { border-color: rgba(233,199,132,.55); background: rgba(233,199,132,.06); }

  .cur-lg { font-size: 32px; font-weight: 500; color: var(--gold); align-self: center; }
  .cur::after, .cur-lg::after { content: "€"; }
  .cur { color: inherit; }

  .amount {
    font-size: 56px; font-weight: 650; letter-spacing: -.04em; line-height: 1.05;
    font-variant-numeric: tabular-nums; outline: none;
    overflow-wrap: break-word; min-width: 0;
  }
  /* Words need more room than digits, so long values step down a size. */
  .amount.long   { font-size: 40px; letter-spacing: -.03em; }
  .amount.longer { font-size: 28px; letter-spacing: -.02em; line-height: 1.15; }
  .cents { font-size: 30px; font-weight: 600; color: var(--muted); letter-spacing: -.02em; font-variant-numeric: tabular-nums; outline: none; }

  .month-strip { display: flex; justify-content: center; gap: 8px; margin-top: 16px; }
  .chip {
    display: inline-flex; align-items: baseline; gap: 6px;
    border: 1px solid var(--line-soft); background: var(--raise);
    border-radius: 999px; padding: 7px 13px; font-size: 12px; color: var(--muted);
  }
  .chip b { font-weight: 600; color: var(--text); font-variant-numeric: tabular-nums; }
  .chip.up b { color: var(--mint); }

  /* ---------- quick actions ---------- */
  .actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; margin: 24px 0 12px; }

  .action {
    background: var(--raise); border: 1px solid var(--line-soft); border-radius: var(--r-md);
    padding: 14px 4px 12px; display: flex; flex-direction: column; align-items: center; gap: 9px;
    font-size: 11px; cursor: pointer; text-align: center;
    transition: background .16s ease, border-color .16s ease, transform .14s ease;
  }
  .action:hover { background: var(--raise-2); transform: translateY(-2px); }
  .action:active { transform: translateY(0); }
  .action svg { width: 19px; height: 19px; stroke: var(--gold); fill: none; stroke-width: 1.6; }

  .sheet {
    display: none; align-items: flex-start; gap: 12px;
    border: 1px solid rgba(233,199,132,.28); background: rgba(233,199,132,.06);
    border-radius: var(--r-md); padding: 14px 14px 14px 16px; margin-bottom: 18px;
  }
  .sheet-body { flex: 1; }
  .sheet-title { margin: 0 0 4px; font-size: 13px; font-weight: 600; color: var(--gold); }
  .sheet-text { margin: 0; font-size: 12.5px; line-height: 1.5; color: var(--muted); }
  .sheet-close {
    flex: none; width: 24px; height: 24px; border-radius: 50%;
    border: 1px solid var(--line); display: grid; place-items: center;
    cursor: pointer; color: var(--muted); font-size: 14px; line-height: 1;
  }
  .sheet-close:hover { color: var(--text); }

  /* ---------- section furniture ---------- */
  .section { margin-top: 26px; }
  .section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
  .section-head h2 { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: -.01em; }
  .head-tools { display: flex; align-items: center; gap: 8px; }

  .link-btn {
    background: none; border: none; color: var(--muted); font-size: 12px;
    cursor: pointer; padding: 4px 2px;
  }
  .link-btn:hover { color: var(--text); text-decoration: underline; }

  /* The Add control sits in the header, right above where a new row lands. */
  .add-stack { display: grid; }
  .add-stack label {
    grid-area: 1 / 1;
    display: none; align-items: center; gap: 5px;
    padding: 7px 14px 7px 11px; border-radius: 999px;
    border: 1px solid rgba(233,199,132,.42); background: rgba(233,199,132,.09);
    color: var(--gold); font-size: 12.5px; font-weight: 500; cursor: pointer;
    transition: background .16s ease, border-color .16s ease;
  }
  .add-stack label[for="slot-1"] { display: inline-flex; }
  .add-stack label:hover { background: rgba(233,199,132,.18); border-color: rgba(233,199,132,.7); }
  .add-stack svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }

  .day-label { font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; color: var(--faint); margin: 18px 0 8px; }
  .ledger { display: flex; flex-direction: column; gap: 2px; }

  .tx {
    display: flex; align-items: center; gap: 11px;
    padding: 10px 8px 10px 10px; border-radius: var(--r-md);
    transition: background .16s ease;
  }
  .tx:hover { background: var(--raise); }
  .tx.is-slot { display: none; }

  .tx-avatar {
    width: 42px; height: 42px; border-radius: 50%; flex: none;
    display: grid; place-items: center; font-size: 13.5px; font-weight: 600;
    background: var(--raise-2); border: 1px solid var(--line-soft);
  }
  .tx-avatar.in { color: var(--mint); border-color: rgba(79,214,160,.32); background: rgba(79,214,160,.08); }

  .tx-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .tx-name { font-size: 14.5px; font-weight: 500; outline: none; border-radius: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tx-meta { font-size: 12px; color: var(--muted); outline: none; border-radius: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .tx-amt {
    display: inline-flex; align-items: baseline; flex: none;
    font-size: 14.5px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  .tx-amt.in { color: var(--mint); }
  .tx-num { outline: none; border-radius: 5px; padding: 1px 2px; }
  .tx-sign {
    background: none; border: none; padding: 0 1px 0 0; margin: 0;
    color: inherit; font: inherit; cursor: default;
  }
  .js .tx-sign { cursor: pointer; }

  .tx-del {
    flex: none; width: 28px; height: 28px; border-radius: 50%;
    border: 1px solid var(--line-soft); background: var(--raise-2); color: var(--faint);
    display: grid; place-items: center; cursor: pointer; font-size: 15px; line-height: 1;
    opacity: .45; transition: opacity .16s ease, color .16s ease, border-color .16s ease;
  }
  .tx:hover .tx-del { opacity: 1; }
  .tx-del:hover { color: var(--coral); border-color: rgba(255,111,111,.45); }

  [contenteditable]:focus { background: rgba(233,199,132,.1); box-shadow: 0 0 0 1px rgba(233,199,132,.4); }

  /* ---------- spending bars ---------- */
  .bars { display: flex; flex-direction: column; gap: 14px; }
  .bar-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
  .bar-name { font-size: 13px; }
  .bar-val { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .bar-track { height: 6px; border-radius: 999px; background: var(--line-soft); overflow: hidden; }
  .bar-fill { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--gold-deep), var(--gold)); }
  .bar-fill.mint { background: linear-gradient(90deg, #2E9C74, var(--mint)); }
  .bar-fill.plum { background: linear-gradient(90deg, var(--plum-a), var(--plum-b)); }

  /* ---------- panels, lists, switches ---------- */
  .panel { border: 1px solid var(--line-soft); background: var(--raise); border-radius: var(--r-lg); padding: 6px 14px; }
  .panel + .panel { margin-top: 12px; }

  .list-row { display: flex; align-items: center; gap: 12px; padding: 13px 0; border-bottom: 1px solid var(--line-soft); }
  .list-row:last-child { border-bottom: none; }
  .list-ico { width: 34px; height: 34px; border-radius: 10px; flex: none; display: grid; place-items: center; background: var(--raise-2); }
  .list-ico svg { width: 17px; height: 17px; stroke: var(--gold); fill: none; stroke-width: 1.6; }
  .list-label { flex: 1; font-size: 14px; }
  .list-value { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; }

  .switch { display: flex; align-items: center; gap: 12px; padding: 13px 0; border-bottom: 1px solid var(--line-soft); cursor: pointer; }
  .switch:last-child { border-bottom: none; }
  .switch input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .switch-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .switch-label { font-size: 14px; }
  .switch-note { font-size: 12px; color: var(--muted); }
  .track {
    flex: none; width: 46px; height: 27px; border-radius: 999px;
    background: var(--raise-2); border: 1px solid var(--line);
    display: flex; align-items: center; padding: 2px;
    transition: background .18s ease, border-color .18s ease;
  }
  .knob {
    width: 21px; height: 21px; border-radius: 50%; background: var(--faint);
    transition: transform .18s ease, background .18s ease;
  }
  .switch input:checked ~ .track { background: rgba(233,199,132,.24); border-color: rgba(233,199,132,.55); }
  .switch input:checked ~ .track .knob { transform: translateX(19px); background: var(--gold); }
  .switch input:focus-visible ~ .track { outline: 2px solid var(--gold); outline-offset: 3px; }

  /* ---------- people ---------- */
  .people { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .person { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
  .person-av {
    width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center;
    background: linear-gradient(140deg, var(--plum-a), var(--plum-b));
    border: 1px solid rgba(255,255,255,.1); font-size: 15px; font-weight: 600;
  }
  .person-name { font-size: 11.5px; outline: none; border-radius: 5px; max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .person-note { font-size: 10px; color: var(--faint); }

  /* ---------- currency picker ---------- */
  .cur-picker { display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 0 12px; }
  .cur-picker label {
    border: 1px solid var(--line); background: var(--raise-2); color: var(--muted);
    border-radius: 999px; padding: 8px 15px; font-size: 13px; cursor: pointer;
    transition: color .16s ease, border-color .16s ease, background .16s ease;
  }
  .cur-picker label:hover { color: var(--text); }

  /* ---------- nav ---------- */
  .nav {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: var(--shell); z-index: 20;
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;
    padding: 9px 14px calc(13px + env(safe-area-inset-bottom));
    background: linear-gradient(180deg, rgba(7,8,11,.86), var(--ink) 40%);
    border-top: 1px solid var(--line-soft);
  }
  .nav label {
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    font-size: 10.5px; letter-spacing: .03em; color: var(--faint);
    padding: 6px 0; border-radius: var(--r-sm); cursor: pointer;
    transition: color .16s ease;
  }
  .nav label:hover { color: var(--text); }
  .nav svg { width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 1.6; }

  /* ---------- toast ---------- */
  .toast {
    position: fixed; left: 50%; bottom: calc(92px + env(safe-area-inset-bottom));
    transform: translate(-50%, 10px);
    background: var(--raise-2); border: 1px solid var(--line); color: var(--text);
    padding: 10px 16px; border-radius: 999px; font-size: 13px;
    opacity: 0; pointer-events: none; z-index: 30;
    transition: opacity .2s ease, transform .2s ease;
  }
  .toast.show { opacity: 1; transform: translate(-50%, 0); }

  .foot-note { margin: 22px 0 0; font-size: 11.5px; line-height: 1.6; color: var(--faint); text-align: center; }

  :focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

  @keyframes arrive { from { background: rgba(233,199,132,.16); } to { background: transparent; } }
  .tx-fresh { animation: arrive 1.5s ease-out 1; }

  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }

  /* ---------- generated state ---------- */
${tabRules()}

${actRules()}

${stateRules()}
</style>
</head>
<body>
<div class="app">

  <input class="state" type="radio" name="tab" id="tab-home" checked />
  <input class="state" type="radio" name="tab" id="tab-cards" />
  <input class="state" type="radio" name="tab" id="tab-pay" />
  <input class="state" type="radio" name="tab" id="tab-you" />

  <input class="state" type="radio" name="act" id="act-none" checked />
  <input class="state" type="radio" name="act" id="act-transfer" />
  <input class="state" type="radio" name="act" id="act-request" />
  <input class="state" type="radio" name="act" id="act-pay" />
  <input class="state" type="radio" name="act" id="act-swap" />

${CURRENCIES.map((c, i) => `  <input class="state" type="radio" name="cur" id="cur-${c.id}" data-k="cur-${c.id}"${i === 0 ? " checked" : ""} />`).join("\n")}

${Array.from({ length: SLOTS }, (_, i) => `  <input class="state" type="checkbox" id="slot-${i + 1}" data-k="slot-${i + 1}" />`).join("\n")}
${Array.from({ length: DEFAULTS.length + SLOTS }, (_, i) => `  <input class="state" type="checkbox" id="del-${i + 1}" data-k="del-${i + 1}" />`).join("\n")}

  <main>

    <!-- ===================== HOME ===================== -->
    <section class="screen screen-home">
      <header class="topbar">
        <span class="avatar" id="initials">G</span>
        <span class="who">
          <span class="eyebrow" id="greeting">Good evening</span>
          <span class="who-name" contenteditable="true" spellcheck="false" data-k="user">Gabriel</span>
        </span>
        <span class="grow"></span>
        <button type="button" class="round js-only" id="btnReset" title="Reset everything">${icon(ICONS.reset)}</button>
        <button type="button" class="round" title="Notifications">${icon(ICONS.bell)}</button>
      </header>

      <div class="balance">
        <p class="balance-label">Total balance</p>
        <span class="amount-row" id="amountRow"><span class="cur-lg"></span><span class="amount" contenteditable="true" spellcheck="false" inputmode="text" data-k="whole">12 480</span><span class="cents" contenteditable="true" spellcheck="false" inputmode="text" data-k="cents">,50</span></span>
        <div class="month-strip">
          <span class="chip">Spent <b><span class="cur"></span>76,78</b></span>
          <span class="chip up">Received <b><span class="cur"></span>3 226,00</b></span>
        </div>
      </div>

      <div class="actions">${action("transfer", "Transfer", "up")}${action("request", "Request", "down")}${action("pay", "Pay", "card")}${action("swap", "Exchange", "swap")}
      </div>
${sheet("transfer", "Send money", "Pick a saved recipient from Payments, or edit any name in the list below — every field on this screen is yours to change.")}
${sheet("request", "Request money", "Share your Millennium handle and the amount lands in your balance. Tap the balance above to set it to whatever you like.")}
${sheet("pay", "Pay in store", "Hold the phone near the terminal. Card controls live in the Cards tab — freeze, contactless and online payments.")}
${sheet("swap", "Exchange", "Switch the symbol on your balance from the You tab: euro, dollar, pound, franc or złoty.")}

      <section class="section">
        <div class="section-head">
          <h2>Transactions</h2>
          <div class="head-tools">
            <div class="add-stack">
${Array.from({ length: SLOTS }, (_, i) => SLOTS - i).map((n) => `              <label for="slot-${n}">${icon(ICONS.plus)}<span>Add</span></label>`).join("\n")}
            </div>
            <button type="button" class="link-btn js-only" id="btnClear">Clear</button>
          </div>
        </div>
${ledger()}
      </section>

      <section class="section">
        <div class="section-head"><h2>Where it went</h2><span class="eyebrow">This month</span></div>
        <div class="bars">
${bar("Groceries", 63, "48,20", "")}
${bar("Transport", 19, "14,60", "plum")}
${bar("Subscriptions", 18, "13,98", "mint")}
        </div>
      </section>

      <p class="foot-note">Every figure on this screen is yours to edit — tap and type.</p>
    </section>

    <!-- ===================== CARDS ===================== -->
    <section class="screen screen-cards">
      <header class="topbar">
        <span class="who"><span class="eyebrow">Millennium</span><span class="who-name">Cards</span></span>
      </header>

      <div class="balance">
        <p class="balance-label">Card spending this month</p>
        <span class="amount-row"><span class="cur-lg"></span><span class="amount" contenteditable="true" spellcheck="false" inputmode="text" data-k="card-whole">76</span><span class="cents" contenteditable="true" spellcheck="false" inputmode="text" data-k="card-cents">,78</span></span>
      </div>

      <section class="section">
        <div class="section-head"><h2>Controls</h2></div>
        <div class="panel">
${toggle("sw-freeze", "Freeze card", "Blocks every new payment", false)}
${toggle("sw-online", "Online payments", "Web and in-app purchases", true)}
${toggle("sw-contactless", "Contactless", "Tap to pay in store", true)}
${toggle("sw-abroad", "Payments abroad", "Outside the euro area", false)}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Limits</h2></div>
        <div class="panel">
${row("card", "Monthly limit", '<span class="cur"></span>2 000,00')}
${row("lock", "Single payment", '<span class="cur"></span>500,00')}
${row("globe", "Cash withdrawal", '<span class="cur"></span>400,00')}
${row("wifi", "Contactless cap", '<span class="cur"></span>50,00')}
        </div>
      </section>

      <p class="foot-note">Freeze is off. Your card works everywhere contactless is accepted.</p>
    </section>

    <!-- ===================== PAYMENTS ===================== -->
    <section class="screen screen-pay">
      <header class="topbar">
        <span class="who"><span class="eyebrow">Millennium</span><span class="who-name">Payments</span></span>
      </header>

      <section class="section">
        <div class="section-head"><h2>Recent people</h2><span class="eyebrow">Editable</span></div>
        <div class="people">
${person("Ana Ribeiro", "Split")}
${person("Tomás Silva", "Rent")}
${person("Marta Alves", "Coffee")}
${person("Luís Costa", "Padel")}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Scheduled</h2></div>
        <div class="panel">
${row("calendar", "Rent — 1st of the month", '<span class="cur"></span>780,00')}
${row("euro", "Savings transfer — Friday", '<span class="cur"></span>150,00')}
${row("card", "Spotify — 12th", '<span class="cur"></span>10,99')}
${row("shield", "Insurance — 20th", '<span class="cur"></span>34,50')}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Split with friends</h2></div>
        <div class="bars">
${bar("Ana Ribeiro", 72, "26,00", "mint")}
${bar("Tomás Silva", 40, "14,50", "plum")}
        </div>
      </section>
    </section>

    <!-- ===================== YOU ===================== -->
    <section class="screen screen-you">
      <header class="topbar">
        <span class="avatar" id="initials2">G</span>
        <span class="who">
          <span class="eyebrow">Millennium Metal</span>
          <span class="who-name" contenteditable="true" spellcheck="false" data-k="user2">Gabriel</span>
        </span>
      </header>

      <section class="section">
        <div class="section-head"><h2>Currency</h2></div>
        <div class="cur-picker">
${CURRENCIES.map((c) => `          <label for="cur-${c.id}">${c.sym} <span class="sr-only">${c.label}</span></label>`).join("\n")}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Security</h2></div>
        <div class="panel">
${toggle("sw-face", "Face ID", "Unlock the app with your face", true)}
${toggle("sw-notify", "Notifications", "Alerts for every payment", true)}
${toggle("sw-hide", "Hide balance in app switcher", "Blur the amount on preview", false)}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Account</h2></div>
        <div class="panel">
${row("person", "Plan", "Metal")}
${row("globe", "Country", "Portugal")}
${row("shield", "Millennium since", "2019")}
${row("face", "App version", "1.2")}
        </div>
      </section>

      <p class="foot-note">Everything you edit is saved in this browser only.</p>
    </section>

  </main>

  <nav class="nav" aria-label="Main">
    <label for="tab-home">${icon(ICONS.home)}<span>Home</span></label>
    <label for="tab-cards">${icon(ICONS.card)}<span>Cards</span></label>
    <label for="tab-pay">${icon(ICONS.euro)}<span>Payments</span></label>
    <label for="tab-you">${icon(ICONS.person)}<span>You</span></label>
  </nav>

</div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>
(function () {
  "use strict";

  // Everything above already works without this script. What follows only adds
  // number formatting, saving between visits, and small confirmations.
  var root = document.documentElement;
  root.className += " js";

  var KEY = "millennium.v2";
  var toastEl = document.getElementById("toast");
  var timer;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(function () { toastEl.classList.remove("show"); }, 1700);
  }

  function fields() { return document.querySelectorAll("[data-k]"); }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function write() {
    var data = {};
    Array.prototype.forEach.call(fields(), function (node) {
      var key = node.getAttribute("data-k");
      if (node.tagName === "INPUT") data[key] = node.checked;
      else if (node.isContentEditable) data[key] = node.textContent;
    });
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage off */ }
  }

  function restore() {
    var data = read();
    if (!data) return;
    Array.prototype.forEach.call(fields(), function (node) {
      var key = node.getAttribute("data-k");
      if (!(key in data)) return;
      if (node.tagName === "INPUT") node.checked = !!data[key];
      else if (node.isContentEditable && typeof data[key] === "string") node.textContent = data[key];
    });
  }

  /* ---------- amount shaping ---------- */

  // Amounts take words as happily as digits: "a fortune" stays exactly as
  // typed, while a plain number still gets its thousands spacing. Anything
  // that isn't purely digits and spaces is left alone.
  function isPlainNumber(text) { return /^[\\d\\s]*$/.test(text); }

  function tidyWords(text, limit) {
    return text.replace(/\\s+/g, " ").trim().slice(0, limit);
  }

  function groupWhole(text) {
    if (!isPlainNumber(text)) return tidyWords(text, 28);
    var digits = text.replace(/\\D/g, "").slice(0, 12);
    if (!digits) return "0";
    digits = digits.replace(/^0+(?=\\d)/, "");
    return digits.replace(/\\B(?=(\\d{3})+(?!\\d))/g, "\u00a0");
  }

  function twoCents(text) {
    var bare = text.replace(/^[,.]/, "");
    if (!isPlainNumber(bare)) return "\u00a0" + tidyWords(bare, 14);
    var digits = bare.replace(/\\D/g, "").slice(0, 2);
    while (digits.length < 2) digits += "0";
    return "," + digits;
  }

  function fullAmount(text) {
    if (!/^[\\d\\s.,]*$/.test(text)) return tidyWords(text, 20);
    var digits = text.replace(/\\D/g, "").slice(0, 11) || "0";
    while (digits.length < 3) digits = "0" + digits;
    return groupWhole(digits.slice(0, -2)) + "," + digits.slice(-2);
  }

  function fitAmount(node) {
    var len = node.textContent.trim().length;
    node.classList.toggle("long", len > 11 && len <= 18);
    node.classList.toggle("longer", len > 18);
  }

  Array.prototype.forEach.call(document.querySelectorAll(".amount"), function (node) {
    fitAmount(node);
    node.addEventListener("input", function () { fitAmount(node); });
    node.addEventListener("blur", function () {
      node.textContent = groupWhole(node.textContent);
      fitAmount(node);
      write();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll(".cents"), function (node) {
    node.addEventListener("focus", function () {
      var range = document.createRange();
      range.selectNodeContents(node);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
    node.addEventListener("blur", function () { node.textContent = twoCents(node.textContent); write(); });
  });

  Array.prototype.forEach.call(document.querySelectorAll(".tx-num"), function (node) {
    node.addEventListener("blur", function () { node.textContent = fullAmount(node.textContent); write(); });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[contenteditable]"), function (node) {
    node.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); node.blur(); }
    });
    node.addEventListener("paste", function (e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData("text");
      document.execCommand("insertText", false, text.replace(/[\\r\\n]+/g, " "));
    });
    node.addEventListener("blur", write);
  });

  /* ---------- names drive their avatar ---------- */

  function initialsOf(name) {
    var parts = name.split(/[^\\p{L}\\p{N}]+/u).filter(Boolean);
    if (!parts.length) return "?";
    return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0]).toUpperCase();
  }

  Array.prototype.forEach.call(document.querySelectorAll(".tx"), function (row) {
    var name = row.querySelector(".tx-name");
    var av = row.querySelector(".tx-avatar");
    var sign = row.querySelector(".tx-sign");
    var amt = row.querySelector(".tx-amt");

    name.addEventListener("blur", function () {
      name.textContent = name.textContent.trim().slice(0, 40) || "Untitled";
      av.textContent = initialsOf(name.textContent);
      write();
    });

    sign.addEventListener("click", function () {
      var inbound = sign.textContent.trim() !== "+";
      sign.textContent = inbound ? "+" : "−";
      amt.classList.toggle("in", inbound);
      av.classList.toggle("in", inbound);
      write();
    });
  });

  // The account avatar takes a single letter — "GA" for Gabriel reads like a
  // company monogram rather than a person.
  function ownInitial(name) {
    var parts = name.split(/[^\\p{L}\\p{N}]+/u).filter(Boolean);
    if (!parts.length) return "M";
    return (parts.length === 1 ? parts[0][0] : parts[0][0] + parts[1][0]).toUpperCase();
  }

  function syncUser() {
    var name = document.querySelector('[data-k="user"]').textContent.trim() || "Millennium";
    document.getElementById("initials").textContent = ownInitial(name);
    document.getElementById("initials2").textContent = ownInitial(name);
    var twin = document.querySelector('[data-k="user2"]');
    if (twin.textContent !== name) twin.textContent = name;
  }

  document.querySelector('[data-k="user"]').addEventListener("blur", syncUser);
  document.querySelector('[data-k="user2"]').addEventListener("blur", function () {
    document.querySelector('[data-k="user"]').textContent = this.textContent.trim() || "Millennium";
    syncUser();
    write();
  });

  /* ---------- add / clear ---------- */

  Array.prototype.forEach.call(document.querySelectorAll('.add-stack label'), function (label) {
    label.addEventListener("click", function () {
      var id = label.getAttribute("for").replace("slot-", "");
      var row = document.querySelector(".r-" + (${DEFAULTS.length} + Number(id)));
      setTimeout(function () {
        row.classList.add("tx-fresh");
        var name = row.querySelector(".tx-name");
        name.focus();
        var range = document.createRange();
        range.selectNodeContents(name);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        write();
      }, 0);
      toast("Transaction added");
    });
  });

  document.getElementById("btnClear").addEventListener("click", function () {
    var hid = 0;
    Array.prototype.forEach.call(document.querySelectorAll('[id^="del-"]'), function (box) {
      var row = document.querySelector(".r-" + box.id.replace("del-", ""));
      if (row && getComputedStyle(row).display !== "none") { box.checked = true; hid++; }
    });
    write();
    toast(hid ? "Transactions cleared" : "Nothing to clear");
  });

  document.getElementById("btnReset").addEventListener("click", function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* storage off */ }
    location.reload();
  });

  /* ---------- greeting, saving, tab feedback ---------- */

  var hour = new Date().getHours();
  document.getElementById("greeting").textContent =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  Array.prototype.forEach.call(document.querySelectorAll(".state, .switch input"), function (input) {
    input.addEventListener("change", write);
  });

  restore();
  syncUser();
  Array.prototype.forEach.call(document.querySelectorAll(".amount"), fitAmount);
})();
</script>
</body>
</html>
`;

writeFileSync(new URL("./index.html", import.meta.url), html);
console.log("wrote index.html");
