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
    ["path\\file", "invalid characters"],
    ["test:name", "invalid characters"],
    ["path/../file", "invalid characters"],
  ])("should reject name '%s'", async (name, expectedError) => {
    const promise = addRule({ name, source: "test:file.md" });
    await expect(promise).rejects.toThrow(expectedError);
  });

  it.each([
    [".hidden", 'cannot start with "."'],
    ["-flag", 'cannot start with "-"'],
  ])("should reject name '%s' starting with special char", async (name, expectedError) => {
    const promise = addRule({ name, source: "test:file.md" });
    await expect(promise).rejects.toThrow(expectedError);
  });
});
