import { describe, it, expect } from "vitest";
import { resolveSource } from "./resolver.js";
import type { SharedConfig } from "./types.js";

const emptyConfig: SharedConfig = { rules: {} };
const configWithAlias: SharedConfig = {
  sources: { kc: "github:kevincrabbe/kc-rules" },
  rules: {},
};

describe("resolveSource - Alias sources", () => {
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
