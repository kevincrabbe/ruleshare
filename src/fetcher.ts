import type { ResolvedSource, FetchResult } from "./types.js";

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

  const branch = ref || "main";
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

  const response = await fetch(url);

  if (!response.ok) {
    const fallbackUrl = url.replace("/main/", "/master/");
    const fallbackResponse = await fetch(fallbackUrl);

    if (!fallbackResponse.ok) {
      throw new Error(`Failed to fetch from GitHub: ${response.statusText}`);
    }

    const content = await fallbackResponse.text();
    const sha = await computeHash({ content });
    return { content, sha };
  }

  const content = await response.text();
  const sha = await computeHash({ content });

  return { content, sha };
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
