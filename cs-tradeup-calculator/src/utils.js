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

// Display name for UI
export function getSourceName(skin) {
  if (skin.collections) {
     if (Array.isArray(skin.collections) && skin.collections.length > 0) return skin.collections[0].name;
     if (skin.collections.name) return skin.collections.name;
  }
  if (skin.collection) {
     if (typeof skin.collection === 'object') return skin.collection.name;
     return skin.collection;
  }
  if (skin.crates && Array.isArray(skin.crates) && skin.crates.length > 0) {
    return skin.crates[0].name;
  }
  return "Unknown Source";
}

// Get the SINGLE source ID for an INPUT skin 
// (An input skin physically comes from one specific source context)
export function getInputSourceId(skin) {
  if (skin.collections) {
     if (Array.isArray(skin.collections) && skin.collections.length > 0) return skin.collections[0].id;
     if (skin.collections.id) return skin.collections.id;
  }
  if (skin.collection) {
     if (typeof skin.collection === 'object') return skin.collection.id;
     return skin.collection;
  }
  if (skin.crates && Array.isArray(skin.crates) && skin.crates.length > 0) {
    return skin.crates[0].id;
  }
  return "unknown_id";
}

// Check if an OUTPUT skin belongs to a specific source ID
// (Output skins like Gloves might belong to 5 different cases)
export function doesSkinBelongToSource(skin, sourceId) {
  // Check Collections
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

  // Check Crates (CRITICAL FIX FOR KNIVES/GLOVES)
  if (skin.crates && Array.isArray(skin.crates)) {
     // Check if ANY crate in the list matches the input sourceId
     if (skin.crates.some(c => (c.id || c) === sourceId)) return true;
  }

  return false;
}

// --- MAIN LOGIC ---

export function getPossibleOutcomes(inputs, allSkins) {
  if (inputs.length === 0) return [];

  // 1. Determine Input Rarity & Source ID
  const inputRarity = inputs[0].safeRarity || (typeof inputs[0].rarity === 'object' ? inputs[0].rarity.name : inputs[0].rarity);
  
  // Get all unique source IDs from inputs (usually just 1, but could be mixed)
  const inputSourceIds = [...new Set(inputs.map(getInputSourceId))];

  // 2. Determine Next Rarity
  const rarityOrder = ["Consumer Grade", "Industrial Grade", "Mil-Spec Grade", "Restricted", "Classified", "Covert"];
  const currentIdx = rarityOrder.indexOf(inputRarity);
  const nextRarity = rarityOrder[currentIdx + 1]; 

  let possibleOutcomes = [];

  // 3. Find Matching Outcomes
  if (inputRarity === "Covert") {
     // --- COVERT -> GOLD (Knives/Gloves) ---
     possibleOutcomes = allSkins.filter(skin => {
        const category = skin.category?.name || "";
        const isGold = category === "Knives" || category === "Gloves";
        
        if (!isGold) return false;

        // FIX: Check if skin belongs to ANY of the input sources
        return inputSourceIds.some(sourceId => doesSkinBelongToSource(skin, sourceId));
     });
  } else {
     // --- STANDARD TRADE UP ---
     possibleOutcomes = allSkins.filter(skin => {
        const skinRarity = typeof skin.rarity === 'object' ? skin.rarity.name : skin.rarity;
        
        if (skinRarity !== nextRarity) return false;

        // Check source match
        return inputSourceIds.some(sourceId => doesSkinBelongToSource(skin, sourceId));
     });
  }

  // 4. Calculate Probabilities
  return possibleOutcomes.map(outSkin => {
    // We need to group probabilities by Source.
    // (e.g. if we mixed Revolution and Clutch inputs, we calculate shares relative to those cases)
    
    let totalChance = 0;

    inputSourceIds.forEach(sourceId => {
        // Is this outcome valid for this specific source?
        if (doesSkinBelongToSource(outSkin, sourceId)) {
            const inputsFromThisSource = inputs.filter(i => getInputSourceId(i) === sourceId).length;
            
            // How many possible outcomes exist in THIS source?
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