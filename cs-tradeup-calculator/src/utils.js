// src/utils.js

export function calculateOutcomeFloat(inputs, outputSkin) {
  let sumNormalized = 0;
  
  inputs.forEach(skin => {
    const range = skin.max_float - skin.min_float;
    const normalized = range === 0 ? 0 : (skin.float - skin.min_float) / range;
    sumNormalized += normalized;
  });

  const avgNormalized = sumNormalized / inputs.length;

  const outputRange = outputSkin.max_float - outputSkin.min_float;
  const resultFloat = (avgNormalized * outputRange) + outputSkin.min_float;

  return Math.min(Math.max(resultFloat, outputSkin.min_float), outputSkin.max_float);
}

// --- HELPER FUNCTIONS ---

export function getSourceName(skin) {
  // PRIORITY 1: CRATES (Cases)
  // Most trade-ups happen within a case. If it has a case, that's the name we want.
  if (skin.crates && Array.isArray(skin.crates) && skin.crates.length > 0) {
    return skin.crates[0].name;
  }

  // PRIORITY 2: COLLECTIONS
  // Only use this if there are no crates (e.g., Map Collections like "Dust II")
  if (skin.collections) {
     if (Array.isArray(skin.collections) && skin.collections.length > 0) return skin.collections[0].name;
     if (skin.collections.name) return skin.collections.name;
  }
  if (skin.collection) {
     if (typeof skin.collection === 'object') return skin.collection.name;
     return skin.collection;
  }
  
  return "Unknown Source";
}

export function getInputSourceId(skin) {
  // PRIORITY 1: CRATES (Fixes the Gold/Knife bug)
  if (skin.crates && Array.isArray(skin.crates) && skin.crates.length > 0) {
    return skin.crates[0].id;
  }

  // PRIORITY 2: COLLECTIONS
  if (skin.collections) {
     if (Array.isArray(skin.collections) && skin.collections.length > 0) return skin.collections[0].id;
     if (skin.collections.id) return skin.collections.id;
  }
  if (skin.collection) {
     if (typeof skin.collection === 'object') return skin.collection.id;
     return skin.collection;
  }

  return "unknown_id";
}

export function doesSkinBelongToSource(skin, sourceId) {
  // 1. Check Crates (Primary Check)
  if (skin.crates && Array.isArray(skin.crates)) {
     if (skin.crates.some(c => (c.id || c) === sourceId)) return true;
  }

  // 2. Check Collections (Secondary Check)
  if (skin.collections) {
     if (Array.isArray(skin.collections)) {
        if (skin.collections.some(c => c.id === sourceId)) return true;
     } else if (skin.collections.id === sourceId) {
        return true;
     }
  }
  if (skin.collection) {
     const colId = typeof skin.collection === 'object' ? skin.collection.id : skin.collection;
     if (colId === sourceId) return true;
  }

  return false;
}

// --- VISUAL HELPERS ---

export function getRarityClasses(rarity) {
  const r = rarity?.toLowerCase() || "";

  // Base style for all cards
  const base = "bg-gradient-to-br shadow-lg transition-all duration-300";

  if (r.includes('consumer')) return `${base} from-slate-800 to-slate-700/40 border-slate-600/30 hover:border-slate-500`;
  
  if (r.includes('industrial')) return `${base} from-slate-800 to-sky-900/30 border-sky-500/30 hover:border-sky-400`;
  
  if (r.includes('mil-spec')) return `${base} from-slate-800 to-blue-900/30 border-blue-600/30 hover:border-blue-500`;
  
  if (r.includes('restricted')) return `${base} from-slate-800 to-purple-900/30 border-purple-600/30 hover:border-purple-500`;
  
  if (r.includes('classified')) return `${base} from-slate-800 to-fuchsia-900/30 border-fuchsia-600/30 hover:border-fuchsia-500`;
  
  if (r.includes('covert')) return `${base} from-slate-800 to-red-900/30 border-red-600/30 hover:border-red-500`;
  
  if (r.includes('contraband') || r.includes('gold')) return `${base} from-slate-800 to-yellow-900/30 border-yellow-600/30 hover:border-yellow-500`;

  // Default
  return `${base} from-slate-800 to-slate-800 border-slate-700 hover:border-slate-600`;
}

// --- MAIN LOGIC ---

export function getPossibleOutcomes(inputs, allSkins) {
  if (inputs.length === 0) return [];

  const inputRarity = inputs[0].safeRarity || (typeof inputs[0].rarity === 'object' ? inputs[0].rarity.name : inputs[0].rarity);
  
  // Get Source IDs using the new "Crate First" priority
  const inputSourceIds = [...new Set(inputs.map(getInputSourceId))];

  const rarityOrder = ["Consumer Grade", "Industrial Grade", "Mil-Spec Grade", "Restricted", "Classified", "Covert"];
  const currentIdx = rarityOrder.indexOf(inputRarity);
  const nextRarity = rarityOrder[currentIdx + 1]; 

  let possibleOutcomes = [];

  if (inputRarity === "Covert") {
     // --- COVERT -> GOLD (Knives/Gloves) ---
     possibleOutcomes = allSkins.filter(skin => {
        const category = skin.category?.name || "";
        const isGold = category === "Knives" || category === "Gloves";
        
        if (!isGold) return false;

        // Does this Gold item come from the same Crate as the input?
        return inputSourceIds.some(sourceId => doesSkinBelongToSource(skin, sourceId));
     });
  } else {
     // --- STANDARD TRADE UP ---
     possibleOutcomes = allSkins.filter(skin => {
        const skinRarity = typeof skin.rarity === 'object' ? skin.rarity.name : skin.rarity;
        
        if (skinRarity !== nextRarity) return false;

        return inputSourceIds.some(sourceId => doesSkinBelongToSource(skin, sourceId));
     });
  }

  // 4. Calculate Probabilities
  return possibleOutcomes.map(outSkin => {
    let totalChance = 0;

    inputSourceIds.forEach(sourceId => {
        if (doesSkinBelongToSource(outSkin, sourceId)) {
            const inputsFromThisSource = inputs.filter(i => getInputSourceId(i) === sourceId).length;
            const outcomesInThisSource = possibleOutcomes.filter(o => doesSkinBelongToSource(o, sourceId)).length;
            
            if (outcomesInThisSource > 0) {
                totalChance += (inputsFromThisSource / inputs.length) / outcomesInThisSource;
            }
        }
    });

    const calculatedFloat = calculateOutcomeFloat(inputs, outSkin);

    return {
      ...outSkin,
      chance: totalChance * 100,
      resultFloat: calculatedFloat,
      sourceName: getSourceName(outSkin)
    };
  })
  .filter(o => o.chance > 0)
  .sort((a, b) => b.chance - a.chance);
}