import { describe, it, expect } from "vitest";
import { resolveSource } from "./resolver.js";
import type { SharedConfig } from "./types.js";

const emptyConfig: SharedConfig = { rules: {} };

describe("resolveSource - URL sources", () => {
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
