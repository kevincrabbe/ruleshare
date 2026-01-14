import { describe, it, expect } from "vitest";
import { resolveSource } from "./resolver.js";
import type { SharedConfig } from "./types.js";

const emptyConfig: SharedConfig = { rules: {} };

describe("resolveSource - GitHub sources", () => {
  it("should resolve github: prefix", () => {
    const result = resolveSource({
      source: "github:owner/repo/path/file.md",
      config: emptyConfig,
    });
    expect(result.resolved.type).toBe("github");
    expect(result.resolved.owner).toBe("owner");
    expect(result.resolved.repo).toBe("repo");
    expect(result.resolved.path).toBe("path/file.md");
  });

  it("should extract ref from @ symbol", () => {
    const result = resolveSource({
      source: "github:owner/repo/file.md@v1.0.0",
      config: emptyConfig,
    });
    expect(result.resolved.ref).toBe("v1.0.0");
    expect(result.resolved.path).toBe("file.md");
  });

  it("should throw for invalid github path", () => {
    expect(() =>
      resolveSource({
        source: "github:owner/repo",
        config: emptyConfig,
      })
    ).toThrow("Invalid GitHub source");
  });
});
