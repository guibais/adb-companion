# Binary Download Sources

This document specifies the official download URLs for all binaries that ADB Companion will auto-download.

---

## 📦 Platform Tools (ADB + Fastboot)

### Official Google Downloads

| Platform | URL                                                                        |
| -------- | -------------------------------------------------------------------------- |
| Windows  | https://dl.google.com/android/repository/platform-tools-latest-windows.zip |
| macOS    | https://dl.google.com/android/repository/platform-tools-latest-darwin.zip  |
| Linux    | https://dl.google.com/android/repository/platform-tools-latest-linux.zip   |

### Version Discovery

- Latest version can be parsed from: https://developer.android.com/studio/releases/platform-tools
- Or use repository XML: https://dl.google.com/android/repository/repository2-1.xml

### Contents After Extraction

```
platform-tools/
├── adb(.exe)
├── fastboot(.exe)
├── etc1tool(.exe)
├── hprof-conv(.exe)
├── make_f2fs(.exe)
├── mke2fs(.exe)
└── ...
```

---

## 📺 scrcpy

### GitHub Releases API

```
https://api.github.com/repos/Genymobile/scrcpy/releases/latest
```

### Direct Download URLs (v3.3.3 example)

| Platform | Architecture | URL                                                                                             |
| -------- | ------------ | ----------------------------------------------------------------------------------------------- |
| Windows  | x64          | https://github.com/Genymobile/scrcpy/releases/download/v3.3.3/scrcpy-win64-v3.3.3.zip           |
| Windows  | x86          | https://github.com/Genymobile/scrcpy/releases/download/v3.3.3/scrcpy-win32-v3.3.3.zip           |
| macOS    | Universal    | Via Homebrew or build from source                                                               |
| Linux    | x64          | https://github.com/Genymobile/scrcpy/releases/download/v3.3.3/scrcpy-linux-x86_64-v3.3.3.tar.gz |

### macOS Installation Strategy

For macOS, we have two options:

1. **Bundle pre-built**: Build scrcpy ourselves and include in app
2. **Homebrew check**: Check if installed via `which scrcpy`
3. **Source build**: Download and compile (complex)

**Recommended**: Include pre-built binaries for macOS (x64 + arm64)

### Contents After Extraction

```
scrcpy/
├── scrcpy(.exe)
├── scrcpy-server           # Server APK pushed to device
├── adb(.exe)               # Can be ignored, use our own
├── *.dll (Windows only)
└── ...
```

---

## 🔧 apktool

### GitHub Releases API

```
https://api.github.com/repos/iBotPeaches/Apktool/releases/latest
```

### Direct Download (v2.9.3 example)

```
https://github.com/iBotPeaches/Apktool/releases/download/v2.9.3/apktool_2.9.3.jar
```

### Requirements

- Java Runtime Environment (JRE) 8 or higher
- We should bundle a portable JRE or use system Java

### Java Strategy

Options for Java dependency:

1. **System Java**: Check for `java` in PATH
2. **Bundled JRE**: Include portable JRE (~50MB per platform)
3. **Download JRE**: Download on first use

**Recommended**: Check system first, offer to download portable JRE if needed

### Portable JRE Sources

- **Adoptium (Eclipse Temurin)**: https://adoptium.net/
- **Azul Zulu**: https://www.azul.com/downloads/

---

## ✍️ uber-apk-signer

### GitHub Releases API

```
https://api.github.com/repos/patrickfav/uber-apk-signer/releases/latest
```

### Direct Download (v1.3.0 example)

```
https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar
```

### Requirements

- Java Runtime Environment (JRE) 8+
- Same as apktool

---

## 📋 Version Management

### binaries.json Schema

```json
{
  "platform-tools": {
    "version": "35.0.0",
    "sources": {
      "win32": {
        "url": "https://dl.google.com/android/repository/platform-tools-latest-windows.zip",
        "sha256": "abc123...",
        "size": 12345678
      },
      "darwin": {
        "url": "https://dl.google.com/android/repository/platform-tools-latest-darwin.zip",
        "sha256": "def456...",
        "size": 12345678
      },
      "linux": {
        "url": "https://dl.google.com/android/repository/platform-tools-latest-linux.zip",
        "sha256": "789ghi...",
        "size": 12345678
      }
    }
  },
  "scrcpy": {
    "version": "3.3.3",
    "sources": {
      "win32-x64": {
        "url": "https://github.com/Genymobile/scrcpy/releases/download/v3.3.3/scrcpy-win64-v3.3.3.zip",
        "sha256": "...",
        "size": 12345678
      },
      "linux-x64": {
        "url": "https://github.com/Genymobile/scrcpy/releases/download/v3.3.3/scrcpy-linux-x86_64-v3.3.3.tar.gz",
        "sha256": "...",
        "size": 12345678
      },
      "darwin-x64": {
        "bundled": true
      },
      "darwin-arm64": {
        "bundled": true
      }
    }
  },
  "apktool": {
    "version": "2.9.3",
    "source": {
      "url": "https://github.com/iBotPeaches/Apktool/releases/download/v2.9.3/apktool_2.9.3.jar",
      "sha256": "...",
      "size": 12345678
    },
    "requires": "java"
  },
  "uber-apk-signer": {
    "version": "1.3.0",
    "source": {
      "url": "https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar",
      "sha256": "...",
      "size": 12345678
    },
    "requires": "java"
  },
  "java": {
    "version": "21",
    "sources": {
      "win32-x64": {
        "url": "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse",
        "sha256": "...",
        "size": 51234567
      },
      "darwin-x64": {
        "url": "https://api.adoptium.net/v3/binary/latest/21/ga/mac/x64/jre/hotspot/normal/eclipse",
        "sha256": "...",
        "size": 51234567
      },
      "darwin-arm64": {
        "url": "https://api.adoptium.net/v3/binary/latest/21/ga/mac/aarch64/jre/hotspot/normal/eclipse",
        "sha256": "...",
        "size": 51234567
      },
      "linux-x64": {
        "url": "https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jre/hotspot/normal/eclipse",
        "sha256": "...",
        "size": 51234567
      }
    }
  }
}
```

---

## 🔄 Update Check Strategy

### On App Startup

1. Load local `binaries.json` with current versions
2. Check GitHub API for latest releases (optional, can be disabled)
3. Compare versions
4. If update available, show notification (don't auto-update)

### Rate Limiting

- GitHub API: 60 requests/hour (unauthenticated)
- Cache version checks for 24 hours
- Allow manual "Check for Updates" button

---

## 📁 Local Storage Structure

```
{userData}/
├── binaries/
│   ├── platform-tools/
│   │   ├── adb(.exe)
│   │   ├── fastboot(.exe)
│   │   └── version.txt          # "35.0.0"
│   ├── scrcpy/
│   │   ├── scrcpy(.exe)
│   │   ├── scrcpy-server
│   │   └── version.txt          # "3.3.3"
│   ├── java/
│   │   ├── bin/
│   │   │   └── java(.exe)
│   │   └── version.txt          # "21"
│   └── jars/
│       ├── apktool.jar
│       ├── apktool.version.txt  # "2.9.3"
│       ├── uber-apk-signer.jar
│       └── uber-apk-signer.version.txt
├── config/
│   └── settings.json
├── devices/
│   └── saved-devices.json
└── temp/
    └── downloads/
```

---

## ⬇️ Download Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADB Companion Setup                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Downloading required components...                            │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Platform Tools v35.0.0                                 │   │
│   │  ████████████████████░░░░░░░░░░░░░░  45% (5.2/11.5 MB)  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  scrcpy v3.3.3                                          │   │
│   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Waiting...         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  APK Tools                                              │   │
│   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Waiting...         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   Total Progress: 15%                                           │
│   Estimated time: 2 minutes                                     │
│                                                                 │
│                                              [Cancel Setup]     │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Checksum Verification

### Algorithm

- Use SHA-256 for all binary verification
- Calculate hash during download (streaming)
- Compare with expected hash from `binaries.json`
- If mismatch, delete file and retry

### Node.js Implementation

```typescript
import crypto from "crypto";
import fs from "fs";

async function verifyChecksum(
  filePath: string,
  expectedSha256: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => {
      const calculated = hash.digest("hex");
      resolve(calculated === expectedSha256);
    });
    stream.on("error", reject);
  });
}
```
