/**
 * terminal.js
 * Terminal UI: renders output, handles keyboard input and history navigation.
 */

import { runCommand, getCurrentPrompt } from './commands.js';

const termBody      = document.getElementById('term-body');
const termInput     = document.getElementById('term-input');
const termPanel     = document.getElementById('terminal-panel');
const promptLabel   = document.getElementById('term-prompt-label');
const toggleBtn     = document.getElementById('term-toggle');
const clearBtn      = document.getElementById('term-clear');

let historyBuf = [];
let histIdx    = -1;
let savedInput = '';

/* ── State ─────────────────────────────────────────────── */
let collapsed = false;
let expanded  = false;

/* ── Prompt refresh ────────────────────────────────────── */
function refreshPrompt() {
  promptLabel.textContent = getCurrentPrompt();
}

/* ── Print a line to the terminal ──────────────────────── */
function printLine(type, text) {
  if (type === '__clear__') {
    termBody.innerHTML = '';
    return;
  }
  const el = document.createElement('div');
  el.className = `term-line ${type}`;
  el.textContent = text;
  termBody.appendChild(el);
}

/* ── Print command echo ─────────────────────────────────── */
function printPrompt(cmd) {
  const el = document.createElement('div');
  el.className = 'term-line prompt';
  el.textContent = getCurrentPrompt() + cmd;
  termBody.appendChild(el);
}

/* ── Scroll to bottom ───────────────────────────────────── */
function scrollBottom() {
  termBody.scrollTop = termBody.scrollHeight;
}

/* ── Execute a command string ───────────────────────────── */
function execCommand(cmd) {
  const trimmed = cmd.trim();
  printPrompt(trimmed);
  if (trimmed) {
    historyBuf.push(trimmed);
    histIdx   = -1;
    savedInput = '';
    const results = runCommand(trimmed);
    results.forEach(r => printLine(r.type, r.text));
  }
  refreshPrompt();
  scrollBottom();
}

/* ── Public: insert text into input (from cheat sheet) ─── */
function insertCommand(text) {
  termInput.value = text;
  termInput.focus();
  // If panel is collapsed, expand it
  if (collapsed) {
    collapsed = false;
    termPanel.classList.remove('collapsed');
    toggleBtn.textContent = '−';
    toggleBtn.title = 'Collapse terminal';
  }
  scrollBottom();
}

/* ── Public: run command immediately (▶ button) ──────────── */
function runImmediate(text) {
  insertCommand('');
  execCommand(text);
  termInput.focus();
}

/* ── Keyboard handling ──────────────────────────────────── */
termInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    execCommand(termInput.value);
    termInput.value = '';
    return;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (histIdx === -1) savedInput = termInput.value;
    if (histIdx < historyBuf.length - 1) {
      histIdx++;
      termInput.value = historyBuf[historyBuf.length - 1 - histIdx];
    }
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (histIdx > 0) {
      histIdx--;
      termInput.value = historyBuf[historyBuf.length - 1 - histIdx];
    } else if (histIdx === 0) {
      histIdx = -1;
      termInput.value = savedInput;
    }
    return;
  }

  if (e.key === 'Tab') {
    e.preventDefault();
    // Simple tab completion for commands
    const val    = termInput.value;
    const parts  = val.split(' ');
    const last   = parts[parts.length - 1];
    const cmds   = ['ls','cd','pwd','mkdir','rm','cp','mv','touch','find','cat',
                    'head','tail','grep','wc','sort','uniq','chmod','chown','ps',
                    'kill','top','uname','hostname','whoami','id','date','cal',
                    'uptime','df','du','free','ping','curl','ssh','tar','gzip',
                    'zip','unzip','nano','vim','man','history','clear','help',
                    'echo','env','export','which'];
    if (parts.length === 1) {
      const matches = cmds.filter(c => c.startsWith(last));
      if (matches.length === 1) termInput.value = matches[0] + ' ';
      else if (matches.length > 1) printLine('info', matches.join('  '));
    }
    return;
  }

  if (e.ctrlKey && e.key === 'c') {
    printPrompt(termInput.value + '^C');
    termInput.value = '';
    histIdx = -1;
    return;
  }

  if (e.ctrlKey && e.key === 'l') {
    e.preventDefault();
    termBody.innerHTML = '';
    return;
  }
});

/* ── Toggle panel (collapse / restore) ─────────────────── */
toggleBtn.addEventListener('click', () => {
  if (expanded) {
    expanded  = false;
    collapsed = false;
    termPanel.classList.remove('expanded');
    toggleBtn.textContent = '−';
    toggleBtn.title = 'Collapse terminal';
  } else if (!collapsed) {
    collapsed = true;
    termPanel.classList.add('collapsed');
    toggleBtn.textContent = '+';
    toggleBtn.title = 'Expand terminal';
  } else {
    collapsed = false;
    termPanel.classList.remove('collapsed');
    toggleBtn.textContent = '−';
    toggleBtn.title = 'Collapse terminal';
  }
});

document.getElementById('term-expand').addEventListener('click', () => {
  if (expanded) {
    expanded = false;
    termPanel.classList.remove('expanded');
  } else {
    expanded  = true;
    collapsed = false;
    termPanel.classList.remove('collapsed');
    termPanel.classList.add('expanded');
  }
  toggleBtn.textContent = '−';
  toggleBtn.title = 'Collapse terminal';
});

/* ── Clear button ───────────────────────────────────────── */
clearBtn.addEventListener('click', () => {
  termBody.innerHTML = '';
  termInput.focus();
});

/* ── Click on terminal body to focus input ──────────────── */
termBody.addEventListener('click', () => termInput.focus());

/* ── Welcome banner ─────────────────────────────────────── */
function printBanner() {
  const banner = [
    { type: 'success', text: '╔══════════════════════════════════════════════════════╗' },
    { type: 'success', text: '║       Linux Cheat Sheet — Interactive Terminal       ║' },
    { type: 'success', text: '╚══════════════════════════════════════════════════════╝' },
    { type: 'info',    text: 'Type `help` to see available commands.' },
    { type: 'info',    text: 'Click any command in the sheet above to insert it here.' },
    { type: 'output',  text: '' },
  ];
  banner.forEach(l => printLine(l.type, l.text));
  refreshPrompt();
}

printBanner();

export { insertCommand, runImmediate };
