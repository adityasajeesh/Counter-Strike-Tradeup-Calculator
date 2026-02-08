import { getSourceName, getRarityClasses } from '../utils'; // Import new helper

export default function InputSlot({ skin, index, onRemove, onUpdateFloat }) {
  // Get dynamic styles
  const rarityName = typeof skin.rarity === 'object' ? skin.rarity.name : skin.rarity;
  const rarityStyles = getRarityClasses(rarityName);

  return (
    // Applied rarityStyles here (replaces "bg-slate-800 ... border-slate-700 ... hover:border-blue-500")
    <div className={`${rarityStyles} p-4 rounded-lg border flex flex-col gap-2 relative group`}>
      
      {/* ... Content remains exactly the same ... */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold truncate text-sm md:text-base" title={skin.name}>
            {skin.name}
          </span>
          <span className="text-xs text-slate-400 truncate">
            {getSourceName(skin)}
          </span>
        </div>
        <button 
          onClick={() => onRemove(index)} 
          className="text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded p-1 transition-colors"
          title="Remove skin"
        >
          ✕
        </button>
      </div>

      {skin.image && (
        <div className="h-24 w-full flex items-center justify-center my-2 bg-slate-900/50 rounded shadow-inner">
          <img src={skin.image} alt={skin.name} className="max-h-full max-w-full object-contain" />
        </div>
      )}

      <div className="mt-auto">
        <div className="flex justify-between text-xs mb-1 text-slate-400">
          <span>Float:</span>
          <span>{skin.min_float} - {skin.max_float}</span>
        </div>
        
        <input
          type="number"
          step="0.0001"
          min={skin.min_float}
          max={skin.max_float}
          value={skin.float}
          onChange={(e) => onUpdateFloat(index, e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-center mb-2 focus:border-blue-500 outline-none"
        />

        <input 
          type="range" 
          min={skin.min_float} 
          max={skin.max_float} 
          step="0.0001"
          value={skin.float}
          onChange={(e) => onUpdateFloat(index, e.target.value)}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>
    </div>
  );
}