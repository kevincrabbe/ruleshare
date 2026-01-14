import type { ResolvedSource, SharedConfig } from "./types.js";

type ResolveArgs = {
  source: string;
  config: SharedConfig;
  visited?: Set<string>;
};

type ResolveResult = {
  resolved: ResolvedSource;
  originalSource: string;
};

export function resolveSource(args: ResolveArgs): ResolveResult {
  const { source, config, visited = new Set() } = args;

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

  return resolveAlias({ source, config, visited });
}

type ResolveAliasArgs = {
  source: string;
  config: SharedConfig;
  visited: Set<string>;
};

function resolveAlias(args: ResolveAliasArgs): ResolveResult {
  const { source, config, visited } = args;

  const bareAlias = tryResolveBareAlias({ source, config, visited });
  if (bareAlias) {
    return bareAlias;
  }

  return resolveAliasWithPath({ source, config, visited });
}

function tryResolveBareAlias(args: ResolveAliasArgs): ResolveResult | null {
  const { source, config, visited } = args;

  if (!config.sources?.[source]) {
    return null;
  }

  if (visited.has(source)) {
    throw new Error(`Circular alias detected: ${source}`);
  }
  visited.add(source);

  const baseSource = config.sources[source];
  const result = resolveSource({ source: baseSource, config, visited });
  return { resolved: result.resolved, originalSource: source };
}

function resolveAliasWithPath(args: ResolveAliasArgs): ResolveResult {
  const { source, config, visited } = args;

  const aliasMatch = source.match(/^([^:]+):(.*)$/);
  const hasAlias = aliasMatch && config.sources?.[aliasMatch[1]];

  if (!hasAlias) {
    throw new Error(`Invalid source format: ${source}`);
  }

  const alias = aliasMatch[1];
  if (visited.has(alias)) {
    throw new Error(`Circular alias detected: ${alias}`);
  }
  visited.add(alias);

  const filePath = aliasMatch[2];
  const baseSource = config.sources![alias];

  if (!filePath) {
    const result = resolveSource({ source: baseSource, config, visited });
    return { resolved: result.resolved, originalSource: source };
  }

  const combined = combineSourceAndPath({ baseSource, filePath });
  const result = resolveSource({ source: combined, config, visited });
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
  const noSlashAfterAt = atIndex > 0 && !source.substring(atIndex).includes("/");

  if (!noSlashAfterAt) {
    return { ref: undefined, pathPart: source };
  }

  const pathBeforeAt = source.substring(0, atIndex);
  const hasExtensionBeforeAt = hasFileExtension({ path: pathBeforeAt });

  if (!hasExtensionBeforeAt) {
    return { ref: undefined, pathPart: source };
  }

  return {
    ref: source.substring(atIndex + 1),
    pathPart: pathBeforeAt,
  };
}

type HasExtensionArgs = {
  path: string;
};

function hasFileExtension(args: HasExtensionArgs): boolean {
  const { path } = args;
  const lastSlash = path.lastIndexOf("/");
  const lastDot = path.lastIndexOf(".");
  return lastDot > lastSlash && lastDot < path.length - 1;
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
