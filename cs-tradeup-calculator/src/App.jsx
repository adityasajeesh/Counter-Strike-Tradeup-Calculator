// src/App.jsx
import { useState, useEffect } from 'react';
import { getPossibleOutcomes } from './utils';
import SkinSearch from './components/SkinSearch';
import InputSlot from './components/InputSlot';

// Constants
const API_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";

export default function App() {
  const [allSkins, setAllSkins] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

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

  // Add Skin to Inputs
  const addSkin = (skin) => {
    const skinRarity = typeof skin.rarity === 'object' ? skin.rarity.name : skin.rarity;
    
    // Check limit dynamically
    const isCovert = inputs.length > 0 && inputs[0].safeRarity === "Covert";
    const currentLimit = isCovert ? 5 : 10;
    
    if (inputs.length >= currentLimit) return;
    
    // Validate Rarity
    if (inputs.length > 0 && skinRarity !== inputs[0].safeRarity) {
      alert(`Rarity mismatch! You started with ${inputs[0].safeRarity}, you cannot add ${skinRarity}.`);
      return;
    }

    // Default float
    const defaultFloat = (skin.min_float + skin.max_float) / 2;
    
    setInputs([...inputs, { ...skin, float: defaultFloat, safeRarity: skinRarity }]);
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

  const outcomes = getPossibleOutcomes(inputs, allSkins);
  const isCovertMode = inputs.length > 0 && inputs[0].safeRarity === 'Covert';
  const maxSlots = isCovertMode ? 5 : 10;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans relative">
      
      {/* --- DISCLAIMER MODAL --- */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            {/* Close X */}
            <button 
              onClick={() => setShowDisclaimer(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-red-400 mb-2 text-center">DISCLAIMER</h2>
          
            <p className="mb-2">
              This application is solely for calculating potential trade-up floats and outcomes based on the current-known Tradeup Calculation Algorithm.
            </p>
            <p className="mb-2">
              Market prices fluctuate, and trade-ups involve significant risk. Always verify data independently, and from a multitude of sources such as BUFF, CSFloat and Skinport.
            </p>
            <p className="font-bold mb-4 text-yellow-500">
              It is entirely up to the user (you) to verify prices and profitability when trading up items in CS2. The developer bears no responsibility for any financial losses suffered by the user.
            </p>

            <button 
              onClick={() => setShowDisclaimer(false)}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all transform active:scale-95 shadow-lg shadow-green-900/20"
            >
              I Accept
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Counter Strike Trade-Up Calculator</h1>

        {/* --- SEARCH COMPONENT --- */}
        {/* We pass shouldFocus so the search bar knows when the modal is gone */}
        <SkinSearch 
          allSkins={allSkins} 
          onAdd={addSkin} 
          shouldFocus={!showDisclaimer} 
        />

        {/* --- INPUT SLOTS GRID --- */}
        <div className={`grid grid-cols-2 ${isCovertMode ? 'md:grid-cols-5' : 'md:grid-cols-5'} gap-4 mb-12`}>
          {inputs.map((skin, idx) => (
            <InputSlot 
              key={`${skin.id}-${idx}`} 
              index={idx} 
              skin={skin} 
              onRemove={removeSkin} 
              onUpdateFloat={updateFloat} 
            />
          ))}
             
          {Array.from({ length: Math.max(0, maxSlots - inputs.length) }).map((_, i) => (
            <div 
              key={`empty-${i}`} 
              className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 min-h-[160px]"
            >
              <span className="text-2xl mb-2 opacity-50">+</span>
              <span className="text-sm">Empty Slot {inputs.length + i + 1}</span>
            </div>
          ))}
        </div>

{/* --- RESULTS SECTION (UPDATED GRID) --- */}
        {inputs.length > 0 && (
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 mt-8">
            <div className="bg-slate-800 p-4 border-b border-slate-700">
              <h2 className="text-xl font-bold">Possible Outcomes</h2>
            </div>
            
            {/* GRID LAYOUT START */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {outcomes.map((out, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex flex-col items-center text-center relative hover:border-blue-500 transition-all group"
                >
                  {/* Percentage Badge */}
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                    {out.chance.toFixed(1)}%
                  </div>

                  {/* Image */}
                  <div className="h-24 w-full flex items-center justify-center mb-2 bg-slate-900/50 rounded p-2">
                    {out.image ? (
                       <img src={out.image} alt={out.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                       <span className="text-slate-600 text-xs">No Image</span>
                    )}
                  </div>

                  {/* Text Info */}
                  <div className="w-full">
                    <div className="font-bold text-sm truncate mb-1" title={out.name}>
                      {out.name}
                    </div>
                    
                    <div className="text-xs text-slate-400 mb-2">
                      Float: <span className="text-white font-mono">{out.resultFloat.toFixed(9)}</span>
                    </div>

                    <div className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-700/50 truncate">
                      {out.sourceName}
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {outcomes.length === 0 && (
                <div className="col-span-full p-8 text-center text-slate-500">
                  No compatible outcomes found. (Note: Knives/Gloves generally cannot be traded up further).
                </div>
              )}
            </div>
            {/* GRID LAYOUT END */}
          </div>
        )}

      </div>
    </div>
  );
}