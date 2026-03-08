// popup.js

const DEFAULT_SHORTCUTS = {
  g: "https://www.google.com",
  y: "https://www.youtube.com"
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const COMMUNITY_URL =
  "https://raw.githubusercontent.com/alperugurca/HopKey/refs/heads/main/shortcuts.json";

const inputKey       = document.getElementById("input-key");
const inputUrl       = document.getElementById("input-url");
const btnAdd         = document.getElementById("btn-add");
const shortcutList   = document.getElementById("shortcut-list");
const btnExport      = document.getElementById("btn-export");
const btnImportFile  = document.getElementById("btn-import-file");
const btnImportMain  = document.getElementById("btn-import-main");
const fileInput      = document.getElementById("file-input");
const inputUrlImport = document.getElementById("input-url-import");
const btnImportUrl   = document.getElementById("btn-import-url");
const statusMsg      = document.getElementById("status-msg");

// ── Storage helpers ───────────────────────────────────────────────────────────
function loadShortcuts() {
  return new Promise((resolve) => {
    chrome.storage.local.get("shortcuts", (result) => {
      resolve(result.shortcuts || { ...DEFAULT_SHORTCUTS });
    });
  });
}

function saveShortcuts(shortcuts) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ shortcuts }, resolve);
  });
}

// ── Render list ───────────────────────────────────────────────────────────────
function renderList(shortcuts) {
  shortcutList.innerHTML = "";
  const entries = Object.entries(shortcuts).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  if (entries.length === 0) {
    shortcutList.innerHTML =
      '<p class="empty-msg">No shortcuts yet. Add one above.</p>';
    return;
  }

  entries.forEach(([key, url]) => {
    const row = document.createElement("div");
    row.className = "shortcut-row";

    const keySpan = document.createElement("span");
    keySpan.className = "shortcut-key";
    keySpan.textContent = key;

    const urlSpan = document.createElement("span");
    urlSpan.className = "shortcut-url";
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = url;
    urlSpan.appendChild(a);

    const delBtn = document.createElement("button");
    delBtn.className = "btn-delete";
    delBtn.textContent = "×";
    delBtn.title = `Delete shortcut "${key}"`;
    delBtn.addEventListener("click", async () => {
      const current = await loadShortcuts();
      delete current[key];
      await saveShortcuts(current);
      renderList(current);
      showStatus(`Deleted "${key}".`);
    });

    row.appendChild(keySpan);
    row.appendChild(urlSpan);
    row.appendChild(delBtn);
    shortcutList.appendChild(row);
  });
}

// ── Status message ────────────────────────────────────────────────────────────
let statusTimer;
function showStatus(msg, isError = false) {
  clearTimeout(statusTimer);
  statusMsg.textContent = msg;
  statusMsg.className = "status-msg" + (isError ? " error" : "");
  statusTimer = setTimeout(() => {
    statusMsg.textContent = "";
    statusMsg.className = "status-msg";
  }, 3000);
}

// ── Validate and normalise URL ────────────────────────────────────────────────
function normaliseUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).href;
  } catch {
    try {
      return new URL("https://" + trimmed).href;
    } catch {
      return null;
    }
  }
}

// ── Add shortcut ──────────────────────────────────────────────────────────────
btnAdd.addEventListener("click", async () => {
  const key = inputKey.value.trim().toLowerCase();
  const url = normaliseUrl(inputUrl.value);

  if (!key) {
    showStatus("Key cannot be empty.", true);
    return;
  }
  if (!url) {
    showStatus("Invalid URL.", true);
    return;
  }

  const shortcuts = await loadShortcuts();
  shortcuts[key] = url;
  await saveShortcuts(shortcuts);
  renderList(shortcuts);
  inputKey.value = "";
  inputUrl.value = "";
  showStatus(`Added "${key}" → ${url}`);
});

// Allow pressing Enter in key field to jump to URL field
inputKey.addEventListener("keydown", (e) => {
  if (e.key === "Enter") inputUrl.focus();
});

// Allow pressing Enter in URL field to trigger Add
inputUrl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnAdd.click();
});

// ── Export JSON ───────────────────────────────────────────────────────────────
btnExport.addEventListener("click", async () => {
  const shortcuts = await loadShortcuts();
  const json = JSON.stringify(shortcuts, null, 4);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "shortcuts.json";
  a.click();
  URL.revokeObjectURL(url);
  showStatus("Exported shortcuts.json");
});

// ── Import JSON from file ─────────────────────────────────────────────────────
btnImportFile.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  fileInput.value = "";

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (typeof data !== "object" || Array.isArray(data)) {
      showStatus("Invalid JSON: expected an object.", true);
      return;
    }
    const existing = await loadShortcuts();
    const merged = { ...existing, ...normaliseShortcuts(data) };
    await saveShortcuts(merged);
    renderList(merged);
    showStatus(`Imported ${Object.keys(data).length} shortcuts from file.`);
  } catch (err) {
    showStatus("Failed to parse JSON file.", true);
  }
});

// ── Fetch via background service worker (avoids MV3 popup CSP restrictions) ──
function fetchJsonViaBackground(url) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "FETCH_JSON", url }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response && response.ok) {
        resolve(response.data);
      } else {
        reject(new Error(response?.error || "Unknown error"));
      }
    });
  });
}

// ── Import community shortcuts (hardcoded GitHub URL) ────────────────────────
btnImportMain.addEventListener("click", async () => {
  showStatus("Fetching community shortcuts...");
  try {
    const data = await fetchJsonViaBackground(COMMUNITY_URL);
    const existing = await loadShortcuts();
    const merged = { ...existing, ...normaliseShortcuts(data) };
    await saveShortcuts(merged);
    renderList(merged);
    showStatus(`Imported ${Object.keys(data).length} community shortcuts.`);
  } catch (err) {
    showStatus(`Error: ${err.message}`, true);
  }
});

// ── Import JSON from URL ──────────────────────────────────────────────────────
btnImportUrl.addEventListener("click", async () => {
  const rawUrl = inputUrlImport.value.trim();
  if (!rawUrl) {
    showStatus("Paste a raw GitHub URL first.", true);
    return;
  }

  showStatus("Fetching...");
  try {
    const data = await fetchJsonViaBackground(rawUrl);
    if (typeof data !== "object" || Array.isArray(data)) {
      showStatus("Invalid JSON: expected an object.", true);
      return;
    }
    const existing = await loadShortcuts();
    const merged = { ...existing, ...normaliseShortcuts(data) };
    await saveShortcuts(merged);
    renderList(merged);
    inputUrlImport.value = "";
    showStatus(`Imported ${Object.keys(data).length} shortcuts from URL.`);
  } catch (err) {
    showStatus(`Error: ${err.message}`, true);
  }
});

// ── Normalise a shortcuts dict (lowercase keys, string values) ─────────────────
function normaliseShortcuts(data) {
  const result = {};
  for (const [k, v] of Object.entries(data)) {
    const key = String(k).trim().toLowerCase();
    const url = normaliseUrl(String(v));
    if (key && url) result[key] = url;
  }
  return result;
}

// ── Init ──────────────────────────────────────────────────────────────────────
(async () => {
  const shortcuts = await loadShortcuts();
  renderList(shortcuts);
})();
