import { useState, useEffect } from 'react';
import { calculateOutcomeFloat, getPossibleOutcomes } from './utils';
import SkinSearch from './components/SkinSearch';

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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">CS2 Trade-Up Calculator</h1>

        {/* --- SEARCH COMPONENT (Replaces the old Search Bar) --- */}
        <SkinSearch allSkins={allSkins} onAdd={addSkin} />

        {/* INPUT SLOTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {inputs.map((skin, idx) => (
            <div key={idx} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="font-bold truncate">{skin.name}</span>
                <button onClick={() => removeSkin(idx)} className="text-red-400 hover:text-red-300">✕</button>
              </div>
              
              <div className="text-xs text-slate-400">
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
          {Array.from({ length: (inputs.length > 0 && inputs[0].safeRarity === 'Covert' ? 5 : 10) - inputs.length }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-lg p-4 flex items-center justify-center text-slate-500">
              Empty Slot
            </div>
          ))}
        </div>

        {/* RESULTS SECTION */}
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