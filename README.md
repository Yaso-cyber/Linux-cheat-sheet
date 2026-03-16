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
