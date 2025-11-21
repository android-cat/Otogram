'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/shared/contexts/AuthContext';
import { API_BASE_URL } from '@/shared/config';

function SetupProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // If user already has a display name, redirect to home
    if (currentUser && currentUser.display_name) {
      const redirectTo = searchParams.get('redirect') || '/';
      router.push(redirectTo);
    } else if (currentUser) {
      // Pre-fill with OAuth data if available
      setDisplayName(currentUser.display_name || '');
      setProfileImage(currentUser.profile_image || '');
    }
  }, [currentUser, router, searchParams]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('画像ファイルのみアップロード可能です');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('画像のアップロードに失敗しました');
      }

      const data = await response.json();
      setProfileImage(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('表示名は必須です');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          display_name: displayName.trim(),
          profile_image: profileImage.trim(),
          bio: bio.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('プロフィールの更新に失敗しました');
      }

      await refreshUser();
      const redirectTo = searchParams.get('redirect') || '/';
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-800">
        <p className="text-gray-100">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-zinc-900 to-zinc-800">
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent mb-2">
          プロフィール設定
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          初回登録です。プロフィールを設定してください
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-gray-900 dark:text-gray-100 font-medium mb-2">
              表示名 <span className="text-accent">*</span>
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="あなたの表示名"
              required
              maxLength={50}
            />
          </div>

          <div>
            <label htmlFor="profileImage" className="block text-gray-900 dark:text-gray-100 font-medium mb-2">
              プロフィール画像
            </label>
            <div className="space-y-3">
              <input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 disabled:opacity-50"
              />
              {uploading && (
                <p className="text-sm text-primary">アップロード中...</p>
              )}
              {profileImage && (
                <div className="mt-2">
                  <img
                    src={profileImage}
                    alt="プレビュー"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 dark:border-zinc-600"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-gray-900 dark:text-gray-100 font-medium mb-2">
              自己紹介
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="あなたについて教えてください"
              rows={4}
              maxLength={200}
            />
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {bio.length} / 200
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary via-secondary to-accent text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '保存中...' : '保存して始める'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SetupProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-800"><p className="text-gray-100">読み込み中...</p></div>}>
      <SetupProfileContent />
    </Suspense>
  );
}
