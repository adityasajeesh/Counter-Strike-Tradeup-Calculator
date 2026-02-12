// src/components/SkinSearch.jsx
import { useState, useEffect, useRef } from 'react';

export default function SkinSearch({ allSkins, onAdd, shouldFocus }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false); // New control for visibility
  
  const inputRef = useRef(null);
  const containerRef = useRef(null); // To detect clicks outside

  // 1. Auto-focus
  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [shouldFocus]);

  // 2. Click Outside Listener (Closes dropdown but keeps text)
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Filter logic
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      setActiveIndex(-1);
      return;
    }

    const tokens = query.toLowerCase().split(" ").filter(t => t.trim() !== "");

    const filtered = allSkins
      .filter(s => {
        const cat = s.category?.name || "";
        const rarityName = typeof s.rarity === 'object' ? s.rarity.name : s.rarity;
        
        if (cat === "Knives" || cat === "Gloves") return false;
        if (rarityName === "Contraband") return false;
        if (!s.name) return false;

        const nameLower = s.name.toLowerCase();
        return tokens.every(token => nameLower.includes(token));
      })
      .slice(0, 10);

    setResults(filtered);
    setShowDropdown(true); // Always show if we have results
    
    // Only reset index if the query changed significantly enough to alter results
    // (Simple approach: reset on every query change)
    setActiveIndex(-1);
  }, [query, allSkins]);

  const handleSelect = (skin) => {
    if (!skin) return;
    onAdd(skin);
    
    // --- CRITICAL UX FIX ---
    // We DO NOT clear query or results here anymore.
    // This allows rapid-fire selection of the same skin.
    
    // Ensure input stays focused for keyboard spamming
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex]);
      } else if (results.length > 0) {
        // Default to first item if none selected
        handleSelect(results[0]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false); // Just close dropdown, keep text
    }
  };

  // Scroll active item into view
  const dropdownListRef = useRef(null);
  useEffect(() => {
    if (activeIndex >= 0 && dropdownListRef.current) {
      const activeItem = dropdownListRef.current.children[activeIndex];
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  return (
    <div className="relative mb-8 z-50" ref={containerRef}>
      
      {/* Input Wrapper */}
      <div className="relative">
        <input 
            ref={inputRef}
            type="text" 
            className="w-full p-4 bg-[#12141a] rounded-xl border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-slate-600 text-white transition-all shadow-lg text-sm font-medium tracking-wide"
            placeholder={shouldFocus ? "Search for a skin (e.g. 'M4A4 Tooth Fairy', 'Sand Dune P250')..." : "Please accept the warning first..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if(results.length > 0) setShowDropdown(true); }}
            onKeyDown={handleKeyDown}
            disabled={!shouldFocus}
        />
        
        {/* Clear Button (Only shows when there is text) */}
        {query.length > 0 && (
            <button 
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-2"
                title="Clear search"
            >
                ✕
            </button>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div 
          ref={dropdownListRef}
          className="absolute w-full bg-[#12141a] mt-2 rounded-xl shadow-2xl border border-slate-800 max-h-80 overflow-y-auto z-50 custom-scrollbar"
        >
          {results.map((skin, idx) => {
             const rarityLabel = typeof skin.rarity === 'object' ? skin.rarity.name : skin.rarity;
             const isActive = idx === activeIndex;

             return (
              <div 
                key={skin.id} 
                className={`
                  p-3 cursor-pointer flex justify-between items-center text-sm border-b border-slate-800/50 last:border-0 transition-colors
                  ${isActive ? 'bg-blue-600/20 border-l-4 border-l-blue-500 pl-2' : 'hover:bg-slate-800/50 border-l-4 border-l-transparent'}
                `}
                onClick={() => handleSelect(skin)}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-8 flex items-center justify-center bg-slate-900/50 rounded p-1">
                      {skin.image ? (
                        <img src={skin.image} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-700" />
                      )}
                  </div>
                  <span className="text-slate-200 font-bold text-xs uppercase tracking-wider">{skin.name}</span>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${getRarityColor(rarityLabel)}`}>
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
  if (r.includes('consumer')) return 'bg-gray-500/20 text-gray-300';
  if (r.includes('industrial')) return 'bg-blue-300/20 text-blue-200';
  if (r.includes('mil-spec')) return 'bg-blue-600/20 text-blue-400';
  if (r.includes('restricted')) return 'bg-purple-600/20 text-purple-300';
  if (r.includes('classified')) return 'bg-pink-500/20 text-pink-400';
  if (r.includes('covert')) return 'bg-red-600/20 text-red-400';
  return 'bg-slate-800 text-slate-500';
}