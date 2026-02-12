import { useState, useEffect } from 'react';
import { getPossibleOutcomes, getRarityClasses } from './utils';
import SkinSearch from './components/SkinSearch';
import InputSlot from './components/InputSlot';

// Use the transparent face for the header
import devAvatar from './assets/my-notion-face-transparent.png'; 

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
    <div className="min-h-screen bg-[#09090b] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Background Mesh Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
      </div>

      {/* --- DISCLAIMER MODAL --- */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md transition-opacity duration-300">
          <div className="bg-[#12141a] border border-slate-800 rounded-2xl max-w-lg w-full p-8 shadow-2xl relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
            
            <button 
              onClick={() => setShowDisclaimer(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Trade-Up Calculator</h2>
            
            <div className="mb-8 text-slate-400 text-sm leading-relaxed space-y-2">
              <p>
                This tool simulates trade-up outcomes based on known CS2 algorithms. 
              </p>
              <p>
                Always verify prices on external markets before committing to a trade-up.
              </p>
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500">
                <p className="font-bold text-xs uppercase tracking-widest mb-1">Disclaimer</p>
                <p>Profitability is not guaranteed. Financial losses are your own responsibility.</p>
              </div>
            </div>

            <button 
              onClick={() => setShowDisclaimer(false)}
              className="w-full bg-slate-100 hover:bg-white text-black font-bold py-3.5 px-6 rounded-xl transition-all transform active:scale-[0.98] shadow-lg"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="relative z-50 border-b border-slate-800/60 bg-[#09090b]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
               {/* Ensure you move the image to public/ folder or import correctly if using Vite assets */}
               <img src={devAvatar} alt="Dev" className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white uppercase tracking-[0.2em]">CS2 Trade-Up</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Calculator Tool</p>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-mono">
             v1.0.0
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto pt-8 pb-20 px-4">
        
        {/* --- SEARCH COMPONENT --- */}
        <div className="mb-8">
            <SkinSearch 
            allSkins={allSkins} 
            onAdd={addSkin} 
            shouldFocus={!showDisclaimer} 
            />
        </div>

        {/* --- INPUT SLOTS GRID --- */}
        <div className={`grid grid-cols-2 ${isCovertMode ? 'md:grid-cols-5' : 'md:grid-cols-5'} gap-4 mb-16`}>
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
              className="group bg-[#12141a]/50 border border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-slate-600 transition-all hover:border-slate-600 hover:bg-[#12141a] min-h-[220px]"
            >
              <div className="h-12 w-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                 <span className="text-2xl opacity-50">+</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">Slot {inputs.length + i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- SECTION 2: RESULTS (Full Width) --- */}
      {inputs.length > 0 && (
        <div className="relative z-10 border-t border-slate-800 bg-[#0c0e12]">
          <div className="max-w-[95%] 2xl:max-w-[1800px] mx-auto py-12">
            
            <div className="flex items-center gap-4 mb-8 px-4">
                <h2 className="text-xl font-bold text-white uppercase tracking-widest">Outcomes</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
                <span className="text-xs text-slate-500 font-mono">{outcomes.length} POSSIBILITIES</span>
            </div>
            
            <div className="px-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {outcomes.map((out, idx) => {
                const rarityName = typeof out.rarity === 'object' ? out.rarity.name : out.rarity;
                const finalRarity = (out.category?.name === "Knives" || out.category?.name === "Gloves") ? "Covert" : rarityName;
                const rarityStyles = getRarityClasses(finalRarity);

                return (
                  <div 
                    key={idx} 
                    className={`
                        ${rarityStyles} 
                        relative group flex flex-col p-0 rounded-xl overflow-hidden
                        border border-slate-800/60 bg-[#12141a] shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300
                    `}
                  >
                    {/* Percentage Badge - Now polished */}
                    <div className="absolute top-3 right-3 z-20">
                        <div className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-slate-200">
                            {out.chance.toFixed(1)}%
                        </div>
                    </div>

                    {/* Image Area */}
                    <div className="h-32 w-full flex items-center justify-center relative p-4 mt-2">
                       <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#12141a]/10" />
                      {out.image ? (
                        <img src={out.image} alt={out.name} className="max-h-full max-w-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <span className="text-slate-600 text-xs">No Image</span>
                      )}
                    </div>

                    {/* Footer Info */}
                    <div className="mt-auto bg-[#09090b]/40 p-3 border-t border-slate-800/50 backdrop-blur-sm">
                      <div className="font-bold text-sm truncate text-slate-200 mb-1" title={out.name}>
                        {out.name}
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-slate-500 mt-2">
                        <span>Float</span>
                        <span className="text-blue-400 font-mono text-xs">{out.resultFloat.toFixed(9)}</span>
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-slate-800/50">
                          <div className="text-[9px] text-slate-600 uppercase tracking-widest truncate">
                            {out.sourceName}
                          </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}