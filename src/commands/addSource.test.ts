import { describe, it, expect, vi } from "vitest";
import { addSource } from "./add.js";

vi.mock("../config.js", () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
  createEmptyConfig: (): object => ({ sources: {}, rules: {} }),
}));

describe("addSource - alias validation", () => {
  it("should reject empty aliases", async () => {
    const promise = addSource({ alias: "", source: "github:owner/repo" });
    await expect(promise).rejects.toThrow("Alias name cannot be empty");
  });

  it.each([
    ["github", "reserved name"],
    ["https", "reserved name"],
  ])("should reject reserved alias '%s'", async (alias, expectedError) => {
    const promise = addSource({ alias, source: "github:owner/repo" });
    await expect(promise).rejects.toThrow(expectedError);
  });

  it("should reject aliases with colons", async () => {
    const promise = addSource({ alias: "my:alias", source: "github:owner/repo" });
    await expect(promise).rejects.toThrow("cannot contain ':'");
  });
});
