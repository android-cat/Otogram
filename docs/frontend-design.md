# フロントエンド設計書

## 概要

Otogramのフロントエンドは、Next.js 14 (App Router) とTypeScriptで構築されており、Feature-Sliced Design (FSD) アーキテクチャを採用しています。

## アーキテクチャ

### Feature-Sliced Design (FSD)

FSDは、スケーラブルで保守性の高いフロントエンドアプリケーションを構築するためのアーキテクチャパターンです。

#### レイヤー構成

```
src/
├── app/           # Next.js App Router (ページとレイアウト)
├── widgets/       # 独立した機能ブロック (未使用)
├── features/      # ユーザーインタラクション機能
├── entities/      # ビジネスエンティティ
└── shared/        # 共有コード
```

### ディレクトリ詳細

#### `src/app/` - アプリケーション層
Next.js App Routerの規約に従ったページとレイアウト。

- `layout.tsx` - ルートレイアウト (フォント、メタデータ)
- `page.tsx` - ホームページ (フィード表示)
- `globals.css` - グローバルスタイル

#### `src/features/` - 機能層
ユーザーインタラクションを実装する機能コンポーネント。

**create-post/**
- `ui/CreatePostForm.tsx` - 投稿作成フォーム
  - タイトル、URL、コメント、タグの入力
  - URL解析 (Spotify/YouTube/その他)
  - API呼び出し

**search-post/**
- `ui/SearchBar.tsx` - 検索バー
  - キーワード検索UI
  - 検索フォーム送信

#### `src/entities/` - エンティティ層
ビジネスドメインのエンティティとそのUI。

**post/**
- `ui/PostCard.tsx` - 投稿カードコンポーネント
  - ユーザー情報表示
  - タイトル、コメント表示
  - プレーヤー埋め込み (Spotify/YouTube)
  - タグ表示

#### `src/shared/` - 共有層
アプリケーション全体で使用される共有コード。

**ui/**
- `SpotifyPlayer.tsx` - Spotify埋め込みプレーヤー
- `YouTubePlayer.tsx` - YouTube埋め込みプレーヤー

**types.ts**
- `User` - ユーザー型定義
- `Post` - 投稿型定義

## データフロー

### 投稿の取得

```
page.tsx → fetchPosts() → GET /api/posts → setPosts() → PostCard
```

### 投稿の作成

```
CreatePostForm → parseUrl() → POST /api/posts → onPostCreated() → fetchPosts()
```

### 検索

```
SearchBar → onSearch() → fetchPosts(query) → GET /api/search/posts?q=... → PostCard
```

## 主要コンポーネント

### `page.tsx` (ホームページ)

**責務:**
- 投稿リストの取得と表示
- 検索機能の統合
- 投稿作成フォームの表示制御

**状態管理:**
- `posts` - 投稿リスト
- `searchQuery` - 検索クエリ
- `loading` - ローディング状態
- `isFormOpen` - フォーム表示状態

### `PostCard` (投稿カード)

**Props:**
- `post: Post` - 投稿データ

**機能:**
- ユーザー情報表示 (アバター、名前、日時)
- タイトルとコメント表示
- 音楽プレーヤー埋め込み (song_typeに応じて)
- タグ表示

### `CreatePostForm` (投稿フォーム)

**Props:**
- `onPostCreated: () => void` - 投稿成功時のコールバック
- `onCancel: () => void` - キャンセル時のコールバック

**機能:**
- URL解析 (Spotify/YouTube/その他の判定)
- タグのパース (カンマ区切り、最大10個)
- バリデーション
- API呼び出し

**URL解析ロジック:**
```typescript
// Spotify: open.spotify.com/intl-ja/track/ID または open.spotify.com/track/ID
const spotifyMatch = url.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)/);

// YouTube: youtube.com/watch?v=ID または youtu.be/ID
const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);

// その他: URLをそのまま保存
```

### `SearchBar` (検索バー)

**Props:**
- `searchQuery: string` - 検索クエリ
- `setSearchQuery: (query: string) => void` - クエリ更新関数
- `onSearch: (e: React.FormEvent) => void` - 検索実行関数

**機能:**
- 検索入力UI
- フォーム送信処理

## スタイリング

### TailwindCSS

ユーティリティファーストのCSSフレームワークを使用。

**主要なデザイントークン:**
- カラー: `bg-gray-100`, `dark:bg-zinc-900`
- スペーシング: `p-4`, `mb-8`, `space-y-8`
- ボーダー: `rounded-xl`, `border-green-500`
- シャドウ: `shadow-md`

**ダークモード:**
- `dark:` プレフィックスでダークモード対応
- システム設定に自動追従

## 型定義

### `User`
```typescript
interface User {
    display_name: string;
    profile_image: string;
}
```

### `Post`
```typescript
interface Post {
    id: number;
    title: string;
    song_id: string;
    song_type: 'spotify' | 'youtube' | 'other';
    comment: string;
    tags: string[];
    created_at: string;
    user?: User;
}
```

## API統合

### エンドポイント

**投稿取得:**
```typescript
GET http://localhost:8080/api/posts
```

**投稿作成:**
```typescript
POST http://localhost:8080/api/posts
Content-Type: application/json

{
  "title": "曲のタイトル",
  "song_id": "2MtvDq9TmHJd3hVbe0STbP",
  "song_type": "spotify",
  "comment": "コメント",
  "tags": ["tag1", "tag2"]
}
```

**検索:**
```typescript
GET http://localhost:8080/api/search/posts?q=keyword
```

## パフォーマンス最適化

### Next.js最適化
- **App Router** - サーバーコンポーネントとクライアントコンポーネントの分離
- **Standalone出力** - 最小限のDockerイメージサイズ

### 画像最適化
- 現在は未実装 (将来的にNext.js Imageコンポーネントを使用)

## 今後の改善点

1. **状態管理の強化**
   - React Query / SWR の導入
   - キャッシュとリアルタイム更新

2. **エラーハンドリング**
   - エラーバウンダリの実装
   - トーストメッセージの追加

3. **アクセシビリティ**
   - ARIA属性の追加
   - キーボードナビゲーション

4. **テスト**
   - Jest + React Testing Library
   - E2Eテスト (Playwright)

5. **パフォーマンス**
   - 仮想スクロール (無限スクロール)
   - 画像遅延読み込み

6. **認証**
   - Spotify OAuth フローの完全実装
   - セッション管理
