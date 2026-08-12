# Spokenly 単語置換 — Raycast Extension 仕様

> **正本**: [spokenly-raycast-comparison-plan.html](./spokenly-raycast-comparison-plan.html)（HTML 正本。本 Markdown は同期版）

## 結論

MVP は **Raycast Extension**（`getSelectedText()` + Form + useExec）とする。**Script Command は採用しない**。選択テキストは clipboard ではなく `getSelectedText()` で取得する。

## 目的

任意アプリで選択したテキストを Original に、ユーザー入力した Replacement を Spokenly の Word Replacements へ登録する Raycast Extension の仕様を定義する。

- package manager: **pnpm 固定**（supply chain 設定を含む）
- CI: **Mac Studio self-hosted runner**（`runs-on: [self-hosted, raycast-extension-spokenly-word-replace]`）。host runner 未登録なら merge 不可
- lint / format: **適用**
- Tab 補完後 hook: **不適用**

## 方式比較（参考: Script Command は不採用）

| 比較軸 | Script Command | Extension（採用） |
| --- | --- | --- |
| 選択テキスト取得 | clipboard / `{selection}` または AppleScript | `getSelectedText()` 公式 API |
| Replacement 入力 | `@raycast.argument` | Form（バリデーション付き） |
| CLI 実行 | シェルから直接 | `useExec` / `execFile` |
| 実装コスト | 低 | 中〜高 |
| 権限 | Cmd+C 経路または Accessibility | Raycast 標準権限内 |
| 登録方式 | CLI 即時登録 | CLI または deeplink 事前入力 |

本 PJ では Script Command を採用しない。上記は比較検討時の参考情報である。

## Extension の具体フロー（MVP）

1. コマンド起動時に `getSelectedText()` で Original を取得（失敗時は Toast で案内）
1. Form に Original（読み取り専用）と Replacement（必須）を表示
1. 送信時に `useExec` または `execFile` で `spokenly replacements add` を実行
1. stderr / exit code を解析し、成功・失敗 Toast を表示

deeplink（`spokenly://word-replacements/add?from=…&to=…`）はフォーム事前入力のみで Add は手動のため、ワンショット登録には CLI が適する。**clipboard は使用しない。**

## 共通: Spokenly CLI 登録と timing

最終登録は Spokenly CLI の `replacements add` を使う。アプリが起動していることが前提。

```bash
spokenly replacements add "<original>" "<replacement>" --timing both
```

`timing both` は AI Instructions の前後で置換を実行する設定。

## リスクと対策

| 重要度 | リスク | 対策 |
| --- | --- | --- |
| 高 | Spokenly 未起動 | `open -a Spokenly` 後にリトライ、または明確なエラーメッセージ |
| 中 | 選択取得失敗 | `getSelectedText` の reject を catch して Toast 表示 |
| 中 | 特殊文字・改行・カンマ | クォート・事前バリデーション。カンマは複数バリアント区切りに注意 |
| 中 | 重複登録 | `spokenly replacements list` で存在確認 |
| 中 | CI runner 未登録 | host に runner 登録を merge 前に完了する |

## 採用方針

- **MVP 採用**: Raycast Extension
  - `getSelectedText()` で選択テキストを取得（clipboard は使用しない）
  - Form バリデーション・エラー UX
  - pnpm 固定と supply chain 設定
  - CI は Mac Studio self-hosted runner（host runner 未登録なら merge 不可）
  - lint / format を適用
  - Tab 補完後 hook は不適用（今回の利用ツールに必要な hook を設定しないため）
- **不採用**: Script Command

## 実装前の検証項目

- `spokenly replacements add "test" "TEST" --timing both` が手動で成功するか（Spokenly 起動状態）
- 対象アプリで `getSelectedText` が reject しないか
- Mac Studio self-hosted runner が host に登録済みか
- pnpm install / lint / format / test が self-hosted runner 上で成功するか

## 受け入れ条件

- 選択テキストが Original として Spokenly に登録される（`getSelectedText` 経由。clipboard は使用しない）
- Replacement はユーザーが毎回入力できる
- timing は both（AI 前後）で登録される
- 選択なし・Spokenly 未起動・CLI 失敗時にユーザーへ分かるフィードバックがある

## 未確定事項

- 同一 Original の再登録時の Spokenly 側挙動（上書きか重複か）
- 改行・タブを含む Original の CLI 上限とエスケープ規則
- CI での Raycast UI 手動検証の範囲（mock / CLI 契約テストとの切り分け）
- regex 置換や before-ai / after-ai 個別指定の将来ニーズ

## 開発基盤（bootstrap 実装）

- Node.js 22.22.2 以上（mise 管理）、pnpm 固定、`pnpm-workspace.yaml` に supply chain 設定
- `mise.toml` タスク: `install` / `dev` / `check` / `test` / `build` / `lint` / `format` / `hooks-install` / `secrets:scan`
- CLI 実行層: `child_process.execFile`（`src/lib/spokenly-cli.ts`）。Vitest で argv 構築とエラーマッピングを検証
- CI: Mac Studio self-hosted（`runs-on: [self-hosted, raycast-extension-spokenly-word-replace]`）。gitleaks と quality（install / lint / test / build）。Raycast UI E2E は CI 対象外
- pre-commit: gitleaks。pre-push: `mise run test`
- lint / format: `ray lint`（ESLint flat config + Prettier）。編集後は `mise run lint` / `mise run format` を手動実行（project hooks 未設定）

## 外部資料

- [Spokenly — Word Replacements](https://spokenly.app/docs/word-replacements)
- [Spokenly — Deeplinks](https://spokenly.app/docs/macos/deeplinks)
- [Spokenly — CLI](https://spokenly.app/docs/macos/cli)
- [Raycast — getSelectedText](https://developers.raycast.com/api-reference/environment.md#getselectedtext)
- [Raycast — Form](https://developers.raycast.com/api-reference/user-interface/form.md)
- [Raycast — useExec](https://developers.raycast.com/utilities/react-hooks/useexec)
