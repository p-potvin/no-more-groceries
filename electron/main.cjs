/**
 * Electron Main Process — No More Groceries
 * CommonJS format (.cjs) — required because package.json has "type":"module"
 * which would treat .js files as ESM, but Electron's main process uses CJS.
 */

'use strict';

const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path   = require('node:path');
const { spawn, fork } = require('node:child_process');
const net    = require('node:net');

// ─────────────────────────────────────────────────────────────────────────────
// Globals
// ─────────────────────────────────────────────────────────────────────────────
let mainWindow = null;
let apiProcess = null;
let apiPort    = null;

const isDev   = !app.isPackaged;
const rootDir = app.getAppPath();

// ─────────────────────────────────────────────────────────────────────────────
// Find a free TCP port
// ─────────────────────────────────────────────────────────────────────────────
function findFreePort(preferred = 8787) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
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
  apiPort = await findFreePort(process.env.PORT || 8787);

  const serverScript = path.join(rootDir, 'server.mjs');
  const nodeBin      = process.execPath;

  if (isDev) console.log(`[main] Starting API on port ${apiPort}`);

  apiProcess = fork(serverScript, [], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT:     String(apiPort),
      NODE_ENV: isDev ? 'development' : 'production',
      DB_DIR:   path.join(app.getPath('userData'), 'Local Store'),
      ELECTRON_RUN_AS_NODE: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });

  apiProcess.stdout.on('data', (d) => {
    if (isDev) process.stdout.write(`[api] ${d}`);
  });
  apiProcess.stderr.on('data', (d) => {
    if (isDev) process.stderr.write(`[api:err] ${d}`);
  });
  apiProcess.on('exit', (code) => {
    if (isDev) console.log(`[main] API exited (code ${code})`);
  });

  await waitForPort(apiPort, 12_000);
  if (isDev) console.log(`[main] API ready at http://127.0.0.1:${apiPort}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Poll until a TCP port accepts connections
// ─────────────────────────────────────────────────────────────────────────────
function waitForPort(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    function attempt() {
      const s = net.createConnection({ port, host: '127.0.0.1' });
      s.on('connect', () => { s.destroy(); resolve(); });
      s.on('error', () => {
        s.destroy();
        if (Date.now() >= deadline) return reject(new Error(`Port ${port} not ready`));
        setTimeout(attempt, 150);
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
    width:           1280,
    height:          860,
    minWidth:        800,
    minHeight:       600,
    backgroundColor: '#0a0d13',
    titleBarStyle:   'default',
    title:           'No More Groceries',
    icon:            path.join(__dirname, 'icon.png'),
    webPreferences: {
      // Point to the CJS preload — must match this file's extension convention
      preload:          path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
    },
  });

  // Inject API port before first paint
  mainWindow.webContents.on('dom-ready', () => {
    if (apiPort) {
      mainWindow.webContents.executeJavaScript(`window.__API_PORT__ = ${apiPort};`);
    }
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadFile(path.join(rootDir, 'dist', 'index.html'));
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

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
ipcMain.handle('open-external', (_event, url) => shell.openExternal(url));

// ─────────────────────────────────────────────────────────────────────────────
// App lifecycle
// ─────────────────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    await startApiServer();
  } catch (err) {
    console.error('[main] API failed to start:', err.message);
  }

  await createWindow();

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'Application',
      submenu: [
        { label: 'Reload',   accelerator: 'CmdOrCtrl+R',       click: () => mainWindow?.reload() },
        { label: 'DevTools', accelerator: 'CmdOrCtrl+Shift+I', click: () => mainWindow?.webContents.openDevTools() },
        { type: 'separator' },
        { label: 'Quit',     accelerator: 'CmdOrCtrl+Q',       click: () => app.quit() },
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

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!mainWindow) createWindow(); });
app.on('before-quit', () => {
  if (apiProcess) { apiProcess.kill('SIGTERM'); apiProcess = null; }
});
process.on('exit', () => { if (apiProcess) apiProcess.kill(); });
