import { execFile } from "child_process";
import { promisify } from "util";
import type { ListFilesResult } from "./types.js";

const execFileAsync = promisify(execFile);

type ListFilesArgs = {
  owner: string;
  repo: string;
  path?: string;
  ref?: string;
};

export async function listFiles(args: ListFilesArgs): Promise<ListFilesResult> {
  const { owner, repo, path = "", ref = "main" } = args;
  const apiPath = `/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;

  try {
    const { stdout } = await execFileAsync("gh", [
      "api",
      apiPath,
      "--jq",
      ".tree[] | select(.type==\"blob\") | {name: .path, path: .path, type: \"file\"}",
    ]);
    const allFiles = parseGhOutput({ stdout });
    const files = filterByPath({ files: allFiles, basePath: path });
    return { files };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to list files from ${owner}/${repo}. ${message}`);
  }
}

type FilterByPathArgs = {
  files: ListFilesResult["files"];
  basePath: string;
};

function filterByPath(args: FilterByPathArgs): ListFilesResult["files"] {
  const { files, basePath } = args;
  if (!basePath) {
    return files;
  }
  return files.filter((f) => f.path.startsWith(basePath + "/"));
}

type ParseGhOutputArgs = {
  stdout: string;
};

function parseGhOutput(args: ParseGhOutputArgs): ListFilesResult["files"] {
  const { stdout } = args;
  const lines = stdout.trim().split("\n").filter(Boolean);
  return lines.map((line) => JSON.parse(line));
}
