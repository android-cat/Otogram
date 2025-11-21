import React from 'react';

interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onSearch: (e: React.FormEvent) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, onSearch }) => {
    return (
        <form onSubmit={onSearch} className="w-full mb-4">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search messages, titles, or tags..."
                    className="w-full p-4 pl-12 rounded-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </div>
        </form>
    );
};
