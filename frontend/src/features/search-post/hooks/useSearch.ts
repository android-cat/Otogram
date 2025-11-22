import { useState, useCallback } from 'react';
import { Post } from '@/shared/types';
import { API_BASE_URL } from '@/shared/config';

interface UseSearchResult {
    posts: Post[];
    loading: boolean;
    isSearching: boolean;
    searchQuery: string;
    searchType: string;
    activeSearch: string;
    activeSearchType: string;
    setSearchQuery: (query: string) => void;
    setSearchType: (type: string) => void;
    handleSearch: (e: React.FormEvent) => void;
    clearSearch: () => void;
    searchByTag: (tag: string) => void;
    refreshPosts: () => void;
}

export const useSearch = (): UseSearchResult => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('all');
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [activeSearch, setActiveSearch] = useState('');
    const [activeSearchType, setActiveSearchType] = useState('all');

    const fetchPosts = useCallback(async (query: string = '', type: string = 'all') => {
        if (query) {
            setIsSearching(true);
        } else {
            setLoading(true);
        }
        
        try {
            const endpoint = query
                ? `${API_BASE_URL}/api/search/posts?q=${encodeURIComponent(query)}&type=${type}`
                : `${API_BASE_URL}/api/posts`;

            const res = await fetch(endpoint, {
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setPosts(data || []);
        } catch (error) {
            console.error(error);
            setPosts([]);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    }, []);

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        setActiveSearch(searchQuery);
        setActiveSearchType(searchType);
        fetchPosts(searchQuery, searchType);
    }, [searchQuery, searchType, fetchPosts]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchType('all');
        setActiveSearch('');
        setActiveSearchType('all');
        fetchPosts();
    }, [fetchPosts]);

    const searchByTag = useCallback((tag: string) => {
        setSearchQuery(tag);
        setSearchType('tag');
        setActiveSearch(tag);
        setActiveSearchType('tag');
        fetchPosts(tag, 'tag');
    }, [fetchPosts]);

    const refreshPosts = useCallback(() => {
        setActiveSearch('');
        setActiveSearchType('all');
        fetchPosts();
    }, [fetchPosts]);

    return {
        posts,
        loading,
        isSearching,
        searchQuery,
        searchType,
        activeSearch,
        activeSearchType,
        setSearchQuery,
        setSearchType,
        handleSearch,
        clearSearch,
        searchByTag,
        refreshPosts,
    };
};
