import { describe, it, expect, vi, beforeEach } from "vitest";
import { addRule, addSource } from "./add.js";

vi.mock("../config.js", () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
  createEmptyConfig: () => ({ sources: {}, rules: {} }),
}));

describe("addRule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("name validation", () => {
    it("should reject empty names", async () => {
      await expect(addRule({ name: "", source: "test:file.md" })).rejects.toThrow(
        "Rule name cannot be empty"
      );
    });

    it("should reject names with slashes", async () => {
      await expect(
        addRule({ name: "path/to/file", source: "test:file.md" })
      ).rejects.toThrow("invalid characters");
    });

    it("should reject names with backslashes", async () => {
      await expect(
        addRule({ name: "path\\file", source: "test:file.md" })
      ).rejects.toThrow("invalid characters");
    });

    it("should reject names starting with dot", async () => {
      await expect(
        addRule({ name: ".hidden", source: "test:file.md" })
      ).rejects.toThrow("invalid characters");
    });

    it("should reject names starting with dash", async () => {
      await expect(
        addRule({ name: "-flag", source: "test:file.md" })
      ).rejects.toThrow('cannot start with "-"');
    });

    it("should reject names with colons", async () => {
      await expect(
        addRule({ name: "test:name", source: "test:file.md" })
      ).rejects.toThrow("invalid characters");
    });
  });
});

describe("addSource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("alias validation", () => {
    it("should reject empty aliases", async () => {
      await expect(
        addSource({ alias: "", source: "github:owner/repo" })
      ).rejects.toThrow("Alias name cannot be empty");
    });

    it("should reject reserved alias 'github'", async () => {
      await expect(
        addSource({ alias: "github", source: "github:owner/repo" })
      ).rejects.toThrow("reserved name");
    });

    it("should reject reserved alias 'https'", async () => {
      await expect(
        addSource({ alias: "https", source: "github:owner/repo" })
      ).rejects.toThrow("reserved name");
    });

    it("should reject aliases with colons", async () => {
      await expect(
        addSource({ alias: "my:alias", source: "github:owner/repo" })
      ).rejects.toThrow("cannot contain ':'");
    });
  });
});
