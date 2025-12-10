# ADB Companion

<p align="center">
  <img src="resources/icons/icon.png" alt="ADB Companion Logo" width="128" height="128">
</p>

<p align="center">
  A comprehensive GUI wrapper for Android Debug Bridge (ADB) and related tools.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#download">Download</a> •
  <a href="#development">Development</a> •
  <a href="#license">License</a>
</p>

---

## Features

- 🔌 **Device Management** - Connect via USB or WiFi, pair new devices with QR code
- 📺 **Screen Mirroring** - Mirror and control your device with scrcpy
- 📦 **App Management** - Install, uninstall, and manage applications
- 📁 **File Manager** - Browse, upload, and download files
- 📋 **Logcat Viewer** - Real-time log streaming with filters
- 🖥️ **Shell Terminal** - Interactive ADB shell
- 📸 **Screenshot/Recording** - Capture screenshots and record screen
- 🔧 **APK Tools** - Clone apps by renaming packages
- ⚡ **Quick Actions** - Toggle WiFi, Bluetooth, reboot, and more
- 💾 **Backup/Restore** - Full device backup and restore

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

## Acknowledgments

- [scrcpy](https://github.com/Genymobile/scrcpy) - Screen mirroring
- [Android Platform Tools](https://developer.android.com/studio/releases/platform-tools) - ADB
- [Apktool](https://github.com/iBotPeaches/Apktool) - APK manipulation
