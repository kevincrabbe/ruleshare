import { execFile } from "child_process";
import { promisify } from "util";
import type { ResolvedSource, FetchResult } from "./types.js";

const execFileAsync = promisify(execFile);

type FetchArgs = {
  resolved: ResolvedSource;
};

export async function fetchContent(args: FetchArgs): Promise<FetchResult> {
  const { resolved } = args;

  if (resolved.type === "url") {
    return fetchFromUrl({ url: resolved.url! });
  }

  return fetchFromGitHub({ resolved });
}

type FetchUrlArgs = {
  url: string;
};

async function fetchFromUrl(args: FetchUrlArgs): Promise<FetchResult> {
  const { url } = args;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const content = await response.text();
  const sha = await computeHash({ content });

  return { content, sha };
}

type FetchGitHubArgs = {
  resolved: ResolvedSource;
};

async function fetchFromGitHub(args: FetchGitHubArgs): Promise<FetchResult> {
  const { resolved } = args;
  const { owner, repo, path, ref } = resolved;

  if (!owner || !repo) {
    throw new Error("GitHub source requires owner and repo");
  }

  const branch = ref || "main";

  const publicResult = await tryPublicFetch({ owner, repo, path, branch });
  if (publicResult) {
    return publicResult;
  }

  return fetchViaGhCli({ owner, repo, path, branch });
}

type TryPublicFetchArgs = {
  owner: string;
  repo: string;
  path: string;
  branch: string;
};

async function tryPublicFetch(
  args: TryPublicFetchArgs
): Promise<FetchResult | null> {
  const { owner, repo, path, branch } = args;
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

  const response = await fetch(url);
  if (response.ok) {
    const content = await response.text();
    const sha = await computeHash({ content });
    return { content, sha };
  }

  if (branch === "main") {
    const masterUrl = url.replace("/main/", "/master/");
    const masterResponse = await fetch(masterUrl);
    if (masterResponse.ok) {
      const content = await masterResponse.text();
      const sha = await computeHash({ content });
      return { content, sha };
    }
  }

  return null;
}

type GhCliFetchArgs = {
  owner: string;
  repo: string;
  path: string;
  branch: string;
};

async function fetchViaGhCli(args: GhCliFetchArgs): Promise<FetchResult> {
  const { owner, repo, path, branch } = args;
  const apiPath = `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

  try {
    const { stdout } = await execFileAsync("gh", [
      "api",
      apiPath,
      "--jq",
      ".content",
    ]);
    const content = Buffer.from(stdout.trim(), "base64").toString("utf-8");
    const sha = await computeHash({ content });
    return { content, sha };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isNotInstalled = message.includes("ENOENT");
    const hint = isNotInstalled
      ? "Install GitHub CLI: https://cli.github.com/"
      : "For private repos, run 'gh auth login' first.";
    throw new Error(
      `Failed to fetch ${owner}/${repo}/${path}. ` +
        `Ensure the repo exists and you have access. ${hint}\n${message}`
    );
  }
}

type HashArgs = {
  content: string;
};

async function computeHash(args: HashArgs): Promise<string> {
  const { content } = args;
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

type CheckUpdateArgs = {
  resolved: ResolvedSource;
  currentSha: string;
};

type CheckUpdateResult = {
  isOutdated: boolean;
  latestSha: string;
};

export async function checkForUpdate(
  args: CheckUpdateArgs
): Promise<CheckUpdateResult> {
  const { resolved, currentSha } = args;
  const { sha: latestSha } = await fetchContent({ resolved });
  return { isOutdated: currentSha !== latestSha, latestSha };
}

