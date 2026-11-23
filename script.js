
const form = document.getElementById("activityForm");
const historyBody = document.getElementById("history");

let records = JSON.parse(localStorage.getItem("fitnessRecords")) || [];
let dailyGoal = Number(localStorage.getItem("fitnessGoal")) || 8000;

// Set today's date
if (document.getElementById("date")) {
  document.getElementById("date").value =
    new Date().toISOString().split("T")[0];
}

if (document.getElementById("goalInput")) {
  document.getElementById("goalInput").value = dailyGoal;
}

// Save data
function saveData() {
  localStorage.setItem("fitnessRecords", JSON.stringify(records));
  localStorage.setItem("fitnessGoal", dailyGoal);
}

// Calculate calories
function calculateCalories(duration, weight) {
  return Math.round(5 * 3.5 * weight / 200 * duration);
}

// Today's records
function getTodayRecords() {
  const today = new Date().toISOString().split("T")[0];
  return records.filter(record => record.date === today);
}

// Dashboard display
function render() {
  const todayRecords = getTodayRecords();

  const totalSteps = todayRecords.reduce(
    (sum, item) => sum + Number(item.steps || 0), 0
  );

  const totalCalories = todayRecords.reduce(
    (sum, item) => sum + Number(item.calories || 0), 0
  );

  const totalDistance = todayRecords.reduce(
    (sum, item) => sum + Number(item.distance || 0), 0
  );

  const stepsElement = document.getElementById("steps");
  const caloriesElement = document.getElementById("calories");
  const distanceElement = document.getElementById("distanceDisplay");

  if (stepsElement) {
    stepsElement.textContent = totalSteps.toLocaleString();
  }

  if (caloriesElement) {
    caloriesElement.textContent = totalCalories;
  }

  if (distanceElement) {
    distanceElement.textContent = totalDistance.toFixed(2) + " km";
  }

  // BMI
  const latest = records.length ? records[records.length - 1] : null;

  if (latest) {
    const heightInMeters = Number(latest.height) / 100;
    const bmi = Number(latest.weight) /
      (heightInMeters * heightInMeters);

    const bmiElement = document.getElementById("bmi");
    const bmiStatus = document.getElementById("bmiStatus");

    if (bmiElement) {
      bmiElement.textContent = bmi.toFixed(1);
    }

    let status = "Normal range";

    if (bmi < 18.5) status = "Below normal range";
    else if (bmi < 25) status = "Normal range";
    else if (bmi < 30) status = "Above normal range";
    else status = "High BMI range";

    if (bmiStatus) {
      bmiStatus.textContent = status;
    }
  }

  // Daily goal progress
  const percentage = Math.min(
    100, Math.round(totalSteps / dailyGoal * 100)
  );

  const progressText = document.getElementById("progressText");
  const progressBar = document.getElementById("progressBar");
  const goalMessage = document.getElementById("goalMessage");

  if (progressText) {
    progressText.textContent = percentage + "%";
  }

  if (progressBar) {
    progressBar.style.width = percentage + "%";
  }

  if (goalMessage) {
    goalMessage.textContent =
      totalSteps >= dailyGoal
        ? "Great work! You reached your daily goal."
        : `${Math.max(0, dailyGoal - totalSteps)} steps left to reach your goal.`;
  }

  // Activity history on dashboard
  if (historyBody) {
    if (records.length === 0) {
      historyBody.innerHTML =
        '<tr><td colspan="5">No activity records yet.</td></tr>';
    } else {
      historyBody.innerHTML = records.map(record => `
        <tr>
          <td>${record.date || "-"}</td>
          <td>${Number(record.steps || 0).toLocaleString()}</td>
          <td>${record.duration || 0} min</td>
          <td>${record.calories || 0} kcal</td>
          <td>
            <button class="delete-btn"
              onclick="deleteRecord(${record.id})">
              Delete
            </button>
          </td>
        </tr>
      `).join("");
    }
  }

  updateAchievementBadges();
  showWeeklyChart();
}

// Save activity
if (form) {
  form.addEventListener("submit", function(event) {
    event.preventDefault();

    const date = document.getElementById("date").value;
    const exerciseType = document.getElementById("exerciseType").value;
    const exerciseName = document.getElementById("exerciseName").value;
    const distance = Number(document.getElementById("distance").value);
    const steps = Number(document.getElementById("stepInput").value);
    const duration = Number(document.getElementById("duration").value);
    const weight = Number(document.getElementById("weight").value);
    const height = Number(document.getElementById("height").value);

    if (
      !date ||
      !exerciseType ||
      !exerciseName.trim() ||
      !Number.isFinite(distance) ||
      distance < 0 ||
      !Number.isFinite(steps) ||
      steps < 0 ||
      !Number.isFinite(duration) ||
      duration <= 0 ||
      weight <= 0 ||
      height <= 0
    ) {
      alert("Please enter valid activity details.");
      return;
    }

    const calories = calculateCalories(duration, weight);

    records.push({
      id: Date.now(),
      date,
      exerciseType,
      exerciseName,
      distance,
      steps,
      duration,
      weight,
      height,
      calories
    });

    saveData();
    render();
    form.reset();

    document.getElementById("date").value =
      new Date().toISOString().split("T")[0];

    alert("Activity saved successfully!");
  });
}

// Update daily goal
const goalButton = document.getElementById("goalButton");

if (goalButton) {
  goalButton.addEventListener("click", function() {
    const newGoal = Number(
      document.getElementById("goalInput").value
    );

    if (newGoal <= 0) {
      alert("Please enter a valid goal.");
      return;
    }

    dailyGoal = newGoal;
    saveData();
    render();

    alert("Daily goal updated!");
  });
}

// Delete activity
function deleteRecord(id) {
  records = records.filter(record => record.id !== id);
  saveData();
  render();
}

// Make deleteRecord available to HTML buttons
window.deleteRecord = deleteRecord;

// Weekly chart
function showWeeklyChart() {
  const canvas = document.getElementById("weeklyChart");

  if (!canvas || typeof Chart === "undefined") return;

  const labels = [];
  const stepData = [];

  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);

    const dateKey = day.toISOString().split("T")[0];

    labels.push(day.toLocaleDateString("en-US", {
      weekday: "short"
    }));

    const total = records
      .filter(record => record.date === dateKey)
      .reduce((sum, record) => sum + Number(record.steps || 0), 0);

    stepData.push(total);
  }

  if (window.weeklyChartInstance) {
    window.weeklyChartInstance.destroy();
  }

  window.weeklyChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Steps",
        data: stepData,
        backgroundColor: "#28a477",
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Achievement badges
function updateAchievementBadges() {
  const todayRecords = getTodayRecords();

  const todaySteps = todayRecords.reduce(
    (sum, item) => sum + Number(item.steps || 0), 0
  );

  const firstBadge = document.getElementById("firstBadge");
  const goalBadge = document.getElementById("goalBadge");
  const masterBadge = document.getElementById("masterBadge");

  if (firstBadge) {
    firstBadge.textContent =
      records.length > 0 ? "🏆 Unlocked!" : "🔒 Locked";
  }

  if (goalBadge) {
    goalBadge.textContent =
      todaySteps >= dailyGoal ? "🏆 Unlocked!" : "🔒 Locked";
  }

  if (masterBadge) {
    masterBadge.textContent =
      todaySteps >= 10000 ? "🏆 Unlocked!" : "🔒 Locked";
  }
}

// Water tracker
let waterCount = Number(localStorage.getItem("waterCount")) || 0;

function updateWaterDisplay() {
  const countElement = document.getElementById("waterCount");
  const progressElement = document.getElementById("waterProgress");
  const messageElement = document.getElementById("waterMessage");

  if (countElement) {
    countElement.textContent = waterCount;
  }

  if (progressElement) {
    progressElement.style.width =
      Math.min(waterCount / 8 * 100, 100) + "%";
  }

  if (messageElement) {
    messageElement.textContent =
      waterCount >= 8
        ? "Great! Daily water goal completed! 🎉"
        : `${8 - waterCount} glasses left to reach your goal.`;
  }
}

function addWater() {
  if (waterCount < 8) {
    waterCount++;
    localStorage.setItem("waterCount", waterCount);
    updateWaterDisplay();
  }
}

function resetWater() {
  waterCount = 0;
  localStorage.setItem("waterCount", waterCount);
  updateWaterDisplay();
}

window.addWater = addWater;
window.resetWater = resetWater;

// Dark mode
const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️ Light Mode";
  }

  themeToggle.addEventListener("click", function() {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    localStorage.setItem("darkMode", isDark);

    themeToggle.textContent = isDark
      ? "☀️ Light Mode"
      : "🌙 Dark Mode";
  });
}

// Initial display
render();
updateWaterDisplay();
