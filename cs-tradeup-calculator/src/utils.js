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

// --- NEW HELPER FUNCTIONS ---

// robustly get a display name for the source
export function getSourceName(skin) {
  // 1. Try Collection (could be array or object)
  if (skin.collections) {
     if (Array.isArray(skin.collections) && skin.collections.length > 0) return skin.collections[0].name;
     if (skin.collections.name) return skin.collections.name;
  }
  // Note: API sometimes uses "collection" (singular) or "collections" (plural) depending on endpoint version
  if (skin.collection) {
     if (typeof skin.collection === 'object') return skin.collection.name;
     return skin.collection;
  }

  // 2. Try Crates (Cases)
  if (skin.crates && Array.isArray(skin.crates) && skin.crates.length > 0) {
    return skin.crates[0].name;
  }

  return "Unknown Source";
}

// robustly get a unique ID for grouping
export function getSourceId(skin) {
  // 1. Try Collection
  if (skin.collections) {
     if (Array.isArray(skin.collections) && skin.collections.length > 0) return skin.collections[0].id;
     if (skin.collections.id) return skin.collections.id;
  }
  if (skin.collection) {
     if (typeof skin.collection === 'object') return skin.collection.id;
     return skin.collection;
  }

  // 2. Try Crates
  if (skin.crates && Array.isArray(skin.crates) && skin.crates.length > 0) {
    return skin.crates[0].id;
  }

  return "unknown_id";
}

// --- MAIN LOGIC ---

export function getPossibleOutcomes(inputs, allSkins) {
  if (inputs.length === 0) return [];

  // 1. Determine Input Rarity & Source ID
  const inputRarity = inputs[0].safeRarity || (typeof inputs[0].rarity === 'object' ? inputs[0].rarity.name : inputs[0].rarity);
  const inputSourceIds = [...new Set(inputs.map(getSourceId))];

  // 2. Determine Next Rarity
  const rarityOrder = ["Consumer Grade", "Industrial Grade", "Mil-Spec Grade", "Restricted", "Classified", "Covert"];
  const currentIdx = rarityOrder.indexOf(inputRarity);
  const nextRarity = rarityOrder[currentIdx + 1]; 

  let possibleOutcomes = [];

  // 3. Find Matching Outcomes
  if (inputRarity === "Covert") {
     // --- COVERT -> GOLD (Knives/Gloves) ---
     possibleOutcomes = allSkins.filter(skin => {
        const skinSourceId = getSourceId(skin);
        const category = skin.category?.name || "";
        
        // Gold check (Knives/Gloves share the same source case)
        const isGold = category === "Knives" || category === "Gloves";
        return inputSourceIds.includes(skinSourceId) && isGold;
     });
  } else {
     // --- STANDARD TRADE UP ---
     possibleOutcomes = allSkins.filter(skin => {
        const skinSourceId = getSourceId(skin);
        const skinRarity = typeof skin.rarity === 'object' ? skin.rarity.name : skin.rarity;
        
        return inputSourceIds.includes(skinSourceId) && skinRarity === nextRarity;
     });
  }

  // 4. Calculate Probabilities
  return possibleOutcomes.map(outSkin => {
    const outSourceId = getSourceId(outSkin);
    
    // Count how many inputs match this outcome's source
    const inputsFromThisSource = inputs.filter(i => getSourceId(i) === outSourceId).length;
    
    // Count how many outcomes exist in this specific source (e.g. 2 pinks in a case)
    const outcomesInThisSource = possibleOutcomes.filter(o => getSourceId(o) === outSourceId).length;
    
    // Probability Formula: (Share of Inputs) / (Possible Outcomes in that Share)
    const chance = outcomesInThisSource > 0 ? (inputsFromThisSource / inputs.length) / outcomesInThisSource : 0;
    const calculatedFloat = calculateOutcomeFloat(inputs, outSkin);

    return {
      ...outSkin,
      chance: chance * 100,
      resultFloat: calculatedFloat,
      sourceName: getSourceName(outSkin) // Add this for UI display
    };
  })
  .filter(o => o.chance > 0) // Remove 0% chance items
  .sort((a, b) => b.chance - a.chance);
}