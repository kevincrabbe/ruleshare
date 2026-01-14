import { readConfig, writeConfig, createEmptyConfig } from "../config.js";
import { listFiles } from "../fetcher.js";
import { resolveSource } from "../resolver.js";

type AddAllArgs = {
  source: string;
};

type AddAllResult = {
  added: string[];
};

export async function addAll(args: AddAllArgs): Promise<AddAllResult> {
  const { source } = args;

  let config = await readConfig();
  if (!config) {
    config = createEmptyConfig();
  }

  const { resolved, originalSource } = resolveSource({ source, config });

  if (resolved.type !== "github") {
    throw new Error("add-all only supports GitHub sources");
  }

  const { files } = await listFiles({
    owner: resolved.owner!,
    repo: resolved.repo!,
    path: resolved.path || "",
    ref: resolved.ref,
  });

  const mdFiles = files.filter((f) => f.type === "file" && f.name.endsWith(".md"));

  if (mdFiles.length === 0) {
    console.log("No .md files found in source");
    return { added: [] };
  }

  const added = addFilesToConfig({ mdFiles, originalSource, config });
  await writeConfig(config);

  console.log(`Added ${added.length} rules:`);
  added.forEach((name) => console.log(`  ${name}`));

  return { added };
}

type AddFilesArgs = {
  mdFiles: { name: string; path: string }[];
  originalSource: string;
  config: { rules: Record<string, string> };
};

function addFilesToConfig(args: AddFilesArgs): string[] {
  const { mdFiles, originalSource, config } = args;
  const added: string[] = [];

  for (const file of mdFiles) {
    const name = file.name.replace(/\.md$/, "");
    const ruleSource = buildRuleSource({ originalSource, fileName: file.name });
    config.rules[name] = ruleSource;
    added.push(name);
  }

  return added;
}

type BuildRuleSourceArgs = {
  originalSource: string;
  fileName: string;
};

function buildRuleSource(args: BuildRuleSourceArgs): string {
  const { originalSource, fileName } = args;

  if (originalSource.endsWith(":")) {
    return `${originalSource}${fileName}`;
  }

  if (originalSource.includes(":") && !originalSource.includes("/")) {
    return `${originalSource}/${fileName}`;
  }

  return `${originalSource}/${fileName}`;
}
