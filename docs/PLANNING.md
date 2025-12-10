# ADB Companion - Planning Document

## 📋 Project Overview

**ADB Companion** is a cross-platform desktop application (Windows, macOS, Linux) that serves as a comprehensive GUI wrapper for Android Debug Bridge (ADB) and related tools. The goal is to make Android device management accessible to everyone - from developers to casual users.

### Key Principles

- **Zero configuration**: Auto-download all required binaries
- **Cross-platform**: Works identically on Windows, macOS, and Linux
- **Standalone**: No external dependencies required (except Node.js for development)
- **User-friendly**: Intuitive interface that feels like Unity Hub or Unreal Engine launcher

---

## 🛠️ Technology Stack

| Layer            | Technology                      |
| ---------------- | ------------------------------- |
| Framework        | Electron + Vite                 |
| Frontend         | React 18 + TypeScript           |
| Styling          | Tailwind CSS                    |
| State Management | Zustand                         |
| IPC              | Electron IPC with typed preload |
| Build            | electron-builder                |
| CI/CD            | GitHub Actions                  |

---

## 📦 Binary Management

### Bundled Binaries (Auto-Download on First Run)

| Binary               | Source                     | Platforms                 |
| -------------------- | -------------------------- | ------------------------- |
| ADB (platform-tools) | Google Android SDK         | win32, darwin, linux      |
| scrcpy               | Genymobile/scrcpy          | win32, darwin, linux      |
| apktool              | iBotPeaches/apktool        | Cross-platform (Java JAR) |
| uber-apk-signer      | patrickfav/uber-apk-signer | Cross-platform (Java JAR) |

### Download Strategy

1. On first launch, check if binaries exist in `userData/binaries/`
2. If missing, show download manager UI with:
   - Version being downloaded
   - Progress bar per binary
   - Total progress
   - Estimated time remaining
3. Verify checksums after download
4. Extract and set executable permissions (Unix)

### Binary Paths Structure

```
~/Library/Application Support/ADB Companion/  (macOS)
%APPDATA%/ADB Companion/                       (Windows)
~/.config/ADB Companion/                       (Linux)
└── binaries/
    ├── platform-tools/
    │   ├── adb(.exe)
    │   └── fastboot(.exe)
    ├── scrcpy/
    │   ├── scrcpy(.exe)
    │   └── scrcpy-server
    └── java-tools/
        ├── apktool.jar
        └── uber-apk-signer.jar
```

---

## 🎨 UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] ADB Companion            [Settings] [Minimize] [Close]  │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  [Device 1 Tab] [Device 2 Tab] [+ Add Device]               │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ │                         │                                   │ │
│ │    SIDEBAR              │         MAIN CONTENT              │ │
│ │    ─────────            │         ────────────              │ │
│ │    📱 Device Info       │    [Content based on selection]   │ │
│ │    📺 Screen Mirror     │                                   │ │
│ │    📦 Apps              │                                   │ │
│ │    📁 Files             │                                   │ │
│ │    📋 Logcat            │                                   │ │
│ │    🖥️ Shell             │                                   │ │
│ │    📸 Screenshot        │                                   │ │
│ │    🔧 APK Tools         │                                   │ │
│ │    ⚡ Quick Actions     │                                   │ │
│ │                         │                                   │ │
├─────────────────────────────────────────────────────────────────┤
│  Status: Connected via USB │ ADB v35.0.0 │ scrcpy v3.3.3       │
└─────────────────────────────────────────────────────────────────┘
```

### Design Tokens

```css
--color-bg-primary: #0f0f0f;
--color-bg-secondary: #1a1a1a;
--color-bg-tertiary: #242424;
--color-accent: #22c55e;
--color-accent-hover: #16a34a;
--color-text-primary: #ffffff;
--color-text-secondary: #a1a1aa;
--color-border: #2d2d2d;
--color-danger: #ef4444;
--color-warning: #f59e0b;
```

### Draggable Windows Feature

- scrcpy window can be:
  - Embedded in main window (default)
  - Dragged outside to become standalone window
  - Snapped back by dragging to dock area
- Implementation: Use Electron BrowserWindow for detached mode

---

## 🔌 Core Features

### 1. Device Connection Manager

- **USB Detection**: Auto-detect connected devices via USB
- **Wireless Pairing**:
  - QR Code generation for pairing
  - Manual IP + Port input
  - Save paired devices for quick reconnect
- **Device List**: Show all connected/saved devices with status

### 2. Device Information Panel

- Model, Manufacturer, Android Version
- Screen resolution and DPI
- Battery level and charging status
- Available storage
- CPU/Memory usage (real-time)

### 3. Screen Mirroring (scrcpy)

- Embedded or detachable window
- Resolution presets (1080p, 720p, 480p)
- Bitrate control
- Recording to file
- Virtual display mode
- Camera mirroring (Android 12+)

### 4. Application Manager

- List all installed apps (system + user)
- Search and filter apps
- Install APK (drag & drop)
- Uninstall apps
- Clear app data
- Force stop apps
- Export APK from device
- **APK Cloning**: Rename package to install duplicates

### 5. File Manager

- Browse device filesystem
- Upload files (drag & drop)
- Download files
- Create/Delete folders
- Permissions viewer

### 6. Logcat Viewer

- Real-time log streaming
- Filter by:
  - Log level (V, D, I, W, E, F)
  - Package name
  - Tag
  - Search text
- Export logs to file
- Clear logs

### 7. Shell Terminal

- Interactive ADB shell
- Command history
- Auto-complete common commands
- Custom command presets

### 8. Screenshot/Recording

- Capture screenshot (save as PNG)
- Screen recording with options:
  - Duration
  - Resolution
  - Include audio (Android 11+)
- Auto-save to configured folder

### 9. APK Tools

- **APK Renamer/Cloner**:
  - Change package name
  - Change app name
  - Change app icon
  - Re-sign APK
- **APK Info Viewer**:
  - Manifest details
  - Permissions list
  - Size breakdown

### 10. Quick Actions

- Reboot (normal, recovery, bootloader, fastboot)
- Toggle WiFi/Bluetooth/Airplane mode
- Enable/disable developer options
- Clear device cache
- Factory reset (with confirmation)

### 11. Backup/Restore

- Full device backup
- App-specific backup
- Restore from backup file

---

## 📁 Project Structure

```
adb-companion/
├── .github/
│   └── workflows/
│       └── build.yml           # CI/CD pipeline
├── electron/
│   ├── main/
│   │   ├── index.ts            # Main process entry
│   │   ├── ipc-handlers.ts     # IPC event handlers
│   │   ├── window-manager.ts   # Window management
│   │   └── services/
│   │       ├── adb.service.ts
│   │       ├── scrcpy.service.ts
│   │       ├── binary-manager.service.ts
│   │       ├── apk-tools.service.ts
│   │       └── device.service.ts
│   └── preload/
│       └── index.ts            # Preload script with typed API
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── TabBar.tsx
│   │   │   └── StatusBar.tsx
│   │   ├── device/
│   │   │   ├── DeviceInfo.tsx
│   │   │   ├── DeviceList.tsx
│   │   │   └── ConnectionDialog.tsx
│   │   ├── apps/
│   │   │   ├── AppList.tsx
│   │   │   ├── AppDetails.tsx
│   │   │   └── ApkInstaller.tsx
│   │   ├── files/
│   │   │   ├── FileExplorer.tsx
│   │   │   └── FileUploader.tsx
│   │   ├── logcat/
│   │   │   ├── LogViewer.tsx
│   │   │   └── LogFilter.tsx
│   │   ├── shell/
│   │   │   └── Terminal.tsx
│   │   ├── scrcpy/
│   │   │   ├── ScrcpyWindow.tsx
│   │   │   └── ScrcpyControls.tsx
│   │   ├── apk-tools/
│   │   │   ├── ApkRenamer.tsx
│   │   │   └── ApkInfo.tsx
│   │   ├── setup/
│   │   │   ├── BinaryDownloader.tsx
│   │   │   └── DownloadProgress.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Tabs.tsx
│   │       ├── Toast.tsx
│   │       └── ProgressBar.tsx
│   ├── pages/
│   │   ├── DevicePage.tsx
│   │   ├── AppsPage.tsx
│   │   ├── FilesPage.tsx
│   │   ├── LogcatPage.tsx
│   │   ├── ShellPage.tsx
│   │   ├── ScreenMirrorPage.tsx
│   │   ├── ScreenshotPage.tsx
│   │   ├── ApkToolsPage.tsx
│   │   ├── QuickActionsPage.tsx
│   │   └── BackupPage.tsx
│   ├── stores/
│   │   ├── device.store.ts
│   │   ├── ui.store.ts
│   │   ├── settings.store.ts
│   │   └── binary.store.ts
│   ├── hooks/
│   │   ├── useAdb.ts
│   │   ├── useDevices.ts
│   │   ├── useScrcpy.ts
│   │   └── useDownload.ts
│   ├── types/
│   │   ├── device.types.ts
│   │   ├── app.types.ts
│   │   ├── file.types.ts
│   │   └── ipc.types.ts
│   ├── utils/
│   │   ├── platform.ts
│   │   └── formatters.ts
│   └── styles/
│       └── globals.css
├── resources/
│   ├── icons/
│   │   ├── icon.png
│   │   ├── icon.icns
│   │   └── icon.ico
│   └── binaries.json          # Binary download URLs and checksums
├── electron-builder.yml
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── package.json
└── README.md
```

---

## 🔄 IPC Communication

### Typed IPC Channels

```typescript
type IpcChannels = {
  "adb:list-devices": () => Promise<Device[]>;
  "adb:connect": (ip: string, port: number) => Promise<boolean>;
  "adb:pair": (ip: string, port: number, code: string) => Promise<boolean>;
  "adb:disconnect": (deviceId: string) => Promise<void>;
  "adb:shell": (deviceId: string, command: string) => Promise<string>;
  "adb:install-apk": (deviceId: string, apkPath: string) => Promise<void>;
  "adb:uninstall": (deviceId: string, packageName: string) => Promise<void>;
  "adb:push": (
    deviceId: string,
    localPath: string,
    remotePath: string
  ) => Promise<void>;
  "adb:pull": (
    deviceId: string,
    remotePath: string,
    localPath: string
  ) => Promise<void>;
  "adb:screenshot": (deviceId: string, savePath: string) => Promise<string>;
  "adb:logcat": (deviceId: string, filters?: LogcatFilter) => void;
  "adb:reboot": (
    deviceId: string,
    mode: "normal" | "recovery" | "bootloader"
  ) => Promise<void>;

  "scrcpy:start": (deviceId: string, options: ScrcpyOptions) => Promise<number>;
  "scrcpy:stop": (processId: number) => Promise<void>;

  "binary:check": () => Promise<BinaryStatus>;
  "binary:download": (name: string) => Promise<void>;
  "binary:download-progress": (
    callback: (progress: DownloadProgress) => void
  ) => void;

  "apk:rename-package": (
    apkPath: string,
    newPackage: string
  ) => Promise<string>;
  "apk:get-info": (apkPath: string) => Promise<ApkInfo>;

  "device:info": (deviceId: string) => Promise<DeviceInfo>;
  "device:battery": (deviceId: string) => Promise<BatteryInfo>;
  "device:storage": (deviceId: string) => Promise<StorageInfo>;
};
```

---

## 🚀 GitHub Actions CI/CD

### Build Workflow

```yaml
name: Build and Release

on:
  push:
    tags:
      - "v*"
  pull_request:
    branches:
      - main

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Package
        run: npm run package
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.os }}
          path: dist/*

  release:
    needs: build
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/')

    steps:
      - uses: actions/download-artifact@v4

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            release-*/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 📅 Implementation Phases

### Phase 1: Foundation (Week 1)

- [ ] Initialize Electron + Vite + React project
- [ ] Setup Tailwind CSS and design system
- [ ] Create basic layout components
- [ ] Implement binary download manager
- [ ] Setup Zustand stores

### Phase 2: Core ADB Features (Week 2)

- [ ] Device detection and listing
- [ ] USB connection handling
- [ ] Wireless pairing (QR + manual)
- [ ] Device info display
- [ ] Basic shell command execution

### Phase 3: Screen Mirroring (Week 3)

- [ ] scrcpy integration
- [ ] Embedded window mode
- [ ] Detachable window mode
- [ ] Recording functionality

### Phase 4: App Management (Week 4)

- [ ] App listing
- [ ] APK installation (drag & drop)
- [ ] App uninstall and management
- [ ] APK cloner/renamer

### Phase 5: File & Logs (Week 5)

- [ ] File explorer
- [ ] File upload/download
- [ ] Logcat viewer with filters
- [ ] Screenshot/Recording

### Phase 6: Polish & Distribution (Week 6)

- [ ] Settings page
- [ ] Multi-device tabs
- [ ] Quick actions
- [ ] GitHub Actions setup
- [ ] Documentation
- [ ] Beta release

---

## 🔒 Security Considerations

1. **Binary Verification**: SHA256 checksum validation for all downloads
2. **Sandboxed Execution**: Run external binaries in isolated processes
3. **No Network Requests**: App doesn't send data to external servers (except binary downloads from official sources)
4. **Context Isolation**: Electron context isolation enabled
5. **Privileged Access**: Request user confirmation for sensitive operations (factory reset, etc.)

---

## 📚 References

- [Electron Documentation](https://www.electronjs.org/docs)
- [scrcpy GitHub](https://github.com/Genymobile/scrcpy)
- [ADB Documentation](https://developer.android.com/studio/command-line/adb)
- [electron-builder](https://www.electron.build/)
- [Zustand](https://github.com/pmndrs/zustand)
