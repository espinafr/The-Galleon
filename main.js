const SPREADSHEET_ID = "1h1vPm6fOUxieO5uhXg3oGxNqT2ISKsu7_tmzfFNb8To";
const CONFIG_GID = 1583366169;
const SEASONALS_GID = 0;
const RARE_ITEMS_GID = 1442647108;
const SCROLLS_GID = 1428613482;
const NPC_DROPS_GID = 349543872;
const INGREDIENTS_GID = 573269167;
const MODIFIED_ITEMS_GID = 1628198663;
const MISCELLANEOUS_GID = 550507433;

function sheetUrl(gid) {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?gid=${gid}&tqx=out:json`;
}

function parseGoogleResponse(text) {
  return JSON.parse(text.substring(47).slice(0, -2));
}

async function loadRawSheet(gid) {
  const res = await fetch(sheetUrl(gid));
  const text = await res.text();
  const json = parseGoogleResponse(text);
  return json.table.rows || [];
}

async function loadSheet(gid, rowMapper) {
  const rows = await loadRawSheet(gid);
  return rows.map(rowMapper);
}

async function loadKeyValueSheet(gid) {
  const rows = await loadRawSheet(gid);
  const obj = {};

  rows.forEach(row => {
    const key = row.c[0]?.v;
    const value = row.c[1]?.v;
    if (key !== undefined) obj[key] = value;
  });

  return obj;
}

function mapItemRow(row) {
  return {
    id: row.c[0]?.v ?? "",
    image: row.c[1]?.v ?? "",
    name: row.c[2]?.v ?? "",
    description: row.c[3]?.v ?? "",
    value: row.c[4]?.v ?? 0,
    demand: row.c[5]?.v ?? 0,
    notes: row.c[6]?.v ?? ""
  };
}

function addDemand(demand) {
    const colors = ["#660000", "#CC0000", "#7F6000", "#38761D", "#E69138"];
    return `<span style="color: ${colors[demand-1]};">${"★".repeat(demand)}${"☆".repeat(5-demand)}</span>`;
}

function renderTable(items, death_crow_base_value) {
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";

  for (const item of items) {
    const tr = document.createElement("tr");
    tr.classList.add('border-b','border-slate-200','odd:bg-white','even:bg-orange-100');

    tr.innerHTML = `
        <td class="p-3 align-top">
            <div class="w-16 h-16"><img src="${item.image}" alt="${item.name} photo"></div>
        </td>
        <td class="p-3 align-top">
            <div class="font-bold text-slate-900">${item.name}</div>
            <div class="text-sm text-slate-600">${item.description}</div>
        </td>
        <td class="p-3 text-center font-semibold text-slate-900">${item.value.toLocaleString()}</td>
        <td class="p-3 text-center text-slate-700">${parseFloat((item.value/death_crow_base_value).toFixed(2)).toLocaleString()}</td>
        <td class="p-3 text-center text-amber-500">${addDemand(item.demand)}</td>
        <td class="p-3 text-center text-slate-600">${item.notes}</td>
    `;

    tbody.appendChild(tr);
  }
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.demandContainer').forEach(container => {
		container.innerHTML = addDemand(container.getAttribute('data-demand', 1));
	});
});