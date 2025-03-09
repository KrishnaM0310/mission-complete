document.addEventListener("DOMContentLoaded", () => {
    const missionContainer = document.getElementById("missionContainer");
    const defaultPomodoroTime = 1500; // 25 minutes
  
    chrome.runtime.sendMessage({ type: "getTrackingState" }, (response) => {
      if (response.isTracking) {
        showActiveMission(response.goal);
      } else {
        showMissionSetup();
      }
    });
  
    function showMissionSetup() {
      missionContainer.innerHTML = `
        <h1 class="rocket-title">RocketFocus</h1>
        <p class="rocket-paragraph">Enter your mission objective below:</p>
  
        <img 
          src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3FjN2ZrZjNwNnp6bzFoMDBxY251aDB2dDZ1MXZiaXluODg0ZXV1bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4KhQo2MESJkc6QbS/giphy.gif" 
          alt="Rocket GIF" 
          class="rocket-image"
          id="rocketGif"
        />
  
        <input 
          type="text" 
          id="missionInput" 
          class="rocket-input" 
          placeholder="e.g. Finish reading Chapter 3..."
        />
        <button id="launchBtn" class="rocket-button">Launch Mission</button>
        <p id="statusMessage" class="rocket-status"></p>
      `;
  
      document.getElementById("launchBtn").addEventListener("click", () => {
        const missionValue = document.getElementById("missionInput").value.trim();
        if (!missionValue) {
          updateStatus("Please enter a valid mission objective!", "red");
          return;
        }
        chrome.runtime.sendMessage({ type: "startTracking", goal: missionValue }, (response) => {
          if (response.success) {
            showActiveMission(response.goal);
            sendRocketToActiveTab();
          } else {
            updateStatus("Failed to launch mission. Try again!", "red");
          }
        });
      });
    }
  
    function showActiveMission(missionGoal) {
      missionContainer.innerHTML = `
        <h1 class="rocket-title">Mission in Progress</h1>
        <p class="rocket-paragraph">${missionGoal}</p>
        <button id="completeBtn" class="rocket-button">Complete Mission</button>
        <p id="statusMessage" class="rocket-status"></p>
      `;
  
      document.getElementById("completeBtn").addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "stopTracking" }, (response) => {
          if (response.success) {
            recallRocketFromAllTabs();
            showMissionSetup();
          } else {
            updateStatus("Mission completion failed!", "red");
          }
        });
      });
    }
  
    function updateStatus(msg, color) {
      const statusMessage = document.getElementById("statusMessage");
      if (!statusMessage) return;
      statusMessage.textContent = msg;
      statusMessage.style.color = color;
    }
  
    function sendRocketToActiveTab() {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "rocketArrives" });
        }
      });
    }
  
    function recallRocketFromAllTabs() {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { action: "rocketDeparts" });
        });
      });
    }
  
    function formatTime(seconds) {
      const m = Math.floor(seconds / 60).toString().padStart(2, "0");
      const s = (seconds % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    }
  
    function showPomodoroTimer() {
      const timerContainer = document.createElement("div");
      timerContainer.id = "timerContainer";
      document.body.appendChild(timerContainer);
  
      timerContainer.innerHTML = `
        <h2 class="rocket-title">Focus Timer</h2>
        <p id="timerDisplay" class="rocket-paragraph">${formatTime(defaultPomodoroTime)}</p>
        <div>
          <button id="startTimerBtn" class="rocket-button">Start</button>
          <button id="pauseTimerBtn" class="rocket-button" style="display: none;">Pause</button>
          <button id="resetTimerBtn" class="rocket-button">Reset</button>
        </div>
      `;
  
      document.getElementById("startTimerBtn").addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "startPomodoro" }, (response) => {
          if (response.success) refreshTimerUI();
        });
      });
  
      document.getElementById("pauseTimerBtn").addEventListener("click", () => {
        const btn = document.getElementById("pauseTimerBtn");
        if (btn.textContent === "Pause") {
          chrome.runtime.sendMessage({ type: "pausePomodoro" }, (response) => {
            if (response.success) refreshTimerUI();
          });
        } else {
          chrome.runtime.sendMessage({ type: "resumePomodoro" }, (response) => {
            if (response.success) refreshTimerUI();
          });
        }
      });
  
      document.getElementById("resetTimerBtn").addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "resetPomodoro" }, (response) => {
          if (response.success) refreshTimerUI();
        });
      });
  
      setInterval(refreshTimerUI, 1000);
    }
  
    function refreshTimerUI() {
      chrome.runtime.sendMessage({ type: "getPomodoroStatus" }, (response) => {
        if (response.success) {
          document.getElementById("timerDisplay").textContent = formatTime(response.remainingTime);
          const pauseBtn = document.getElementById("pauseTimerBtn");
          const startBtn = document.getElementById("startTimerBtn");
          if (response.status === "running") {
            startBtn.style.display = "none";
            pauseBtn.style.display = "inline-block";
            pauseBtn.textContent = "Pause";
          } else if (response.status === "paused") {
            startBtn.style.display = "none";
            pauseBtn.style.display = "inline-block";
            pauseBtn.textContent = "Resume";
          } else {
            startBtn.style.display = "inline-block";
            pauseBtn.style.display = "none";
          }
        }
      });
    }
  
    // Initialize
    showMissionSetup();
    showPomodoroTimer();
  });
  