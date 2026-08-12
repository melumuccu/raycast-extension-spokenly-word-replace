import { Action, ActionPanel, Form, getSelectedText, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";

import { createExecFileRunner, mapSpokenlyCliError, runAddReplacement } from "./lib/spokenly-cli";

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
      await runAddReplacement(createExecFileRunner(), original, trimmedReplacement);
      await showToast({
        style: Toast.Style.Success,
        title: "Word Replacement を登録しました",
      });
    } catch (error) {
      const message = mapSpokenlyCliError(error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Spokenly CLI の実行に失敗しました",
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
