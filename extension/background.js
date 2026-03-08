// background.js — Manifest V3 service worker
// Intercepts Google search navigations and redirects exact-match shortcut keys.

const DEFAULT_SHORTCUTS = {
  g: "https://www.google.com",
  y: "https://www.youtube.com"
};

/**
 * Load shortcuts from chrome.storage.local.
 * Falls back to DEFAULT_SHORTCUTS if nothing is stored yet.
 */
async function getShortcuts() {
  return new Promise((resolve) => {
    chrome.storage.local.get("shortcuts", (result) => {
      resolve(result.shortcuts || DEFAULT_SHORTCUTS);
    });
  });
}

/**
 * On install / update: seed storage with DEFAULT_SHORTCUTS if empty.
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("shortcuts", (result) => {
    if (!result.shortcuts) {
      chrome.storage.local.set({ shortcuts: DEFAULT_SHORTCUTS });
    }
  });
});

/**
 * Handle fetch requests from the popup.
 * Popup cannot fetch external URLs directly in MV3; it sends a message here instead.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "FETCH_JSON") {
    fetch(message.url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(`JSON parse error: ${e.message}\n\nRaw content preview:\n${text.slice(0, 200)}`);
        }
        sendResponse({ ok: true, data });
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true; // keep channel open for async response
  }
});

/**
 * Listen for tab URL changes.
 * When Chrome searches Google for a query that exactly matches a shortcut key,
 * redirect the tab to the shortcut URL.
 *
 * Example: user types "y" + Enter → Chrome navigates to
 * https://www.google.com/search?q=y  →  we redirect to https://www.youtube.com
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  const url = changeInfo.url;
  if (!url) return;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }

  // Only intercept Google search pages
  if (
    parsed.hostname !== "www.google.com" ||
    parsed.pathname !== "/search"
  ) {
    return;
  }

  const query = (parsed.searchParams.get("q") || "").trim().toLowerCase();
  if (!query) return;

  const shortcuts = await getShortcuts();
  const target = shortcuts[query];
  if (target) {
    chrome.tabs.update(tabId, { url: target });
  }
});
