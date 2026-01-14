import { describe, it, expect } from "vitest";
import { resolveSource } from "./resolver.js";
import type { SharedConfig } from "./types.js";

describe("resolveSource", () => {
  const emptyConfig: SharedConfig = { rules: {} };

  describe("URL sources", () => {
    it("should resolve http URLs", () => {
      const result = resolveSource({
        source: "http://example.com/rules.md",
        config: emptyConfig,
      });
      expect(result.resolved.type).toBe("url");
      expect(result.resolved.url).toBe("http://example.com/rules.md");
    });

    it("should resolve https URLs", () => {
      const result = resolveSource({
        source: "https://example.com/rules.md",
        config: emptyConfig,
      });
      expect(result.resolved.type).toBe("url");
      expect(result.resolved.url).toBe("https://example.com/rules.md");
    });
  });

  describe("GitHub sources", () => {
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

  describe("Alias sources", () => {
    const configWithAlias: SharedConfig = {
      sources: { kc: "github:kevincrabbe/kc-rules" },
      rules: {},
    };

    it("should resolve alias to github source", () => {
      const result = resolveSource({
        source: "kc:general.md",
        config: configWithAlias,
      });
      expect(result.resolved.type).toBe("github");
      expect(result.resolved.owner).toBe("kevincrabbe");
      expect(result.resolved.repo).toBe("kc-rules");
      expect(result.resolved.path).toBe("general.md");
    });

    it("should resolve alias with nested path", () => {
      const result = resolveSource({
        source: "kc:typescript/rules.md",
        config: configWithAlias,
      });
      expect(result.resolved.path).toBe("typescript/rules.md");
    });

    it("should throw for unknown alias", () => {
      expect(() =>
        resolveSource({
          source: "unknown:file.md",
          config: emptyConfig,
        })
      ).toThrow("Invalid source format");
    });
  });
});
