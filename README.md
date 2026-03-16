# タスク管理アプリケーション

タスクの作成・ステータス管理・コメント機能を備えたフルスタック Web アプリケーションです。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| バックエンド | Express.js / TypeScript / SQLite (better-sqlite3) |
| フロントエンド | React 18 / TypeScript / Vite / Tailwind CSS |
| テスト | Vitest / @testing-library/react / supertest |
| CI | GitHub Actions |

## ローカル開発

```bash
# 依存パッケージのインストール
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# 開発サーバー起動（バックエンド: 8000 / フロントエンド: 5173）
npm run dev
```

ブラウザで http://localhost:5173/tasks にアクセスしてください。

## テスト実行

```bash
# 全テスト実行
npm test

# バックエンドのみ
cd backend && npx vitest run

# フロントエンドのみ
cd frontend && npx vitest run
```

## CI（GitHub Actions）

### 自動実行

以下のタイミングで CI が自動実行されます：

- `main` ブランチへの **push**
- `main` ブランチへの **Pull Request** 作成・更新

CI では以下の 3 つのジョブが実行されます：

| ジョブ | 内容 |
|-------|------|
| Backend Tests | TypeScript 型チェック + バックエンドテスト (28 tests) |
| Frontend Tests | TypeScript 型チェック + ビルド + フロントエンドテスト (16 tests) |
| HTML Validation | ビルド成果物の HTML 構文検証 |

### 手動実行の手順

1. GitHub リポジトリの **[Actions](../../actions)** タブを開く
2. 左のサイドバーから **「CI」** ワークフローを選択
3. 右上の **「Run workflow」** ボタンをクリック
4. ブランチを選択して **「Run workflow」** をクリック

> **補足**: `workflow_dispatch` により手動実行が有効化されています。任意のタイミングでテストを実行したい場合に使用してください。

### 失敗時のログ確認方法

1. **[Actions](../../actions)** タブを開く
2. 失敗したワークフロー（赤い x マークのもの）をクリック
3. 失敗したジョブ名（例: **Backend Tests**）をクリック
4. 各ステップを展開してログを確認
   - **テストを実行** ステップ → テストの失敗箇所とエラーメッセージが表示されます
   - **TypeScript 型チェック** ステップ → 型エラーの箇所が表示されます
   - **HTML を検証** ステップ → HTML 構文エラーの詳細が表示されます

> **ヒント**: ログ内で `Error` や `FAIL` を検索すると、問題箇所を素早く特定できます。

## ドキュメント

- [設計書](docs/design.md)
- [テスト仕様書](docs/test-specification.md)
