import { create } from "zustand";
import type { BinaryStatus, DownloadProgress } from "../types";

type BinaryState = {
  status: BinaryStatus | null;
  downloadProgress: Map<string, DownloadProgress>;
  isDownloading: boolean;
  isChecking: boolean;

  setStatus: (status: BinaryStatus) => void;
  setDownloadProgress: (name: string, progress: DownloadProgress) => void;
  clearDownloadProgress: (name: string) => void;
  setDownloading: (downloading: boolean) => void;
  setChecking: (checking: boolean) => void;

  isAllInstalled: () => boolean;
};

export const useBinaryStore = create<BinaryState>((set, get) => ({
  status: null,
  downloadProgress: new Map(),
  isDownloading: false,
  isChecking: false,

  setStatus: (status) => set({ status }),

  setDownloadProgress: (name, progress) =>
    set((state) => {
      const newProgress = new Map(state.downloadProgress);
      newProgress.set(name, progress);
      return { downloadProgress: newProgress };
    }),

  clearDownloadProgress: (name) =>
    set((state) => {
      const newProgress = new Map(state.downloadProgress);
      newProgress.delete(name);
      return { downloadProgress: newProgress };
    }),

  setDownloading: (isDownloading) => set({ isDownloading }),

  setChecking: (isChecking) => set({ isChecking }),

  isAllInstalled: () => {
    const { status } = get();
    if (!status) return false;

    const required = [status.platformTools];
    return required.every((b) => b.isInstalled);
  },
}));
