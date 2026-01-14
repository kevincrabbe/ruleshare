import { describe, it, expect, vi } from "vitest";
import { addRule } from "./add.js";

vi.mock("../config.js", () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
  createEmptyConfig: (): object => ({ sources: {}, rules: {} }),
}));

describe("addRule - name validation", () => {
  it("should reject empty names", async () => {
    const promise = addRule({ name: "", source: "test:file.md" });
    await expect(promise).rejects.toThrow("Rule name cannot be empty");
  });

  it.each([
    ["path/to/file", "invalid characters"],
    ["path\\file", "invalid characters"],
    [".hidden", "invalid characters"],
    ["test:name", "invalid characters"],
  ])("should reject name '%s'", async (name, expectedError) => {
    const promise = addRule({ name, source: "test:file.md" });
    await expect(promise).rejects.toThrow(expectedError);
  });

  it("should reject names starting with dash", async () => {
    const promise = addRule({ name: "-flag", source: "test:file.md" });
    await expect(promise).rejects.toThrow('cannot start with "-"');
  });
});
