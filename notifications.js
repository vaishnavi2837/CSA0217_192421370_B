
// FITTRACK NOTIFICATION SYSTEM

(function () {
  const STORAGE_KEY = "fitTrackNotifications";
  const STATE_KEY = "fitTrackNotificationState";

  let notifications = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
  );

  function saveNotifications() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }

  function browserAlert(title, message) {
    if ("Notification" in window &&
        Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
      });
    }
  }

  window.addFitTrackNotification = function(title, message) {
    const item = {
      id: Date.now(),
      title: title,
      message: message,
      time: new Date().toLocaleString(),
      read: false
    };

    notifications.unshift(item);
    notifications = notifications.slice(0, 30);
    saveNotifications();
    renderNotifications();
    browserAlert(title, message);
  };

  // Create notification bell
  const bell = document.createElement("div");
  bell.id = "fitNotificationBell";
  bell.innerHTML = `
    <button id="notificationButton" title="Notifications">
      🔔 <span id="notificationCount">0</span>
    </button>
    <div id="notificationPanel">
      <div class="notification-header">
        <h3>Notifications</h3>
        <button id="closeNotifications">✕</button>
      </div>
      <button id="enableBrowserNotifications">
        Enable Browser Notifications
      </button>
      <button id="clearNotifications">Clear All</button>
      <div id="notificationList"></div>
    </div>
  `;

  document.body.appendChild(bell);

  // Notification styles
  const style = document.createElement("style");
  style.textContent = `
    #fitNotificationBell {
      position: fixed;
      top: 18px;
      right: 25px;
      z-index: 99999;
      font-family: Arial, sans-serif;
    }

    #notificationButton {
      background: #16865f;
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 30px;
      cursor: pointer;
      font-size: 17px;
      box-shadow: 0 3px 12px #0002;
    }

    #notificationCount {
      background: #ff5252;
      color: white;
      padding: 3px 7px;
      border-radius: 50%;
      font-size: 12px;
    }

    #notificationPanel {
      display: none;
      position: absolute;
      top: 52px;
      right: 0;
      width: 320px;
      max-height: 430px;
      overflow-y: auto;
      background: white;
      color: #164c39;
      border-radius: 14px;
      padding: 15px;
      box-shadow: 0 5px 25px #0003;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .notification-header h3 {
      margin: 5px 0 15px;
    }

    #closeNotifications {
      border: none;
      background: none;
      cursor: pointer;
      font-size: 18px;
    }

    #enableBrowserNotifications,
    #clearNotifications {
      width: 100%;
      padding: 10px;
      margin-bottom: 8px;
      border: none;
      border-radius: 8px;
      background: #e5f5eb;
      color: #176044;
      cursor: pointer;
    }

    .notification-item {
      padding: 12px;
      margin-top: 9px;
      border-radius: 9px;
      background: #f0f8f3;
      border-left: 4px solid #28a477;
    }

    .notification-item.unread {
      background: #dff5e6;
    }

    .notification-item p {
      margin: 5px 0;
      font-size: 13px;
    }

    .notification-item small {
      color: #718579;
    }

    @media(max-width: 500px) {
      #fitNotificationBell {
        right: 12px;
        top: 12px;
      }
      #notificationPanel {
        width: 280px;
      }
    }
  `;
  document.head.appendChild(style);

  const panel = document.getElementById("notificationPanel");

  document.getElementById("notificationButton").onclick = function() {
    panel.style.display =
      panel.style.display === "block" ? "none" : "block";

    notifications.forEach(item => item.read = true);
    saveNotifications();
    renderNotifications();
  };

  document.getElementById("closeNotifications").onclick = function() {
    panel.style.display = "none";
  };

  document.getElementById("clearNotifications").onclick = function() {
    notifications = [];
    saveNotifications();
    renderNotifications();
  };

  document.getElementById("enableBrowserNotifications").onclick =
    async function() {
      if (!("Notification" in window)) {
        alert("This browser does not support notifications.");
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        alert("Browser notifications enabled!");
        browserAlert("FitTrack", "Notifications are now enabled!");
      } else {
        alert("Please allow notifications in your browser settings.");
      }
    };

  function renderNotifications() {
    const list = document.getElementById("notificationList");
    const unread = notifications.filter(item => !item.read).length;

    document.getElementById("notificationCount").textContent = unread;

    if (notifications.length === 0) {
      list.innerHTML = "<p>No notifications yet.</p>";
      return;
    }

    list.innerHTML = notifications.map(item => `
      <div class="notification-item ${item.read ? "" : "unread"}">
        <strong>${escapeText(item.title)}</strong>
        <p>${escapeText(item.message)}</p>
        <small>${escapeText(item.time)}</small>
      </div>
    `).join("");
  }

  function escapeText(value) {
    const div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
  }

  // Detect new activities and achievement unlocks
  function checkFitnessUpdates() {
    const records = JSON.parse(
      localStorage.getItem("fitnessRecords") || "[]"
    );

    const goal = Number(localStorage.getItem("fitnessGoal")) || 8000;

    const now = new Date();
    const today = now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0");

    const todaySteps = records
      .filter(r => r.date === today)
      .reduce((sum, r) => sum + Number(r.steps || 0), 0);

    const state = {
      count: records.length,
      goalReached: todaySteps >= goal,
      masterReached: todaySteps >= 10000,
      today: today
    };

    const previous = JSON.parse(
      localStorage.getItem(STATE_KEY) || "null"
    );

    if (previous && previous.today === today) {
      if (state.count > previous.count) {
        addFitTrackNotification(
          "💪 Activity Saved",
          "Your new fitness activity has been recorded!"
        );

        if (!previous.goalReached && state.goalReached) {
          addFitTrackNotification(
            "🎯 Goal Crusher Unlocked!",
            "Congratulations! You reached your daily step goal."
          );
        }

        if (!previous.masterReached && state.masterReached) {
          addFitTrackNotification(
            "🥇 Step Master Unlocked!",
            "Amazing! You completed 10,000 steps today."
          );
        }
      }
    }

    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  renderNotifications();
  checkFitnessUpdates();
  setInterval(checkFitnessUpdates, 2000);
  // Automatic Water Reminder - Every 1 Hour
setInterval(function () {
  addFitTrackNotification(
    "💧 Water Reminder",
    "Hey! It's time to drink a glass of water. Stay hydrated!"
  );
},60 * 1000);

})();
