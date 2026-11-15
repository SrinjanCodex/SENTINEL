import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9222;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('Launching Edge headless...');
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--remote-debugging-address=127.0.0.1',
    '--no-sandbox',
    '--disable-gpu',
    'about:blank',
  ]);

  edge.stderr.on('data', (d) => {
    // console.error('[Edge]', d.toString());
  });

  // Wait for remote debugging endpoint
  let targets = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      if (res.ok) {
        targets = await res.json();
        break;
      }
    } catch {}
    await sleep(300);
  }

  if (!targets || targets.length === 0) {
    edge.kill();
    throw new Error('Failed to connect to Edge DevTools target');
  }

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  console.log('Connected to target:', pageTarget.id);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  function send(method, params = {}) {
    const id = msgId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  const viewports = [
    { name: 'desktop', width: 1440, height: 2400, mobile: false },
    { name: 'tablet', width: 1024, height: 2400, mobile: false },
    { name: 'mobile', width: 390, height: 3500, mobile: true },
  ];

  const results = {};

  if (!fs.existsSync('artifacts')) {
    fs.mkdirSync('artifacts', { recursive: true });
  }

  for (const vp of viewports) {
    console.log(`\n--- Measuring at ${vp.name} (${vp.width}x${vp.height}) ---`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile,
    });

    await send('Page.navigate', { url: 'http://localhost:5173/' });
    
    // Wait until dashboard is rendered with real incident and report data
    for (let i = 0; i < 40; i++) {
      const check = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('section[aria-label="Active Anomalies & Cluster Hotspots"] .card-depth, section[aria-label="Active Anomalies & Cluster Hotspots"] figure'))`,
        returnByValue: true
      });
      if (check.result?.value) break;
      await sleep(250);
    }
    await sleep(1500); // Wait for countUp and map tiles to stabilize

    // Measure elements on dashboard
    const evalResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          function measure(sel) {
            const el = document.querySelector(sel);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
              width: Math.round(r.width * 10) / 10,
              height: Math.round(r.height * 10) / 10,
              top: Math.round(r.top * 10) / 10,
              left: Math.round(r.left * 10) / 10
            };
          }

          return {
            container: measure('main > div'),
            kpiTile: measure('section[aria-label="Incident Prioritisation Metrics"] .grid > *:first-child .card-depth, section[aria-label="Incident Prioritisation Metrics"] .grid > *:first-child figure'),
            recentReportStream: measure('section[aria-label="Recent reports stream"] .card-depth, section[aria-label="Recent reports stream"]'),
            recentReportRow: measure('section[aria-label="Recent reports stream"] ul > li'),
            heuristicPipeline: measure('section[aria-label="Community Sensor Information"] .card-depth, section[aria-label="Community Sensor Information"]'),
            activeAnomaly: measure('section[aria-label="Active Anomalies & Cluster Hotspots"] .grid .card-depth, section[aria-label="Active Anomalies & Cluster Hotspots"] .grid figure'),
            mapSection: measure('section[aria-label="Spatial GIS Preview"]'),
            mapPreview: measure('section[aria-label="Spatial GIS Preview"] .card-depth'),
            mapCanvas: measure('section[aria-label="Spatial GIS Preview"] div[style*="440px"]'),
            mapLeaflet: measure('section[aria-label="Spatial GIS Preview"] .leaflet-container'),
            mapError: measure('section[aria-label="Spatial GIS Preview"] [role="region"]')
          };
        })()
      `,
      returnByValue: true,
    });

    const screenshotData = await send('Page.captureScreenshot', { format: 'png' });
    const screenshotPath = path.resolve(`artifacts/dashboard-${vp.width}.png`);
    fs.writeFileSync(screenshotPath, Buffer.from(screenshotData.data, 'base64'));
    console.log(`Saved screenshot: ${screenshotPath}`);

    // Now navigate to /reports and measure
    await send('Page.navigate', { url: 'http://localhost:5173/reports' });
    
    // Wait until reports directory is rendered
    for (let i = 0; i < 30; i++) {
      const check = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('article, [aria-busy="false"]'))`,
        returnByValue: true
      });
      if (check.result?.value) break;
      await sleep(200);
    }
    await sleep(1500);

    const reportsEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          function measure(sel) {
            const el = document.querySelector(sel);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
              width: Math.round(r.width * 10) / 10,
              height: Math.round(r.height * 10) / 10
            };
          }
          return {
            reportCard: measure('main article, article, main div.space-y-4 .card-depth, main div.space-y-4 > div:first-child')
          };
        })()
      `,
      returnByValue: true,
    });

    if (vp.width === 1440) {
      const repScreenshot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('artifacts/reports-1440.png', Buffer.from(repScreenshot.data, 'base64'));
    }

    results[vp.name] = {
      viewport: `${vp.width}x${vp.height}`,
      dashboard: evalResult.result?.value,
      reportsPage: reportsEval.result?.value,
    };
  }

  console.log('\n================ MEASUREMENT RESULTS ================');
  console.log(JSON.stringify(results, null, 2));

  ws.close();
  edge.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error in measure script:', err);
  process.exit(1);
});
