import { describe, expect, it, vi } from "vitest";

import {
  WORD_REPLACEMENTS_ADD_DEEPLINK_BASE,
  buildWordReplacementAddUrl,
  mapOpenDeeplinkError,
  openWordReplacementAdd,
  type OpenFn,
} from "./spokenly-deeplink";

describe("buildWordReplacementAddUrl", () => {
  it("builds spokenly word-replacements add deeplink with encoded from only", () => {
    const url = buildWordReplacementAddUrl("hello");
    expect(url).toBe(`${WORD_REPLACEMENTS_ADD_DEEPLINK_BASE}?from=hello`);
    expect(url).not.toContain("to=");
  });

  it("URL-encodes special characters and Japanese in from", () => {
    expect(buildWordReplacementAddUrl("clod code")).toBe(`${WORD_REPLACEMENTS_ADD_DEEPLINK_BASE}?from=clod+code`);
    expect(buildWordReplacementAddUrl("foo,bar")).toBe(`${WORD_REPLACEMENTS_ADD_DEEPLINK_BASE}?from=foo%2Cbar`);
    expect(buildWordReplacementAddUrl("日本語&記号")).toBe(
      `${WORD_REPLACEMENTS_ADD_DEEPLINK_BASE}?from=%E6%97%A5%E6%9C%AC%E8%AA%9E%26%E8%A8%98%E5%8F%B7`,
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

    await openWordReplacementAdd(openFn, "alpha");

    expect(openFn).toHaveBeenCalledWith(buildWordReplacementAddUrl("alpha"));
  });

  it("propagates open errors for caller mapping", async () => {
    const openFn = vi.fn<OpenFn>().mockRejectedValue(new Error("failed"));

    await expect(openWordReplacementAdd(openFn, "a")).rejects.toThrow("failed");
  });
});
