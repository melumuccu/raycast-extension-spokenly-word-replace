import { describe, expect, it, vi } from "vitest";

import {
  REPLACEMENT_TIMING,
  SPOKENLY_CLI,
  buildAddReplacementArgs,
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
