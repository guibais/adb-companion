# ADB Companion

<p align="center">
  <img src="resources/icons/icon.png" alt="ADB Companion Logo" width="128" height="128">
</p>

<p align="center">
  A daily-driver hub for connecting Android devices (USB/Wi‑Fi) and running your mobile workflows faster.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#why">Why</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#download">Download</a> •
  <a href="#development">Development</a> •
  <a href="#license">License</a>
</p>

---

## Features

## Why

ADB Companion is designed for people who connect a device all day and want one place to:

- **Connect fast** (USB or Wi‑Fi) and keep multiple devices organized.
- **Run dev workflows** (Expo, Capacitor, local web servers) without constantly switching tools.
- **Install multiple variants** of the same app (stage/preview/prod) side-by-side.
- **Launch companion tools** (scrcpy, Reactotron, etc.) without installing everything manually.

## Quick Start

### 1) Connect your device

- **USB**: enable Developer Options + USB debugging.
- **Wi‑Fi**: use the built-in pairing flow.

### 2) Common workflows

#### Expo (EAS / development builds)

- **Install multiple variants** (stage/prod) by cloning the package name.
- Great when you need to keep **two development builds** installed at the same time.

#### Capacitor

- Keep a device connected and use the app to:
  - install/reinstall APK quickly
  - watch logs
  - mirror the device with scrcpy

#### Access localhost from Android (port forwarding)

When your device is connected, you can forward ports (for example, to access a dev server running on your computer from the device):

```bash
adb -s <deviceId> reverse tcp:8081 tcp:8081
adb -s <deviceId> reverse tcp:5173 tcp:5173
adb -s <deviceId> reverse tcp:3000 tcp:3000
```

You can also run these commands from the app's shell.

## Demo

<!--
Add your demo video/GIF here.

Examples:

1) GIF
<p align="center">
  <img src="docs/demo.gif" alt="ADB Companion Demo" width="900" />
</p>

2) Video link
<p align="center">
  <a href="https://your-video-url">Watch the demo video</a>
</p>

3) MP4 in the repo (GitHub may not autoplay, but it will show a player)
<p align="center">
  <video src="docs/demo.mp4" controls width="900"></video>
</p>
-->

#### WebView / local sites (Capacitor / Expo web)

If you run a dev server on your computer, `adb reverse` makes it accessible from the device as `http://localhost:<port>`.

- Capacitor Live Reload often uses ports like `8100` (Ionic) or custom ports.
- Vite uses `5173`.
- React Native Metro uses `8081`.

### Device Management

- **USB & WiFi Connection** - Connect devices via USB or wirelessly over WiFi
- **QR Code Pairing** - Pair new devices easily with QR code scanning
- **Multi-device Support** - Manage multiple connected devices with tabs
- **Device Info** - View detailed device information (model, Android version, battery, storage)

### Screen Mirroring

- **Real-time Mirroring** - Mirror your device screen using scrcpy
- **Touch Control** - Control your device directly from the mirror window
- **Configurable Quality** - Adjust bitrate, resolution, and frame rate
- **Recording** - Record screen while mirroring

### App Management

- **List Applications** - View all installed apps (system and user)
- **Install APKs** - Drag & drop or browse to install APK files
- **Uninstall Apps** - Remove applications with one click
- **App Cloning** - Clone apps with different package names to run multiple instances
- **Split APK Support** - Full support for split APK applications
- **Export APKs** - Extract APK files from installed applications

### Multiple APK variants (stage / production)

- **Clone installs** by modifying the package name, so you can keep multiple builds installed.
- Useful for:
  - **Expo dev clients** (stage + prod)
  - QA workflows
  - testing migrations without uninstalling your daily build

### Logcat Viewer

- **Real-time Logs** - Stream device logs in real-time
- **Filters** - Filter by log level (Verbose, Debug, Info, Warning, Error)
- **Search** - Search through logs with regex support
- **Package Filter** - Filter logs by specific package name
- **Export Logs** - Save logs to file

### Shell Terminal

- **Interactive Shell** - Full ADB shell access
- **Command History** - Navigate through previous commands
- **Auto-complete** - Common command suggestions
- **Multi-line Support** - Execute complex scripts

### Screenshot & Recording

- **Screenshots** - Capture device screen instantly
- **Screen Recording** - Record device screen with configurable duration
- **Auto-save** - Automatically save to specified folder
- **Quick Share** - Copy to clipboard or open in default app

### APK Tools

- **Package Renaming** - Rename package name to create app clones
- **App Name Change** - Modify application display name
- **Robust Cloning** - Comprehensive package replacement in manifest, smali, and resources
- **Automatic Signing** - Re-sign modified APKs automatically

### Quick Actions

- **Device Controls** - Toggle WiFi, Bluetooth, Mobile Data
- **Reboot Options** - Reboot, Recovery, Bootloader, Fastboot
- **Screen Controls** - Screen on/off, rotation lock
- **Developer Options** - Toggle layout bounds, GPU overdraw, etc.

### Dev Tools

- **Reactotron** - Desktop app for React Native debugging
- **Flipper** - Mobile debugging platform (availability depends on OS)
- **JADX GUI** - APK analysis & reverse engineering
- **HTTP Toolkit** - HTTP(S) debugging proxy with desktop UI
- **scrcpy** - Screen mirroring (integrated in the app)

## Download

Download the latest release for your platform:

- **Windows**: [ADB-Companion-x.x.x-Windows.exe](https://github.com/adb-companion/adb-companion/releases/latest)
- **macOS**: [ADB-Companion-x.x.x-macOS.dmg](https://github.com/adb-companion/adb-companion/releases/latest)
- **Linux**: [ADB-Companion-x.x.x-Linux.AppImage](https://github.com/adb-companion/adb-companion/releases/latest)

### First Run

On first launch, ADB Companion will download the required tools:

- Android Platform Tools (ADB)
- scrcpy
- Java Runtime (for APK tools)
- APK Tool & Signer

## Screenshots

<p align="center">
  <img src="docs/screenshots/device-info.png" alt="Device Info" width="45%">
  <img src="docs/screenshots/screen-mirror.png" alt="Screen Mirror" width="45%">
</p>

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/adb-companion/adb-companion.git
cd adb-companion

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Building

```bash
# Build for current platform
npm run build

# Package for distribution
npm run package

# Platform-specific builds
npm run package:win
npm run package:mac
npm run package:linux
```

## Tech Stack

- **Framework**: Electron + Vite
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Build**: electron-builder

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Troubleshooting

### Device not showing up

- Ensure **USB debugging** is enabled.
- Try disconnecting/reconnecting the USB cable.
- From the app, open the shell and run:

```bash
adb devices
```

### Wi‑Fi pairing issues

- Device and computer must be on the same network.
- On Android 11+, enable **Wireless debugging**.
- If pairing succeeds but the device doesn't connect, retry connect using the address/port shown by Android.

### Localhost on device doesn't work

- Use **`adb reverse`** (device -> computer) for dev servers.
- Use **`adb forward`** (computer -> device) when you need to reach a port opened on the device.

```bash
adb -s <deviceId> reverse tcp:3000 tcp:3000
adb -s <deviceId> forward tcp:9222 tcp:9222
```

### Need stage + production installed at the same time

- Use the app's APK tools / clone install flow to install the same APK with a different **package name**.
- This is useful when Expo requires separate dev clients or when QA needs multiple channels installed.

## Acknowledgments

- [scrcpy](https://github.com/Genymobile/scrcpy) - Screen mirroring
- [Android Platform Tools](https://developer.android.com/studio/releases/platform-tools) - ADB
- [Apktool](https://github.com/iBotPeaches/Apktool) - APK manipulation
