import React, { useState } from 'react';
import { Search, Globe, MapPin } from 'lucide-react';
import { Language } from '../types';

interface SearchBarProps {
  onSearch: (location: string, lang: Language) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [location, setLocation] = useState('');
  const [lang, setLang] = useState<Language>('English');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim() && !isLoading) {
      onSearch(location, lang);
      setLocation('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-center gap-2 mb-2">
        {(['English', 'Swahili', 'Luganda'] as Language[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              lang === l
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Globe className="w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ask about heavy rain, floods, or any location..."
          className="w-full pl-12 pr-16 py-5 bg-white border-2 border-slate-100 rounded-[2rem] focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none text-lg shadow-xl shadow-slate-200/50 font-medium"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !location.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};
