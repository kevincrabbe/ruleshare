import { readConfig, writeConfig, createEmptyConfig } from "../config.js";
import { listFiles } from "../lister.js";
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
    const basename = file.path.split("/").pop() || file.path;
    const name = basename.replace(/\.md$/, "");
    const ruleSource = buildRuleSource({ originalSource, filePath: file.path });
    config.rules[name] = ruleSource;
    added.push(name);
  }

  return added;
}

type BuildRuleSourceArgs = {
  originalSource: string;
  filePath: string;
};

function buildRuleSource(args: BuildRuleSourceArgs): string {
  const { originalSource, filePath } = args;

  if (originalSource.endsWith(":")) {
    return `${originalSource}${filePath}`;
  }

  if (!originalSource.includes(":")) {
    return `${originalSource}:${filePath}`;
  }

  return `${originalSource}/${filePath}`;
}
