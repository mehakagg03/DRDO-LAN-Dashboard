let allData = [];
let charts = {};

// ✅ Column aliases
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

// ✅ Helper function
function getValue(obj, keys) {
  for (let key of keys) {
    if (obj[key]) return obj[key];
  }
  return "";
}

// File upload
document.getElementById("fileInput").addEventListener("change", function(e) {

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(event) {

    const data = event.target.result;

    const lines = data.trim().split('\n');

    const headers = lines[0]
      .split(',')
      .map(h => h.trim().toLowerCase());

    allData = [];

    lines.slice(1).forEach(line => {

      // Robust CSV parsing
      const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
        ?.map(c => c.replace(/^"|"$/g, '').trim());

      if (!cols) return;

      let obj = {};
      headers.forEach((h, i) => {
        obj[h] = cols[i] || "";
      });

      allData.push({
        gender: getValue(obj, columnMap.gender),
        state: getValue(obj, columnMap.state),
        college: getValue(obj, columnMap.college),
        prof: getValue(obj, columnMap.prof),
        year: getValue(obj, columnMap.year),
        domain: getValue(obj, columnMap.domain),
        department: getValue(obj, columnMap.department),
        duration: getValue(obj, columnMap.duration)
      });
    });

    console.log("Sample Data:", allData[0]);

    setupYearFilter();
    updateDashboard("all");
  };

  reader.readAsText(file);
});

// Setup filter
function setupYearFilter() {
  const years = [...new Set(
    allData
      .map(d => (d.year || "").replace(/\r/g, "").trim())
      .filter(y => y !== "" && !isNaN(y))
  )];

  const select = document.getElementById("yearFilter");

  select.innerHTML =
    `<option value="all">All</option>` +
    years.map(y => `<option value="${y}">${y}</option>`).join("");

  select.addEventListener("change", function () {
    updateDashboard(this.value);
  });
}

function updateDashboard(selectedYear) {

  const data = selectedYear === "all"
    ? allData
    : allData.filter(d => d.year === selectedYear);

  const total = data.length;

  const male = data.filter(d =>
    (d.gender || "").toLowerCase() === "male"
  ).length;

  const female = data.filter(d =>
    (d.gender || "").toLowerCase() === "female"
  ).length;

  document.getElementById("total").innerText = total;
  document.getElementById("male").innerText = male;
  document.getElementById("female").innerText = female;

  function countBy(key) {
    const result = {};
    data.forEach(d => {
      if (!d[key]) return;
      result[d[key]] = (result[d[key]] || 0) + 1;
    });
    return result;
  }

  const stateCount = countBy("state");
  const collegeCount = countBy("college");
  const profCount = countBy("prof");
  const domainCount = countBy("domain");
  const departmentCount = countBy("department");
  const durationCount = countBy("duration");

  Object.values(charts).forEach(chart => chart.destroy());

  charts.state = new Chart(document.getElementById("stateChart"), {
    type: 'bar',
    data: {
      labels: Object.keys(stateCount),
      datasets: [{ label: "Interns", data: Object.values(stateCount) }]
    }
  });

  charts.college = new Chart(document.getElementById("collegeChart"), {
    type: 'bar',
    data: {
      labels: Object.keys(collegeCount),
      datasets: [{ label: "Interns", data: Object.values(collegeCount) }]
    }
  });

  charts.prof = new Chart(document.getElementById("profChart"), {
    type: 'bar',
    data: {
      labels: Object.keys(profCount),
      datasets: [{ label: "Interns", data: Object.values(profCount) }]
    }
  });

  charts.domain = new Chart(document.getElementById("domainChart"), {
    type: 'doughnut',
    data: {
      labels: Object.keys(domainCount),
      datasets: [{ label: "Interns", data: Object.values(domainCount) }]
    }
  });

  charts.department = new Chart(document.getElementById("departmentChart"), {
    type: 'bar',
    data: {
      labels: Object.keys(departmentCount),
      datasets: [{ label: "Interns", data: Object.values(departmentCount) }]
    }
  });

  charts.duration = new Chart(document.getElementById("durationChart"), {
    type: 'pie',
    data: {
      labels: Object.keys(durationCount),
      datasets: [{ label: "Interns", data: Object.values(durationCount) }]
    }
  });
}