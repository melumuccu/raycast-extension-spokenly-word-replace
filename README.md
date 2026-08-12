# Spokenly Word Replace — Raycast Extension

任意アプリで選択したテキストを Spokenly の Word Replacements に登録する Raycast Extension です。選択テキストは `getSelectedText()` で取得し、clipboard は使用しません。

## 前提条件

- [Raycast](https://www.raycast.com/)（macOS）
- [mise](https://mise.jdx.dev/)（Node.js 22.22.2 以上と pnpm を管理）
- [Spokenly](https://spokenly.app/)（macOS アプリ）

`package.json` の `author` は Store 公開前に自身の Raycast ユーザー名へ差し替えてください。

## セットアップ

```bash
mise install
mise run install
mise run hooks-install
```

## 開発

```bash
mise run dev
```

Raycast で Extension をインポートし、開発モードでコマンドを起動します。

## テスト

```bash
mise run test
```

deeplink URL 構築は Vitest で検証します。Raycast UI の動作は手動で確認してください。

## ビルド

```bash
mise run build
```

## Lint / Format

```bash
mise run lint
mise run format:check
mise run format -- "src/path/to/file.ts"
```

`mise run check` は lint / format check / test / build を順に実行する品質ゲートです。`mise run hooks-install` 後は `git push` 時に pre-push hook 経由で自動実行され、失敗時は push が拒否されます。

編集後の lint / format は、リポジトリに project hooks の仕組みが未設定のため、変更後に上記コマンドを手動実行してください。

## 手動受け入れ

1. Spokenly アプリを起動する
1. 任意のアプリでテキストを選択する
1. Raycast で「Add Word Replacement」コマンドを起動する
1. Original に選択テキストが表示されることを確認する
1. Replacement を入力して送信する
1. Toast で成功が表示され、Spokenly の Word Replacements 追加フォームが開くことを確認する
1. Spokenly 側で Add をクリックし、登録が完了することを確認する

失敗系:

- 選択なしで起動 → 取得失敗の Toast
- deeplink を開けない場合 → エラー Toast

## 仕様

- [spec/spokenly-raycast-comparison-plan.md](./spec/spokenly-raycast-comparison-plan.md)
- [spec/spokenly-raycast-comparison-plan.html](./spec/spokenly-raycast-comparison-plan.html)（正本）

## CI

品質検査（lint / format check / test / build）は pre-push hook の `mise run check` で実行します。GitHub Actions は gitleaks のみを Mac Studio self-hosted runner（`runs-on: [self-hosted, raycast-extension-spokenly-word-replace]`）で実行します。Raycast UI の E2E は自動検証しません。
