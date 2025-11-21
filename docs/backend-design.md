# バックエンド設計書

## 概要

OtogramのバックエンドはGo言語で構築されたRESTful APIサーバーです。PostgreSQLデータベースと連携し、投稿の管理、検索、認証機能を提供します。

## アーキテクチャ

### レイヤー構成

```
backend/
├── cmd/api/           # アプリケーションエントリーポイント
│   └── main.go        # サーバー起動、ルーティング設定
└── internal/          # 内部パッケージ
    ├── auth/          # 認証ロジック
    ├── database/      # データベース接続
    ├── handlers/      # HTTPハンドラー
    └── models/        # データモデル
```

### パッケージ詳細

#### `cmd/api/` - エントリーポイント

**main.go**
- データベース初期化
- CORSミドルウェアの設定
- ルーティング設定
- HTTPサーバー起動

**主要な関数:**
- `main()` - アプリケーションのエントリーポイント
- `enableCORS()` - CORSミドルウェア

#### `internal/database/` - データベース層

**postgres.go**
- PostgreSQL接続管理
- リトライロジック (最大5回、5秒間隔)
- グローバルDB接続オブジェクト

**主要な関数:**
- `InitDB()` - データベース接続の初期化

**接続設定:**
```go
host := os.Getenv("DB_HOST")      // デフォルト: db
port := os.Getenv("DB_PORT")      // デフォルト: 5432
user := os.Getenv("DB_USER")      // デフォルト: postgres
password := os.Getenv("DB_PASSWORD") // デフォルト: password
dbname := os.Getenv("DB_NAME")    // デフォルト: music_sns
```

#### `internal/models/` - データモデル層

**types.go**

**User モデル:**
```go
type User struct {
    ID           int       `json:"id"`
    SpotifyID    string    `json:"spotify_id"`
    DisplayName  string    `json:"display_name"`
    ProfileImage string    `json:"profile_image"`
    CreatedAt    time.Time `json:"created_at"`
}
```

**Post モデル:**
```go
type Post struct {
    ID        int       `json:"id"`
    UserID    int       `json:"user_id"`
    Title     string    `json:"title"`
    SongID    string    `json:"song_id"`
    SongType  string    `json:"song_type"`
    Comment   string    `json:"comment"`
    Tags      []string  `json:"tags"`
    CreatedAt time.Time `json:"created_at"`
    User      *User     `json:"user,omitempty"`
}
```

#### `internal/handlers/` - ハンドラー層

**posts.go**

**GetPosts** - 投稿一覧取得
- エンドポイント: `GET /api/posts`
- レスポンス: 投稿の配列 (新しい順)
- ユーザー情報を含む (LEFT JOIN)

**CreatePost** - 投稿作成
- エンドポイント: `POST /api/posts`
- リクエストボディ:
  ```json
  {
    "title": "曲のタイトル",
    "song_id": "ID or URL",
    "song_type": "spotify | youtube | other",
    "comment": "コメント",
    "tags": ["tag1", "tag2"]
  }
  ```
- バリデーション: タグ数は最大10個
- デフォルトユーザーID: 1 (デモ用)

**search.go**

**SearchPosts** - 投稿検索
- エンドポイント: `GET /api/search/posts?q=keyword`
- 検索対象: タイトル、コメント、タグ
- クエリ: ILIKE (大文字小文字を区別しない)

**SearchUsers** - ユーザー検索
- エンドポイント: `GET /api/search/users?q=keyword`
- 検索対象: 表示名
- クエリ: ILIKE

#### `internal/auth/` - 認証層

**handler.go**

**HandleSpotifyLogin** - Spotifyログイン
- エンドポイント: `GET /auth/spotify`
- 現在: プレースホルダー実装

**HandleSpotifyCallback** - Spotifyコールバック
- エンドポイント: `GET /auth/spotify/callback`
- 現在: プレースホルダー実装

## データベース設計

### テーブル定義

#### `users` テーブル
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    spotify_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**初期データ:**
```sql
INSERT INTO users (id, spotify_id, display_name, profile_image) 
VALUES (1, 'demo_user', 'Demo User', '')
ON CONFLICT (id) DO NOTHING;
```

#### `posts` テーブル
```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    song_id TEXT NOT NULL,
    song_type VARCHAR(50) NOT NULL CHECK (song_type IN ('spotify', 'youtube', 'other')),
    comment TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### インデックス

現在は未実装。以下のインデックスを推奨：

```sql
-- 投稿の検索パフォーマンス向上
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- ユーザー検索
CREATE INDEX idx_users_display_name ON users(display_name);
```

## API仕様

### CORS設定

すべてのエンドポイントでCORSが有効化されています。

```go
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

### エンドポイント一覧

#### 投稿API

**GET /api/posts**
- 説明: 全投稿を取得
- レスポンス: `200 OK`
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "title": "曲のタイトル",
      "song_id": "2MtvDq9TmHJd3hVbe0STbP",
      "song_type": "spotify",
      "comment": "コメント",
      "tags": ["tag1", "tag2"],
      "created_at": "2025-11-21T10:00:00Z",
      "user": {
        "display_name": "Demo User",
        "profile_image": ""
      }
    }
  ]
  ```

**POST /api/posts**
- 説明: 新規投稿を作成
- リクエスト: `Content-Type: application/json`
  ```json
  {
    "title": "曲のタイトル",
    "song_id": "2MtvDq9TmHJd3hVbe0STbP",
    "song_type": "spotify",
    "comment": "コメント",
    "tags": ["tag1", "tag2"]
  }
  ```
- レスポンス: `200 OK`
  ```json
  {
    "id": 2,
    "created_at": "2025-11-21T10:05:00Z"
  }
  ```
- エラー:
  - `400 Bad Request` - バリデーションエラー (タグ数超過など)
  - `500 Internal Server Error` - データベースエラー

#### 検索API

**GET /api/search/posts?q=keyword**
- 説明: 投稿を検索
- クエリパラメータ:
  - `q` (必須): 検索キーワード
- レスポンス: `200 OK` (投稿の配列)
- エラー:
  - `400 Bad Request` - クエリパラメータ不足

**GET /api/search/users?q=keyword**
- 説明: ユーザーを検索
- クエリパラメータ:
  - `q` (必須): 検索キーワード
- レスポンス: `200 OK` (ユーザーの配列)

#### 認証API (未実装)

**GET /auth/spotify**
- 説明: Spotifyログインページへリダイレクト
- 現在: プレースホルダー

**GET /auth/spotify/callback**
- 説明: Spotifyからのコールバック処理
- 現在: プレースホルダー

#### ヘルスチェック

**GET /health**
- 説明: サーバーの稼働状態を確認
- レスポンス: `200 OK` "OK"

## エラーハンドリング

### 標準エラーレスポンス

```go
http.Error(w, "エラーメッセージ", http.StatusCode)
```

### ログ出力

```go
log.Println("Error scanning row:", err)
```

## セキュリティ

### 現在の実装

- CORS: すべてのオリジンを許可 (`*`)
- 認証: 未実装 (デモユーザーID固定)

### 今後の改善点

1. **認証・認可**
   - Spotify OAuth 2.0の完全実装
   - JWTトークンの発行と検証
   - セッション管理

2. **CORS**
   - 本番環境では特定のオリジンのみ許可

3. **入力バリデーション**
   - より厳格なバリデーションルール
   - SQLインジェクション対策 (現在はプリペアドステートメント使用)

4. **レート制限**
   - API呼び出し回数の制限

## パフォーマンス最適化

### 現在の実装

- プリペアドステートメント使用
- データベース接続プーリング (デフォルト)

### 今後の改善点

1. **キャッシング**
   - Redis導入
   - 投稿リストのキャッシュ

2. **ページネーション**
   - LIMIT/OFFSET または カーソルベース

3. **インデックス**
   - 検索パフォーマンス向上

4. **接続プール設定**
   - `SetMaxOpenConns()`, `SetMaxIdleConns()` の調整

## デプロイメント

### Docker構成

**Dockerfile**
```dockerfile
FROM golang:1.21-alpine
WORKDIR /app
COPY go.mod ./
COPY . .
RUN go mod tidy
RUN go mod download
RUN go build -o main ./cmd/api
EXPOSE 8080
CMD ["/app/main"]
```

### 環境変数

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `DB_HOST` | `db` | データベースホスト |
| `DB_PORT` | `5432` | データベースポート |
| `DB_USER` | `postgres` | データベースユーザー |
| `DB_PASSWORD` | `password` | データベースパスワード |
| `DB_NAME` | `music_sns` | データベース名 |
| `SPOTIFY_CLIENT_ID` | - | Spotify Client ID |
| `SPOTIFY_CLIENT_SECRET` | - | Spotify Client Secret |
| `SPOTIFY_REDIRECT_URI` | `http://localhost:8080/auth/spotify/callback` | Spotifyリダイレクト URI |

## テスト

### 現在の状態
- 未実装

### 推奨テスト戦略

1. **ユニットテスト**
   - ハンドラーのテスト
   - モデルのバリデーション

2. **統合テスト**
   - データベース操作のテスト
   - API エンドポイントのテスト

3. **テストツール**
   - `testing` パッケージ
   - `httptest` パッケージ
   - `testify` ライブラリ

## 今後の拡張

1. **機能追加**
   - いいね機能
   - コメント機能
   - フォロー機能
   - 通知機能

2. **パフォーマンス**
   - GraphQL API
   - WebSocket (リアルタイム更新)

3. **監視**
   - Prometheus メトリクス
   - ログ集約 (ELK Stack)

4. **CI/CD**
   - GitHub Actions
   - 自動テスト
   - 自動デプロイ
