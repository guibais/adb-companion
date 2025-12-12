import { spawn } from "child_process";
import { join, basename } from "path";
import { app } from "electron";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "fs";
import type { ApkInfo, ApkRenameOptions } from "../../../src/types/app.types";

export class ApkToolsService {
  private replacePackageInManifest(
    manifest: string,
    oldPackage: string,
    newPackage: string
  ): string {
    const oldPkgEscaped = oldPackage.replace(/\./g, "\\.");

    manifest = manifest.replace(
      new RegExp(`package="${oldPkgEscaped}"`, "g"),
      `package="${newPackage}"`
    );

    manifest = manifest.replace(
      new RegExp(`android:authorities="${oldPkgEscaped}`, "g"),
      `android:authorities="${newPackage}`
    );

    manifest = manifest.replace(
      new RegExp(`split="${oldPkgEscaped}`, "g"),
      `split="${newPackage}`
    );

    manifest = manifest.replace(
      new RegExp(`android:name="${oldPkgEscaped}\\.`, "g"),
      `android:name="${newPackage}.`
    );

    manifest = manifest.replace(
      new RegExp(`android:targetActivity="${oldPkgEscaped}\\.`, "g"),
      `android:targetActivity="${newPackage}.`
    );

    manifest = manifest.replace(
      new RegExp(`android:permission="${oldPkgEscaped}\\.`, "g"),
      `android:permission="${newPackage}.`
    );

    manifest = manifest.replace(
      new RegExp(`android:name="${oldPkgEscaped}"`, "g"),
      `android:name="${newPackage}"`
    );

    manifest = manifest.replace(
      new RegExp(`android:taskAffinity="${oldPkgEscaped}`, "g"),
      `android:taskAffinity="${newPackage}`
    );

    manifest = manifest.replace(
      new RegExp(`android:process="${oldPkgEscaped}`, "g"),
      `android:process="${newPackage}`
    );

    manifest = manifest.replace(
      new RegExp(`android:sharedUserId="${oldPkgEscaped}`, "g"),
      `android:sharedUserId="${newPackage}`
    );

    manifest = manifest.replace(
      new RegExp(`"${oldPkgEscaped}\\.permission\\.`, "g"),
      `"${newPackage}.permission.`
    );

    manifest = manifest.replace(
      new RegExp(`"${oldPkgEscaped}\\.DYNAMIC_RECEIVER`, "g"),
      `"${newPackage}.DYNAMIC_RECEIVER`
    );

    manifest = manifest.replace(
      new RegExp(`>${oldPkgEscaped}\\.`, "g"),
      `>${newPackage}.`
    );

    manifest = manifest.replace(
      new RegExp(`>${oldPkgEscaped}<`, "g"),
      `>${newPackage}<`
    );

    return manifest;
  }

  private updateSmaliFiles(
    outputDir: string,
    oldPackage: string,
    newPackage: string
  ): void {
    const smaliDirs = readdirSync(outputDir).filter((d) =>
      d.startsWith("smali")
    );

    for (const smaliDir of smaliDirs) {
      const smaliPath = join(outputDir, smaliDir);
      if (!existsSync(smaliPath)) continue;

      this.processSmaliDirectory(smaliPath, oldPackage, newPackage);
    }
  }

  private processSmaliDirectory(
    dir: string,
    oldPackage: string,
    newPackage: string
  ): void {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        this.processSmaliDirectory(fullPath, oldPackage, newPackage);
      } else if (entry.name.endsWith(".smali")) {
        this.updateSmaliFile(fullPath, oldPackage, newPackage);
      }
    }
  }

  private updateSmaliFile(
    filePath: string,
    oldPackage: string,
    newPackage: string
  ): void {
    try {
      let content = readFileSync(filePath, "utf-8");
      const oldPkgPath = oldPackage.replace(/\./g, "/");
      const newPkgPath = newPackage.replace(/\./g, "/");

      if (content.includes(oldPkgPath) || content.includes(oldPackage)) {
        content = content.replace(new RegExp(oldPkgPath, "g"), newPkgPath);
        content = content.replace(
          new RegExp(oldPackage.replace(/\./g, "\\."), "g"),
          newPackage
        );
        writeFileSync(filePath, content);
      }
    } catch {}
  }

  private updatePublicXml(
    outputDir: string,
    oldPackage: string,
    newPackage: string
  ): void {
    const publicXmlPath = join(outputDir, "res", "values", "public.xml");
    if (existsSync(publicXmlPath)) {
      let content = readFileSync(publicXmlPath, "utf-8");
      const oldPkgEscaped = oldPackage.replace(/\./g, "\\.");
      content = content.replace(new RegExp(oldPkgEscaped, "g"), newPackage);
      writeFileSync(publicXmlPath, content);
    }
  }

  private updateResourceFiles(
    outputDir: string,
    oldPackage: string,
    newPackage: string
  ): void {
    const resDir = join(outputDir, "res");
    if (!existsSync(resDir)) return;

    const xmlDirs = readdirSync(resDir).filter(
      (d) =>
        d.startsWith("xml") || d.startsWith("values") || d.startsWith("layout")
    );

    for (const xmlDir of xmlDirs) {
      const dirPath = join(resDir, xmlDir);
      if (!existsSync(dirPath)) continue;

      const files = readdirSync(dirPath).filter((f) => f.endsWith(".xml"));
      for (const file of files) {
        const filePath = join(dirPath, file);
        try {
          let content = readFileSync(filePath, "utf-8");
          const oldPkgEscaped = oldPackage.replace(/\./g, "\\.");
          if (content.includes(oldPackage)) {
            content = content.replace(
              new RegExp(oldPkgEscaped, "g"),
              newPackage
            );
            writeFileSync(filePath, content);
          }
        } catch {}
      }
    }
  }
  private getJavaPath(): string {
    const userDataPath = app.getPath("userData");
    const javaDir = join(userDataPath, "binaries", "java");
    const javaName = process.platform === "win32" ? "bin/java.exe" : "bin/java";
    const localPath = join(javaDir, javaName);

    if (existsSync(localPath)) return localPath;
    return "java";
  }

  private getApktoolPath(): string {
    return join(app.getPath("userData"), "binaries", "jars", "apktool.jar");
  }

  private getSignerPath(): string {
    return join(
      app.getPath("userData"),
      "binaries",
      "jars",
      "uber-apk-signer.jar"
    );
  }

  private exec(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const java = spawn(this.getJavaPath(), args);
      let stdout = "";
      let stderr = "";

      java.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      java.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      java.on("close", (code) => {
        if (code === 0) resolve(stdout);
        else reject(new Error(stderr || `Java exited with code ${code}`));
      });

      java.on("error", reject);
    });
  }

  async getApkInfo(apkPath: string): Promise<ApkInfo> {
    const output = await this.exec([
      "-jar",
      this.getApktoolPath(),
      "d",
      apkPath,
      "-o",
      "-",
      "-f",
      "--no-src",
    ]);

    return {
      packageName: "com.example.app",
      appName: "Example App",
      versionName: "1.0.0",
      versionCode: 1,
      minSdkVersion: 21,
      targetSdkVersion: 34,
      permissions: [],
      activities: [],
      services: [],
      receivers: [],
      size: 0,
    };
  }

  async renamePackage(options: ApkRenameOptions): Promise<string> {
    const { apkPath, newPackageName, newAppName } = options;
    const tempDir = join(
      app.getPath("temp"),
      "adb-companion",
      `apk-${Date.now()}`
    );
    const outputDir = join(tempDir, "output");
    const modifiedApk = join(tempDir, "modified.apk");

    if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });
    if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

    await this.exec([
      "-jar",
      this.getApktoolPath(),
      "d",
      apkPath,
      "-o",
      outputDir,
      "-f",
    ]);

    const manifestPath = join(outputDir, "AndroidManifest.xml");
    let oldPackage = "";

    if (existsSync(manifestPath)) {
      let manifest = readFileSync(manifestPath, "utf-8");
      const oldPackageMatch = manifest.match(/package="([^"]+)"/);
      if (oldPackageMatch) {
        oldPackage = oldPackageMatch[1];
        manifest = this.replacePackageInManifest(
          manifest,
          oldPackage,
          newPackageName
        );
      }
      writeFileSync(manifestPath, manifest);
    }

    if (oldPackage) {
      console.log(
        `Updating smali files from ${oldPackage} to ${newPackageName}...`
      );
      this.updateSmaliFiles(outputDir, oldPackage, newPackageName);
      this.updatePublicXml(outputDir, oldPackage, newPackageName);
      this.updateResourceFiles(outputDir, oldPackage, newPackageName);
    }

    if (newAppName) {
      const stringsPath = join(outputDir, "res", "values", "strings.xml");
      if (existsSync(stringsPath)) {
        let strings = readFileSync(stringsPath, "utf-8");
        strings = strings.replace(
          /<string name="app_name">[^<]*<\/string>/,
          `<string name="app_name">${newAppName}</string>`
        );
        writeFileSync(stringsPath, strings);
      }
    }

    await this.exec([
      "-jar",
      this.getApktoolPath(),
      "b",
      outputDir,
      "-o",
      modifiedApk,
    ]);

    await this.exec([
      "-jar",
      this.getSignerPath(),
      "-a",
      modifiedApk,
      "-o",
      tempDir,
    ]);

    const signedApk = join(tempDir, "modified-aligned-debugSigned.apk");
    if (!existsSync(signedApk)) {
      const files = readdirSync(tempDir);
      const signed = files.find(
        (f) => f.includes("signed") || f.includes("Signed")
      );
      if (signed) {
        return join(tempDir, signed);
      }
      throw new Error("Signed APK not found");
    }

    return signedApk;
  }

  async renameSplitApks(options: {
    apkPaths: string[];
    newPackageName: string;
    newAppName?: string;
  }): Promise<string[]> {
    const { apkPaths, newPackageName, newAppName } = options;
    const tempDir = join(
      app.getPath("temp"),
      "adb-companion",
      `split-apk-${Date.now()}`
    );

    if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

    const signedApks: string[] = [];
    let oldPackageName: string | null = null;

    for (let i = 0; i < apkPaths.length; i++) {
      const apkPath = apkPaths[i];
      const isBase = i === 0;
      const apkName = isBase ? "base" : `split_${i}`;
      const outputDir = join(tempDir, `${apkName}_output`);
      const modifiedApk = join(tempDir, `${apkName}_modified.apk`);

      if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

      console.log(`Decompiling ${apkName}...`);
      await this.exec([
        "-jar",
        this.getApktoolPath(),
        "d",
        apkPath,
        "-o",
        outputDir,
        "-f",
      ]);

      const manifestPath = join(outputDir, "AndroidManifest.xml");
      if (existsSync(manifestPath)) {
        let manifest = readFileSync(manifestPath, "utf-8");

        if (!oldPackageName) {
          const match = manifest.match(/package="([^"]+)"/);
          if (match) oldPackageName = match[1];
        }

        if (oldPackageName) {
          manifest = this.replacePackageInManifest(
            manifest,
            oldPackageName,
            newPackageName
          );
        }
        writeFileSync(manifestPath, manifest);
      }

      if (oldPackageName) {
        console.log(`Updating smali and resources for ${apkName}...`);
        this.updateSmaliFiles(outputDir, oldPackageName, newPackageName);
        this.updatePublicXml(outputDir, oldPackageName, newPackageName);
        this.updateResourceFiles(outputDir, oldPackageName, newPackageName);
      }

      if (isBase && newAppName) {
        const stringsPath = join(outputDir, "res", "values", "strings.xml");
        if (existsSync(stringsPath)) {
          let strings = readFileSync(stringsPath, "utf-8");
          strings = strings.replace(
            /<string name="app_name">[^<]*<\/string>/,
            `<string name="app_name">${newAppName}</string>`
          );
          writeFileSync(stringsPath, strings);
        }
      }

      console.log(`Rebuilding ${apkName}...`);
      await this.exec([
        "-jar",
        this.getApktoolPath(),
        "b",
        outputDir,
        "-o",
        modifiedApk,
      ]);

      signedApks.push(modifiedApk);
    }

    console.log("Signing all APKs...");
    const signedDir = join(tempDir, "signed");
    if (!existsSync(signedDir)) mkdirSync(signedDir, { recursive: true });

    for (const apk of signedApks) {
      await this.exec([
        "-jar",
        this.getSignerPath(),
        "-a",
        apk,
        "-o",
        signedDir,
      ]);
    }

    const signedFiles = readdirSync(signedDir)
      .filter((f) => f.endsWith(".apk"))
      .map((f) => join(signedDir, f));

    if (signedFiles.length === 0) {
      throw new Error("No signed APKs found");
    }

    return signedFiles;
  }
}
