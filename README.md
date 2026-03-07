# Shortcut Browser

Type a short key in any address bar and get redirected instantly.

Works in two ways:
- **Chrome Extension** — intercepts Google searches in Chrome and redirects them
- **PyQt Desktop Browser** — a lightweight standalone browser with the same logic

All shortcuts live in a single `shortcuts.json` file that anyone can contribute to.

---

## How it works

When you type `y` + Enter in Chrome (or the PyQt browser), the app recognises it as a shortcut and sends you directly to `https://www.youtube.com` — no typing the full URL needed.

---

## Chrome Extension

### Install

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `extension/` folder.
5. The "Shortcut Browser" icon will appear in your toolbar.

### Use

- Click the extension icon to open the popup.
- **Add a shortcut:** type a key (e.g. `gh`) and a URL (e.g. `https://github.com`), press **Add**.
- **Delete a shortcut:** click `×` next to any row.
- **Export:** download your shortcuts as `shortcuts.json`.
- **Import from file:** load a local `shortcuts.json`.
- **Import from URL:** paste the raw GitHub URL below and click **Import from URL**:

```
https://raw.githubusercontent.com/alperugurca/HopKey/refs/heads/main/shortcuts.json
```

---

## PyQt Desktop Browser

### Requirements

```bash
pip install PyQt5 PyQtWebEngine
```

### Run

```bash
python tarayici.py
```

### Toolbar buttons

| Button | What it does |
|---|---|
| **Import from URL** | Fetches a `shortcuts.json` from a raw GitHub URL and merges it into your local file |
| **Manage Shortcuts** | Opens `shortcuts.json` in your default text editor |

Your shortcuts are saved at:
```
%APPDATA%\CustomShortcutBrowser\shortcuts.json
```

---

## Community shortcuts.json

The `shortcuts.json` file at the root of this repo is a shared community list.
Anyone can open a Pull Request to add useful shortcuts.

### Format

```json
{
    "g":  "https://www.google.com",
    "y":  "https://www.youtube.com",
    "gh": "https://www.github.com"
}
```

Rules:
- Keys must be **lowercase**, short, and memorable.
- Values must be **full URLs** starting with `https://` or `http://`.
- No personal or private URLs.
- One shortcut per line for clean diffs.

### Contribute

1. Fork the repository.
2. Edit `shortcuts.json` — add your shortcut in alphabetical order.
3. Open a Pull Request with a short description.

---

## Build .exe (Windows)

To distribute the PyQt browser as a standalone executable:

```bash
pip install pyinstaller
pyinstaller --onefile --windowed tarayici.py
```

The executable will appear in the `dist/` folder.

---

## License

MIT
