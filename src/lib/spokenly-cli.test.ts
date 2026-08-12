import { describe, expect, it, vi } from "vitest";

import {
  REPLACEMENT_TIMING,
  SPOKENLY_CLI,
  buildAddReplacementArgs,
  buildExecFileEnv,
  buildExecFilePath,
  mapSpokenlyCliError,
  runAddReplacement,
  type ExecFileFn,
} from "./spokenly-cli";

describe("buildAddReplacementArgs", () => {
  it("builds spokenly replacements add with timing both", () => {
    expect(buildAddReplacementArgs("hello", "HELLO")).toEqual([
      "replacements",
      "add",
      "hello",
      "HELLO",
      "--timing",
      REPLACEMENT_TIMING,
    ]);
  });

  it("passes original and replacement verbatim", () => {
    expect(buildAddReplacementArgs("foo,bar", "baz qux")).toEqual([
      "replacements",
      "add",
      "foo,bar",
      "baz qux",
      "--timing",
      "both",
    ]);
  });
});

describe("mapSpokenlyCliError", () => {
  it("maps ENOENT to a user-facing CLI missing message", () => {
    expect(mapSpokenlyCliError({ code: "ENOENT", message: "spawn spokenly ENOENT" })).toContain(
      "Spokenly CLI が見つかりません",
    );
  });

  it("includes stderr when present", () => {
    expect(mapSpokenlyCliError({ message: "Command failed", stderr: "Spokenly is not running" })).toBe(
      "Command failed\nSpokenly is not running",
    );
  });

  it("falls back for unknown errors", () => {
    expect(mapSpokenlyCliError(null)).toBe("Spokenly CLI の実行に失敗しました。");
  });
});

describe("buildExecFilePath", () => {
  it("appends /usr/local/bin when missing from PATH", () => {
    expect(buildExecFilePath("/usr/bin:/bin")).toBe("/usr/bin:/bin:/usr/local/bin");
  });

  it("does not duplicate /usr/local/bin when already present", () => {
    expect(buildExecFilePath("/usr/local/bin:/usr/bin")).toBe("/usr/local/bin:/usr/bin");
  });

  it("uses /usr/local/bin when PATH is unset or empty", () => {
    expect(buildExecFilePath(undefined)).toBe("/usr/local/bin");
    expect(buildExecFilePath("")).toBe("/usr/local/bin");
  });
});

describe("buildExecFileEnv", () => {
  it("preserves other environment variables while augmenting PATH", () => {
    expect(
      buildExecFileEnv({
        HOME: "/Users/test",
        PATH: "/usr/bin",
      }),
    ).toEqual({
      HOME: "/Users/test",
      PATH: "/usr/bin:/usr/local/bin",
    });
  });
});

describe("createExecFileRunner", () => {
  it("passes augmented PATH to execFile child process options", async () => {
    const execFileMock = vi.fn(
      (
        _file: string,
        _args: string[],
        options: { env?: NodeJS.ProcessEnv },
        callback: (error: null, result: { stdout: string; stderr: string }) => void,
      ) => {
        expect(options.env?.PATH).toBe("/usr/bin:/usr/local/bin");
        callback(null, { stdout: "ok", stderr: "" });
      },
    );

    vi.doMock("node:child_process", () => ({
      execFile: execFileMock,
    }));

    vi.resetModules();
    const { createExecFileRunner } = await import("./spokenly-cli");
    const originalPath = process.env.PATH;
    process.env.PATH = "/usr/bin";

    try {
      const result = await createExecFileRunner()("spokenly", ["--version"]);
      expect(result).toEqual({ stdout: "ok", stderr: "" });
      expect(execFileMock).toHaveBeenCalledOnce();
    } finally {
      process.env.PATH = originalPath;
      vi.doUnmock("node:child_process");
      vi.resetModules();
    }
  });
});

describe("runAddReplacement", () => {
  it("invokes spokenly with constructed args", async () => {
    const execFileFn = vi.fn<ExecFileFn>().mockResolvedValue({ stdout: "ok", stderr: "" });

    await runAddReplacement(execFileFn, "alpha", "beta");

    expect(execFileFn).toHaveBeenCalledWith(SPOKENLY_CLI, buildAddReplacementArgs("alpha", "beta"));
  });

  it("propagates exec errors for caller mapping", async () => {
    const execFileFn = vi.fn<ExecFileFn>().mockRejectedValue({ code: 1, stderr: "failed" });

    await expect(runAddReplacement(execFileFn, "a", "b")).rejects.toEqual({ code: 1, stderr: "failed" });
  });
});
