export type SharedConfig = {
  sources?: Record<string, string>;
  rules: Record<string, string>;
};

export type LockEntry = {
  source: string;
  sha: string;
  tag?: string;
  updated: string;
};

export type SharedLock = {
  version: number;
  rules: Record<string, LockEntry>;
};

export type ResolvedSource = {
  type: "github" | "url";
  owner?: string;
  repo?: string;
  path: string;
  ref?: string;
  url?: string;
};

export type FetchResult = {
  content: string;
  sha: string;
};

export type SyncResult = {
  name: string;
  status: "created" | "updated" | "unchanged" | "error";
  error?: string;
};

export type StatusEntry = {
  name: string;
  currentSha: string;
  latestSha: string;
  isOutdated: boolean;
  source: string;
};

export type GitHubFile = {
  name: string;
  path: string;
  type: "file" | "dir";
};

export type ListFilesResult = {
  files: GitHubFile[];
};
