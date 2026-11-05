"use strict";

const STORAGE_KEYS = {
  toggles: "ridesafe-preview-toggles",
  lockMethod: "ridesafe-preview-lock-method",
  alarmTime: "ridesafe-preview-alarm-time",
  documents: "ridesafe-preview-document-names",
  contact: "ridesafe-preview-emergency-contact",
  locked: "ridesafe-preview-bike-locked"
};

const toast = document.querySelector("#toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3800);
}

function storeValue(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.error("Could not save this preview setting.", error);
    showToast("This browser could not save the setting. It may not be available next time.");
  }
}

function readValue(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.error("Could not read preview settings.", error);
    showToast("Saved settings are unavailable in this browser session.");
    return null;
  }
}

const navSidebar = document.querySelector("#sidebar");
const mobileMenu = document.querySelector("#mobile-menu");
mobileMenu.addEventListener("click", () => {
  const isOpen = navSidebar.classList.toggle("open");
  mobileMenu.setAttribute("aria-expanded", String(isOpen));
  mobileMenu.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});
navSidebar.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    navSidebar.classList.remove("open");
    mobileMenu.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-label", "Open navigation");
    navSidebar.querySelectorAll(".nav-link").forEach((item) => item.classList.toggle("active", item === link));
  });
});

const now = new Date();
document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric"
}).format(now);
document.querySelector("#greeting-date").textContent = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "long",
  day: "numeric"
}).format(now).toUpperCase();

const toggleDefaults = {
  "theft-alerts": true,
  alarm: false,
  "emergency-alerts": false,
  "helmet-reminder": true,
  "smart-lock": true
};
let savedToggles = {};
try {
  savedToggles = JSON.parse(readValue(STORAGE_KEYS.toggles) || "{}");
} catch (error) {
  console.error("Saved preview toggles are invalid.", error);
  showToast("Saved feature settings could not be read; default settings are shown.");
}

function updateToggle(button, enabled, persist = true) {
  const name = button.dataset.toggle;
  button.setAttribute("aria-checked", String(enabled));
  if (persist) {
    savedToggles[name] = enabled;
    storeValue(STORAGE_KEYS.toggles, JSON.stringify(savedToggles));
  }
  const status = document.querySelector(`[data-state-for="${name}"]`);
  if (status) {
    const featureName = name === "theft-alerts" ? "Monitoring" : "Reminder";
    status.textContent = `${featureName} ${enabled ? "on" : "off"}`;
  }
  if (name === "theft-alerts") {
    document.querySelector("#security-state").textContent = enabled ? "Armed" : "Paused";
  }
}

document.querySelectorAll(".switch[data-toggle]").forEach((button) => {
  const key = button.dataset.toggle;
  const enabled = typeof savedToggles[key] === "boolean"
    ? savedToggles[key]
    : button.getAttribute("aria-checked") === "true" && toggleDefaults[key];
  updateToggle(button, enabled, false);
  button.addEventListener("click", () => {
    const next = button.getAttribute("aria-checked") !== "true";
    updateToggle(button, next);
    const labels = {
      "theft-alerts": "Theft alert preference",
      alarm: "Bike alarm preference",
      "emergency-alerts": "Emergency alert preference",
      "helmet-reminder": "Helmet reminder",
      "smart-lock": "Lock setting"
    };
    showToast(`${labels[key]} ${next ? "on" : "off"} in this preview.`);
  });
});

const lockButton = document.querySelector("#lock-button");
const lockButtonText = document.querySelector("#lock-button-text");
let isLocked = readValue(STORAGE_KEYS.locked) !== "false";
function renderLockState() {
  lockButtonText.textContent = isLocked ? "Bike is locked" : "Bike is unlocked";
  document.querySelector("#security-state").textContent =
    document.querySelector('[data-toggle="theft-alerts"]').getAttribute("aria-checked") === "true"
      ? (isLocked ? "Armed" : "Paused")
      : "Paused";
  lockButton.querySelector(".button-icon").textContent = isLocked ? "⌑" : "⌕";
}
renderLockState();
lockButton.addEventListener("click", () => {
  isLocked = !isLocked;
  storeValue(STORAGE_KEYS.locked, String(isLocked));
  renderLockState();
  showToast(`Preview only: bike marked ${isLocked ? "locked" : "unlocked"}. No real lock was changed.`);
});

const lockMethod = document.querySelector("#lock-method");
const savedLockMethod = readValue(STORAGE_KEYS.lockMethod);
if (savedLockMethod && [...lockMethod.options].some((option) => option.value === savedLockMethod)) {
  lockMethod.value = savedLockMethod;
}
lockMethod.addEventListener("change", () => {
  storeValue(STORAGE_KEYS.lockMethod, lockMethod.value);
  showToast(`${lockMethod.value} selected for the app preview. No PIN or pattern is stored.`);
});

const alarmTime = document.querySelector("#alarm-time");
const savedAlarmTime = readValue(STORAGE_KEYS.alarmTime);
if (savedAlarmTime && /^\d{2}:\d{2}$/.test(savedAlarmTime)) alarmTime.value = savedAlarmTime;
alarmTime.addEventListener("change", () => {
  storeValue(STORAGE_KEYS.alarmTime, alarmTime.value);
  showToast(`Alarm time set to ${alarmTime.value}. This preview does not schedule an alarm.`);
});

document.querySelector("#engine-stop-button").addEventListener("click", () => {
  const approved = window.confirm("Send a demo engine-stop request? No motorcycle is connected, so no engine will be affected.");
  if (approved) showToast("Demo request recorded. No engine-stop command was sent.");
});

document.querySelectorAll("[data-toast]").forEach((button) => {
  button.addEventListener("click", () => showToast(button.dataset.toast));
});

document.querySelector(".banner-close").addEventListener("click", (event) => {
  event.currentTarget.closest(".demo-banner").remove();
});

function showPhoneLocation(position) {
  const latitude = position.coords.latitude.toFixed(5);
  const longitude = position.coords.longitude.toFixed(5);
  document.querySelector("#location-title").textContent = "Phone GPS checked";
  document.querySelector("#location-detail").textContent = `${latitude}, ${longitude} · not plotted, phone only`;
  showToast("Phone location checked. Your bike location is still unavailable.");
}

function handleLocationError(error) {
  const messages = {
    1: "Location permission was denied. Allow location access in your browser to use this feature.",
    2: "Your phone’s location is currently unavailable. Try again when GPS reception improves.",
    3: "Location check timed out. Please try again."
  };
  showToast(messages[error.code] || "Could not read your phone location. Check your browser settings and try again.");
}

function checkPhoneLocation() {
  if (!navigator.geolocation) {
    showToast("This browser does not support phone location.");
    return;
  }
  showToast("Requesting your phone location. You can decline permission.");
  navigator.geolocation.getCurrentPosition(showPhoneLocation, handleLocationError, {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 0
  });
}

document.querySelector("#phone-location-button").addEventListener("click", checkPhoneLocation);

const tripButton = document.querySelector("#trip-button");
const tripDistance = document.querySelector("#trip-distance");
const tripDuration = document.querySelector("#trip-duration");
let tripWatchId = null;
let tripStartTime = 0;
let tripMeters = 0;
let lastTripPosition = null;
let tripClock;

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function distanceBetween(first, second) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latDelta = radians(second.latitude - first.latitude);
  const lonDelta = radians(second.longitude - first.longitude);
  const value = Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude)) *
    Math.sin(lonDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function finishTrip() {
  if (tripWatchId !== null) navigator.geolocation.clearWatch(tripWatchId);
  tripWatchId = null;
  window.clearInterval(tripClock);
  tripButton.innerHTML = 'Start a trip <span>↗</span>';
  document.querySelector("#trip-state").textContent = "READY";
  showToast(`Trip ended · ${tripDistance.textContent} km recorded using phone GPS.`);
}

function startTrip() {
  if (!navigator.geolocation) {
    showToast("This browser does not support GPS trip tracking.");
    return;
  }
  showToast("Allow phone location to start recording this trip.");
  navigator.geolocation.getCurrentPosition((position) => {
    lastTripPosition = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
    tripMeters = 0;
    tripStartTime = Date.now();
    tripDistance.textContent = "0.0";
    tripButton.innerHTML = "End trip <span>■</span>";
    document.querySelector("#trip-state").textContent = "RECORDING";
    tripClock = window.setInterval(() => {
      tripDuration.textContent = formatDuration(Math.floor((Date.now() - tripStartTime) / 1000));
    }, 1000);
    tripWatchId = navigator.geolocation.watchPosition((nextPosition) => {
      if (nextPosition.coords.accuracy > 60) return;
      const current = {
        latitude: nextPosition.coords.latitude,
        longitude: nextPosition.coords.longitude
      };
      if (lastTripPosition) {
        const segment = distanceBetween(lastTripPosition, current);
        if (segment < 1000) tripMeters += segment;
      }
      lastTripPosition = current;
      tripDistance.textContent = (tripMeters / 1000).toFixed(1);
    }, handleLocationError, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    });
    showToast("Trip recording started. Keep the page open while you ride.");
  }, handleLocationError, {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 0
  });
}

tripButton.addEventListener("click", () => {
  if (tripWatchId !== null) finishTrip();
  else startTrip();
});

const contactDialog = document.querySelector("#contact-dialog");
const contactForm = document.querySelector("#contact-form");
const contactSummary = document.querySelector("#contact-summary");
let emergencyContact = null;
try {
  emergencyContact = JSON.parse(readValue(STORAGE_KEYS.contact) || "null");
} catch (error) {
  console.error("Saved emergency contact is invalid.", error);
  showToast("Saved emergency contact could not be read.");
}

function renderContact() {
  contactSummary.textContent = emergencyContact
    ? `${emergencyContact.name} · ${emergencyContact.phone}`
    : "No contact saved";
}
renderContact();

function openContactDialog() {
  if (emergencyContact) {
    document.querySelector("#contact-name").value = emergencyContact.name;
    document.querySelector("#contact-phone").value = emergencyContact.phone;
  }
  contactDialog.showModal();
}

document.querySelector("#contact-settings-button").addEventListener("click", openContactDialog);
document.querySelector("#sos-button").addEventListener("click", () => {
  if (!emergencyContact) {
    openContactDialog();
    return;
  }
  const confirmed = window.confirm(
    `Preview only: no message will be sent. If this is a real emergency, contact ${emergencyContact.name} at ${emergencyContact.phone} directly.`
  );
  if (confirmed) showToast("No SOS was sent. This preview is not connected to emergency services.");
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => contactDialog.close());
});
contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const formData = new FormData(contactForm);
  const name = String(formData.get("name")).trim();
  const phone = String(formData.get("phone")).trim();
  if (phone.replace(/\D/g, "").length < 7) {
    document.querySelector("#contact-phone").setCustomValidity("Enter a phone number with at least 7 digits.");
    contactForm.reportValidity();
    document.querySelector("#contact-phone").setCustomValidity("");
    return;
  }
  emergencyContact = { name, phone };
  storeValue(STORAGE_KEYS.contact, JSON.stringify(emergencyContact));
  renderContact();
  contactDialog.close();
  showToast("Emergency contact saved on this device. No message was sent.");
});
document.querySelector("#contact-phone").addEventListener("input", (event) => event.currentTarget.setCustomValidity(""));

const documentInput = document.querySelector("#document-input");
const documentList = document.querySelector("#document-list");
let savedDocuments = [];
try {
  const parsedDocuments = JSON.parse(readValue(STORAGE_KEYS.documents) || "[]");
  if (Array.isArray(parsedDocuments)) {
    savedDocuments = parsedDocuments.filter((name) => typeof name === "string").slice(0, 20);
  }
} catch (error) {
  console.error("Saved document names are invalid.", error);
  showToast("Saved document names could not be read.");
}

function renderDocuments() {
  documentList.querySelectorAll(".saved-document").forEach((row) => row.remove());
  savedDocuments.forEach((name, index) => {
    const row = document.createElement("div");
    row.className = "document-row saved-document";
    const icon = document.createElement("span");
    icon.className = "document-icon";
    icon.textContent = "▤";
    const details = document.createElement("span");
    details.className = "document-name";
    const title = document.createElement("strong");
    title.textContent = name;
    const note = document.createElement("small");
    note.textContent = "Name only · file stays on your device";
    details.append(title, note);
    const type = document.createElement("span");
    type.className = "document-type";
    type.textContent = name.split(".").pop().slice(0, 4).toUpperCase();
    const remove = document.createElement("button");
    remove.className = "remove-document";
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${name} from the document list`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      savedDocuments = savedDocuments.filter((_, itemIndex) => itemIndex !== index);
      storeValue(STORAGE_KEYS.documents, JSON.stringify(savedDocuments));
      renderDocuments();
      showToast("Document name removed from this device.");
    });
    row.append(icon, details, type, remove);
    documentList.append(row);
  });
}

renderDocuments();
document.querySelector("#add-document-button").addEventListener("click", () => documentInput.click());
documentInput.addEventListener("change", () => {
  const names = [...documentInput.files].map((file) => file.name);
  const additions = names.filter((name) => !savedDocuments.includes(name));
  if (savedDocuments.length + additions.length > 20) {
    showToast("The preview can list up to 20 document names. Remove one before adding more.");
    documentInput.value = "";
    return;
  }
  savedDocuments = [...savedDocuments, ...additions];
  storeValue(STORAGE_KEYS.documents, JSON.stringify(savedDocuments));
  renderDocuments();
  documentInput.value = "";
  if (additions.length) showToast(`${additions.length} document name${additions.length === 1 ? "" : "s"} added. Files were not uploaded or copied.`);
});
