import React from 'react';

interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchType: string;
    setSearchType: (type: string) => void;
    onSearch: (e: React.FormEvent) => void;
    isSearching?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, searchType, setSearchType, onSearch, isSearching = false }) => {
    return (
        <form onSubmit={onSearch} className="w-full mb-4">
            <div className="flex gap-3 mb-3">
                <button
                    type="button"
                    onClick={() => setSearchType('title')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                        searchType === 'title' 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
                    }`}
                >
                    Title
                </button>
                <button
                    type="button"
                    onClick={() => setSearchType('comment')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                        searchType === 'comment' 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
                    }`}
                >
                    Message
                </button>
                <button
                    type="button"
                    onClick={() => setSearchType('tag')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                        searchType === 'tag' 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
                    }`}
                >
                    Tag
                </button>
                {(searchType === 'title' || searchType === 'comment' || searchType === 'tag') && (
                    <button
                        type="button"
                        onClick={() => setSearchType('all')}
                        className="px-4 py-2 rounded-lg font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
                    >
                        Clear Filter
                    </button>
                )}
            </div>
            <div className="relative">
                <input
                    type="text"
                    placeholder={`Search ${searchType === 'all' ? 'all fields' : searchType}...`}
                    className="w-full p-4 pl-12 pr-12 rounded-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 ${isSearching ? 'animate-spin' : ''}`}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    {isSearching ? (
                        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    ) : (
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    )}
                </svg>
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-300 dark:bg-zinc-600 hover:bg-gray-400 dark:hover:bg-zinc-500 transition"
                    >
                        <svg
                            className="w-4 h-4 text-gray-700 dark:text-gray-200"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                )}
            </div>
        </form>
    );
};
