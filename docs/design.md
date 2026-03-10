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
| 1 | users | ユーザー | アプリケーション利用者情報を管理する |
| 2 | tasks | タスク | タスク情報を管理する |
| 3 | comments | コメント | タスクに対するコメントを管理する |

### 1.2 テーブル定義

#### 1.2.1 users（ユーザー）

| No. | カラム名 | 論理名 | データ型 | PK | NOT NULL | デフォルト | 備考 |
|-----|---------|--------|---------|-----|----------|-----------|------|
| 1 | id | ユーザーID | BIGINT (AUTO_INCREMENT) | ○ | ○ | - | |
| 2 | username | ユーザー名 | VARCHAR(100) | | ○ | - | ユニーク制約 |
| 3 | email | メールアドレス | VARCHAR(255) | | ○ | - | ユニーク制約 |
| 4 | password_hash | パスワードハッシュ | VARCHAR(255) | | ○ | - | bcrypt等でハッシュ化 |
| 5 | created_at | 作成日時 | TIMESTAMP | | ○ | CURRENT_TIMESTAMP | |
| 6 | updated_at | 更新日時 | TIMESTAMP | | ○ | CURRENT_TIMESTAMP | 更新時自動更新 |

**インデックス：**
- `idx_users_username` : `username`（UNIQUE）
- `idx_users_email` : `email`（UNIQUE）

#### 1.2.2 tasks（タスク）

| No. | カラム名 | 論理名 | データ型 | PK | NOT NULL | デフォルト | 備考 |
|-----|---------|--------|---------|-----|----------|-----------|------|
| 1 | id | タスクID | BIGINT (AUTO_INCREMENT) | ○ | ○ | - | |
| 2 | title | タイトル | VARCHAR(255) | | ○ | - | 最大255文字 |
| 3 | description | 説明 | TEXT | | | NULL | |
| 4 | status | ステータス | ENUM('todo','in_progress','done') | | ○ | 'todo' | |
| 5 | due_date | 期限 | DATE | | | NULL | |
| 6 | created_by | 作成者ID | BIGINT | | ○ | - | FK → users.id |
| 7 | created_at | 作成日時 | TIMESTAMP | | ○ | CURRENT_TIMESTAMP | |
| 8 | updated_at | 更新日時 | TIMESTAMP | | ○ | CURRENT_TIMESTAMP | 更新時自動更新 |

**インデックス：**
- `idx_tasks_status` : `status`
- `idx_tasks_created_by` : `created_by`
- `idx_tasks_due_date` : `due_date`

**外部キー：**
- `fk_tasks_created_by` : `created_by` → `users(id)` ON DELETE RESTRICT

#### 1.2.3 comments（コメント）

| No. | カラム名 | 論理名 | データ型 | PK | NOT NULL | デフォルト | 備考 |
|-----|---------|--------|---------|-----|----------|-----------|------|
| 1 | id | コメントID | BIGINT (AUTO_INCREMENT) | ○ | ○ | - | |
| 2 | task_id | タスクID | BIGINT | | ○ | - | FK → tasks.id |
| 3 | user_id | 投稿者ID | BIGINT | | ○ | - | FK → users.id |
| 4 | body | コメント本文 | TEXT | | ○ | - | |
| 5 | created_at | 投稿日時 | TIMESTAMP | | ○ | CURRENT_TIMESTAMP | |
| 6 | updated_at | 更新日時 | TIMESTAMP | | ○ | CURRENT_TIMESTAMP | 更新時自動更新 |

**インデックス：**
- `idx_comments_task_id` : `task_id`
- `idx_comments_user_id` : `user_id`

**外部キー：**
- `fk_comments_task_id` : `task_id` → `tasks(id)` ON DELETE CASCADE
- `fk_comments_user_id` : `user_id` → `users(id)` ON DELETE RESTRICT

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

TABLE(users, "users\nユーザー") {
  PK(id) : BIGINT <<AUTO_INCREMENT>>
  --
  COLUMN(username) : VARCHAR(100) <<UNIQUE, NOT NULL>>
  COLUMN(email) : VARCHAR(255) <<UNIQUE, NOT NULL>>
  COLUMN(password_hash) : VARCHAR(255) <<NOT NULL>>
  COLUMN(created_at) : TIMESTAMP <<NOT NULL>>
  COLUMN(updated_at) : TIMESTAMP <<NOT NULL>>
}

TABLE(tasks, "tasks\nタスク") {
  PK(id) : BIGINT <<AUTO_INCREMENT>>
  --
  COLUMN(title) : VARCHAR(255) <<NOT NULL>>
  COLUMN(description) : TEXT
  COLUMN(status) : ENUM('todo','in_progress','done') <<NOT NULL>>
  COLUMN(due_date) : DATE
  FK(created_by) : BIGINT <<NOT NULL>>
  COLUMN(created_at) : TIMESTAMP <<NOT NULL>>
  COLUMN(updated_at) : TIMESTAMP <<NOT NULL>>
}

TABLE(comments, "comments\nコメント") {
  PK(id) : BIGINT <<AUTO_INCREMENT>>
  --
  FK(task_id) : BIGINT <<NOT NULL>>
  FK(user_id) : BIGINT <<NOT NULL>>
  COLUMN(body) : TEXT <<NOT NULL>>
  COLUMN(created_at) : TIMESTAMP <<NOT NULL>>
  COLUMN(updated_at) : TIMESTAMP <<NOT NULL>>
}

users ||--o{ tasks : "1人のユーザーが\n複数のタスクを作成"
users ||--o{ comments : "1人のユーザーが\n複数のコメントを投稿"
tasks ||--o{ comments : "1つのタスクに\n複数のコメント"

@enduml
```

---

## 2. 画面設計書

### 2.1 画面一覧

| No. | 画面ID | 画面名 | URL | 概要 |
|-----|--------|--------|-----|------|
| 1 | SCR-001 | ログイン画面 | `/login` | ユーザー認証を行う |
| 2 | SCR-002 | タスク一覧画面 | `/tasks` | タスクの一覧を表示する |
| 3 | SCR-003 | タスク作成画面 | `/tasks/new` | 新規タスクを作成する |
| 4 | SCR-004 | タスク詳細画面 | `/tasks/:id` | タスクの詳細情報とコメントを表示する |
| 5 | SCR-005 | タスク編集画面 | `/tasks/:id/edit` | タスクの情報を編集する |

### 2.2 画面遷移図

```plantuml
@startuml 画面遷移図

skinparam state {
  BackgroundColor #F0F8FF
  BorderColor #4682B4
  ArrowColor #333333
  FontSize 14
}

state "SCR-001\nログイン画面" as Login
state "SCR-002\nタスク一覧画面" as TaskList
state "SCR-003\nタスク作成画面" as TaskCreate
state "SCR-004\nタスク詳細画面" as TaskDetail
state "SCR-005\nタスク編集画面" as TaskEdit

[*] --> Login

Login --> TaskList : ログイン成功

TaskList --> TaskCreate : 「新規作成」ボタン押下
TaskList --> TaskDetail : タスク行クリック

TaskCreate --> TaskList : 作成完了 / キャンセル

TaskDetail --> TaskEdit : 「編集」ボタン押下
TaskDetail --> TaskList : 「戻る」ボタン押下

TaskEdit --> TaskDetail : 更新完了 / キャンセル

TaskList --> Login : ログアウト

@enduml
```

### 2.3 画面レイアウト

#### 2.3.1 SCR-001 ログイン画面

**概要：** ユーザーがメールアドレスとパスワードでログインする。

| No. | 要素 | 種類 | 必須 | バリデーション |
|-----|------|------|------|--------------|
| 1 | メールアドレス | テキスト入力 | ○ | メール形式チェック |
| 2 | パスワード | パスワード入力 | ○ | 1文字以上 |
| 3 | ログインボタン | ボタン | - | - |

```plantuml
@startuml SCR-001_ログイン画面

skinparam monochrome false
skinparam shadowing false
skinparam defaultFontSize 12

salt
{+
  {* タスク管理アプリ }
  ---
  {+
    <b>ログイン</b>
    ---
    { メールアドレス: | "                              " }
    { パスワード:     | "                              " }
    ---
    [     ログイン     ]
  }
}

@enduml
```

#### 2.3.2 SCR-002 タスク一覧画面

**概要：** 全タスクを一覧表示する。ステータスでフィルタリングが可能。

| No. | 要素 | 種類 | 必須 | バリデーション |
|-----|------|------|------|--------------|
| 1 | ステータスフィルタ | ドロップダウン | - | - |
| 2 | タスク一覧テーブル | テーブル | - | - |
| 3 | 新規作成ボタン | ボタン | - | - |
| 4 | ログアウトボタン | ボタン | - | - |

```plantuml
@startuml SCR-002_タスク一覧画面

skinparam monochrome false
skinparam shadowing false
skinparam defaultFontSize 12

salt
{+
  {* タスク管理アプリ | [ ログアウト ] }
  ---
  {+
    <b>タスク一覧</b>
    ---
    { ステータス: | ^すべて^todo^in_progress^done^ } | [ 新規作成 ]
    ---
    {#
      No. | タイトル | ステータス | 期限 | 作成者
      1 | サンプルタスク1 | todo | 2026-03-15 | user1
      2 | サンプルタスク2 | in_progress | 2026-03-20 | user2
      3 | サンプルタスク3 | done | 2026-03-10 | user1
    }
  }
}

@enduml
```

#### 2.3.3 SCR-003 タスク作成画面

**概要：** 新しいタスクを作成する。

| No. | 要素 | 種類 | 必須 | バリデーション |
|-----|------|------|------|--------------|
| 1 | タイトル | テキスト入力 | ○ | 1〜255文字 |
| 2 | 説明 | テキストエリア | - | - |
| 3 | 期限 | 日付入力 | - | 過去日不可 |
| 4 | 作成ボタン | ボタン | - | - |
| 5 | キャンセルボタン | ボタン | - | - |

```plantuml
@startuml SCR-003_タスク作成画面

skinparam monochrome false
skinparam shadowing false
skinparam defaultFontSize 12

salt
{+
  {* タスク管理アプリ | [ ログアウト ] }
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

#### 2.3.4 SCR-004 タスク詳細画面

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
@startuml SCR-004_タスク詳細画面

skinparam monochrome false
skinparam shadowing false
skinparam defaultFontSize 12

salt
{+
  {* タスク管理アプリ | [ ログアウト ] }
  ---
  {+
    <b>タスク詳細</b>
    ---
    { タイトル:  | サンプルタスク1 }
    { 説明:     | タスクの説明文がここに表示されます }
    { ステータス: | ^todo^in_progress^done^ } | [ 更新 ]
    { 期限:     | 2026-03-15 }
    { 作成者:   | user1 }
    { 作成日時:  | 2026-03-01 10:00 }
    ---
    [ 編集 ] | [ 戻る ]
    ---
    <b>コメント</b>
    ---
    {+
      <b>user2</b> - 2026-03-02 14:30
      コメント内容がここに表示されます。
      [ 編集 ] | [ 削除 ]
      ---
      <b>user1</b> - 2026-03-03 09:00
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

#### 2.3.5 SCR-005 タスク編集画面

**概要：** タスクのタイトルと説明を編集する。

| No. | 要素 | 種類 | 必須 | バリデーション |
|-----|------|------|------|--------------|
| 1 | タイトル | テキスト入力 | ○ | 1〜255文字 |
| 2 | 説明 | テキストエリア | - | - |
| 3 | 更新ボタン | ボタン | - | - |
| 4 | キャンセルボタン | ボタン | - | - |

```plantuml
@startuml SCR-005_タスク編集画面

skinparam monochrome false
skinparam shadowing false
skinparam defaultFontSize 12

salt
{+
  {* タスク管理アプリ | [ ログアウト ] }
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
| 1 | POST | `/api/auth/login` | ログイン |
| 2 | POST | `/api/auth/logout` | ログアウト |
| 3 | GET | `/api/tasks` | タスク一覧取得 |
| 4 | POST | `/api/tasks` | タスク作成 |
| 5 | GET | `/api/tasks/:id` | タスク詳細取得 |
| 6 | PUT | `/api/tasks/:id` | タスク更新 |
| 7 | PATCH | `/api/tasks/:id/status` | タスクステータス変更 |
| 8 | GET | `/api/tasks/:id/comments` | コメント一覧取得 |
| 9 | POST | `/api/tasks/:id/comments` | コメント投稿 |
| 10 | PUT | `/api/tasks/:id/comments/:commentId` | コメント編集 |
| 11 | DELETE | `/api/tasks/:id/comments/:commentId` | コメント削除 |

### 3.2 API詳細

#### 3.2.1 POST `/api/auth/login` - ログイン

**リクエスト：**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

| パラメータ | 型 | 必須 | バリデーション |
|-----------|-----|------|--------------|
| email | string | ○ | メール形式 |
| password | string | ○ | 1文字以上 |

**レスポンス（200 OK）：**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "user1",
    "email": "user@example.com"
  }
}
```

**エラーレスポンス（401 Unauthorized）：**

```json
{
  "error": "メールアドレスまたはパスワードが正しくありません"
}
```

#### 3.2.2 POST `/api/auth/logout` - ログアウト

**リクエスト：** なし（認証ヘッダーのみ）

**レスポンス（200 OK）：**

```json
{
  "message": "ログアウトしました"
}
```

#### 3.2.3 GET `/api/tasks` - タスク一覧取得

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
      "created_by": {
        "id": 1,
        "username": "user1"
      },
      "created_at": "2026-03-01T10:00:00Z",
      "updated_at": "2026-03-01T10:00:00Z"
    }
  ]
}
```

#### 3.2.4 POST `/api/tasks` - タスク作成

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
  "created_by": {
    "id": 1,
    "username": "user1"
  },
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

#### 3.2.5 GET `/api/tasks/:id` - タスク詳細取得

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
  "created_by": {
    "id": 1,
    "username": "user1"
  },
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

#### 3.2.6 PUT `/api/tasks/:id` - タスク更新

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
  "created_by": {
    "id": 1,
    "username": "user1"
  },
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-03-10T11:00:00Z"
}
```

#### 3.2.7 PATCH `/api/tasks/:id/status` - タスクステータス変更

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
  "created_by": {
    "id": 1,
    "username": "user1"
  },
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

#### 3.2.8 GET `/api/tasks/:id/comments` - コメント一覧取得

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
      "user": {
        "id": 2,
        "username": "user2"
      },
      "body": "コメント内容",
      "created_at": "2026-03-02T14:30:00Z",
      "updated_at": "2026-03-02T14:30:00Z"
    }
  ]
}
```

#### 3.2.9 POST `/api/tasks/:id/comments` - コメント投稿

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
  "user": {
    "id": 1,
    "username": "user1"
  },
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

#### 3.2.10 PUT `/api/tasks/:id/comments/:commentId` - コメント編集

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
  "user": {
    "id": 2,
    "username": "user2"
  },
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

#### 3.2.11 DELETE `/api/tasks/:id/comments/:commentId` - コメント削除

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

#### 3.3.1 認証

- ログインAPI以外のすべてのAPIは認証が必要。
- 認証はJWTトークンをAuthorizationヘッダーに付与する方式。

```
Authorization: Bearer <token>
```

**認証エラーレスポンス（401 Unauthorized）：**

```json
{
  "error": "認証が必要です"
}
```

#### 3.3.2 共通エラーレスポンス

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
FE -> FE : SCR-003 タスク作成画面を表示

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
    FE -> FE : タスク一覧画面（SCR-002）へ遷移
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

#### 3.4.5 ログインフロー

```plantuml
@startuml ログインシーケンス

actor ユーザー as User
participant "フロントエンド\n(ブラウザ)" as FE
participant "APIサーバー" as API
database "データベース" as DB

User -> FE : ログイン画面を開く
FE -> FE : SCR-001 ログイン画面を表示

User -> FE : メールアドレス・パスワードを入力
User -> FE : 「ログイン」ボタンを押下

FE -> FE : バリデーション\n（必須チェック・メール形式チェック）

alt バリデーションエラー
  FE -> User : エラーメッセージを表示
else バリデーションOK
  FE -> API : POST /api/auth/login\n{email, password}
  
  API -> DB : SELECT * FROM users\nWHERE email = :email
  DB --> API : ユーザーデータ
  
  alt ユーザーが存在しない or パスワード不一致
    API --> FE : 401 Unauthorized\n{error: "メールアドレスまたは\nパスワードが正しくありません"}
    FE -> User : エラーメッセージを表示
  else 認証成功
    API -> API : JWTトークンを生成
    API --> FE : 200 OK\n{token, user: {id, username, email}}
    FE -> FE : トークンを保存（localStorage）
    FE -> FE : タスク一覧画面（SCR-002）へ遷移
  end
end

@enduml
```
