// src/components/SkinSearch.jsx
import { useState, useEffect, useRef } from 'react';

export default function SkinSearch({ allSkins, onAdd, shouldFocus }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1); // For keyboard navigation
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // 1. Auto-focus when "shouldFocus" becomes true (Modal closed)
  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [shouldFocus]);

  // 2. Filter logic (Flexible Search)
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setActiveIndex(-1); // Reset selection on new query
      return;
    }

    // Split query into tokens (e.g. "sand p250" -> ["sand", "p250"])
    const tokens = query.toLowerCase().split(" ").filter(t => t.trim() !== "");

    const filtered = allSkins
      .filter(s => {
        // Exclude Knives/Gloves/Contraband
        const cat = s.category?.name || "";
        const rarityName = typeof s.rarity === 'object' ? s.rarity.name : s.rarity;
        
        if (cat === "Knives" || cat === "Gloves") return false;
        if (rarityName === "Contraband") return false;
        if (!s.name) return false;

        const nameLower = s.name.toLowerCase();
        
        // Flexible Match: EVERY token must be present in the name
        // This allows "p250 sand" to match "P250 | Sand Dune"
        return tokens.every(token => nameLower.includes(token));
      })
      .slice(0, 10); // Limit results

    setResults(filtered);
    setActiveIndex(-1); // Reset selection
  }, [query, allSkins]);

  const handleSelect = (skin) => {
    if (!skin) return;
    onAdd(skin);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
    // Keep focus on input for rapid addition
    inputRef.current?.focus();
  };

  // 3. Keyboard Navigation Handler
  const handleKeyDown = (e) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault(); // Prevent cursor moving in input
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex]);
      } else if (results.length > 0) {
        // Optional: Enter on top result if none selected? 
        // Let's strictly require selection or arrow keys for now to avoid accidents.
        // Actually, for "lazier among us", selecting top result on Enter is nice:
        handleSelect(results[0]);
      }
    } else if (e.key === "Escape") {
      setResults([]);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const activeItem = dropdownRef.current.children[activeIndex];
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  return (
    <div className="relative mb-8 z-50">
      <input 
        ref={inputRef}
        type="text" 
        className="w-full p-4 bg-slate-800 rounded-lg border border-slate-700 focus:border-blue-500 outline-none placeholder-slate-500 text-white transition-all shadow-lg"
        placeholder={shouldFocus ? "Search for a skin (e.g. 'sand p250')..." : "Please accept the warning first..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!shouldFocus} // Disable input if modal is open
      />

      {results.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute w-full bg-slate-800 mt-1 rounded-lg shadow-xl border border-slate-700 max-h-80 overflow-y-auto z-50 custom-scrollbar"
        >
          {results.map((skin, idx) => {
             const rarityLabel = typeof skin.rarity === 'object' ? skin.rarity.name : skin.rarity;
             const isActive = idx === activeIndex;

             return (
              <div 
                key={skin.id} 
                className={`
                  p-3 cursor-pointer flex justify-between items-center text-sm border-b border-slate-700/50 last:border-0 transition-colors
                  ${isActive ? 'bg-blue-600' : 'hover:bg-slate-700'}
                `}
                onClick={() => handleSelect(skin)}
                onMouseEnter={() => setActiveIndex(idx)} // Highlight on hover too
              >
                <div className="flex items-center gap-3">
                  {skin.image && (
                    <img src={skin.image} alt="" className="w-8 h-6 object-contain" />
                  )}
                  <span className="text-white font-medium">{skin.name}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getRarityColor(rarityLabel)}`}>
                  {rarityLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getRarityColor(rarity) {
  const r = rarity?.toLowerCase() || "";
  if (r.includes('consumer')) return 'bg-gray-500 text-white';
  if (r.includes('industrial')) return 'bg-blue-300 text-black';
  if (r.includes('mil-spec')) return 'bg-blue-600 text-white';
  if (r.includes('restricted')) return 'bg-purple-600 text-white';
  if (r.includes('classified')) return 'bg-pink-500 text-white';
  if (r.includes('covert')) return 'bg-red-600 text-white';
  return 'bg-gray-600';
}