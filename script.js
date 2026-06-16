let allData = [];
let filteredData = [];
let charts = {};
let rawHeaders = [];
let rawLines = [];
let activeYear = "all";

const columnMap = {
  gender:     ["gender", "sex"],
  state:      ["state", "location"],
  college:    ["college", "affiliation", "university", "institution"],
  prof:       ["professor", "scientist name", "mentor", "guide", "supervisor"],
  year:       ["year", "batch"],
  domain:     ["domain", "field", "project domain"],
  department: ["department", "dept", "division"],
  duration:   ["duration", "tenure", "period"]
};

const PALETTE = [
  "#2563eb","#00c6b8","#f5a623","#e63946","#7c3aed",
  "#10b981","#f97316","#3b82f6","#ec4899","#14b8a6",
  "#facc15","#8b5cf6","#06b6d4","#84cc16","#ef4444"
];

const CHART_DEFAULTS = {
  color: "#e8edf5",
  font: { family: "'DM Sans', sans-serif", size: 12 },
  plugins: {
    legend: {
      labels: {
        color: "#7a90ae",
        font: { family: "'Rajdhani', sans-serif", size: 12 },
        padding: 16,
        usePointStyle: true,
        pointStyleWidth: 8
      }
    },
    tooltip: {
      backgroundColor: "#0f2040",
      titleColor: "#f5a623",
      bodyColor: "#e8edf5",
      borderColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: { family: "'Rajdhani', sans-serif", size: 13, weight: "bold" },
      bodyFont: { family: "'DM Sans', sans-serif", size: 12 }
    }
  },
  scales: {
    x: {
      ticks: { color: "#7a90ae", font: { family: "'Rajdhani', sans-serif", size: 11 } },
      grid: { color: "rgba(255,255,255,0.05)" }
    },
    y: {
      ticks: { color: "#7a90ae", font: { family: "'Rajdhani', sans-serif", size: 11 } },
      grid: { color: "rgba(255,255,255,0.05)" }
    }
  }
};

function getValue(obj, keys) {
  for (const k of keys) { if (obj[k]) return obj[k]; }
  return "";
}

function countBy(data, key) {
  return data.reduce((acc, item) => {
    if (!item[key]) return acc;
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function sortDesc(obj) {
  return Object.fromEntries(
    Object.entries(obj).sort((a, b) => b[1] - a[1])
  );
}

function topN(obj, n = 12) {
  return Object.fromEntries(Object.entries(obj).slice(0, n));
}

function animateCount(el, target) {
  const start = parseInt(el.textContent) || 0;
  const dur = 800;
  const step = (ts) => {
    if (!step.start) step.start = ts;
    const p = Math.min((ts - step.start) / dur, 1);
    el.textContent = Math.round(start + (target - start) * p);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const fileInput = document.getElementById("fileInput");
const dropZone  = document.getElementById("dropZone");

fileInput.addEventListener("change", e => handleFile(e.target.files[0]));

dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
  if (!file) return;
  document.getElementById("fileName").textContent = file.name;

  const reader = new FileReader();
  reader.onload = ev => {
    const csv = ev.target.result;
    rawLines = csv.trim().split("\n");
    rawHeaders = rawLines[0].split(",").map(h => h.trim());
    const headers = rawHeaders.map(h => h.toLowerCase());

    allData = parseCSV(rawLines, headers);
    filteredData = allData;

    displayPreviewTable(rawLines);
    setupYearFilter();

    document.getElementById("rowCount").textContent =
      `${allData.length} records · ${rawHeaders.length} columns`;

    document.getElementById("tableSection").classList.remove("hidden");
    document.getElementById("tableSection").scrollIntoView({ behavior: "smooth" });
  };
  reader.readAsText(file);
}

function parseCSV(lines, headers) {
  return lines.slice(1).map(line => {
    const cols = line.match(/(".*?"|[^",\r]+)(?=\s*,|\s*$)/g)
      ?.map(c => c.replace(/^"|"$/g, "").trim());
    if (!cols) return null;
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] || "");
    return {
      _raw: obj,
      gender:     getValue(obj, columnMap.gender),
      state:      getValue(obj, columnMap.state),
      college:    getValue(obj, columnMap.college),
      prof:       getValue(obj, columnMap.prof),
      year:       (getValue(obj, columnMap.year) || "").replace(/\r/g, "").trim(),
      domain:     getValue(obj, columnMap.domain),
      department: getValue(obj, columnMap.department),
      duration:   getValue(obj, columnMap.duration)
    };
  }).filter(Boolean);
}

function displayPreviewTable(lines) {
  const th = document.getElementById("tableHead");
  const tb = document.getElementById("tableBody");
  th.innerHTML = "<tr>" + rawHeaders.map(h => `<th>${h}</th>`).join("") + "</tr>";
  tb.innerHTML = "";

  lines.slice(1, 11).forEach(line => {
    const cols = line.match(/(".*?"|[^",\r]+)(?=\s*,|\s*$)/g)
      ?.map(c => c.replace(/^"|"$/g, "").trim());
    if (!cols) return;
    tb.innerHTML += "<tr>" + cols.map(c => `<td>${c}</td>`).join("") + "</tr>";
  });

  if (lines.length > 11) {
    tb.innerHTML += `<tr><td colspan="${rawHeaders.length}" style="text-align:center;color:#7a90ae;padding:14px">
      Showing first 10 of ${allData.length} rows
    </td></tr>`;
  }
}

function setupYearFilter() {
  const years = [...new Set(
    allData.map(d => d.year).filter(y => y && !isNaN(y))
  )].sort();

  const pills = document.getElementById("yearPills");
  pills.innerHTML = `<button class="pill active" data-year="all">All</button>` +
    years.map(y => `<button class="pill" data-year="${y}">${y}</button>`).join("");

  pills.querySelectorAll(".pill").forEach(btn => {
    btn.addEventListener("click", () => {
      pills.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      activeYear = btn.dataset.year;
      applyFilters();
    });
  });
}

document.getElementById("searchInput").addEventListener("input", applyFilters);

function applyFilters() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  const byYear = activeYear === "all"
    ? allData
    : allData.filter(d => d.year === activeYear);

  filteredData = q
    ? byYear.filter(d =>
        Object.values(d).some(v => typeof v === "string" && v.toLowerCase().includes(q))
      )
    : byYear;

  updateDashboard();
}

document.getElementById("viewDashboardBtn").addEventListener("click", () => {
  const dash = document.getElementById("dashboard");
  dash.classList.remove("hidden");

  requestAnimationFrame(() => requestAnimationFrame(() => {
    updateDashboard();
    buildFullTable();
    dash.scrollIntoView({ behavior: "smooth" });
  }));
});

function updateDashboard() {
  const data = filteredData;

  const total = data.length;
  const male   = data.filter(d => d.gender.toLowerCase() === "male").length;
  const female = data.filter(d => d.gender.toLowerCase() === "female").length;
  const states = new Set(data.map(d => d.state).filter(Boolean)).size;
  const colleges = new Set(data.map(d => d.college).filter(Boolean)).size;

  animateCount(document.getElementById("total"),       total);
  animateCount(document.getElementById("male"),        male);
  animateCount(document.getElementById("female"),      female);
  animateCount(document.getElementById("stateCount"),  states);
  animateCount(document.getElementById("collegeCount"), colleges);

  const mPct = total ? (male / total * 100).toFixed(1) : 0;
  const fPct = total ? (female / total * 100).toFixed(1) : 0;
  document.getElementById("gbMale").style.width   = mPct + "%";
  document.getElementById("gbFemale").style.width = fPct + "%";
  document.getElementById("gbPct").textContent    = `♂ ${mPct}%  ·  ♀ ${fPct}%`;

  const stateData   = sortDesc(countBy(data, "state"));
  const collegeData = sortDesc(topN(countBy(data, "college"), 10));
  const profData    = sortDesc(countBy(data, "prof"));
  const domainData  = sortDesc(countBy(data, "domain"));
  const deptData    = sortDesc(countBy(data, "department"));
  const durData     = sortDesc(countBy(data, "duration"));

  Object.values(charts).forEach(c => c.destroy());
  charts = {};

  [
    "stateChart","domainChart","durationChart",
    "profChart","departmentChart","collegeChart"
  ].forEach(id => {
    const old = document.getElementById(id);
    const fresh = document.createElement("canvas");
    fresh.id = id;
    old.parentNode.replaceChild(fresh, old);
  });

  charts.state      = makeBar("stateChart",      stateData,   false);
  charts.domain     = makeDoughnut("domainChart", domainData);
  charts.duration   = makePie("durationChart",    durData);
  charts.prof       = makeBar("profChart",        profData,    true);
  charts.department = makeBar("departmentChart",  deptData,    false);
  charts.college    = makeBar("collegeChart",     collegeData, true);
}

function makeScales() {
  return {
    x: { ticks: { color: "#7a90ae", font: { family: "'Rajdhani', sans-serif", size: 11 } }, grid: { color: "rgba(255,255,255,0.05)" } },
    y: { ticks: { color: "#7a90ae", font: { family: "'Rajdhani', sans-serif", size: 11 } }, grid: { color: "rgba(255,255,255,0.05)" } }
  };
}

function makeBar(id, dataObj, horizontal = false) {
  const labels = Object.keys(dataObj);
  const vals   = Object.values(dataObj);

  return new Chart(document.getElementById(id), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Interns",
        data: vals,
        backgroundColor: PALETTE.map(c => c + "cc"),
        borderColor: PALETTE,
        borderWidth: 1.5,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: horizontal ? "y" : "x",
      responsive: true,
      plugins: CHART_DEFAULTS.plugins,

    }
  });
}

function makeDoughnut(id, dataObj) {
  return new Chart(document.getElementById(id), {
    type: "doughnut",
    data: {
      labels: Object.keys(dataObj),
      datasets: [{
        data: Object.values(dataObj),
        backgroundColor: PALETTE.map(c => c + "cc"),
        borderColor: "#111f35",
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      plugins: CHART_DEFAULTS.plugins
    }
  });
}

function makePie(id, dataObj) {
  return new Chart(document.getElementById(id), {
    type: "pie",
    data: {
      labels: Object.keys(dataObj),
      datasets: [{
        data: Object.values(dataObj),
        backgroundColor: PALETTE.map(c => c + "cc"),
        borderColor: "#111f35",
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: CHART_DEFAULTS.plugins
    }
  });
}

function buildFullTable() {
  const th = document.getElementById("fullTableHead");
  const tb = document.getElementById("fullTableBody");

  th.innerHTML = "<tr>" + rawHeaders.map(h => `<th>${h}</th>`).join("") + "</tr>";
  tb.innerHTML = "";

  allData.forEach(row => {
    const cols = rawHeaders.map(h => row._raw[h.toLowerCase()] || "");
    tb.innerHTML += "<tr>" + cols.map(c => `<td>${c}</td>`).join("") + "</tr>";
  });
}

document.getElementById("exportBtn").addEventListener("click", () => {
  const rows = [rawHeaders.join(",")];

  filteredData.forEach(row => {
    rows.push(rawHeaders.map(h => {
      const v = row._raw[h.toLowerCase()] || "";
      return v.includes(",") ? `"${v}"` : v;
    }).join(","));
  });

  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `drdo_interns_export_${Date.now()}.csv`;
  a.click();
});
