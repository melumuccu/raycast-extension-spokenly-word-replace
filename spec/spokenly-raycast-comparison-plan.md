# Spokenly 単語置換 — Raycast Extension 仕様

> **正本**: [spokenly-raycast-comparison-plan.html](./spokenly-raycast-comparison-plan.html)（HTML 正本。本 Markdown は同期版）

## 結論

MVP は **Raycast Extension**（`getSelectedText()` + `open` deeplink）とする。**Script Command は採用しない**。選択テキストは clipboard ではなく `getSelectedText()` で取得する。コマンド実行直後に deeplink を開き、Raycast フォームは表示しない。

## 目的

任意アプリで選択したテキストを Spokenly の Word Replacements 追加フォームの `from` に渡し、Spokenly 側で Replacement を入力して Add をクリックして保存する Raycast Extension の仕様を定義する。

- package manager: **pnpm 固定**（supply chain 設定を含む）
- CI: **Mac Studio self-hosted runner**（`runs-on: [self-hosted, raycast-extension-spokenly-word-replace]`）。host runner 未登録なら merge 不可
- lint / format: **適用**
- Tab 補完後 hook: **不適用**

## 方式比較（参考: Script Command は不採用）

| 比較軸           | Script Command                               | Extension（採用）                                                      |
| ---------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| 選択テキスト取得 | clipboard / `{selection}` または AppleScript | `getSelectedText()` 公式 API                                           |
| Replacement 入力 | `@raycast.argument`                          | Spokenly 追加フォーム（deeplink 事前入力後）                           |
| 登録起動         | シェルから直接 `spokenly replacements add`   | `open` で word-replacements/add deeplink を開く                        |
| 実装コスト       | 低                                           | 中〜高                                                                 |
| 権限             | Cmd+C 経路または Accessibility               | getSelectedText は Raycast 標準権限内。deeplink は Spokenly アプリ連携 |
| 登録方式         | CLI で即時登録（確認なし）                   | deeplink でフォーム事前入力（Add は Spokenly 側で手動）                |

本 PJ では Script Command を採用しない。上記は比較検討時の参考情報である。

## Extension の具体フロー（MVP）

1. コマンド起動時に `getSelectedText()` で Original を取得（失敗時は Toast で案内し、deeplink は開かない）
1. 取得直後に `open` で `spokenly://word-replacements/add?from=…` を開く（`from` のみ URL エンコード。`to` は付けない）
1. 成功 Toast で Spokenly の追加フォームを開いたことを伝える（保存完了は示唆しない）

deeplink はフォーム事前入力のみで、Add をクリックするまで保存されない。**clipboard は使用しない。**

## Script Command の具体フロー（参考・不採用）

1. ユーザーが任意アプリでテキストを選択する
1. Raycast で Script Command を起動（ホットキー可）
1. スクリプトが `osascript` 等で `⌘C` を送信し、clipboard 先頭を Original として取得（事前に clipboard を保存）
1. Raycast 引数 UI で Replacement を入力
1. `spokenly replacements add "$ORIGINAL" "$REPLACEMENT" --timing both` を実行

本 PJ では Script Command を採用しない。上記は比較検討時の参考情報である。

## 共通: Word Replacements deeplink と保存動作

Extension は word-replacements/add deeplink で Spokenly の追加フォームを開く。`from` は URL エンコードし、Add をクリックするまで保存されない。`to` は deeplink に含めない。

```
spokenly://word-replacements/add?from=<original>
```

timing などの詳細設定は Spokenly の追加フォームでユーザーが選択する。comma 区切りの Original（例: `raycast, reycast`）は Spokenly 側で複数バリアントとして 1 ルールにまとめられる。

## リスクと対策

| 重要度 | リスク                 | 対策                                                                                                                 |
| ------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 高     | Spokenly 未起動        | deeplink は必要に応じて Spokenly を起動する。開けない場合は明確なエラーメッセージ                                    |
| 中     | 選択取得失敗           | `getSelectedText` の reject を catch して Toast 表示。空文字の deeplink は開かない                                   |
| 中     | 特殊文字・改行・カンマ | `from` は URL エンコード。改行や特殊文字は事前バリデーションで拒否。カンマは Spokenly 側で複数バリアント区切りに注意 |
| 中     | 重複登録               | 同一 Original の再登録は上書きか重複か未確認。Word Replacements 一覧で確認してから Add                               |
| 中     | CI runner 未登録       | host に runner 登録を merge 前に完了する                                                                             |

## 採用方針

- **MVP 採用**: Raycast Extension
  - `getSelectedText()` で選択テキストを取得（clipboard は使用しない）
  - コマンド実行直後に deeplink を開く（Raycast フォームなし）
  - pnpm 固定と supply chain 設定
  - CI は Mac Studio self-hosted runner（host runner 未登録なら merge 不可）
  - lint / format を適用
  - Tab 補完後 hook は不適用（今回の利用ツールに必要な hook を設定しないため）
- **不採用**: Script Command

## 実装前の検証項目

- `spokenly://word-replacements/add?from=test` が手動で Spokenly の追加フォームを開くか
- 対象アプリで `getSelectedText` が reject しないか
- Mac Studio self-hosted runner が host に登録済みか
- pnpm install / lint / format / test が self-hosted runner 上で成功するか

## 受け入れ条件

- 選択テキストが `from` として Spokenly の追加フォームに事前入力される（`getSelectedText` 経由。clipboard は使用しない）
- Replacement は Spokenly 側の追加フォームでユーザーが入力する
- Spokenly 側で Add をクリックすると登録される
- 選択なし・deeplink を開けない場合にユーザーへ分かるフィードバックがある

## 未確定事項

- 同一 Original の再登録時の Spokenly 側挙動（上書きか重複か）
- 改行・タブを含む Original の deeplink クエリ上限とエスケープ規則
- CI での Raycast UI 手動検証の範囲（mock / deeplink 契約テストとの切り分け）
- regex 置換や before-ai / after-ai 個別指定の将来ニーズ

## 開発基盤（bootstrap 実装）

- Node.js 22.22.2 以上（mise 管理）、pnpm 固定、`pnpm-workspace.yaml` に supply chain 設定
- `mise.toml` タスク: `install` / `dev` / `check` / `test` / `build` / `lint` / `format` / `hooks-install` / `secrets:scan`
- deeplink 実行層: `open`（`src/lib/spokenly-deeplink.ts`）。Vitest で URL 構築を検証
- CI: Mac Studio self-hosted runner（`runs-on: [self-hosted, raycast-extension-spokenly-word-replace]`）。gitleaks のみ。Raycast UI E2E は CI 対象外
- pre-commit: gitleaks。pre-push: `mise run check`（lint / format check / test / build。失敗時は push 拒否）
- lint / format: ESLint（`@raycast/eslint-config`）+ Prettier。`mise run lint` / `mise run format:check` / `mise run format`。編集後は手動実行（project hooks 未設定）

## 外部資料

- [Spokenly — Word Replacements](https://spokenly.app/docs/word-replacements)
- [Spokenly — Deeplinks](https://spokenly.app/docs/macos/deeplinks)
- [Spokenly — CLI](https://spokenly.app/docs/macos/cli)
- [Raycast — getSelectedText](https://developers.raycast.com/api-reference/environment.md#getselectedtext)
- [Raycast — open](https://developers.raycast.com/api-reference/environment.md#open)
