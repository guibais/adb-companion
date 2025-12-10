export type AppType = "user" | "system" | "all";

export type InstalledApp = {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  isSystem: boolean;
  isEnabled: boolean;
  installedDate?: number;
  updatedDate?: number;
  size?: number;
  apkPath?: string;
};

export type ApkInfo = {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  minSdkVersion: number;
  targetSdkVersion: number;
  permissions: string[];
  activities: string[];
  services: string[];
  receivers: string[];
  size: number;
  iconPath?: string;
};

export type ApkRenameOptions = {
  apkPath: string;
  newPackageName: string;
  newAppName?: string;
  newIconPath?: string;
};
