import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

// Kiểm tra môi trường Dev hay Production/Packaged app
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../../client/public/favicon.ico'),
    autoHideMenuBar: true,
  });

  if (isDev) {
    // Khi đang phát triển: Kết nối tới Vite dev server port 3001
    mainWindow.loadURL('http://localhost:3001');
    // mainWindow.webContents.openDevTools(); // Mở comment nếu muốn bật DevTools
  } else {
    // Khi đã đóng gói file .exe: Load file tĩnh kèm HashRouter
    const indexPath = path.join(__dirname, '../client/index.html');
    mainWindow.loadURL(`file:///${indexPath.replace(/\\/g, '/')}#/`);
  }

  // Quản lý sự kiện cửa sổ (Minimize, Maximize, Close)
  ipcMain.on('window-minimize', () => mainWindow.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow.close());
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});