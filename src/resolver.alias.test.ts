import { describe, it, expect } from "vitest";
import { resolveSource } from "./resolver.js";
import type { SharedConfig } from "./types.js";

const emptyConfig: SharedConfig = { rules: {} };
const configWithAlias: SharedConfig = {
  sources: { kc: "github:kevincrabbe/kc-rules" },
  rules: {},
};

describe("resolveSource - Alias sources", () => {
  it.each([
    ["kc", "", "bare alias"],
    ["kc:", "", "alias with colon"],
    ["kc:general.md", "general.md", "alias with file"],
    ["kc:typescript/rules.md", "typescript/rules.md", "alias with path"],
  ])("should resolve %s (%s)", (source, expectedPath) => {
    const result = resolveSource({ source, config: configWithAlias });
    expect(result.resolved.type).toBe("github");
    expect(result.resolved.owner).toBe("kevincrabbe");
    expect(result.resolved.path).toBe(expectedPath);
  });

  it("should throw for unknown alias", () => {
    expect(() => resolveSource({ source: "unknown:file.md", config: emptyConfig }))
      .toThrow("Invalid source format");
  });
});
