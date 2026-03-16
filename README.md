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

# Linux Cheat Sheet

An interactive, categorized Linux command reference with an embedded mini terminal for safe practice.

## Live Demo

- GitHub Pages URL: https://yaso-cyber.github.io/Linux-cheat-sheet/
- If you see 404, enable Pages deployment using the steps in the Deployment section below.

## Features

- Organized command categories (file operations, system info, networking, permissions, and more)
- Built-in simulated terminal panel for practicing commands in the browser
- Search and quick actions to insert or run commands from the cheat sheet
- Command support for common Linux tools such as ls, cd, pwd, grep, find, chmod, ps, kill, and others
- Friendly terminal UX with history, clear output, and command hints

## Project Structure

- index.html: Main app layout and command catalog UI
- css/style.css: Styles for the page, command cards, and terminal panel
- js/commands.js: Simulated Linux command engine and virtual filesystem logic
- js/terminal.js: Terminal input/output behavior, command execution flow, and terminal controls

## Run Locally

Option 1 (quick):
1. Open index.html in your browser.

Option 2 (recommended):
1. Serve the folder with a local static server.
2. Open the served URL (for example, http://localhost:5500 if using Live Server).

## Test

1. Install Node.js 24 or newer.
2. Run npm test.
3. The smoke test validates the terminal simulator against key documented commands.

## How To Use

1. Browse categories and click a command row to insert it into the terminal.
2. Use the Run button to execute command examples directly.
3. In terminal input, type commands manually and press Enter.
4. Try help to see available commands and quick guidance.

## Notes

- The terminal is simulated in the browser and does not run system commands on your machine.
- This project is designed for learning and command familiarity in a safe environment.

## Suggested Test Checklist

- Run help and verify command groups are listed.
- Test file navigation: pwd, ls, cd, mkdir, touch.
- Test text tools: cat, head, tail, grep, wc, sort, uniq.
- Test system/network samples: uname -a, whoami, ps, ping, curl.
- Verify terminal controls: clear, collapse, expand, and header toggle button.

## Deployment (GitHub Pages)

This repository includes an Actions workflow at .github/workflows/deploy-pages.yml.
It also includes a CI workflow at .github/workflows/ci.yml for command smoke tests.

To enable it:
1. Open repository Settings on GitHub.
2. Go to Pages.
3. Set Source to GitHub Actions.
4. Go to Actions tab and run or re-run the Deploy static site to GitHub Pages workflow.
5. Wait for it to finish, then open the Live Demo URL above.

## Branch Protection (Recommended)

If GitHub warns your repository is not protected, configure protection for main:
1. Settings -> Branches -> Add branch protection rule.
2. Branch name pattern: main.
3. Enable at least:
	- Require a pull request before merging
	- Require status checks to pass before merging
	- Restrict who can push to matching branches (optional for solo projects)

This removes the unprotected-branch warning and makes the repository safer for future changes.
