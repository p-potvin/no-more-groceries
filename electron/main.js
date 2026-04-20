/**
 * Electron Main Process — No More Groceries
 *
 * Responsibilities:
 *  1. Spawn the API server as a child process on a random free port
 *  2. Build or locate the Vite dist output
 *  3. Open a BrowserWindow that loads the SPA
 *  4. Inject the API port via IPC so the renderer can talk to it
 *  5. Clean up the child process on exit
 */

const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path   = require('node:path');
const { spawn, execSync } = require('node:child_process');
const net    = require('node:net');
const fs     = require('node:fs');

// ─────────────────────────────────────────────────────────────────────────────
// Globals
// ─────────────────────────────────────────────────────────────────────────────
let mainWindow = null;
let apiProcess = null;
let apiPort    = null;

const isDev    = !app.isPackaged;
const rootDir  = isDev
  ? path.join(__dirname, '..')       // project root in dev
  : path.join(process.resourcesPath, 'app'); // packaged resources

// ─────────────────────────────────────────────────────────────────────────────
// Find a free TCP port
// ─────────────────────────────────────────────────────────────────────────────
function findFreePort(preferred = 8787) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
      // preferred port busy → let OS assign one
      const s2 = net.createServer();
      s2.unref();
      s2.on('error', reject);
      s2.listen(0, '127.0.0.1', () => {
        const p = s2.address().port;
        s2.close(() => resolve(p));
      });
    });
    server.listen(preferred, '127.0.0.1', () => {
      server.close(() => resolve(preferred));
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Start the embedded API server
// ─────────────────────────────────────────────────────────────────────────────
async function startApiServer() {
  apiPort = await findFreePort(8787);

  const serverScript = path.join(rootDir, 'server.mjs');
  const nodeBin      = process.execPath; // same node that runs Electron

  console.log(`[main] Starting API server on port ${apiPort} via ${serverScript}`);

  apiProcess = spawn(nodeBin, [serverScript], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT:     String(apiPort),
      NODE_ENV: isDev ? 'development' : 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  apiProcess.stdout.on('data', (d) => process.stdout.write(`[api] ${d}`));
  apiProcess.stderr.on('data', (d) => process.stderr.write(`[api:err] ${d}`));
  apiProcess.on('exit', (code) => console.log(`[main] API process exited (code ${code})`));

  // Wait for API to be ready (up to 10 s)
  await waitForPort(apiPort, 10_000);
  console.log(`[main] API ready at http://127.0.0.1:${apiPort}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Poll until a TCP port accepts connections
// ─────────────────────────────────────────────────────────────────────────────
function waitForPort(port, timeoutMs) {
  const interval = 150;
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    function attempt() {
      const s = net.createConnection({ port, host: '127.0.0.1' });
      s.on('connect', () => { s.destroy(); resolve(); });
      s.on('error', () => {
        s.destroy();
        if (Date.now() >= deadline) return reject(new Error(`Port ${port} not ready after ${timeoutMs}ms`));
        setTimeout(attempt, interval);
      });
    }
    attempt();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Create the BrowserWindow
// ─────────────────────────────────────────────────────────────────────────────
async function createWindow() {
  mainWindow = new BrowserWindow({
    width:          1280,
    height:         860,
    minWidth:       800,
    minHeight:      600,
    backgroundColor: '#0a0d13',
    titleBarStyle:  'default',
    title:          'No More Groceries',
    icon:           path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload:         path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
    },
  });

  // Supply the API port to the renderer before first paint
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.executeJavaScript(
      `window.__API_PORT__ = ${apiPort};`
    );
  });

  // In dev, load from Vite dev server; in prod, load built dist
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const distIndex = path.join(rootDir, 'dist', 'index.html');
    await mainWindow.loadFile(distIndex);
  }

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─────────────────────────────────────────────────────────────────────────────
// IPC handlers
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.handle('get-api-port', () => apiPort);

ipcMain.handle('open-external', (_event, url) => {
  shell.openExternal(url);
});

// ─────────────────────────────────────────────────────────────────────────────
// App lifecycle
// ─────────────────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    await startApiServer();
  } catch (err) {
    console.error('[main] API failed to start:', err.message);
    // Continue anyway — renderer will show error state
  }

  await createWindow();

  // Menu: minimal
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'Application',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { label: 'DevTools', accelerator: 'CmdOrCtrl+Shift+I', click: () => mainWindow?.webContents.openDevTools() },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
  ]));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});

app.on('before-quit', () => {
  if (apiProcess) {
    console.log('[main] Terminating API process...');
    apiProcess.kill('SIGTERM');
    apiProcess = null;
  }
});

// Ensure API process is killed on unexpected exit
process.on('exit', () => { if (apiProcess) apiProcess.kill(); });
