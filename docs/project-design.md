# プロジェクト機能 設計書

## 目次

1. [テーブル設計書](#1-テーブル設計書)
2. [画面設計書](#2-画面設計書)
3. [API設計書](#3-api設計書)

---

## 1. テーブル設計書

### 1.1 テーブル定義

#### projects（プロジェクト）

| No. | カラム名 | 論理名 | データ型 | PK | NOT NULL | デフォルト | 備考 |
|-----|---------|--------|---------|-----|----------|-----------|------|
| 1 | id | プロジェクトID | INTEGER (AUTOINCREMENT) | ○ | ○ | - | |
| 2 | name | プロジェクト名 | TEXT | | ○ | - | 最大255文字 |
| 3 | created_at | 作成日時 | TEXT | | ○ | datetime('now') | |
| 4 | updated_at | 更新日時 | TEXT | | ○ | datetime('now') | 更新時自動更新 |

### 1.2 リレーション

- `tasks.project_id` → `projects.id`（ON DELETE CASCADE）
- プロジェクト削除時、紐づくタスクおよびそのコメントもすべて削除される

### 1.3 ER図

```plantuml
@startuml ER図（プロジェクト）

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

TABLE(projects, "projects\nプロジェクト") {
  PK(id) : INTEGER <<AUTOINCREMENT>>
  --
  COLUMN(name) : TEXT <<NOT NULL>>
  COLUMN(created_at) : TEXT <<NOT NULL>>
  COLUMN(updated_at) : TEXT <<NOT NULL>>
}

TABLE(tasks, "tasks\nタスク") {
  PK(id) : INTEGER <<AUTOINCREMENT>>
  --
  COLUMN(title) : TEXT <<NOT NULL>>
  COLUMN(description) : TEXT
  COLUMN(status) : TEXT <<NOT NULL>>
  COLUMN(due_date) : TEXT
  FK(project_id) : INTEGER
  COLUMN(created_at) : TEXT <<NOT NULL>>
  COLUMN(updated_at) : TEXT <<NOT NULL>>
}

TABLE(comments, "comments\nコメント") {
  PK(id) : INTEGER <<AUTOINCREMENT>>
  --
  FK(task_id) : INTEGER <<NOT NULL>>
  COLUMN(body) : TEXT <<NOT NULL>>
  COLUMN(created_at) : TEXT <<NOT NULL>>
  COLUMN(updated_at) : TEXT <<NOT NULL>>
}

projects ||--o{ tasks : "1つのプロジェクトに\n複数のタスク"
tasks ||--o{ comments : "1つのタスクに\n複数のコメント"

@enduml
```

---

## 2. 画面設計書

### 2.1 画面一覧

| No. | 画面ID | 画面名 | URL | 概要 |
|-----|--------|--------|-----|------|
| 1 | SCR-P01 | プロジェクト一覧画面 | `/projects` | プロジェクトの一覧表示・作成・編集・削除を行う |

### 2.2 画面遷移図

```plantuml
@startuml 画面遷移図（プロジェクト）

skinparam state {
  BackgroundColor #F0F8FF
  BorderColor #4682B4
  ArrowColor #333333
  FontSize 14
}

state "SCR-P01\nプロジェクト一覧画面" as ProjectList
state "SCR-001\nタスク一覧画面" as TaskList

[*] --> ProjectList

ProjectList --> TaskList : プロジェクト行クリック
TaskList --> ProjectList : 「戻る」ボタン押下 /\nヘッダー「プロジェクト一覧」リンク

@enduml
```

### 2.3 画面レイアウト

#### 2.3.1 SCR-P01 プロジェクト一覧画面

**概要：** 全プロジェクトを一覧表示する。モーダルダイアログで作成・編集を行う。

| No. | 要素 | 種類 | 必須 | バリデーション |
|-----|------|------|------|--------------|
| 1 | プロジェクト一覧テーブル | テーブル | - | - |
| 2 | 新規作成ボタン | ボタン | - | - |
| 3 | 編集ボタン（各行） | ボタン | - | - |
| 4 | 削除ボタン（各行） | ボタン | - | - |
| 5 | プロジェクト作成/編集ダイアログ | モーダル | - | - |
| 6 | 削除確認ダイアログ | モーダル | - | - |

**プロジェクト作成/編集ダイアログ：**

| No. | 要素 | 種類 | 必須 | バリデーション |
|-----|------|------|------|--------------|
| 1 | プロジェクト名 | テキスト入力 | ○ | 1〜255文字 |
| 2 | 作成/更新ボタン | ボタン | - | - |
| 3 | キャンセルボタン | ボタン | - | - |

```plantuml
@startuml SCR-P01_プロジェクト一覧画面

skinparam monochrome false
skinparam shadowing false
skinparam defaultFontSize 12

salt
{+
  {* タスク管理アプリ }
  ---
  {+
    <b>プロジェクト一覧</b> | [ 新規作成 ]
    ---
    {#
      No. | プロジェクト名 | 作成日時 | 操作
      1 | サンプルプロジェクト1 | 2026/04/01 10:00 | [編集] [削除]
      2 | サンプルプロジェクト2 | 2026/03/15 09:00 | [編集] [削除]
    }
  }
}

@enduml
```

---

## 3. API設計書

### 3.1 API一覧

| No. | メソッド | エンドポイント | 概要 |
|-----|---------|--------------|------|
| 1 | GET | `/api/projects` | プロジェクト一覧取得 |
| 2 | GET | `/api/projects/:id` | プロジェクト詳細取得 |
| 3 | POST | `/api/projects` | プロジェクト作成 |
| 4 | PUT | `/api/projects/:id` | プロジェクト名更新 |
| 5 | DELETE | `/api/projects/:id` | プロジェクト削除 |

### 3.2 API詳細

#### 3.2.1 GET `/api/projects` - プロジェクト一覧取得

**レスポンス（200 OK）：**

```json
{
  "projects": [
    {
      "id": 1,
      "name": "サンプルプロジェクト",
      "created_at": "2026-04-01 10:00:00",
      "updated_at": "2026-04-01 10:00:00"
    }
  ]
}
```

#### 3.2.2 GET `/api/projects/:id` - プロジェクト詳細取得

**パスパラメータ：**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | プロジェクトID（正の整数） |

**レスポンス（200 OK）：**

```json
{
  "id": 1,
  "name": "サンプルプロジェクト",
  "created_at": "2026-04-01 10:00:00",
  "updated_at": "2026-04-01 10:00:00"
}
```

**エラーレスポンス（404 Not Found）：**

```json
{
  "error": "プロジェクトが見つかりません"
}
```

**エラーレスポンス（400 Bad Request）：**

```json
{
  "errors": [
    { "field": "id", "message": "プロジェクトIDは正の整数で指定してください" }
  ]
}
```

#### 3.2.3 POST `/api/projects` - プロジェクト作成

**リクエスト：**

```json
{
  "name": "新しいプロジェクト"
}
```

| パラメータ | 型 | 必須 | バリデーション |
|-----------|-----|------|--------------|
| name | string | ○ | 1〜255文字 |

**レスポンス（201 Created）：**

```json
{
  "id": 2,
  "name": "新しいプロジェクト",
  "created_at": "2026-04-01 12:00:00",
  "updated_at": "2026-04-01 12:00:00"
}
```

**エラーレスポンス（400 Bad Request）：**

```json
{
  "errors": [
    { "field": "name", "message": "プロジェクト名は必須です" }
  ]
}
```

#### 3.2.4 PUT `/api/projects/:id` - プロジェクト名更新

**リクエスト：**

```json
{
  "name": "更新後のプロジェクト名"
}
```

| パラメータ | 型 | 必須 | バリデーション |
|-----------|-----|------|--------------|
| name | string | ○ | 1〜255文字 |

**レスポンス（200 OK）：**

```json
{
  "id": 1,
  "name": "更新後のプロジェクト名",
  "created_at": "2026-04-01 10:00:00",
  "updated_at": "2026-04-05 15:00:00"
}
```

**エラーレスポンス（404 Not Found）：**

```json
{
  "error": "プロジェクトが見つかりません"
}
```

#### 3.2.5 DELETE `/api/projects/:id` - プロジェクト削除

**パスパラメータ：**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | プロジェクトID（正の整数） |

**レスポンス（204 No Content）：** レスポンスボディなし

**エラーレスポンス（404 Not Found）：**

```json
{
  "error": "プロジェクトが見つかりません"
}
```

**注意：** プロジェクト削除時、紐づくタスクおよびコメントもカスケード削除される。

### 3.3 シーケンス図

#### 3.3.1 プロジェクト作成フロー

```plantuml
@startuml プロジェクト作成シーケンス

actor ユーザー as User
participant "フロントエンド\n(ブラウザ)" as FE
participant "APIサーバー" as API
database "データベース" as DB

User -> FE : 「新規作成」ボタンを押下
FE -> FE : プロジェクト作成ダイアログを表示

User -> FE : プロジェクト名を入力
User -> FE : 「作成」ボタンを押下

FE -> FE : バリデーション\n（必須チェック・文字数チェック）

alt バリデーションエラー
  FE -> User : エラーメッセージを表示
else バリデーションOK
  FE -> API : POST /api/projects\n{name}

  API -> API : サーバー側バリデーション

  alt バリデーションエラー
    API --> FE : 400 Bad Request\n{errors: [...]}
    FE -> User : エラーメッセージを表示
  else バリデーションOK
    API -> DB : INSERT INTO projects (name)
    DB --> API : 挿入結果（新規プロジェクト）
    API --> FE : 201 Created\n{id, name, created_at, updated_at}
    FE -> FE : ダイアログを閉じる
    FE -> API : GET /api/projects
    API -> DB : SELECT * FROM projects
    DB --> API : プロジェクト一覧
    API --> FE : 200 OK\n{projects: [...]}
    FE -> User : プロジェクト一覧を再表示
  end
end

@enduml
```

#### 3.3.2 プロジェクト削除フロー

```plantuml
@startuml プロジェクト削除シーケンス

actor ユーザー as User
participant "フロントエンド\n(ブラウザ)" as FE
participant "APIサーバー" as API
database "データベース" as DB

User -> FE : 「削除」ボタンを押下
FE -> User : 削除確認ダイアログを表示\n「紐づくタスクもすべて削除されます」

alt キャンセル
  User -> FE : 「キャンセル」を押下
  FE -> FE : ダイアログを閉じる
else 削除確認
  User -> FE : 「削除」を押下

  FE -> API : DELETE /api/projects/:id

  API -> DB : SELECT * FROM projects WHERE id = :id
  DB --> API : プロジェクトデータ

  alt プロジェクトが存在しない
    API --> FE : 404 Not Found
    FE -> User : エラーメッセージを表示
  else プロジェクトが存在する
    API -> DB : DELETE FROM projects WHERE id = :id\n（CASCADE で tasks, comments も削除）
    DB --> API : 削除結果
    API --> FE : 204 No Content
    FE -> API : GET /api/projects
    API -> DB : SELECT * FROM projects
    DB --> API : プロジェクト一覧
    API --> FE : 200 OK\n{projects: [...]}
    FE -> User : プロジェクト一覧を再表示
  end
end

@enduml
```
