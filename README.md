# Spokenly Word Replace — Raycast Extension

任意アプリで選択したテキストを Spokenly の Word Replacements に登録する Raycast Extension です。選択テキストは `getSelectedText()` で取得し、clipboard は使用しません。

## 前提条件

- [Raycast](https://www.raycast.com/)（macOS）
- [mise](https://mise.jdx.dev/)（Node.js 22.22.2 以上と pnpm を管理）
- [Spokenly](https://spokenly.app/) と `spokenly` CLI（PATH に通っていること）

`package.json` の `author` は `ray lint` が Raycast ユーザー名を検証するため、Store 公開前に自身の Raycast ユーザー名へ差し替えてください。

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

CLI 引数構築とエラーマッピングは Vitest で検証します。Raycast UI の動作は手動で確認してください。

## ビルド

```bash
mise run build
```

## Lint / Format

```bash
mise run lint
mise run format -- "src/path/to/file.ts"
```

編集後の lint / format は、リポジトリに project hooks の仕組みが未設定のため、変更後に上記コマンドを手動実行してください。

## 手動受け入れ

1. Spokenly アプリを起動する
1. 任意のアプリでテキストを選択する
1. Raycast で「Add Word Replacement」コマンドを起動する
1. Original に選択テキストが表示されることを確認する
1. Replacement を入力して送信する
1. Toast で成功が表示され、Spokenly に登録されることを確認する

失敗系:

- 選択なしで起動 → 取得失敗の Toast
- Spokenly 未起動 / CLI 失敗 → エラー Toast に stderr 等が表示される

## 仕様

- [spec/spokenly-raycast-comparison-plan.md](./spec/spokenly-raycast-comparison-plan.md)
- [spec/spokenly-raycast-comparison-plan.html](./spec/spokenly-raycast-comparison-plan.html)（正本）

## CI

GitHub Actions は Mac Studio self-hosted runner（`runs-on: [self-hosted, raycast-extension-spokenly-word-replace]`）で lint / test / build と gitleaks を実行します。Raycast UI の E2E は CI では検証しません。
