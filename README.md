# Otogram - Music Sharing SNS

音楽を共有し、感想を投稿できるソーシャルネットワークサービスです。

## 概要

Otogramは、お気に入りの音楽をコミュニティと共有できるプラットフォームです。Spotify、YouTube、その他のURLをサポートし、タグ付けや検索機能を備えています。

## 主な機能

- 🎵 **音楽投稿**: Spotify、YouTube、その他のURLを投稿
- 🏷️ **タグ機能**: 最大10個のタグで投稿を分類
- 🔍 **検索機能**: タイトル、コメント、タグで投稿を検索
- 🎨 **レスポンシブUI**: モダンなデザインとダークモード対応
- 🎧 **埋め込みプレーヤー**: Spotify/YouTubeの音楽をその場で再生

## 技術スタック

### フロントエンド
- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Feature-Sliced Design** アーキテクチャ

### バックエンド
- **Go 1.21**
- **PostgreSQL 15**
- **CORS対応REST API**

### インフラ
- **Docker & Docker Compose**

## プロジェクト構成

```
Otogram/
├── frontend/          # Next.js フロントエンド
│   └── src/
│       ├── app/       # Next.js App Router
│       ├── entities/  # ドメインエンティティ (Post)
│       ├── features/  # 機能コンポーネント (CreatePost, SearchPost)
│       └── shared/    # 共有コンポーネント (UI, Types)
├── backend/           # Go バックエンド
│   ├── cmd/api/       # エントリーポイント
│   └── internal/      # 内部パッケージ
│       ├── auth/      # 認証ハンドラー
│       ├── database/  # DB接続
│       ├── handlers/  # APIハンドラー
│       └── models/    # データモデル
├── db/                # データベース初期化スクリプト
├── docs/              # ドキュメント
└── docker-compose.yml # Docker構成
```

## セットアップ

### 前提条件

- Docker & Docker Compose
- (オプション) Spotify Developer アカウント

### 起動手順

1. **リポジトリをクローン**
   ```bash
   git clone <repository-url>
   cd Otogram
   ```

2. **環境変数を設定** (オプション)
   ```bash
   # .env ファイルを作成
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```

3. **Dockerコンテナを起動**
   ```bash
   docker-compose up -d --build
   ```

4. **アプリケーションにアクセス**
   - フロントエンド: http://localhost:3000
   - バックエンドAPI: http://localhost:8080
   - データベース: localhost:5432

### 初回起動時

データベースは自動的に初期化され、デモユーザーが作成されます。

## 使い方

1. **投稿を作成**
   - 「+ Share a Song」ボタンをクリック
   - タイトル、URL、コメント、タグを入力
   - 「Post」をクリック

2. **投稿を検索**
   - 検索バーにキーワードを入力
   - タイトル、コメント、タグから検索

3. **音楽を再生**
   - Spotify/YouTube URLの場合、埋め込みプレーヤーで再生
   - その他のURLは新しいタブで開く

## API エンドポイント

### 投稿関連
- `GET /api/posts` - 全投稿を取得
- `POST /api/posts` - 新規投稿を作成

### 検索
- `GET /api/search/posts?q=keyword` - 投稿を検索
- `GET /api/search/users?q=keyword` - ユーザーを検索

### 認証 (未実装)
- `GET /auth/spotify` - Spotifyログイン
- `GET /auth/spotify/callback` - Spotifyコールバック

### ヘルスチェック
- `GET /health` - サーバーステータス

## 開発

### フロントエンド開発

```bash
cd frontend
npm install
npm run dev
```

### バックエンド開発

```bash
cd backend
go mod download
go run cmd/api/main.go
```

### データベースリセット

```bash
docker-compose down -v
docker-compose up -d
```

## ドキュメント

詳細な設計ドキュメントは `docs/` ディレクトリを参照してください：

- [フロントエンド設計書](docs/frontend-design.md)
- [バックエンド設計書](docs/backend-design.md)

## ライセンス

MIT License

