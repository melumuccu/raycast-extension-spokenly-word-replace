import { Action, ActionPanel, Form, getSelectedText, open, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";

import { mapOpenDeeplinkError, openWordReplacementAdd } from "./lib/spokenly-deeplink";

export default function Command() {
  const [original, setOriginal] = useState("");
  const [replacement, setReplacement] = useState("");
  const [replacementError, setReplacementError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectionError, setSelectionError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    async function loadSelectedText() {
      try {
        const text = await getSelectedText();
        if (!cancelled) {
          setOriginal(text);
        }
      } catch {
        if (!cancelled) {
          const message = "テキストを選択してからコマンドを起動してください。";
          setSelectionError(message);
          await showToast({
            style: Toast.Style.Failure,
            title: "選択テキストを取得できませんでした",
            message,
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSelectedText();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit() {
    const trimmedReplacement = replacement.trim();

    if (!trimmedReplacement) {
      setReplacementError("Replacement は必須です");
      return;
    }

    if (!original.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Original が空です",
        message: selectionError ?? "テキストを選択してからコマンドを起動してください。",
      });
      return;
    }

    setReplacementError(undefined);
    setIsSubmitting(true);

    try {
      await openWordReplacementAdd(open, original, trimmedReplacement);
      await showToast({
        style: Toast.Style.Success,
        title: "Spokenly で Word Replacement を確認してください",
        message: "フォームが開きました。Add をクリックして登録を完了してください。",
      });
    } catch (error) {
      const message = mapOpenDeeplinkError(error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Spokenly の deeplink を開けませんでした",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form
      isLoading={isLoading || isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Replacement" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Original"
        text={original || (selectionError ? "（選択テキストなし）" : "（読み込み中…）")}
      />
      <Form.TextField
        id="replacement"
        title="Replacement"
        placeholder="置換後の文字列"
        value={replacement}
        error={replacementError}
        onChange={(value) => {
          setReplacement(value);
          if (replacementError && value.trim()) {
            setReplacementError(undefined);
          }
        }}
      />
    </Form>
  );
}
