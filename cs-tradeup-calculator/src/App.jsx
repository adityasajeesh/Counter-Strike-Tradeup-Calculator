import { useState, useEffect } from 'react';
import { calculateOutcomeFloat, getPossibleOutcomes } from './utils';

// Constants
const API_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";

export default function App() {
  const [allSkins, setAllSkins] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Fetch Data on Load
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllSkins(data);
        } else {
          console.error("API did not return an array:", data);
        }
      })
      .catch(err => console.error("Fetch error:", err));
  }, []);

  // Search Logic
  useEffect(() => {
    if (searchQuery.length < 2) { // Changed to 2 for faster feedback
      setSearchResults([]);
      return;
    }
    
    // SAFE SEARCH: Checks if name exists before converting to lower case
    const results = allSkins
      .filter(s => s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 10);
      
    setSearchResults(results);
  }, [searchQuery, allSkins]);

  // Add Skin to Inputs
  const addSkin = (skin) => {
    // SAFE RARITY CHECK: Handle if rarity is an object or string
    const skinRarity = typeof skin.rarity === 'object' ? skin.rarity.name : skin.rarity;
    
    const isCovert = inputs.length > 0 && inputs[0].safeRarity === "Covert";
    const currentLimit = isCovert ? 5 : 10;
    
    if (inputs.length >= currentLimit) return;
    
    // Validate Rarity (Must match existing inputs)
    if (inputs.length > 0 && skinRarity !== inputs[0].safeRarity) {
      alert(`Rarity mismatch! You started with ${inputs[0].safeRarity}, you cannot add ${skinRarity}.`);
      return;
    }

    // Default float
    const defaultFloat = (skin.min_float + skin.max_float) / 2;
    
    // We save "safeRarity" to the object so we don't have to check type again
    setInputs([...inputs, { ...skin, float: defaultFloat, safeRarity: skinRarity }]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const updateFloat = (index, newFloat) => {
    const newInputs = [...inputs];
    newInputs[index].float = parseFloat(newFloat);
    setInputs(newInputs);
  };

  const removeSkin = (index) => {
    const newInputs = inputs.filter((_, i) => i !== index);
    setInputs(newInputs);
  };

  // Run outcomes logic (Pass safeRarity to utils if needed, or modify utils)
  // For now, let's assume utils needs the raw skin object, but we need to be careful inside utils too.
  // Actually, we should map inputs to ensure utils gets clean data.
  const outcomes = getPossibleOutcomes(inputs, allSkins);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">CS2 Trade-Up Calculator</h1>

        {/* SEARCH BAR */}
        <div className="relative mb-8 z-50">
          <input 
            type="text" 
            className="w-full p-4 bg-slate-800 rounded-lg border border-slate-700 focus:border-blue-500 outline-none"
            placeholder="Search for a skin (e.g. 'AK-47 | Redline')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="absolute w-full bg-slate-800 mt-1 rounded-lg shadow-xl border border-slate-700 max-h-60 overflow-y-auto">
              {searchResults.map(skin => {
                // RENDER SAFETY: Check if rarity is object or string
                const rarityLabel = typeof skin.rarity === 'object' ? skin.rarity.name : skin.rarity;
                
                return (
                  <div 
                    key={skin.id} 
                    className="p-3 hover:bg-slate-700 cursor-pointer flex justify-between items-center"
                    onClick={() => addSkin(skin)}
                  >
                    <span>{skin.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${getRarityColor(rarityLabel)}`}>
                      {rarityLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* INPUT SLOTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {inputs.map((skin, idx) => (
            <div key={idx} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="font-bold truncate">{skin.name}</span>
                <button onClick={() => removeSkin(idx)} className="text-red-400 hover:text-red-300">✕</button>
              </div>
              
              <div className="text-xs text-slate-400">
                {/* SAFETY: Collection might be object or string */}
                Collection: {skin.collection?.name || skin.collection || "Unknown"}
              </div>

              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Float: {skin.float.toFixed(4)}</span>
                  <span className="text-slate-500">{skin.min_float} - {skin.max_float}</span>
                </div>
                <input 
                  type="range" 
                  min={skin.min_float} 
                  max={skin.max_float} 
                  step="0.0001"
                  value={skin.float}
                  onChange={(e) => updateFloat(idx, e.target.value)}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          ))}
             
          {/* Empty Slots */}
          {/* Fix: Check inputs[0] existence safely */}
          {Array.from({ length: (inputs.length > 0 && inputs[0].safeRarity === 'Covert' ? 5 : 10) - inputs.length }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-lg p-4 flex items-center justify-center text-slate-500">
              Empty Slot
            </div>
          ))}
        </div>

        {/* RESULTS */}
        {inputs.length > 0 && (
          <div className="bg-slate-900 rounded-xl overflow-hidden">
            <h2 className="text-xl font-bold mb-4">Possible Outcomes</h2>
            <div className="grid grid-cols-1 gap-2">
              {outcomes.map((out, idx) => (
                <div key={idx} className="flex items-center p-3 bg-slate-800 rounded border-l-4 border-blue-500">
                  <div className="w-16 font-bold text-lg text-center">{out.chance.toFixed(1)}%</div>
                  <div className="flex-1 px-4">
                    <div className="font-bold">{out.name}</div>
                    <div className="text-sm text-slate-400">Float: <span className="text-white">{out.resultFloat.toFixed(9)}</span></div>
                  </div>
                  <div className="text-xs text-slate-500">
                      {out.collection?.name || out.collection || "Unknown"}
                  </div>
                </div>
              ))}
              {outcomes.length === 0 && <p className="text-slate-500">No compatible outcomes found. (Check Rarity/Collection)</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getRarityColor(rarity) {
  // Normalize string just in case
  const r = rarity?.toLowerCase() || "";
  if (r.includes('consumer')) return 'bg-gray-500 text-white';
  if (r.includes('industrial')) return 'bg-blue-300 text-black';
  if (r.includes('mil-spec')) return 'bg-blue-600 text-white';
  if (r.includes('restricted')) return 'bg-purple-600 text-white';
  if (r.includes('classified')) return 'bg-pink-500 text-white';
  if (r.includes('covert')) return 'bg-red-600 text-white';
  return 'bg-gray-600';
}