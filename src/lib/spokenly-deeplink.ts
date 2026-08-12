// https://spokenly.app/docs/macos/deeplinks#word-replacements
export const WORD_REPLACEMENTS_ADD_DEEPLINK_BASE = "spokenly://word-replacements/add";

export type OpenFn = (target: string) => Promise<void>;

export function buildWordReplacementAddUrl(original: string, replacement: string): string {
  const params = new URLSearchParams();
  params.set("from", original);
  params.set("to", replacement);
  return `${WORD_REPLACEMENTS_ADD_DEEPLINK_BASE}?${params.toString()}`;
}

export function mapOpenDeeplinkError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Spokenly の deeplink を開けませんでした。";
}

export async function openWordReplacementAdd(openFn: OpenFn, original: string, replacement: string): Promise<void> {
  await openFn(buildWordReplacementAddUrl(original, replacement));
}
