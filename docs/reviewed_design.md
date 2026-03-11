# タスク管理アプリケーション 設計書

## 目次

1. [テーブル設計書](#1-テーブル設計書)
2. [画面設計書](#2-画面設計書)
3. [API設計書](#3-api設計書)

---

## 1. テーブル設計書

### 1.1 テーブル一覧

| No. | テーブル名 | 論理名 | 概要 |
|-----|-----------|--------|------|
| 1 | tasks | タスク | タスク情報を管理する |
| 2 | comments | コメント | タスクに対するコメントを管理する |

### 1.2 テーブル定義

#### 1.2.1 tasks（タスク）

| No. | カラム名 | 論理名 | データ型 | PK | NOT NULL | デフォルト | 備考 |
|-----|---------|--------|---------|-----|----------|-----------|------|
| 1 | id | タスクID | BIGINT (AUTO_INCREMENT) | ○ | ○ | - | |
| 2 | title | タイトル | VARCHAR(255) | | ○ | - | 最大255文字 |
| 3 | description | 説明 | TEXT | | | NULL | |
| 4 | status | ステータス | ENUM('todo','in_progress','done') | | ○ | 'todo' | 画面では日本語で表示する。<br>'todo':起票,<br>'in_progress':進行中,<br>'done':完了 |
| 5 | due_date | 期限 | DATE | | | NULL | |
| 6 | created_at | 作成日時 | TIMESTAMP | | ○ | CURRENT_TIMESTAMP | |
| 7 | updated_at | 更新日時 | TIMESTAMP | | ○ | CURRENT_TIMESTAMP | 更新時自動更新 |

**インデックス：**
- `idx_tasks_status` : `status`
- `idx_tasks_due_date` : `due_date`

#### 1.2.2 comments（コメント）

| No. | カラム名 | 論理名 | データ型 | PK | NOT NULL | デフォルト | 備考 |
|-----|---------|--------|---------|-----|----------|-----------|------|
| 1 | id | コメントID | BIGINT (AUTO_INCREMENT) | ○ | ○ | - | |
| 2 | task_id | タスクID | BIGINT | | ○ | - | FK → tasks.id |
| 3 | body | コメント本文 | TEXT | | ○ | - | |
| 4 | created_at | 投稿日時 | TIMESTAMP | | ○ | CURRENT_TIMESTAMP | |
| 5 | updated_at | 更新日時 | TIMESTAMP | | ○ | CURRENT_TIMESTAMP | 更新時自動更新 |

**インデックス：**
- `idx_comments_task_id` : `task_id`

**外部キー：**
- `fk_comments_task_id` : `task_id` → `tasks(id)` ON DELETE CASCADE

### 1.3 ER図

```plantuml
@startuml ER図

!define TABLE(name,desc) entity name as "desc" << (T,#FFAAAA) >>
!define PK(x) <b><color:#b8861b><&key></color> x</b>
!define FK(x) <color:#aaaaaa><&link-intact></color> x
!define COLUMN(x) x

skinparam linetype ortho
skinparam entity {
  BackgroundColor #F9F9F9
  BorderColor #333333
  ArrowColor #333333
}

TABLE(tasks, "tasks\nタスク") {
  PK(id) : BIGINT <<AUTO_INCREMENT>>
  --
  COLUMN(title) : VARCHAR(255) <<NOT NULL>>
  COLUMN(description) : TEXT
  COLUMN(status) : ENUM('todo','in_progress','done') <<NOT NULL>>
  COLUMN(due_date) : DATE
  COLUMN(created_at) : TIMESTAMP <<NOT NULL>>
  COLUMN(updated_at) : TIMESTAMP <<NOT NULL>>
}

TABLE(comments, "comments\nコメント") {
  PK(id) : BIGINT <<AUTO_INCREMENT>>
  --
  FK(task_id) : BIGINT <<NOT NULL>>
  COLUMN(body) : TEXT <<NOT NULL>>
  COLUMN(created_at) : TIMESTAMP <<NOT NULL>>
  COLUMN(updated_at) : TIMESTAMP <<NOT NULL>>
}

tasks ||--o{ comments : "1つのタスクに\n複数のコメント"

@enduml
```

---

## 2. 画面設計書

### 2.1 画面一覧

| No. | 画面ID | 画面名 | URL | 概要 |
|-----|--------|--------|-----|------|
| 1 | SCR-001 | タスク一覧画面 | `/tasks` | タスクの一覧を表示する |
| 2 | SCR-002 | タスク作成画面 | `/tasks/new` | 新規タスクを作成する |
| 3 | SCR-003 | タスク詳細画面 | `/tasks/:id` | タスクの詳細情報とコメントを表示する |
| 4 | SCR-004 | タスク編集画面 | `/tasks/:id/edit` | タスクの情報を編集する |

### 2.2 画面遷移図

```plantuml
@startuml 画面遷移図

skinparam state {
  BackgroundColor #F0F8FF
  BorderColor #4682B4
  ArrowColor #333333
  FontSize 14
}

state "SCR-001\nタスク一覧画面" as TaskList
state "SCR-002\nタスク作成画面" as TaskCreate
state "SCR-003\nタスク詳細画面" as TaskDetail
state "SCR-004\nタスク編集画面" as TaskEdit

TaskList --> TaskCreate : 「新規作成」ボタン押下
TaskList --> TaskDetail : タスク行クリック

TaskCreate --> TaskList : 作成完了 / キャンセル

TaskDetail --> TaskEdit : 「編集」ボタン押下
TaskDetail --> TaskList : 「戻る」ボタン押下

TaskEdit --> TaskDetail : 更新完了 / キャンセル

@enduml
```

### 2.3 画面レイアウト

#### 2.3.1 SCR-001 タスク一覧画面

**概要：** 全タスクを一覧表示する。ステータスでフィルタリングが可能。

| No. | 要素 | 種類 | 必須 | バリデーション |
|-----|------|------|------|--------------|
| 1 | ステータスフィルタ | ドロップダウン | - | - |
| 2 | タスク一覧テーブル | テーブル | - | - |
| 3 | 新規作成ボタン | ボタン | - | - |

```plantuml
@startuml SCR-001_タスク一覧画面

skinparam monochrome false
skinparam shadowing false
skinparam defaultFontSize 12

salt
{+
  {* タスク管理アプリ }
  ---
  {+
    <b>タスク一覧</b>
    ---
    { ステータス: | ^すべて^起票^進行中^完了^ } | [ 新規作成 ]
    ---
    {#
      No. | タイトル | ステータス | 期限
      1 | サンプルタスク1 | 起票 | 2026-03-15
      2 | サンプルタスク2 | 進行中 | 2026-03-20
      3 | サンプルタスク3 | 完了 | 2026-03-10
    }
  }
}

@enduml
```

#### 2.3.2 SCR-002 タスク作成画面

**概要：** 新しいタスクを作成する。

| No. | 要素 | 種類 | 必須 | バリデーション |
|-----|------|------|------|--------------|
| 1 | タイトル | テキスト入力 | ○ | 1〜255文字 |
| 2 | 説明 | テキストエリア | - | - |
| 3 | 期限 | 日付入力 | - | 過去日不可 |
| 4 | 作成ボタン | ボタン | - | - |
| 5 | キャンセルボタン | ボタン | - | - |

```plantuml
@startuml SCR-002_タスク作成画面

skinparam monochrome false
skinparam shadowing false
skinparam defaultFontSize 12

salt
{+
  {* タスク管理アプリ }
  ---
  {+
    <b>タスク作成</b>
    ---
    { タイトル（必須）: | "                              " }
    { 説明:            |
      {SI
        説明を入力してください
      }
    }
    { 期限:            | "  2026-03-15  " }
    ---
    [ 作成 ] | [ キャンセル ]
  }
}

@enduml
```

#### 2.3.3 SCR-003 タスク詳細画面

**概要：** タスクの詳細情報を表示し、ステータスの変更やコメントの投稿・編集・削除を行う。

| No. | 要素 | 種類 | 必須 | バリデーション |
|-----|------|------|------|--------------|
| 1 | タスク情報表示 | 表示エリア | - | - |
| 2 | ステータス変更 | ドロップダウン | - | - |
| 3 | 編集ボタン | ボタン | - | - |
| 4 | 戻るボタン | ボタン | - | - |
| 5 | コメント一覧 | リスト | - | - |
| 6 | コメント入力 | テキストエリア | ○（投稿時） | 1文字以上 |
| 7 | コメント投稿ボタン | ボタン | - | - |

```plantuml
@startuml SCR-003_タスク詳細画面

skinparam monochrome false
skinparam shadowing false
skinparam defaultFontSize 12

salt
{+
  {* タスク管理アプリ }
  ---
  {+
    <b>タスク詳細</b>
    ---
    { タイトル:  | サンプルタスク1 }
    { 説明:     | タスクの説明文がここに表示されます }
    { ステータス: | ^起票^進行中^完了^ } | [ 更新 ]
    { 期限:     | 2026-03-15 }
    { 作成日時:  | 2026-03-01 10:00 }
    ---
    [ 編集 ] | [ 戻る ]
    ---
    <b>コメント</b>
    ---
    {+
      2026-03-02 14:30
      コメント内容がここに表示されます。
      [ 編集 ] | [ 削除 ]
      ---
      2026-03-03 09:00
      別のコメントがここに表示されます。
      [ 編集 ] | [ 削除 ]
    }
    ---
    {SI
      コメントを入力してください
    }
    [ コメント投稿 ]
  }
}

@enduml
```

#### 2.3.4 SCR-004 タスク編集画面

**概要：** タスクのタイトルと説明を編集する。

| No. | 要素 | 種類 | 必須 | バリデーション |
|-----|------|------|------|--------------|
| 1 | タイトル | テキスト入力 | ○ | 1〜255文字 |
| 2 | 説明 | テキストエリア | - | - |
| 3 | 更新ボタン | ボタン | - | - |
| 4 | キャンセルボタン | ボタン | - | - |

```plantuml
@startuml SCR-004_タスク編集画面

skinparam monochrome false
skinparam shadowing false
skinparam defaultFontSize 12

salt
{+
  {* タスク管理アプリ }
  ---
  {+
    <b>タスク編集</b>
    ---
    { タイトル（必須）: | "  サンプルタスク1              " }
    { 説明:            |
      {SI
        既存の説明文がここに表示されます
      }
    }
    ---
    [ 更新 ] | [ キャンセル ]
  }
}

@enduml
```

---

## 3. API設計書

### 3.1 API一覧

| No. | メソッド | エンドポイント | 概要 |
|-----|---------|--------------|------|
| 1 | GET | `/api/tasks` | タスク一覧取得 |
| 2 | POST | `/api/tasks` | タスク作成 |
| 3 | GET | `/api/tasks/:id` | タスク詳細取得 |
| 4 | PUT | `/api/tasks/:id` | タスク更新 |
| 5 | PATCH | `/api/tasks/:id/status` | タスクステータス変更 |
| 6 | GET | `/api/tasks/:id/comments` | コメント一覧取得 |
| 7 | POST | `/api/tasks/:id/comments` | コメント投稿 |
| 8 | PUT | `/api/tasks/:id/comments/:commentId` | コメント編集 |
| 9 | DELETE | `/api/tasks/:id/comments/:commentId` | コメント削除 |

### 3.2 API詳細

#### 3.2.1 GET `/api/tasks` - タスク一覧取得

**クエリパラメータ：**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| status | string | - | ステータスでフィルタ（`todo`, `in_progress`, `done`） |

**レスポンス（200 OK）：**

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "サンプルタスク1",
      "description": "タスクの説明",
      "status": "todo",
      "due_date": "2026-03-15",
      "created_at": "2026-03-01T10:00:00Z",
      "updated_at": "2026-03-01T10:00:00Z"
    }
  ]
}
```

#### 3.2.2 POST `/api/tasks` - タスク作成

**リクエスト：**

```json
{
  "title": "新しいタスク",
  "description": "タスクの詳細説明",
  "due_date": "2026-03-15"
}
```

| パラメータ | 型 | 必須 | バリデーション |
|-----------|-----|------|--------------|
| title | string | ○ | 1〜255文字 |
| description | string | - | - |
| due_date | string (YYYY-MM-DD) | - | 過去日不可 |

**レスポンス（201 Created）：**

```json
{
  "id": 2,
  "title": "新しいタスク",
  "description": "タスクの詳細説明",
  "status": "todo",
  "due_date": "2026-03-15",
  "created_at": "2026-03-10T10:00:00Z",
  "updated_at": "2026-03-10T10:00:00Z"
}
```

**エラーレスポンス（400 Bad Request）：**

```json
{
  "errors": [
    { "field": "title", "message": "タイトルは必須です" }
  ]
}
```

#### 3.2.3 GET `/api/tasks/:id` - タスク詳細取得

**パスパラメータ：**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | タスクID |

**レスポンス（200 OK）：**

```json
{
  "id": 1,
  "title": "サンプルタスク1",
  "description": "タスクの説明",
  "status": "todo",
  "due_date": "2026-03-15",
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-03-01T10:00:00Z"
}
```

**エラーレスポンス（404 Not Found）：**

```json
{
  "error": "タスクが見つかりません"
}
```

#### 3.2.4 PUT `/api/tasks/:id` - タスク更新

**リクエスト：**

```json
{
  "title": "更新後のタイトル",
  "description": "更新後の説明"
}
```

| パラメータ | 型 | 必須 | バリデーション |
|-----------|-----|------|--------------|
| title | string | ○ | 1〜255文字 |
| description | string | - | - |

**レスポンス（200 OK）：**

```json
{
  "id": 1,
  "title": "更新後のタイトル",
  "description": "更新後の説明",
  "status": "todo",
  "due_date": "2026-03-15",
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-03-10T11:00:00Z"
}
```

#### 3.2.5 PATCH `/api/tasks/:id/status` - タスクステータス変更

**リクエスト：**

```json
{
  "status": "in_progress"
}
```

| パラメータ | 型 | 必須 | バリデーション |
|-----------|-----|------|--------------|
| status | string | ○ | `todo`, `in_progress`, `done` のいずれか |

**レスポンス（200 OK）：**

```json
{
  "id": 1,
  "title": "サンプルタスク1",
  "description": "タスクの説明",
  "status": "in_progress",
  "due_date": "2026-03-15",
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-03-10T12:00:00Z"
}
```

**エラーレスポンス（400 Bad Request）：**

```json
{
  "errors": [
    { "field": "status", "message": "ステータスは todo, in_progress, done のいずれかを指定してください" }
  ]
}
```

#### 3.2.6 GET `/api/tasks/:id/comments` - コメント一覧取得

**パスパラメータ：**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | タスクID |

**レスポンス（200 OK）：**

```json
{
  "comments": [
    {
      "id": 1,
      "task_id": 1,
      "body": "コメント内容",
      "created_at": "2026-03-02T14:30:00Z",
      "updated_at": "2026-03-02T14:30:00Z"
    }
  ]
}
```

#### 3.2.7 POST `/api/tasks/:id/comments` - コメント投稿

**リクエスト：**

```json
{
  "body": "新しいコメント"
}
```

| パラメータ | 型 | 必須 | バリデーション |
|-----------|-----|------|--------------|
| body | string | ○ | 1文字以上 |

**レスポンス（201 Created）：**

```json
{
  "id": 3,
  "task_id": 1,
  "body": "新しいコメント",
  "created_at": "2026-03-10T13:00:00Z",
  "updated_at": "2026-03-10T13:00:00Z"
}
```

**エラーレスポンス（400 Bad Request）：**

```json
{
  "errors": [
    { "field": "body", "message": "コメント本文は必須です" }
  ]
}
```

#### 3.2.8 PUT `/api/tasks/:id/comments/:commentId` - コメント編集

**パスパラメータ：**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | タスクID |
| commentId | integer | ○ | コメントID |

**リクエスト：**

```json
{
  "body": "編集後のコメント"
}
```

| パラメータ | 型 | 必須 | バリデーション |
|-----------|-----|------|--------------|
| body | string | ○ | 1文字以上 |

**レスポンス（200 OK）：**

```json
{
  "id": 1,
  "task_id": 1,
  "body": "編集後のコメント",
  "created_at": "2026-03-02T14:30:00Z",
  "updated_at": "2026-03-10T14:00:00Z"
}
```

**エラーレスポンス（403 Forbidden）：**

```json
{
  "error": "このコメントを編集する権限がありません"
}
```

#### 3.2.9 DELETE `/api/tasks/:id/comments/:commentId` - コメント削除

**パスパラメータ：**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | タスクID |
| commentId | integer | ○ | コメントID |

**レスポンス（204 No Content）：** レスポンスボディなし

**エラーレスポンス（403 Forbidden）：**

```json
{
  "error": "このコメントを削除する権限がありません"
}
```

### 3.3 共通仕様

#### 3.3.1 共通エラーレスポンス

| ステータスコード | 説明 |
|---------------|------|
| 400 | バリデーションエラー |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソース未検出 |
| 500 | サーバー内部エラー |

**500 Internal Server Error：**

```json
{
  "error": "サーバー内部エラーが発生しました"
}
```

### 3.4 シーケンス図

#### 3.4.1 タスク作成フロー

```plantuml
@startuml タスク作成シーケンス

actor ユーザー as User
participant "フロントエンド\n(ブラウザ)" as FE
participant "APIサーバー" as API
database "データベース" as DB

User -> FE : タスク作成画面を開く
FE -> FE : SCR-002 タスク作成画面を表示

User -> FE : タイトル・説明・期限を入力
User -> FE : 「作成」ボタンを押下

FE -> FE : バリデーション\n（必須チェック・形式チェック）

alt バリデーションエラー
  FE -> User : エラーメッセージを表示
else バリデーションOK
  FE -> API : POST /api/tasks\n{title, description, due_date}
  
  API -> API : サーバー側バリデーション
  
  alt バリデーションエラー
    API --> FE : 400 Bad Request\n{errors: [...]}
    FE -> User : エラーメッセージを表示
  else バリデーションOK
    API -> DB : INSERT INTO tasks\n(title, description, status, due_date, created_by)
    DB --> API : 挿入結果（新規タスク）
    API --> FE : 201 Created\n{id, title, description, status, ...}
    FE -> FE : タスク一覧画面（SCR-001）へ遷移
    FE -> User : 作成完了メッセージを表示
  end
end

@enduml
```

#### 3.4.2 タスクステータス変更フロー

```plantuml
@startuml タスクステータス変更シーケンス

actor ユーザー as User
participant "フロントエンド\n(ブラウザ)" as FE
participant "APIサーバー" as API
database "データベース" as DB

User -> FE : タスク詳細画面でステータスを変更
User -> FE : 「更新」ボタンを押下

FE -> API : PATCH /api/tasks/:id/status\n{status: "in_progress"}

API -> API : バリデーション\n（ステータス値チェック）

alt バリデーションエラー
  API --> FE : 400 Bad Request\n{errors: [...]}
  FE -> User : エラーメッセージを表示
else バリデーションOK
  API -> DB : SELECT * FROM tasks WHERE id = :id
  DB --> API : タスクデータ
  
  alt タスクが存在しない
    API --> FE : 404 Not Found
    FE -> User : エラーメッセージを表示
  else タスクが存在する
    API -> DB : UPDATE tasks SET status = :status\nWHERE id = :id
    DB --> API : 更新結果
    API --> FE : 200 OK\n{id, title, status, ...}
    FE -> FE : 画面のステータス表示を更新
    FE -> User : 更新完了メッセージを表示
  end
end

@enduml
```

#### 3.4.3 コメント投稿フロー

```plantuml
@startuml コメント投稿シーケンス

actor ユーザー as User
participant "フロントエンド\n(ブラウザ)" as FE
participant "APIサーバー" as API
database "データベース" as DB

User -> FE : タスク詳細画面でコメントを入力
User -> FE : 「コメント投稿」ボタンを押下

FE -> FE : バリデーション\n（空文字チェック）

alt バリデーションエラー
  FE -> User : エラーメッセージを表示
else バリデーションOK
  FE -> API : POST /api/tasks/:id/comments\n{body: "コメント内容"}

  API -> API : サーバー側バリデーション

  alt バリデーションエラー
    API --> FE : 400 Bad Request\n{errors: [...]}
    FE -> User : エラーメッセージを表示
  else バリデーションOK
    API -> DB : SELECT * FROM tasks WHERE id = :id
    DB --> API : タスクデータ
    
    alt タスクが存在しない
      API --> FE : 404 Not Found
      FE -> User : エラーメッセージを表示
    else タスクが存在する
      API -> DB : INSERT INTO comments\n(task_id, user_id, body)
      DB --> API : 挿入結果（新規コメント）
      API --> FE : 201 Created\n{id, task_id, user, body, ...}
      FE -> FE : コメント一覧を更新
      FE -> User : コメント投稿完了
    end
  end
end

@enduml
```

#### 3.4.4 コメント編集・削除フロー

```plantuml
@startuml コメント編集削除シーケンス

actor ユーザー as User
participant "フロントエンド\n(ブラウザ)" as FE
participant "APIサーバー" as API
database "データベース" as DB

== コメント編集 ==

User -> FE : 「編集」ボタンを押下
FE -> FE : コメント編集モードに切替

User -> FE : コメントを編集
User -> FE : 「保存」ボタンを押下

FE -> FE : バリデーション\n（空文字チェック）

FE -> API : PUT /api/tasks/:id/comments/:commentId\n{body: "編集後のコメント"}

API -> DB : SELECT * FROM comments\nWHERE id = :commentId
DB --> API : コメントデータ

alt 権限なし（投稿者ではない）
  API --> FE : 403 Forbidden
  FE -> User : エラーメッセージを表示
else 権限あり
  API -> DB : UPDATE comments SET body = :body\nWHERE id = :commentId
  DB --> API : 更新結果
  API --> FE : 200 OK\n{id, task_id, user, body, ...}
  FE -> FE : コメント表示を更新
  FE -> User : 編集完了
end

== コメント削除 ==

User -> FE : 「削除」ボタンを押下
FE -> User : 削除確認ダイアログを表示

User -> FE : 「OK」を押下

FE -> API : DELETE /api/tasks/:id/comments/:commentId

API -> DB : SELECT * FROM comments\nWHERE id = :commentId
DB --> API : コメントデータ

alt 権限なし（投稿者ではない）
  API --> FE : 403 Forbidden
  FE -> User : エラーメッセージを表示
else 権限あり
  API -> DB : DELETE FROM comments\nWHERE id = :commentId
  DB --> API : 削除結果
  API --> FE : 204 No Content
  FE -> FE : コメントを一覧から除去
  FE -> User : 削除完了
end

@enduml
```