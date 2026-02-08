import { useState, useEffect } from 'react';
import { calculateOutcomeFloat, getPossibleOutcomes } from './utils';
import SkinSearch from './components/SkinSearch';
import InputSlot from './components/InputSlot';

// Constants
const API_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";

export default function App() {
  const [allSkins, setAllSkins] = useState([]);
  const [inputs, setInputs] = useState([]);

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
    // SAFE RARITY CHECK
    const skinRarity = typeof skin.rarity === 'object' ? skin.rarity.name : skin.rarity;
    
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
    
    // Save "safeRarity" to the object
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

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">CS2 Trade-Up Calculator</h1>

        {/* --- SEARCH COMPONENT --- */}
        <SkinSearch allSkins={allSkins} onAdd={addSkin} />

        {/* --- INPUT SLOTS GRID --- */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          
          {/* 1. Render Filled Slots */}
          {inputs.map((skin, idx) => (
            <InputSlot 
              key={`${skin.id}-${idx}`} 
              index={idx} 
              skin={skin} 
              onRemove={removeSkin} 
              onUpdateFloat={updateFloat} 
            />
          ))}
             
          {/* 2. Render Empty or Locked Slots */}
          {Array.from({ length: 10 - inputs.length }).map((_, i) => {
            // Calculate the actual index of this empty slot (0-9)
            const realIndex = inputs.length + i;
            
            // Check if this slot should be locked (Index 5-9 are locked if first skin is Covert)
            const isCovertMode = inputs.length > 0 && inputs[0].safeRarity === 'Covert';
            const isLocked = isCovertMode && realIndex >= 5;

            return (
              <div 
                key={`empty-${realIndex}`} 
                className={`
                  border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center transition-all
                  ${isLocked 
                    ? 'border-red-900/30 bg-red-900/10 text-red-900/30 cursor-not-allowed' 
                    : 'border-slate-700 bg-slate-800/50 text-slate-500'
                  }
                `}
              >
                {isLocked ? (
                  <>
                    <span className="text-2xl mb-2">🔒</span>
                    <span className="text-xs font-bold uppercase">Slot Locked</span>
                    <span className="text-[10px]">(Covert limit reached)</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl mb-2 opacity-50">+</span>
                    <span className="text-sm">Empty Slot</span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* ... Results Section remains the same ... */}
        {/* Copy the Results Section from your previous App.jsx here if you didn't paste the whole file */}
        {/* For completeness, here is the Results Section block again: */}
        {inputs.length > 0 && (
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
            <div className="bg-slate-800 p-4 border-b border-slate-700">
              <h2 className="text-xl font-bold">Possible Outcomes</h2>
            </div>
            <div className="divide-y divide-slate-800">
              {outcomes.map((out, idx) => (
                <div key={idx} className="flex items-center p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors">
                  <div className="w-20 font-bold text-xl text-blue-400 text-center mr-4">{out.chance.toFixed(1)}%</div>
                  
                  {out.image && (
                     <img src={out.image} alt={out.name} className="h-12 w-20 object-contain mr-4" />
                  )}

                  <div className="flex-1">
                    <div className="font-bold text-lg">{out.name}</div>
                    <div className="text-sm text-slate-400">
                      Float: <span className="text-white font-mono">{out.resultFloat.toFixed(9)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 px-2 py-1 bg-slate-900 rounded border border-slate-700">
                      {out.collection?.name || out.collection || "Unknown"}
                  </div>
                </div>
              ))}
              {outcomes.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  No compatible outcomes found. Ensure skins are from the same collection or check rarity.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}