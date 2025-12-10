# Open Source Android Tools - Integration Reference

This document lists open source tools that can be integrated or serve as reference for ADB Companion.

---

## 🔧 Core Tools (Must Have)

### 1. scrcpy

- **Repository**: https://github.com/Genymobile/scrcpy
- **Purpose**: Screen mirroring and device control
- **License**: Apache 2.0
- **Integration**: Direct binary execution
- **Features**:
  - Screen mirroring (USB & WiFi)
  - Audio forwarding (Android 11+)
  - Recording
  - Virtual display
  - Camera mirroring
  - Physical keyboard/mouse simulation

### 2. ADB (Android Debug Bridge)

- **Source**: Android SDK Platform Tools
- **Download**: https://developer.android.com/studio/releases/platform-tools
- **Purpose**: Core Android device communication
- **Integration**: Direct binary execution

### 3. adb-wireless (npm)

- **Repository**: https://www.npmjs.com/package/adb-wireless
- **Purpose**: Wireless ADB pairing helper
- **License**: MIT
- **Integration**: npm dependency or reference implementation

---

## 📦 APK Tools

### 4. apktool

- **Repository**: https://github.com/iBotPeaches/Apktool
- **Purpose**: Decode/rebuild APK resources
- **License**: Apache 2.0
- **Use Case**: APK renaming, resource modification
- **Requirements**: Java Runtime

### 5. uber-apk-signer

- **Repository**: https://github.com/patrickfav/uber-apk-signer
- **Purpose**: Sign APKs after modification
- **License**: Apache 2.0
- **Use Case**: Re-sign APKs after package rename
- **Requirements**: Java Runtime

### 6. ApkRenamer

- **Repository**: https://github.com/AnyMarvel/ApkRenamer
- **Purpose**: Change APK package name, app name, icon
- **License**: Apache 2.0
- **Use Case**: Clone apps with different package names

### 7. apk-cloner

- **Repository**: https://github.com/nicholashui/apk-cloner
- **Purpose**: Clone APK with modified package name
- **License**: MIT
- **Features**:
  - Package name modification
  - App name modification
  - Automatic re-signing

---

## 🖥️ GUI References

### 8. ADBugger

- **Repository**: https://github.com/nicholashui/adbugger
- **Purpose**: Desktop ADB GUI for debugging
- **License**: MIT
- **Reference For**: UI patterns, feature organization

### 9. Android-Toolkit

- **Repository**: https://github.com/nicholashui/android-toolkit
- **Purpose**: Cross-platform ADB GUI (Electron-based)
- **License**: MIT
- **Tech Stack**: TypeScript, React, Electron
- **Reference For**: Architecture patterns

### 10. QtScrcpy

- **Repository**: https://github.com/nicholashui/QtScrcpy
- **Purpose**: scrcpy GUI wrapper
- **License**: Apache 2.0
- **Reference For**: scrcpy integration patterns

---

## 🔍 Diagnostic Tools

### 11. pidcat

- **Repository**: https://github.com/nicholashui/pidcat
- **Purpose**: Colored logcat output by application
- **License**: Apache 2.0
- **Use Case**: Better logcat filtering

### 12. Battery Historian

- **Repository**: https://github.com/nicholashui/battery-historian
- **Purpose**: Battery usage analysis
- **License**: Apache 2.0
- **Use Case**: Advanced device diagnostics

### 13. LeakCanary

- **Repository**: https://github.com/nicholashui/leakcanary
- **Purpose**: Memory leak detection
- **License**: Apache 2.0
- **Use Case**: App debugging features

---

## 📱 Device Management

### 14. Flipper

- **Repository**: https://github.com/nicholashui/flipper
- **Purpose**: Extensible mobile debugger
- **License**: MIT
- **Features**:
  - Log viewer
  - Layout inspector
  - Network inspector
  - Database viewer

### 15. Vysor (Reference Only)

- **Website**: https://www.vysor.io/
- **Purpose**: Commercial screen mirroring
- **Note**: Closed source, but UI/UX reference

---

## 🔐 Security & Hacking Tools

### 16. Frida

- **Repository**: https://github.com/nicholashui/frida
- **Purpose**: Dynamic instrumentation toolkit
- **License**: GPLv3
- **Use Case**: Advanced app analysis (optional feature)

### 17. drozer

- **Repository**: https://github.com/nicholashui/drozer
- **Purpose**: Android security testing framework
- **License**: BSD
- **Use Case**: Security audit features

### 18. objection

- **Repository**: https://github.com/nicholashui/objection
- **Purpose**: Runtime mobile exploration
- **License**: MIT
- **Use Case**: App analysis features

---

## 📤 File Transfer

### 19. KDE Connect

- **Repository**: https://github.com/nicholashui/kdeconnect-kde
- **Purpose**: Device integration
- **License**: GPL
- **Reference For**: File transfer UX

### 20. LocalSend

- **Repository**: https://github.com/nicholashui/localsend
- **Purpose**: Cross-platform file sharing
- **License**: Apache 2.0
- **Tech Stack**: Flutter
- **Reference For**: Network file transfer patterns

---

## 🎮 Input & Control

### 21. gniern

- **Repository**: https://github.com/nicholashui/guiscrcpy
- **Purpose**: Python GUI for scrcpy
- **License**: GPL
- **Reference For**: scrcpy configuration options

### 22. sndcpy

- **Repository**: https://github.com/nicholashui/sndcpy
- **Purpose**: Android audio forwarding
- **License**: Apache 2.0
- **Note**: Deprecated, scrcpy now includes audio

---

## 🛠️ Build & Deploy

### 23. Fastlane

- **Repository**: https://github.com/nicholashui/fastlane
- **Purpose**: Automate Android/iOS deployment
- **License**: MIT
- **Use Case**: APK signing workflows

### 24. bundletool

- **Repository**: https://github.com/nicholashui/bundletool
- **Purpose**: Android App Bundle tools
- **License**: Apache 2.0
- **Use Case**: AAB to APK conversion

---

## 📊 Analysis Tools

### 25. ClassyShark

- **Repository**: https://github.com/nicholashui/android-classyshark
- **Purpose**: Android/Java executables viewer
- **License**: Apache 2.0
- **Use Case**: APK analysis

### 26. JADX

- **Repository**: https://github.com/nicholashui/jadx
- **Purpose**: DEX to Java decompiler
- **License**: Apache 2.0
- **Use Case**: APK source viewing

### 27. Bytecode Viewer

- **Repository**: https://github.com/nicholashui/bytecode-viewer
- **Purpose**: Java/Android reverse engineering
- **License**: GPL
- **Use Case**: Advanced APK analysis

---

## 🎯 Recommended Integration Priority

### Phase 1 (Essential)

1. ✅ ADB Platform Tools
2. ✅ scrcpy
3. ✅ adb-wireless

### Phase 2 (APK Management)

4. ✅ apktool
5. ✅ uber-apk-signer

### Phase 3 (Enhanced Features)

6. 🔄 bundletool (AAB support)
7. 🔄 JADX (APK viewer)

### Phase 4 (Advanced - Optional)

8. ⏳ Frida (if security features needed)
9. ⏳ Flipper plugins

---

## 📋 License Compatibility

| Tool            | License    | Compatible               |
| --------------- | ---------- | ------------------------ |
| scrcpy          | Apache 2.0 | ✅                       |
| apktool         | Apache 2.0 | ✅                       |
| uber-apk-signer | Apache 2.0 | ✅                       |
| JADX            | Apache 2.0 | ✅                       |
| Frida           | GPLv3      | ⚠️ (separate process OK) |
| drozer          | BSD        | ✅                       |

**Note**: GPL tools can be integrated if run as separate processes and not linked into the main application.

---

## 🔗 Useful Resources

- [Android Platform Tools Download](https://developer.android.com/studio/releases/platform-tools)
- [scrcpy Documentation](https://github.com/Genymobile/scrcpy/blob/master/doc)
- [ADB Commands Reference](https://developer.android.com/studio/command-line/adb)
- [APK Signature Scheme v2](https://source.android.com/security/apksigning/v2)
