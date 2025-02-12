// Select elements
const elements = {
  settingsIcon: document.getElementById("settingsIcon"),
  settingsModal: document.getElementById("settingsModal"),
  saveSettingsButton: document.getElementById("saveSettings"),
  countdownTitleElement: document.getElementById("countdownTitle"),
  gridContainer: document.getElementById("gridContainer"),
  tabLifespan: document.getElementById("tabLifespan"),
  tabEvent: document.getElementById("tabEvent"),
  errorMessage: document.getElementById("errorMessage"),
  dobInput: document.getElementById("dobInput"),
  eventTitle: document.getElementById("eventTitle"),
  startDate: document.getElementById("startDate"),
  endDate: document.getElementById("endDate"),
  years: document.getElementById("years"),
  months: document.getElementById("months"),
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
};

// Variables to hold interval IDs
let countdownInterval;
let lastUpdatedSquare = 0;

// Show settings modal
elements.settingsIcon.addEventListener("click", () => {
  elements.settingsModal.style.display = "flex";
  openTab("Lifespan"); // Default to Lifespan tab
});

// Close modal if clicked outside of the modal content
window.addEventListener("click", (event) => {
  if (event.target === elements.settingsModal) {
    elements.settingsModal.style.display = "none";
    resetErrorStyles();
  }
});

// Tab Switching Logic
function openTab(tabName) {
  const tabcontent = document.getElementsByClassName("tabcontent");
  for (let tab of tabcontent) {
    tab.style.display = "none";
  }
  document.getElementById(tabName).style.display = "block";
  resetErrorStyles(); // Clear error styles when switching tabs
}

// Add event listeners for tabs
elements.tabLifespan.addEventListener("click", () => openTab("Lifespan"));
elements.tabEvent.addEventListener("click", () => openTab("Event"));

// Reset error styles for all inputs
function resetErrorStyles() {
  elements.errorMessage.style.display = "none";
  elements.dobInput.style.borderColor = "";
  elements.eventTitle.style.borderColor = "";
  elements.startDate.style.borderColor = "";
  elements.endDate.style.borderColor = "";
}

// Save settings based on selected tab
elements.saveSettingsButton.addEventListener("click", () => {
  const settings = {};
  let totalSquares = 80; // Default for lifespan
  let isValid = true;

  resetErrorStyles(); // Reset any previous error styles

  if (document.getElementById("Lifespan").style.display === "block") {
    const dob = elements.dobInput.value;
    if (dob) {
      // Set lifespan countdown
      settings.type = "lifespan";
      settings.dob = new Date(dob).getTime();
      totalSquares = 80; // Fixed at 80 years
    } else {
      elements.dobInput.style.borderColor = "red";
      isValid = false;
    }
  } else if (document.getElementById("Event").style.display === "block") {
    const eventTitle = elements.eventTitle.value.trim();
    const startDate = elements.startDate.value;
    const endDate = elements.endDate.value;

    if (!eventTitle) {
      elements.eventTitle.style.borderColor = "red";
      isValid = false;
    }

    if (!startDate) {
      elements.startDate.style.borderColor = "red";
      isValid = false;
    }

    if (!endDate) {
      elements.endDate.style.borderColor = "red";
      isValid = false;
    }

    if (
      startDate &&
      endDate &&
      new Date(startDate).getTime() === new Date(endDate).getTime()
    ) {
      elements.startDate.style.borderColor = "red";
      elements.endDate.style.borderColor = "red";
      elements.errorMessage.innerText =
        "Start and end dates cannot be the same.";
      elements.errorMessage.style.display = "block";
      isValid = false;
    }

    if (isValid) {
      settings.type = "event";
      settings.title = eventTitle;
      settings.startDate = new Date(startDate).getTime();
      settings.endDate = new Date(endDate).getTime();

      const totalMonths =
        (new Date(endDate).getFullYear() - new Date(startDate).getFullYear()) *
          12 +
        new Date(endDate).getMonth() -
        new Date(startDate).getMonth();

      settings.totalSquares = totalMonths > 0 ? totalMonths : 1; // Ensure at least 1 month
    }
  }

  if (!isValid) {
    elements.errorMessage.style.display = "block";
    return; // Stop execution if there are validation errors
  }

  settings.totalSquares = totalSquares; // Save the total number of squares
  // Clear existing settings and intervals
  clearIntervals();
  chrome.storage.sync.set({ settings }, () => {
    elements.settingsModal.style.display = "none";
    lastUpdatedSquare = 0; // Reset grid tracking
    loadSettings(); // Load and apply new settings
  });
});

// Load and apply settings
function loadSettings() {
  chrome.storage.sync.get("settings", ({ settings }) => {
    if (settings) {
      const totalSquares = settings.totalSquares || 80; // Default to 80 if not set
      createGrid(totalSquares); // Create the grid with the correct number of squares
      if (settings.type === "lifespan") {
        const lifespan = settings.dob + 80 * 365 * 24 * 60 * 60 * 1000;
        startCountdown(lifespan, settings.dob);
        elements.countdownTitleElement.innerText = "Your Lifespan Countdown";
        updateGrid(Date.now(), settings.dob, lifespan, totalSquares); // Initial color update
      } else if (settings.type === "event") {
        startCountdown(settings.endDate, settings.startDate, settings.title);
        elements.countdownTitleElement.innerText = settings.title;
        updateGrid(
          Date.now(),
          settings.startDate,
          settings.endDate,
          totalSquares
        ); // Initial color update
      }
    }
  });
}

// Countdown and grid initialization
function startCountdown(targetDate, startDate, title) {
  clearIntervals(); // Clear any existing intervals

  // Update the countdown every second
  countdownInterval = setInterval(() => {
    const now = Date.now();
    const remainingTime = targetDate - now;

    if (remainingTime <= 0) {
      elements.countdownTitleElement.innerText = "Countdown Complete!";
      clearIntervals();
      return;
    }

    const years = Math.floor(remainingTime / (365 * 24 * 60 * 60 * 1000));
    const months = Math.floor(
      (remainingTime % (365 * 24 * 60 * 60 * 1000)) / (30 * 24 * 60 * 60 * 1000)
    );
    const days = Math.floor(
      (remainingTime % (30 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000)
    );
    const hours = Math.floor(
      (remainingTime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
    );
    const minutes = Math.floor(
      (remainingTime % (60 * 60 * 1000)) / (60 * 1000)
    );
    const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);

    elements.years.innerText = String(years).padStart(2, "0");
    elements.months.innerText = String(months).padStart(2, "0");
    elements.days.innerText = String(days).padStart(2, "0");
    elements.hours.innerText = String(hours).padStart(2, "0");
    elements.minutes.innerText = String(minutes).padStart(2, "0");
    elements.seconds.innerText = String(seconds).padStart(2, "0");
  }, 1000);
}

// Create grid based on total squares (80 for lifespan, or total months for deadline)
function createGrid(totalSquares) {
  elements.gridContainer.innerHTML = ""; // Clear existing grid

  // Calculate optimal rows and columns to fill screen
  const screenRatio = window.innerWidth / window.innerHeight;
  const columns = Math.ceil(Math.sqrt(totalSquares * screenRatio));
  const rows = Math.ceil(totalSquares / columns);

  // Set grid template for dynamic sizing
  elements.gridContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  elements.gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  for (let i = 0; i < totalSquares; i++) {
    const square = document.createElement("div");
    square.classList.add("square");
    square.style.backgroundColor = "#333"; // Default color for squares
    elements.gridContainer.appendChild(square);
  }
}

// Update grid based on time passed
function updateGrid(now, startDate, targetDate, totalSquares) {
  const squares = document.querySelectorAll(".square");
  const timePassedRatio = startDate
    ? (now - startDate) / (targetDate - startDate)
    : 0;
  const squaresPassed = Math.floor(timePassedRatio * totalSquares);

  for (let i = lastUpdatedSquare; i < squaresPassed; i++) {
    if (i < squares.length) {
      squares[i].style.backgroundColor = "#2e7d32";
    }
  }
  lastUpdatedSquare = squaresPassed;
}

// Clear existing intervals to prevent flickering
function clearIntervals() {
  if (countdownInterval) clearInterval(countdownInterval);
}

// --- Your existing code above ---

// Function to set a random motivational message
function setRandomMotivation() {
  const motivationalMessages = [
    "Every second counts - start living now!",
    "Time is precious, use it wisely.",
    "Don't count the days; make the days count!",
    "Your future is created by what you do today.",
    "Embrace every moment. Create your legacy!",
    "Every second counts - make them meaningful.",
    "Your time is limited. Use it wisely.",
    "The clock is ticking. What will you do today?",
    "Don't wait for the perfect moment - create it.",
    "Make every heartbeat count.",
    "A year from now, you'll wish you started today.",
    "You can't stop time, but you can make it count.",
    "Minutes turn into memories. Make them great.",
    "What you do today shapes your tomorrow.",
    "Live intentionally. Time won't wait.",
  ];

  const messageElement =
    document.getElementById("motivationMessage") ||
    document.querySelector(".message");
  if (messageElement) {
    const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
    messageElement.textContent = motivationalMessages[randomIndex];
  }
}

// Existing DOMContentLoaded listener combined with our random message logic
document.addEventListener("DOMContentLoaded", () => {
  setRandomMotivation();
  loadSettings();
});

// --- The rest of your code below ---
