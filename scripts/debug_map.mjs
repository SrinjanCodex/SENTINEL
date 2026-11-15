import { spawn } from 'node:child_process';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9224;

async function run() {
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--remote-debugging-address=127.0.0.1',
    '--no-sandbox',
    '--disable-gpu',
    'about:blank',
  ]);

  let targets = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      if (res.ok) {
        targets = await res.json();
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!targets) throw new Error('Could not connect to Edge');
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let msgId = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgId++;
      const handler = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.id === id) {
          ws.removeEventListener('message', handler);
          resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  
  // Wait until dashboard is rendered
  for (let i = 0; i < 40; i++) {
    const check = await send('Runtime.evaluate', {
      expression: `Boolean(document.querySelector('section[aria-label="Spatial GIS Preview"]'))`,
      returnByValue: true
    });
    if (check.result?.value) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 1500));

  const result = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const s = document.querySelector('section[aria-label="Spatial GIS Preview"]');
        if (!s) return { error: 'section not found' };
        const canvas = s.querySelector('div[style*="440px"]');
        return {
          sectionHeight: s.getBoundingClientRect().height,
          canvasRect: canvas ? canvas.getBoundingClientRect() : null,
          canvasHTML: canvas ? canvas.outerHTML.substring(0, 300) : null
        };
      })()
    `,
    returnByValue: true,
  });

  console.log(JSON.stringify(result.result.value, null, 2));
  ws.close();
  edge.kill();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
