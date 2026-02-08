// src/components/SkinSearch.jsx
import { useState, useEffect } from 'react';

export default function SkinSearch({ allSkins, onAdd }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  // Filter logic (Runs whenever 'query' changes)
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const filtered = allSkins
      .filter(s => {
        // 1. Basic Name Match
        if (!s.name || !s.name.toLowerCase().includes(query.toLowerCase())) return false;

        // 2. EXCLUDE Knives, Gloves, and Contraband (Cannot be used in Trade Up)
        const cat = s.category?.name || "";
        const rarityName = typeof s.rarity === 'object' ? s.rarity.name : s.rarity;
        
        if (cat === "Knives" || cat === "Gloves") return false;
        if (rarityName === "Contraband") return false;

        return true;
      })
      .slice(0, 10); // Limit to top 10 results

    setResults(filtered);
  }, [query, allSkins]);

  const handleSelect = (skin) => {
    onAdd(skin);   // Send the chosen skin "up" to App.jsx
    setQuery("");  // Clear the search bar
    setResults([]); // Clear the dropdown
  };

  return (
    <div className="relative mb-8 z-50">
      {/* Input Field */}
      <input 
        type="text" 
        className="w-full p-4 bg-slate-800 rounded-lg border border-slate-700 focus:border-blue-500 outline-none placeholder-slate-500 text-white"
        placeholder="Search for a skin (e.g. 'AK-47 | Redline')..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* Dropdown Results */}
      {results.length > 0 && (
        <div className="absolute w-full bg-slate-800 mt-1 rounded-lg shadow-xl border border-slate-700 max-h-60 overflow-y-auto">
          {results.map(skin => {
             // Visual Safety Check for the Badge Color
             const rarityLabel = typeof skin.rarity === 'object' ? skin.rarity.name : skin.rarity;
             
             return (
              <div 
                key={skin.id} 
                className="p-3 hover:bg-slate-700 cursor-pointer flex justify-between items-center text-sm"
                onClick={() => handleSelect(skin)}
              >
                <span className="text-white font-medium">{skin.name}</span>
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

// Helper styling function
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