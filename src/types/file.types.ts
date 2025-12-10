export type FileType = "file" | "directory" | "symlink";

export type FileEntry = {
  name: string;
  path: string;
  type: FileType;
  size: number;
  permissions: string;
  owner: string;
  group: string;
  modifiedDate: number;
  isHidden: boolean;
};

export type FileTransferProgress = {
  fileName: string;
  totalBytes: number;
  transferredBytes: number;
  percentage: number;
  speed: number;
  eta: number;
};

export type FileOperation = {
  id: string;
  type: "push" | "pull";
  sourcePath: string;
  destPath: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  progress?: FileTransferProgress;
  error?: string;
};
