const SPREADSHEET_ID = "1h1vPm6fOUxieO5uhXg3oGxNqT2ISKsu7_tmzfFNb8To";
const CONFIG_GID = 1583366169;
const ITEMS_GID = {
  seasonals: 0,
  rare_items: 1442647108,
  scrolls: 1428613482,
  npc_drops: 349543872,
  ingredients: 573269167,
  modified_items: 1628198663,
  miscellaneous: 550507433
}

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
    notes: row.c[6]?.v ?? "",
    oldvalue: row.c[7]?.v ?? "N/A",
  };
}

async function retrieveConfig(specific_value=null) {
  try {
    let config = await loadKeyValueSheet(CONFIG_GID)
    localStorage.setItem('last_config_update', Date.now());
    for (const key in config) {
      console.log(`Saving \"${key}\" in the local storage`)
      localStorage.setItem(key, config[key]);
    }
    return specific_value ? config[specific_value] : true;
  } catch (error) {
    console.error("Error storing or retrieving config:", error);
    return false
  }
}

async function getConfig(value) {
  try {
    const storedConfig = localStorage.getItem(value);
    if (storedConfig) {
      if (Date.now() - localStorage.getItem('last_config_update') > 24 * 60 * 60 * 1000) {
        console.log("Config is older than 24 hours, retrieving new config.");
        return await retrieveConfig(value);
      }
      return storedConfig;
    } else {
      return await retrieveConfig(value);
    }
  } catch (error) {
    console.error("Error reading from localStorage:", error);
  }
}

function addDemand(demand) {
    const colors = ["#660000", "#CC0000", "#7F6000", "#38761D", "#E69138"];
    return `<span style="color: ${colors[demand-1]};">${"★".repeat(demand)}${"☆".repeat(5-demand)}</span>`;
}

function renderTable(items, item_type, death_crown_base_value) {
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";

  for (const item of items) {
    const tr = document.createElement("tr");
    tr.classList.add('border-b','border-slate-200','odd:bg-white','even:bg-orange-100', 'cursor-pointer', 'transition-colors','duration-200', 'hover:bg-orange-200');
    tr.onclick = () => {
      window.location.href = `../item_details.html?type=${item_type}&id=${encodeURIComponent(item.id)}`;
    }

    tr.innerHTML = `
        <td class="p-3 align-top">
            <div class="w-16 h-16"><img src="${item.image}" alt="${item.name} photo"></div>
        </td>
        <td class="p-3 align-top">
            <div class="font-bold text-slate-900">${item.name}</div>
            <div class="text-sm text-slate-600">${item.description}</div>
        </td>
        <td class="p-3 text-center font-semibold text-slate-900">${item.value.toLocaleString()}</td>
        <td class="p-3 text-center text-slate-700">${parseFloat((item.value/death_crown_base_value).toFixed(2)).toLocaleString()}</td>
        <td class="p-3 text-center text-amber-500">${addDemand(item.demand)}</td>
        <td class="p-3 text-center text-slate-600">${item.notes}</td>
        `;

    tbody.appendChild(tr);
  }
}