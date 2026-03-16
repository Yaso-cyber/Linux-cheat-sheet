# 🐧 Linux Commands Cheat Sheet

An interactive, categorised cheat sheet for Linux commands — available as both a **web page** and a **Python CLI tool**.

[![Deploy to GitHub Pages](https://github.com/Yaso-cyber/Linux-cheat-sheet/actions/workflows/deploy.yml/badge.svg)](https://github.com/Yaso-cyber/Linux-cheat-sheet/actions/workflows/deploy.yml)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📂 **Categorised commands** | Commands are grouped into 11 categories (File System, Networking, Process Management, …) |
| 🔍 **Live search** | Filter commands instantly by name, syntax, description, or example |
| 🧭 **Category navigation** | Sidebar with anchor links to jump directly to any category |
| ❓ **Collapsible FAQ** | Eight common Linux questions with expandable/collapsible answers |
| 🖥️ **CLI tool** | Python script to search commands or browse categories in the terminal |
| 🚀 **Auto-deploy** | GitHub Actions workflow deploys the site to GitHub Pages on every push to `main` |
| 📱 **Responsive** | Sidebar collapses on small screens for a clean mobile experience |

---

## 📁 Project Structure

```
Linux-cheat-sheet/
├── index.html                   # Main web page
├── commands.json                # Command data (categories + commands)
├── cli_tool.py                  # Python CLI tool
├── src/
│   └── app.js                   # JavaScript: rendering, search, FAQ toggle
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions – deploy to GitHub Pages
└── README.md
```

---

## 🌐 Running the Web Page Locally

The site is a plain static HTML/JS/JSON project — no build step needed.

### Option 1 – Python built-in server (recommended)

```bash
# Python 3
python3 -m http.server 8080
```

Open <http://localhost:8080> in your browser.

### Option 2 – Node.js `serve`

```bash
npx serve .
```

### Option 3 – VS Code Live Server

Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, right-click `index.html` → **Open with Live Server**.

> **Note:** You must use a local server (not `file://`) because `app.js` uses `fetch()` to load `commands.json`.

---

## 🖥️ Using the CLI Tool

Python 3.8 or later is required. No third-party packages are needed.

### Interactive mode (default)

```bash
python3 cli_tool.py
```

A menu is presented:

```
  [s]  Search commands by keyword
  [c]  Browse by category
  [l]  List all commands
  [q]  Quit
```

### Direct subcommands

```bash
# Search for a keyword
python3 cli_tool.py search <keyword>

# Example
python3 cli_tool.py search port

# Browse categories (interactive picker)
python3 cli_tool.py category

# Dump all commands
python3 cli_tool.py list
```

---

## 🚀 GitHub Pages Deployment

The workflow in `.github/workflows/deploy.yml` automatically deploys the site whenever commits are pushed to the `main` branch.

### Enable GitHub Pages in your fork

1. Go to **Settings → Pages** in your repository.
2. Under **Source**, choose **GitHub Actions**.
3. Push a commit to `main` — the workflow will build and publish the site.

The deployed URL will be:  
`https://<your-username>.github.io/Linux-cheat-sheet/`

---

## 📦 Adding or Editing Commands

All command data lives in **`commands.json`**. Each entry follows this schema:

```jsonc
{
  "categories": [
    {
      "name": "Category Name",
      "commands": [
        {
          "command": "ls",
          "syntax": "ls [options] [path]",
          "description": "List directory contents",
          "example": "ls -la /home"
        }
      ]
    }
  ]
}
```

Simply add a new object to the `commands` array (or create a new category) and both the web page and CLI tool will pick it up automatically.

---

## 🤝 Contributing

Contributions are welcome! Follow these steps:

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feat/add-vim-commands
   ```

2. **Make your changes** — edit `commands.json` to add commands, or improve the HTML/JS/Python code.

3. **Test locally** using the Python server or Live Server (see above).

4. **Commit** with a descriptive message:
   ```bash
   git commit -m "feat: add advanced vim commands to cheat sheet"
   ```

5. **Open a Pull Request** against `main` and describe what you changed and why.

### Guidelines

- Keep command entries accurate and concise.
- Use the existing JSON schema — do not rename keys.
- JavaScript changes should work without a bundler (plain ES5-compatible code).
- Python changes should remain compatible with Python 3.8+.
- Do not commit build artefacts or editor config files.

---

## 📄 License

This project is open-source. Feel free to use and adapt it.

