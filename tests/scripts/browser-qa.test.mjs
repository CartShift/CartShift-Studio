import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, resolveExecutable } from '../../scripts/browser-qa/verify.mjs';

test('uses only explicitly installed native browser, never downloaded Lambda Chromium', () => {
  const available = path => path === '/usr/bin/chromium';
  assert.equal(resolveExecutable({}, available), '/usr/bin/chromium');
  assert.throws(
    () => resolveExecutable({}, () => false),
    /No native Chromium found/
  );
});

test('configured path must be absolute and executable', () => {
  assert.throws(
    () => resolveExecutable({ BROWSER_EXECUTABLE_PATH: 'chromium' }, () => true),
    /executable absolute path/
  );
  assert.throws(
    () => resolveExecutable({ CHROMIUM_PATH: '/tmp/chromium' }, () => false),
    /executable absolute path/
  );
  assert.equal(
    resolveExecutable({ PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium' }, () => true),
    '/usr/bin/chromium'
  );
});

test('validates URLs, prevents embedded passwords and rejects unknown CLI options', () => {
  assert.equal(parseArgs([]).url, null);
  assert.equal(parseArgs(['--url', 'http://127.0.0.1:3000/he/portal/']).url,
    'http://127.0.0.1:3000/he/portal/');
  assert.throws(() => parseArgs(['--url', 'file:///tmp/index.html']), /HTTP\(S\)/);
  assert.throws(() => parseArgs(['--url', 'https://u:p@example.com/']), /credentials/);
  assert.throws(() => parseArgs(['--url']), /requires/);
  assert.throws(() => parseArgs(['--unexpected']), /Unknown argument/);
});

test('accepts only bounded meaningful mobile and desktop viewport widths', () => {
  assert.deepEqual(parseArgs(['--widths', '320,390,768,390']).widths, [320, 390, 768]);
  for (const input of ['320,0', '100', '5000', 'foo', '320,375,390,400,500,600,700,800,900,1000,1100,1200,1300']) {
    assert.throws(() => parseArgs(['--widths', input]), /Invalid viewport widths/);
  }
});
