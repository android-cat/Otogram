# Otogram 認証設定ガイド

## Spotify OAuth設定

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) にアクセス
2. 新しいアプリを作成
3. **Settings** → **Redirect URIs** に以下を追加:
   ```
   http://localhost:8080/auth/spotify/callback
   ```
4. Client IDとClient Secretを`.env`に設定

## X (Twitter) OAuth 2.0設定

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) にアクセス
2. 新しいアプリを作成
3. **User authentication settings** を設定:
   - **Type of App**: Web App
   - **App permissions**: Read
   - **Callback URI**: `http://localhost:8080/auth/twitter/callback`
   - **Website URL**: `http://localhost:3000`
4. OAuth 2.0設定で以下を有効化:
   - **Type**: Public client (PKCE)
5. Client IDとClient Secretを`.env`に設定

## 環境変数設定

`.env`ファイルを作成し、以下を設定:

```bash
# Spotify OAuth
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8080/auth/spotify/callback

# X (Twitter) OAuth 2.0
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URI=http://localhost:8080/auth/twitter/callback

# Session
SESSION_SECRET=your_random_secret_key_here_at_least_32_characters
SESSION_COOKIE_NAME=otogram_session

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

フロントエンドの`.env.local`も作成:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## 本番環境設定

本番環境では以下を変更:

1. **Redirect URIs**: 本番ドメインに変更
2. **SESSION_SECRET**: 強力なランダム文字列に変更
3. **Secure Cookie**: `auth/session.go`で`Secure: true`に設定
4. **HTTPS**: 必ずHTTPSを使用
5. **CORS**: 本番フロントエンドURLのみ許可

## セキュリティ注意事項

- `.env`ファイルは絶対にGitにコミットしない
- SESSION_SECRETは32文字以上の強力なランダム文字列を使用
- 本番環境ではHTTPSを必須とする
- Cookie設定で`Secure: true`, `HttpOnly: true`, `SameSite: Lax`を設定
