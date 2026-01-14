import { describe, it, expect } from "vitest";
import { resolveSource } from "./resolver.js";
import type { SharedConfig } from "./types.js";

const emptyConfig: SharedConfig = { rules: {} };

describe("resolveSource - GitHub parsing", () => {
  it.each([
    ["github:owner/repo/path/file.md", "owner", "repo", "path/file.md"],
    ["github:owner/repo/file.md", "owner", "repo", "file.md"],
    ["github:owner/repo", "owner", "repo", ""],
  ])("should parse %s", (source, owner, repo, path) => {
    const result = resolveSource({ source, config: emptyConfig });
    expect(result.resolved.owner).toBe(owner);
    expect(result.resolved.repo).toBe(repo);
    expect(result.resolved.path).toBe(path);
  });

  it("should extract ref from @ symbol", () => {
    const result = resolveSource({
      source: "github:owner/repo/file.md@v1.0.0",
      config: emptyConfig,
    });
    expect(result.resolved.ref).toBe("v1.0.0");
  });

  it("should throw for source missing repo", () => {
    expect(() => resolveSource({ source: "github:owner", config: emptyConfig }))
      .toThrow("Invalid GitHub source");
  });
});
