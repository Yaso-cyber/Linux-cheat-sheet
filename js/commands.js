/**
 * commands.js
 * Simulated Linux command implementations for the mini terminal.
 * Each command returns an array of { type, text } lines.
 */

const COMMANDS = {};

/* ── helpers ─────────────────────────────────────────────── */
const ok   = (t) => ({ type: 'output',  text: t });
const err  = (t) => ({ type: 'error',   text: t });
const info = (t) => ({ type: 'info',    text: t });
const succ = (t) => ({ type: 'success', text: t });

function flag(args, name) {
  return args.includes(name) || args.includes('-' + name) || args.includes('--' + name);
}

/* ── Simulated filesystem state ──────────────────────────── */
const FS = {
  '/': {
    home: {
      user: {
        'readme.txt':    'Welcome to the Linux Cheat Sheet terminal!\nThis is a simulated environment for practice.',
        'notes.md':      '# My Notes\n- Learn Linux commands\n- Practice every day',
        '.bashrc':       '# .bashrc\nexport PS1="user@linux:~$ "\nexport EDITOR=nano',
        projects: {
          'hello.sh':    '#!/bin/bash\necho "Hello, World!"',
          'backup.sh':   '#!/bin/bash\ntar -czf backup.tar.gz ~/projects',
        },
        downloads: {
          'archive.tar.gz': '<binary>',
        },
      },
    },
    etc: {
      'passwd':  'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:User:/home/user:/bin/bash',
      'hostname': 'linux-box',
      'os-release': 'NAME="Ubuntu"\nVERSION="22.04 LTS"\nID=ubuntu',
    },
    tmp: {},
    var: { log: { 'syslog': 'Mar 16 10:00:01 kernel: Linux version 6.2\nMar 16 10:00:02 systemd: Starting...' } },
    bin: {},
    usr: { bin: {}, local: { bin: {} } },
  }
};

let cwd = '/home/user';      // current working directory
const env = {
  HOME: '/home/user',
  USER: 'user',
  HOSTNAME: 'linux-box',
  SHELL: '/bin/bash',
  TERM: 'xterm-256color',
  PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
  EDITOR: 'nano',
  LANG: 'en_US.UTF-8',
};

/* ── Path utilities ──────────────────────────────────────── */
function normalizePath(p) {
  const parts = p.split('/').filter(Boolean);
  const resolved = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') resolved.pop();
    else resolved.push(part);
  }
  return '/' + resolved.join('/');
}

function resolvePath(p) {
  if (!p || p === '~') return env.HOME;
  if (p.startsWith('~/')) return normalizePath(env.HOME + '/' + p.slice(2));
  if (p.startsWith('/')) return normalizePath(p);
  return normalizePath(cwd + '/' + p);
}

function getNode(path) {
  const parts = normalizePath(path).split('/').filter(Boolean);
  let node = FS['/'];
  for (const part of parts) {
    if (node === null || typeof node !== 'object' || typeof node === 'string') return undefined;
    node = node[part];
    if (node === undefined) return undefined;
  }
  return node;
}

function isDir(node)  { return node !== undefined && typeof node === 'object'; }
function isFile(node) { return node !== undefined && typeof node === 'string'; }

function listDir(path) {
  const node = getNode(path);
  if (!isDir(node)) return null;
  return Object.keys(node);
}

function shortPath(p) { return p.startsWith(env.HOME) ? '~' + p.slice(env.HOME.length) : p; }

/* ── pwd ─────────────────────────────────────────────────── */
COMMANDS.pwd = () => [ok(cwd)];

/* ── cd ──────────────────────────────────────────────────── */
COMMANDS.cd = (args) => {
  const target = resolvePath(args[0] || '~');
  const node = getNode(target);
  if (!isDir(node)) return [err(`cd: ${args[0] || '~'}: No such file or directory`)];
  cwd = target;
  return [];
};

/* ── ls ──────────────────────────────────────────────────── */
COMMANDS.ls = (args) => {
  const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
  const longFmt    = args.includes('-l') || args.includes('-la') || args.includes('-al') || args.includes('-ll');
  const pathArg    = args.find(a => !a.startsWith('-'));
  const target     = resolvePath(pathArg || '.');
  const node       = getNode(target);

  if (!isDir(node))  return [err(`ls: cannot access '${pathArg}': No such file or directory`)];

  let entries = Object.keys(node);
  if (showHidden) entries = ['.', '..', ...entries];
  else entries = entries.filter(e => !e.startsWith('.'));

  if (!longFmt) {
    const cols = entries.map(e => {
      const child = node[e];
      return isDir(child) ? `\x1b[34m${e}/\x1b[0m` : e;
    });
    return [ok(cols.join('  ') || '(empty)')];
  }

  const lines = entries.map(e => {
    const child = node[e];
    const isD   = isDir(child);
    const size  = isFile(child) ? child.length : 4096;
    const perms = isD ? 'drwxr-xr-x' : '-rw-r--r--';
    return ok(`${perms}  1 user user  ${String(size).padStart(6)}  Mar 16 10:00  ${isD ? e + '/' : e}`);
  });

  return lines.length ? lines : [ok('(empty)')];
};

/* ── echo ────────────────────────────────────────────────── */
COMMANDS.echo = (args) => {
  const text = args.join(' ').replace(/\$(\w+)/g, (_, v) => env[v] !== undefined ? env[v] : '');
  return [ok(text)];
};

/* ── cat ─────────────────────────────────────────────────── */
COMMANDS.cat = (args) => {
  if (!args.length) return [info('cat: reading from stdin (try: cat filename)')];
  const out = [];
  for (const a of args) {
    const p    = resolvePath(a);
    const node = getNode(p);
    if (isDir(node))   { out.push(err(`cat: ${a}: Is a directory`)); continue; }
    if (!isFile(node)) { out.push(err(`cat: ${a}: No such file or directory`)); continue; }
    node.split('\n').forEach(l => out.push(ok(l)));
  }
  return out;
};

/* ── head ────────────────────────────────────────────────── */
COMMANDS.head = (args) => {
  const nIdx = args.indexOf('-n');
  const n    = nIdx >= 0 ? parseInt(args[nIdx + 1], 10) || 10 : 10;
  const file = args.find(a => !a.startsWith('-') && (isNaN(+a) || args[args.indexOf(a) - 1] !== '-n'));
  if (!file) return [info('Usage: head [-n N] <file>')];
  const node = getNode(resolvePath(file));
  if (!isFile(node)) return [err(`head: ${file}: No such file or directory`)];
  return node.split('\n').slice(0, n).map(ok);
};

/* ── tail ────────────────────────────────────────────────── */
COMMANDS.tail = (args) => {
  const nIdx = args.indexOf('-n');
  const n    = nIdx >= 0 ? parseInt(args[nIdx + 1], 10) || 10 : 10;
  const file = args.find(a => !a.startsWith('-') && (isNaN(+a) || args[args.indexOf(a) - 1] !== '-n'));
  if (!file) return [info('Usage: tail [-n N] <file>')];
  const node = getNode(resolvePath(file));
  if (!isFile(node)) return [err(`tail: ${file}: No such file or directory`)];
  return node.split('\n').slice(-n).map(ok);
};

/* ── mkdir ───────────────────────────────────────────────── */
COMMANDS.mkdir = (args) => {
  if (!args.length) return [err('mkdir: missing operand')];
  const out = [];
  for (const a of args.filter(a => !a.startsWith('-'))) {
    const p     = resolvePath(a);
    const parts = p.split('/').filter(Boolean);
    let node    = FS['/'];
    for (let i = 0; i < parts.length - 1; i++) {
      if (!isDir(node[parts[i]])) { out.push(err(`mkdir: cannot create '${a}': No such file or directory`)); node = null; break; }
      node = node[parts[i]];
    }
    if (!node) continue;
    const leaf = parts[parts.length - 1];
    if (node[leaf] !== undefined) { out.push(err(`mkdir: cannot create '${a}': File exists`)); continue; }
    node[leaf] = {};
    out.push(succ(`mkdir: created directory '${a}'`));
  }
  return out;
};

/* ── touch ───────────────────────────────────────────────── */
COMMANDS.touch = (args) => {
  if (!args.length) return [err('touch: missing file operand')];
  const out = [];
  for (const a of args) {
    const p     = resolvePath(a);
    const parts = p.split('/').filter(Boolean);
    let node    = FS['/'];
    for (let i = 0; i < parts.length - 1; i++) {
      if (!isDir(node[parts[i]])) { out.push(err(`touch: cannot touch '${a}': No such file or directory`)); node = null; break; }
      node = node[parts[i]];
    }
    if (!node) continue;
    const leaf = parts[parts.length - 1];
    if (!isDir(node[leaf])) node[leaf] = node[leaf] || '';
    out.push(succ(`touched '${a}'`));
  }
  return out;
};

/* ── rm ──────────────────────────────────────────────────── */
COMMANDS.rm = (args) => {
  const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
  const files     = args.filter(a => !a.startsWith('-'));
  if (!files.length) return [err('rm: missing operand')];
  const out = [];
  for (const a of files) {
    const p     = resolvePath(a);
    const parts = p.split('/').filter(Boolean);
    let parent  = FS['/'];
    for (let i = 0; i < parts.length - 1; i++) {
      parent = parent[parts[i]];
      if (!isDir(parent)) { parent = null; break; }
    }
    if (!parent) { out.push(err(`rm: ${a}: No such file or directory`)); continue; }
    const leaf = parts[parts.length - 1];
    if (parent[leaf] === undefined) { out.push(err(`rm: ${a}: No such file or directory`)); continue; }
    if (isDir(parent[leaf]) && !recursive) { out.push(err(`rm: ${a}: Is a directory (use -r to remove)`)); continue; }
    delete parent[leaf];
    out.push(succ(`removed '${a}'`));
  }
  return out;
};

/* ── cp ──────────────────────────────────────────────────── */
COMMANDS.cp = (args) => {
  const src = args.find(a => !a.startsWith('-'));
  const dst = args.filter(a => !a.startsWith('-'))[1];
  if (!src || !dst) return [err('Usage: cp <source> <destination>')];
  const srcNode = getNode(resolvePath(src));
  if (!isFile(srcNode)) return [err(`cp: '${src}': No such file or directory`)];
  const dstPath  = resolvePath(dst);
  const dstParts = dstPath.split('/').filter(Boolean);
  let parent = FS['/'];
  for (let i = 0; i < dstParts.length - 1; i++) {
    if (!isDir(parent[dstParts[i]])) return [err(`cp: cannot create '${dst}': No such directory`)];
    parent = parent[dstParts[i]];
  }
  parent[dstParts[dstParts.length - 1]] = srcNode;
  return [succ(`'${src}' -> '${dst}'`)];
};

/* ── mv ──────────────────────────────────────────────────── */
COMMANDS.mv = (args) => {
  const src = args.find(a => !a.startsWith('-'));
  const dst = args.filter(a => !a.startsWith('-'))[1];
  if (!src || !dst) return [err('Usage: mv <source> <destination>')];
  const srcPath  = resolvePath(src);
  const srcParts = srcPath.split('/').filter(Boolean);
  let srcParent  = FS['/'];
  for (let i = 0; i < srcParts.length - 1; i++) {
    if (!isDir(srcParent[srcParts[i]])) return [err(`mv: '${src}': No such file or directory`)];
    srcParent = srcParent[srcParts[i]];
  }
  const srcLeaf = srcParts[srcParts.length - 1];
  const srcNode = srcParent[srcLeaf];
  if (srcNode === undefined) return [err(`mv: cannot stat '${src}': No such file or directory`)];

  const dstPath  = resolvePath(dst);
  const dstParts = dstPath.split('/').filter(Boolean);
  let dstParent  = FS['/'];
  for (let i = 0; i < dstParts.length - 1; i++) {
    if (!isDir(dstParent[dstParts[i]])) return [err(`mv: cannot move '${src}' to '${dst}': No such directory`)];
    dstParent = dstParent[dstParts[i]];
  }
  dstParent[dstParts[dstParts.length - 1]] = srcNode;
  delete srcParent[srcLeaf];
  return [succ(`'${src}' -> '${dst}'`)];
};

/* ── grep ────────────────────────────────────────────────── */
COMMANDS.grep = (args) => {
  const caseI   = args.includes('-i');
  const lineNum = args.includes('-n');
  const invert  = args.includes('-v');
  const plain   = args.filter(a => !a.startsWith('-'));
  if (plain.length < 2) return [info('Usage: grep [options] <pattern> <file>')];
  const [pattern, ...files] = plain;
  const out = [];
  for (const f of files) {
    const node = getNode(resolvePath(f));
    if (!isFile(node)) { out.push(err(`grep: ${f}: No such file or directory`)); continue; }
    const regex = new RegExp(pattern, caseI ? 'i' : '');
    node.split('\n').forEach((line, i) => {
      const match = regex.test(line);
      if (match !== invert) {
        const prefix = files.length > 1 ? `${f}:` : '';
        const num    = lineNum ? `${i + 1}:` : '';
        out.push(ok(`${prefix}${num}${line}`));
      }
    });
  }
  return out.length ? out : [info('(no matches)')];
};

/* ── wc ──────────────────────────────────────────────────── */
COMMANDS.wc = (args) => {
  const files = args.filter(a => !a.startsWith('-'));
  if (!files.length) return [info('Usage: wc [-l|-w|-c] <file>')];
  const out = [];
  for (const f of files) {
    const node = getNode(resolvePath(f));
    if (!isFile(node)) { out.push(err(`wc: ${f}: No such file or directory`)); continue; }
    const lines = node.split('\n').length;
    const words = node.split(/\s+/).filter(Boolean).length;
    const bytes = node.length;
    out.push(ok(`  ${lines}  ${words}  ${bytes} ${f}`));
  }
  return out;
};

/* ── sort ────────────────────────────────────────────────── */
COMMANDS.sort = (args) => {
  const reverse = args.includes('-r');
  const file    = args.find(a => !a.startsWith('-'));
  if (!file) return [info('Usage: sort [-r] <file>')];
  const node = getNode(resolvePath(file));
  if (!isFile(node)) return [err(`sort: ${file}: No such file or directory`)];
  const lines = node.split('\n');
  lines.sort((a, b) => reverse ? b.localeCompare(a) : a.localeCompare(b));
  return lines.map(ok);
};

/* ── uniq ────────────────────────────────────────────────── */
COMMANDS.uniq = (args) => {
  const file = args.find(a => !a.startsWith('-'));
  if (!file) return [info('Usage: uniq <file>')];
  const node = getNode(resolvePath(file));
  if (!isFile(node)) return [err(`uniq: ${file}: No such file or directory`)];
  const lines = node.split('\n');
  const out   = [lines[0]];
  for (let i = 1; i < lines.length; i++) if (lines[i] !== lines[i - 1]) out.push(lines[i]);
  return out.map(ok);
};

/* ── chmod ───────────────────────────────────────────────── */
COMMANDS.chmod = (args) => {
  if (args.length < 2) return [err('Usage: chmod <mode> <file>')];
  const [mode, file] = args;
  const node = getNode(resolvePath(file));
  if (node === undefined) return [err(`chmod: ${file}: No such file or directory`)];
  return [succ(`mode of '${file}' changed to ${mode}`)];
};

/* ── chown ───────────────────────────────────────────────── */
COMMANDS.chown = (args) => {
  if (args.length < 2) return [err('Usage: chown <owner>[:group] <file>')];
  const [owner, file] = args;
  const node = getNode(resolvePath(file));
  if (node === undefined) return [err(`chown: ${file}: No such file or directory`)];
  return [succ(`ownership of '${file}' set to '${owner}'`)];
};

/* ── find ────────────────────────────────────────────────── */
COMMANDS.find = (args) => {
  const nameIdx  = args.indexOf('-name');
  const pattern  = nameIdx >= 0 ? args[nameIdx + 1] : null;
  const startRaw = args.find(a => !a.startsWith('-') && a !== (pattern || ''));
  const start    = resolvePath(startRaw || '.');
  const out      = [];

  function walk(path, node) {
    if (!isDir(node)) return;
    for (const [key, child] of Object.entries(node)) {
      const fullPath = path === '/' ? '/' + key : path + '/' + key;
      const matches  = !pattern || key === pattern || key.includes(pattern.replace(/\*/g, ''));
      if (matches) out.push(ok(fullPath));
      if (isDir(child)) walk(fullPath, child);
    }
  }

  const startNode = getNode(start);
  if (!isDir(startNode)) return [err(`find: '${startRaw || '.'}': No such file or directory`)];
  out.push(ok(start));
  walk(start, startNode);
  return out.length > 1 ? out : [ok(start), info('(no matches)')];
};

/* ── which ───────────────────────────────────────────────── */
COMMANDS.which = (args) => {
  const binaries = ['ls','cat','grep','find','pwd','cd','echo','mkdir','rm','cp','mv',
                    'touch','chmod','chown','head','tail','sort','uniq','wc','df','du',
                    'ps','kill','top','uname','hostname','whoami','id','env','export',
                    'history','clear','date','cal','uptime','free','ping','curl','ssh',
                    'tar','gzip','zip','unzip','nano','vim','man','help','which'];
  if (!args.length) return [err('which: missing argument')];
  return args.map(cmd => binaries.includes(cmd)
    ? ok(`/usr/bin/${cmd}`)
    : err(`which: ${cmd}: command not found`));
};

/* ── whoami / id ─────────────────────────────────────────── */
COMMANDS.whoami = () => [ok(env.USER)];
COMMANDS.id     = () => [ok(`uid=1000(user) gid=1000(user) groups=1000(user),4(adm),24(cdrom),27(sudo)`)];

/* ── hostname ────────────────────────────────────────────── */
COMMANDS.hostname = () => [ok(env.HOSTNAME)];

/* ── uname ───────────────────────────────────────────────── */
COMMANDS.uname = (args) => {
  if (args.includes('-a')) return [ok('Linux linux-box 6.2.0-39-generic #40-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux')];
  if (args.includes('-r')) return [ok('6.2.0-39-generic')];
  if (args.includes('-m')) return [ok('x86_64')];
  return [ok('Linux')];
};

/* ── date ────────────────────────────────────────────────── */
COMMANDS.date = (args) => {
  const now = new Date();
  if (args.includes('+%Y-%m-%d')) return [ok(now.toISOString().split('T')[0])];
  if (args.includes('+%s'))       return [ok(Math.floor(now / 1000).toString())];
  return [ok(now.toString())];
};

/* ── cal ─────────────────────────────────────────────────── */
COMMANDS.cal = () => {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const lines = [`   ${months[m]} ${y}`, 'Su Mo Tu We Th Fr Sa'];
  let row = '   '.repeat(firstDay);
  for (let d = 1; d <= daysInMonth; d++) {
    row += String(d).padStart(2) + ' ';
    if ((firstDay + d) % 7 === 0) { lines.push(row.trimEnd()); row = ''; }
  }
  if (row.trim()) lines.push(row.trimEnd());
  return lines.map(ok);
};

/* ── uptime ──────────────────────────────────────────────── */
COMMANDS.uptime = () => [ok(' 10:22:15 up 2 days,  3:14,  1 user,  load average: 0.08, 0.12, 0.10')];

/* ── df ──────────────────────────────────────────────────── */
COMMANDS.df = (args) => {
  const h = args.includes('-h');
  const lines = [
    ok('Filesystem      ' + (h ? 'Size  Used Avail Use%' : '1K-blocks    Used Available Use%') + ' Mounted on'),
    ok('/dev/sda1       ' + (h ? ' 50G   12G   36G  25%' : ' 52428800 12582912  39845888  25%') + ' /'),
    ok('tmpfs           ' + (h ? '2.0G  1.2M  2.0G   1%' : '  2097152     1200   2095952   1%') + ' /dev/shm'),
  ];
  return lines;
};

/* ── du ──────────────────────────────────────────────────── */
COMMANDS.du = (args) => {
  const h    = args.includes('-h');
  const s    = args.includes('-s');
  const path = args.find(a => !a.startsWith('-')) || '.';
  const size = h ? '4.0K' : '4';
  if (s) return [ok(`${size}\t${path}`)];
  return [ok(`${size}\t${path}`), ok(`${size}\t${path}`)];
};

/* ── free ────────────────────────────────────────────────── */
COMMANDS.free = (args) => {
  const h = args.includes('-h');
  if (h) {
    return [
      ok('               total        used        free      shared  buff/cache   available'),
      ok('Mem:           7.7Gi       2.1Gi       3.4Gi       234Mi       2.1Gi       5.1Gi'),
      ok('Swap:          2.0Gi          0B       2.0Gi'),
    ];
  }
  return [
    ok('               total        used        free      shared  buff/cache   available'),
    ok('Mem:         8053248     2207744     3567616      240128     2277888     5369856'),
    ok('Swap:        2097152           0     2097152'),
  ];
};

/* ── ps ──────────────────────────────────────────────────── */
COMMANDS.ps = (args) => {
  const lines = [
    ok('    PID TTY          TIME CMD'),
    ok('   1234 pts/0    00:00:00 bash'),
    ok('   5678 pts/0    00:00:00 ps'),
  ];
  if (args.includes('aux') || args.includes('-aux') || args.includes('-e')) {
    return [
      ok('USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND'),
      ok('root           1  0.0  0.1 168024 12288 ?        Ss   10:00   0:01 /sbin/init'),
      ok('user        1234  0.0  0.2  12345  8192 pts/0    Ss   10:01   0:00 bash'),
      ok('user        5678  0.0  0.1   9876  4096 pts/0    R+   10:22   0:00 ps aux'),
    ];
  }
  return lines;
};

/* ── kill ────────────────────────────────────────────────── */
COMMANDS.kill = (args) => {
  if (!args.length) return [err('kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]')];
  const sig  = args.find(a => a.startsWith('-')) || '-15';
  const pids = args.filter(a => !a.startsWith('-'));
  return pids.map(p => !isNaN(+p)
    ? succ(`Signal ${sig.replace('-','')} sent to process ${p}`)
    : err(`kill: ${p}: arguments must be process or job IDs`));
};

/* ── top ─────────────────────────────────────────────────── */
COMMANDS.top = () => [
  ok('top - 10:22:15 up 2 days,  3:14,  1 user,  load average: 0.08, 0.12, 0.10'),
  ok('Tasks:  87 total,   1 running,  86 sleeping,   0 stopped,   0 zombie'),
  ok('%Cpu(s):  2.3 us,  0.5 sy,  0.0 ni, 97.0 id,  0.0 wa,  0.2 hi,  0.0 si'),
  ok('MiB Mem:   7864.0 total,   3291.3 free,   2156.7 used,   2416.0 buff/cache'),
  ok(''),
  ok('    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND'),
  ok('      1 root      20   0  168024  12288   9216 S   0.0   0.2   0:01.23 systemd'),
  ok('   1234 user      20   0   12345   8192   6144 S   0.0   0.1   0:00.10 bash'),
  info('(interactive top not supported — showing snapshot)'),
];

/* ── env / export ────────────────────────────────────────── */
COMMANDS.env = () => Object.entries(env).map(([k, v]) => ok(`${k}=${v}`));

COMMANDS.export = (args) => {
  if (!args.length) return COMMANDS.env();
  const out = [];
  for (const a of args) {
    const [key, ...valParts] = a.split('=');
    if (!valParts.length) { out.push(info(`export: ${key}`)); continue; }
    env[key] = valParts.join('=');
    out.push(succ(`export ${key}=${env[key]}`));
  }
  return out;
};

/* ── ping ────────────────────────────────────────────────── */
COMMANDS.ping = (args) => {
  const host = args.find(a => !a.startsWith('-')) || 'localhost';
  const c    = args.indexOf('-c') >= 0 ? parseInt(args[args.indexOf('-c') + 1], 10) || 4 : 4;
  const lines = [info(`PING ${host} (93.184.216.34): 56 data bytes`)];
  for (let i = 0; i < Math.min(c, 4); i++) {
    const ms = (Math.random() * 15 + 5).toFixed(3);
    lines.push(ok(`64 bytes from 93.184.216.34: icmp_seq=${i} ttl=55 time=${ms} ms`));
  }
  lines.push(ok(''), ok(`--- ${host} ping statistics ---`));
  lines.push(ok(`${c} packets transmitted, ${Math.min(c, 4)} received, 0% packet loss`));
  return lines;
};

/* ── curl ────────────────────────────────────────────────── */
COMMANDS.curl = (args) => {
  const url = args.find(a => !a.startsWith('-'));
  if (!url) return [err('curl: no URL specified')];
  return [
    info(`  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current`),
    info(`                                 Dload  Upload   Total   Spent    Left  Speed`),
    ok(`100   648  100   648    0     0   1842      0 --:--:-- --:--:-- --:--:--  1843`),
    ok(`<!DOCTYPE html><html><head><title>${url}</title></head><body>...</body></html>`),
  ];
};

/* ── ssh ─────────────────────────────────────────────────── */
COMMANDS.ssh = (args) => {
  const host = args.find(a => !a.startsWith('-'));
  if (!host) return [err('ssh: missing host')];
  return [info(`ssh: connect to host ${host} — simulated environment, no real connection`)];
};

/* ── tar ─────────────────────────────────────────────────── */
COMMANDS.tar = (args) => {
  const create  = args.includes('-c') || args.includes('czf') || args.find(a => /c/.test(a) && a.startsWith('-'));
  const extract = args.includes('-x') || args.find(a => /x/.test(a) && a.startsWith('-'));
  const list    = args.includes('-t') || args.find(a => /t/.test(a) && a.startsWith('-'));
  const file    = args.find(a => a.endsWith('.tar') || a.endsWith('.tar.gz') || a.endsWith('.tgz'));

  if (!args.length || !file) return [info('Usage: tar [-czf|-xzf|-tzf] archive.tar.gz [files...]')];
  if (create)  return [succ(`Creating archive: ${file}`), ok('a README'), ok('a .')];
  if (extract) return [succ(`Extracting: ${file}`), ok('x README'), ok('x ./file1.txt')];
  if (list)    return [ok(`-rw-r--r-- user/user 1024 2024-03-16 README`), ok(`-rw-r--r-- user/user 512 2024-03-16 file1.txt`)];
  return [info('Usage: tar [-czf|-xzf|-tzf] archive.tar.gz [files...]')];
};

/* ── gzip ────────────────────────────────────────────────── */
COMMANDS.gzip = (args) => {
  const file = args.find(a => !a.startsWith('-'));
  if (!file) return [err('gzip: missing filename')];
  const decompress = args.includes('-d');
  return decompress
    ? [succ(`${file}: decompressed to ${file.replace('.gz', '')}`)]
    : [succ(`${file}: compressed to ${file}.gz (reduced by ~65%)`)];
};

/* ── zip / unzip ─────────────────────────────────────────── */
COMMANDS.zip = (args) => {
  if (args.length < 2) return [info('Usage: zip archive.zip file [files...]')];
  const [archive, ...files] = args.filter(a => !a.startsWith('-'));
  return [succ(`creating: ${archive}`), ...files.map(f => ok(`  adding: ${f}`))];
};

COMMANDS.unzip = (args) => {
  const file = args.find(a => !a.startsWith('-'));
  if (!file) return [err('unzip: missing archive name')];
  return [info(`Archive:  ${file}`), ok('  inflating: file1.txt'), ok('  inflating: file2.txt')];
};

/* ── nano / vim ──────────────────────────────────────────── */
COMMANDS.nano = (args) => {
  const file = args.find(a => !a.startsWith('-')) || '';
  return [info(`nano: text editor not available in this terminal simulator.`),
          info(`Try: cat ${file || '<file>'} to view, or echo "text" > ${file || '<file>'} to write`)];
};

COMMANDS.vim = (args) => {
  const file = args.find(a => !a.startsWith('-')) || '';
  return [info(`vim: interactive editor not available in this terminal simulator.`),
          info(`Try: cat ${file || '<file>'} to view, or echo "text" > ${file || '<file>'} to write`)];
};

/* ── man ─────────────────────────────────────────────────── */
const MAN_PAGES = {
  ls:    'ls - list directory contents\nUsage: ls [options] [path]\n  -a  include hidden files\n  -l  long listing format\n  -h  human-readable sizes',
  grep:  'grep - search for patterns\nUsage: grep [options] pattern file\n  -i  case insensitive\n  -n  show line numbers\n  -v  invert match',
  find:  'find - search for files\nUsage: find [path] [expression]\n  -name pattern  match by name\n  -type f/d      match files/directories',
  chmod: 'chmod - change file permissions\nUsage: chmod mode file\n  Octal: 755, 644, 777\n  Symbolic: u+x, g-w, o=r',
  tar:   'tar - archive utility\nUsage: tar [options] archive files\n  -c  create archive\n  -x  extract archive\n  -z  compress with gzip\n  -f  specify filename',
};

COMMANDS.man = (args) => {
  const cmd = args[0];
  if (!cmd) return [err('What manual page do you want?')];
  const page = MAN_PAGES[cmd];
  if (!page) return [err(`No manual entry for ${cmd}`)];
  return [info(`--- man ${cmd} ---`), ...page.split('\n').map(ok)];
};

/* ── history ─────────────────────────────────────────────── */
let _history = [];
function addToHistory(cmd) { if (cmd.trim()) _history.push(cmd); }
COMMANDS.history = () => _history.map((h, i) => ok(`  ${String(i + 1).padStart(4)}  ${h}`));

/* ── clear ───────────────────────────────────────────────── */
COMMANDS.clear = () => [{ type: '__clear__', text: '' }];

/* ── help ────────────────────────────────────────────────── */
COMMANDS.help = () => [
  info('─── Linux Cheat Sheet Terminal ────────────────────────────'),
  info('A simulated Linux terminal for practicing commands.'),
  ok(''),
  ok('Available commands:'),
  ok('  File & Dir:   ls, cd, pwd, mkdir, rm, cp, mv, touch, find'),
  ok('  File Content: cat, head, tail, grep, wc, sort, uniq'),
  ok('  Permissions:  chmod, chown'),
  ok('  Processes:    ps, kill, top'),
  ok('  System:       uname, hostname, whoami, id, uptime, date, cal'),
  ok('  Resources:    df, du, free'),
  ok('  Network:      ping, curl, ssh'),
  ok('  Archive:      tar, gzip, zip, unzip'),
  ok('  Env:          env, export, which'),
  ok('  Other:        echo, nano, vim, man, history, clear, help'),
  ok(''),
  info('Tips:'),
  info('  • Use ↑ / ↓ arrow keys to browse command history'),
  info('  • Click any command in the cheat sheet to insert it here'),
  info('  • Click ▶ Run button to run a command directly'),
  info('  • Filesystem changes persist during the session'),
];

/* ── Redirection helper (echo "text" > file) ─────────────── */
function handleRedirect(raw) {
  const appendMatch = raw.match(/^(.+?)\s*>>\s*(\S+)$/);
  const writeMatch  = raw.match(/^(.+?)\s*>\s*(\S+)$/);
  const pipeMatch   = raw.match(/^(.+?)\s*\|\s*(.+)$/);

  if (appendMatch) {
    const [, left, file] = appendMatch;
    const result  = runSingle(left.trim());
    const content = result.map(r => r.text).join('\n');
    const p = resolvePath(file);
    const parts = p.split('/').filter(Boolean);
    let node = FS['/'];
    for (let i = 0; i < parts.length - 1; i++) {
      if (!isDir(node[parts[i]])) return [err(`bash: ${file}: No such file or directory`)];
      node = node[parts[i]];
    }
    const leaf = parts[parts.length - 1];
    node[leaf] = (isFile(node[leaf]) ? node[leaf] + '\n' : '') + content;
    return [succ(`appended to '${file}'`)];
  }

  if (writeMatch) {
    const [, left, file] = writeMatch;
    const result  = runSingle(left.trim());
    const content = result.map(r => r.text).join('\n');
    const p = resolvePath(file);
    const parts = p.split('/').filter(Boolean);
    let node = FS['/'];
    for (let i = 0; i < parts.length - 1; i++) {
      if (!isDir(node[parts[i]])) return [err(`bash: ${file}: No such file or directory`)];
      node = node[parts[i]];
    }
    node[parts[parts.length - 1]] = content;
    return [succ(`written to '${file}'`)];
  }

  if (pipeMatch) {
    const [, left, right] = pipeMatch;
    const intermediate = runSingle(left.trim());
    const combined     = intermediate.map(r => r.text).join('\n');
    const rightParts   = right.trim().split(/\s+/);
    const rightCmd     = rightParts[0];
    if (rightCmd === 'grep') {
      const pattern = rightParts[1];
      if (!pattern) return [err('grep: missing pattern')];
      const regex = new RegExp(pattern);
      return combined.split('\n').filter(l => regex.test(l)).map(ok);
    }
    if (rightCmd === 'wc') {
      const lines = combined.split('\n').length;
      const words = combined.split(/\s+/).filter(Boolean).length;
      return [ok(`  ${lines}  ${words}  ${combined.length}`)];
    }
    if (rightCmd === 'sort') {
      const sorted = combined.split('\n').sort();
      return sorted.map(ok);
    }
    if (rightCmd === 'head') {
      const n = parseInt(rightParts[2], 10) || 10;
      return combined.split('\n').slice(0, n).map(ok);
    }
    if (rightCmd === 'tail') {
      const n = parseInt(rightParts[2], 10) || 10;
      return combined.split('\n').slice(-n).map(ok);
    }
    return intermediate;
  }

  return null;
}

/* ── Main dispatch ───────────────────────────────────────── */
function runSingle(input) {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const redirect = handleRedirect(trimmed);
  if (redirect) return redirect;

  const parts = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  const cmd   = parts[0].toLowerCase();
  const args  = parts.slice(1).map(a => a.replace(/^['"]|['"]$/g, ''));

  if (COMMANDS[cmd]) return COMMANDS[cmd](args);
  return [err(`${cmd}: command not found`),
          info(`Type 'help' for a list of available commands`)];
}

function runCommand(input) {
  addToHistory(input);
  return runSingle(input);
}

function getCurrentPrompt() {
  return `${env.USER}@${env.HOSTNAME}:${shortPath(cwd)}$ `;
}

export { runCommand, getCurrentPrompt };
