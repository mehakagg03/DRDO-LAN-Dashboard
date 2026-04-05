let allData = [];
let charts = {};

const columnMap = {
  gender: ["gender", "sex"],
  state: ["state", "location"],
  college: ["college", "affiliation", "university"],
  prof: ["professor", "scientist name", "mentor"],
  year: ["year", "batch"],
  domain: ["domain", "field"],
  department: ["department", "dept"],
  duration: ["duration", "tenure"]
};

function getValue(obj, keys) {
  for (let key of keys) {
    if (obj[key]) return obj[key];
  }
  return "";
}

function countBy(data, key) {
  return data.reduce((acc, item) => {
    if (!item[key]) return acc;
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

// FILE UPLOAD 
document.getElementById("fileInput").addEventListener("change", handleFileUpload);

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (event) {
    const csv = event.target.result;
    const lines = csv.trim().split("\n");

    const headers = lines[0]
      .split(",")
      .map(h => h.trim().toLowerCase());

    allData = parseCSV(lines, headers);

    displayTable(lines);
    setupYearFilter();
    updateDashboard("all");

    // SHOW TABLE + BUTTON
    document.getElementById("tableSection").classList.remove("hidden");
    document.getElementById("dashboardBtnContainer").classList.remove("hidden");
  };

  reader.readAsText(file);
}

function parseCSV(lines, headers) {
  return lines.slice(1).map(line => {
    const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
      ?.map(c => c.replace(/^"|"$/g, "").trim());

    if (!cols) return null;

    let obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] || "");

    return {
      gender: getValue(obj, columnMap.gender),
      state: getValue(obj, columnMap.state),
      college: getValue(obj, columnMap.college),
      prof: getValue(obj, columnMap.prof),
      year: getValue(obj, columnMap.year),
      domain: getValue(obj, columnMap.domain),
      department: getValue(obj, columnMap.department),
      duration: getValue(obj, columnMap.duration)
    };
  }).filter(Boolean);
}

// YEAR FILTER
function setupYearFilter() {
  const years = [...new Set(
    allData
      .map(d => (d.year || "").replace(/\r/g, "").trim())
      .filter(y => y !== "" && !isNaN(y))
  )];

  const select = document.getElementById("yearFilter");

  select.innerHTML =
    `<option value="all">All Years</option>` +
    years.map(y => `<option value="${y}">${y}</option>`).join("");

  select.onchange = () => updateDashboard(select.value);
}

// DASHBOARD 
function updateDashboard(selectedYear) {

  const filteredData = selectedYear === "all"
    ? allData
    : allData.filter(d => d.year === selectedYear);

  // KPIs 
  const total = filteredData.length;

  const male = filteredData.filter(d =>
    (d.gender || "").toLowerCase() === "male"
  ).length;

  const female = filteredData.filter(d =>
    (d.gender || "").toLowerCase() === "female"
  ).length;

  document.getElementById("total").innerText = total;
  document.getElementById("male").innerText = male;
  document.getElementById("female").innerText = female;

  //  COUNTS 
  const state = countBy(filteredData, "state");
  const college = countBy(filteredData, "college");
  const prof = countBy(filteredData, "prof");
  const domain = countBy(filteredData, "domain");
  const department = countBy(filteredData, "department");
  const duration = countBy(filteredData, "duration");

  Object.values(charts).forEach(chart => chart.destroy());

  // CREATE CHART
  function createChart(id, type, dataObj, label = "Interns") {
    return new Chart(document.getElementById(id), {
      type: type,
      data: {
        labels: Object.keys(dataObj),
        datasets: [{
          label: label,
          data: Object.values(dataObj)
        }]
      }
    });
  }

  // CHARTS 
  charts.state = createChart("stateChart", "bar", state);
  charts.college = createChart("collegeChart", "bar", college);
  charts.prof = createChart("profChart", "bar", prof);
  charts.domain = createChart("domainChart", "doughnut", domain, "");
  charts.department = createChart("departmentChart", "bar", department);
  charts.duration = createChart("durationChart", "pie", duration, "");
}

// TABLE PREVIEW 
function displayTable(lines) {
  const tableHead = document.getElementById("tableHead");
  const tableBody = document.getElementById("tableBody");

  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  const headers = lines[0].split(",");

  // Header row
  tableHead.innerHTML =
    "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";

  // First 10 rows
  const preview = lines.slice(1, 11);

  preview.forEach(line => {
    const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
      ?.map(c => c.replace(/^"|"$/g, "").trim());

    if (!cols) return;

    tableBody.innerHTML +=
      "<tr>" + cols.map(c => `<td>${c}</td>`).join("") + "</tr>";
  });

  // Footer message
  if (lines.length > 11) {
    tableBody.innerHTML += `
      <tr>
        <td colspan="${headers.length}" style="text-align:center;">
          Showing first 10 rows...
        </td>
      </tr>
    `;
  }
}

// VIEW DASHBOARD BUTTON 
document.getElementById("viewDashboardBtn").addEventListener("click", () => {
  const dashboard = document.getElementById("dashboard");

  dashboard.classList.remove("hidden");
  dashboard.scrollIntoView({ behavior: "smooth" });
});
