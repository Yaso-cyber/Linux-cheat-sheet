import assert from 'node:assert/strict';

import { getCurrentPrompt, resetTerminalState, runCommand } from '../js/commands.js';

function outputText(lines) {
  return lines.map((line) => line.text).join('\n');
}

function run(input) {
  return runCommand(input);
}

resetTerminalState();

assert.equal(getCurrentPrompt(), 'user@linux-box:~$ ');

assert.match(outputText(run('mkdir -p sandbox/docs')),
  /created directory 'sandbox\/docs'/);
assert.match(outputText(run('cp -r ~/projects /tmp')),
  /'~\/projects' -> '\/tmp'/);
assert.match(outputText(run('ls /tmp')),
  /projects\//);

assert.match(outputText(run('cat -n ~/readme.txt')),
  /\s+1\s+Welcome to the Linux Cheat Sheet terminal!/);

assert.match(outputText(run('grep -r -n Hello /home/user')),
  /hello\.sh:2:echo "Hello, World!"/);

assert.equal(outputText(run('wc -l ~/readme.txt')).trim(), '2 ~/readme.txt');

run('echo "alice 10" > /tmp/scores.txt');
run('echo "bob 2" >> /tmp/scores.txt');
assert.equal(outputText(run('sort -k 2 -n /tmp/scores.txt')).trim(), 'bob 2\nalice 10');

run('echo "apple" > /tmp/dupes.txt');
run('echo "apple" >> /tmp/dupes.txt');
run('echo "pear" >> /tmp/dupes.txt');
assert.equal(outputText(run('uniq -c /tmp/dupes.txt')).trim(), '2 apple\n   1 pear');

assert.match(outputText(run('find /etc -type f -name "*.txt"')),
  /\(no matches\)/);
assert.match(outputText(run('kill -l')),
  /HUP INT QUIT KILL TERM STOP CONT/);
assert.match(outputText(run('which python3')),
  /\/usr\/bin\/python3/);
assert.match(outputText(run('curl -o /tmp/example.html https://example.com')),
  /Saved response to \/tmp\/example.html/);
assert.match(outputText(run('cat /tmp/example.html')),
  /<title>https:\/\/example\.com<\/title>/);

console.log('All command smoke tests passed.');