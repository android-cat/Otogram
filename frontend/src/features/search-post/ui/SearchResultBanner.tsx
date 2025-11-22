import React from 'react';

interface SearchResultBannerProps {
    searchQuery: string;
    searchType: string;
    onClear: () => void;
}

export const SearchResultBanner: React.FC<SearchResultBannerProps> = ({ searchQuery, searchType, onClear }) => {
    if (!searchQuery) return null;

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <p className="text-blue-800 dark:text-blue-200 font-medium">
                    Showing results for <span className="font-bold">"{searchQuery}"</span>
                    {searchType !== 'all' && <span className="text-sm ml-1">(in {searchType})</span>}
                </p>
            </div>
            <button
                onClick={onClear}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
                Clear search
            </button>
        </div>
    );
};
