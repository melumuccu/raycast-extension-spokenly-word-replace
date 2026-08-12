import { getSelectedText, open, showToast, Toast } from "@raycast/api";

import { mapOpenDeeplinkError, openWordReplacementAdd } from "./lib/spokenly-deeplink";

const SELECTION_ERROR_MESSAGE = "テキストを選択してからコマンドを起動してください。";

export default async function Command() {
  let original: string;

  try {
    original = await getSelectedText();
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "選択テキストを取得できませんでした",
      message: SELECTION_ERROR_MESSAGE,
    });
    return;
  }

  if (!original.trim()) {
    await showToast({
      style: Toast.Style.Failure,
      title: "選択テキストを取得できませんでした",
      message: SELECTION_ERROR_MESSAGE,
    });
    return;
  }

  try {
    await openWordReplacementAdd(open, original);
    await showToast({
      style: Toast.Style.Success,
      title: "Spokenly の追加フォームを開きました",
    });
  } catch (error) {
    const message = mapOpenDeeplinkError(error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Spokenly の deeplink を開けませんでした",
      message,
    });
  }
}
