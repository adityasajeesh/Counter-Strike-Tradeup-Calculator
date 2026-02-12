import { getSourceName, getRarityClasses } from '../utils';

export default function InputSlot({ skin, index, onRemove, onUpdateFloat }) {
  const rarityName = typeof skin.rarity === 'object' ? skin.rarity.name : skin.rarity;
  const rarityStyles = getRarityClasses(rarityName);

  return (
    <div className={`
      ${rarityStyles} 
      relative group flex flex-col p-0 rounded-xl overflow-hidden
      border border-slate-800/60 bg-[#12141a] shadow-lg hover:shadow-xl hover:border-slate-600/50 hover:-translate-y-1
    `}>
      
      {/* --- TOP BAR: Name & Actions --- */}
      <div className="p-3 flex justify-between items-start bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex flex-col overflow-hidden mr-2">
          <span className="font-bold text-sm truncate text-white leading-tight" title={skin.name}>
            {skin.name}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 truncate mt-1 font-medium">
            {getSourceName(skin)}
          </span>
        </div>
        <button 
          onClick={() => onRemove(index)} 
          className="text-slate-600 hover:text-red-400 transition-colors p-1 -mr-1 -mt-1"
          title="Remove"
        >
          ✕
        </button>
      </div>

      {/* --- IMAGE AREA --- */}
      <div className="h-28 w-full flex items-center justify-center relative p-4 group-hover:scale-105 transition-transform duration-500 ease-out">
        {/* Subtle glow behind image based on rarity */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {skin.image && (
          <img 
            src={skin.image} 
            alt={skin.name} 
            className="max-h-full max-w-full object-contain drop-shadow-2xl z-10" 
          />
        )}
      </div>

      {/* --- CONTROLS AREA (Heavy Footer) --- */}
      <div className="mt-auto bg-[#09090b]/60 p-3 border-t border-slate-800/50 backdrop-blur-sm">
        <div className="flex justify-between items-end mb-2">
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            Float
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.0001"
              min={skin.min_float}
              max={skin.max_float}
              value={skin.float}
              onChange={(e) => onUpdateFloat(index, e.target.value)}
              className="w-20 bg-transparent text-right text-xs font-mono text-blue-400 focus:text-white outline-none border-b border-dashed border-slate-700 focus:border-blue-500 transition-colors py-0.5"
            />
          </div>
        </div>

        {/* Custom Range Slider */}
        <div className="relative h-4 flex items-center">
          <input 
            type="range" 
            min={skin.min_float} 
            max={skin.max_float} 
            step="0.0001"
            value={skin.float}
            onChange={(e) => onUpdateFloat(index, e.target.value)}
            className="slider-thumb-custom w-full"
          />
        </div>
        
        <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
          <span>{skin.min_float}</span>
          <span>{skin.max_float}</span>
        </div>
      </div>
    </div>
  );
}