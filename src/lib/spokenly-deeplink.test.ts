import { describe, expect, it, vi } from "vitest";

import {
  WORD_REPLACEMENTS_ADD_DEEPLINK_BASE,
  buildWordReplacementAddUrl,
  mapOpenDeeplinkError,
  openWordReplacementAdd,
  type OpenFn,
} from "./spokenly-deeplink";

describe("buildWordReplacementAddUrl", () => {
  it("builds spokenly word-replacements add deeplink with encoded query params", () => {
    expect(buildWordReplacementAddUrl("hello", "HELLO")).toBe(
      `${WORD_REPLACEMENTS_ADD_DEEPLINK_BASE}?from=hello&to=HELLO`,
    );
  });

  it("URL-encodes special characters in from and to", () => {
    expect(buildWordReplacementAddUrl("clod code", "Claude Code")).toBe(
      `${WORD_REPLACEMENTS_ADD_DEEPLINK_BASE}?from=clod+code&to=Claude+Code`,
    );
    expect(buildWordReplacementAddUrl("foo,bar", "baz&qux")).toBe(
      `${WORD_REPLACEMENTS_ADD_DEEPLINK_BASE}?from=foo%2Cbar&to=baz%26qux`,
    );
  });
});

describe("mapOpenDeeplinkError", () => {
  it("returns Error message when available", () => {
    expect(mapOpenDeeplinkError(new Error("open failed"))).toBe("open failed");
  });

  it("falls back for unknown errors", () => {
    expect(mapOpenDeeplinkError(null)).toBe("Spokenly の deeplink を開けませんでした。");
  });
});

describe("openWordReplacementAdd", () => {
  it("opens the constructed deeplink", async () => {
    const openFn = vi.fn<OpenFn>().mockResolvedValue(undefined);

    await openWordReplacementAdd(openFn, "alpha", "beta");

    expect(openFn).toHaveBeenCalledWith(buildWordReplacementAddUrl("alpha", "beta"));
  });

  it("propagates open errors for caller mapping", async () => {
    const openFn = vi.fn<OpenFn>().mockRejectedValue(new Error("failed"));

    await expect(openWordReplacementAdd(openFn, "a", "b")).rejects.toThrow("failed");
  });
});
