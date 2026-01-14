import type { ResolvedSource, SharedConfig } from "./types.js";

type ResolveArgs = {
  source: string;
  config: SharedConfig;
};

type ResolveResult = {
  resolved: ResolvedSource;
  originalSource: string;
};

export function resolveSource(args: ResolveArgs): ResolveResult {
  const { source, config } = args;

  if (source.startsWith("https://") || source.startsWith("http://")) {
    return {
      resolved: { type: "url", path: source, url: source },
      originalSource: source,
    };
  }

  if (source.startsWith("github:")) {
    return {
      resolved: parseGitHubSource({ source }),
      originalSource: source,
    };
  }

  return resolveAlias({ source, config });
}

type ResolveAliasArgs = {
  source: string;
  config: SharedConfig;
};

function resolveAlias(args: ResolveAliasArgs): ResolveResult {
  const { source, config } = args;

  const aliasMatch = source.match(/^([^:]+):(.*)$/);
  const hasAlias = aliasMatch && config.sources?.[aliasMatch[1]];

  if (!hasAlias) {
    throw new Error(`Invalid source format: ${source}`);
  }

  const alias = aliasMatch[1];
  const filePath = aliasMatch[2];
  const baseSource = config.sources![alias];

  if (!filePath) {
    const result = resolveSource({ source: baseSource, config });
    return { resolved: result.resolved, originalSource: source };
  }

  const combined = combineSourceAndPath({ baseSource, filePath });
  const result = resolveSource({ source: combined, config });
  return { resolved: result.resolved, originalSource: source };
}

type ParseGitHubArgs = {
  source: string;
};

function parseGitHubSource(args: ParseGitHubArgs): ResolvedSource {
  const { source } = args;
  const withoutPrefix = source.replace("github:", "");
  const { ref, pathPart } = extractRef({ source: withoutPrefix });

  const parts = pathPart.split("/");
  if (parts.length < 2) {
    throw new Error(`Invalid GitHub source: ${source}`);
  }

  return {
    type: "github",
    owner: parts[0],
    repo: parts[1],
    path: parts.length > 2 ? parts.slice(2).join("/") : "",
    ref,
  };
}

type ExtractRefArgs = {
  source: string;
};

type ExtractRefResult = {
  ref: string | undefined;
  pathPart: string;
};

function extractRef(args: ExtractRefArgs): ExtractRefResult {
  const { source } = args;
  const atIndex = source.lastIndexOf("@");
  const hasRef = atIndex > 0 && !source.substring(atIndex).includes("/");

  if (!hasRef) {
    return { ref: undefined, pathPart: source };
  }

  return {
    ref: source.substring(atIndex + 1),
    pathPart: source.substring(0, atIndex),
  };
}

type CombineArgs = {
  baseSource: string;
  filePath: string;
};

function combineSourceAndPath(args: CombineArgs): string {
  const { baseSource, filePath } = args;
  const { ref, pathPart: cleanFilePath } = extractRef({ source: filePath });
  const combined = `${baseSource}/${cleanFilePath}`;

  return ref ? `${combined}@${ref}` : combined;
}
