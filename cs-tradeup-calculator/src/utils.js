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

export function getPossibleOutcomes(inputs, allSkins) {
  if (inputs.length === 0) return [];

  // 1. SAFE EXTRACTION: Get clean strings for comparison
  // The input skin in App.jsx now has a property 'safeRarity' we created.
  const inputRarity = inputs[0].safeRarity || (typeof inputs[0].rarity === 'object' ? inputs[0].rarity.name : inputs[0].rarity);

  // Get list of collection IDs or Names from inputs
  const inputCollections = [...new Set(inputs.map(s => 
    typeof s.collection === 'object' ? s.collection.id : s.collection
  ))];

  const rarityOrder = ["Consumer Grade", "Industrial Grade", "Mil-Spec Grade", "Restricted", "Classified", "Covert"];
  const currentIdx = rarityOrder.indexOf(inputRarity);
  const nextRarity = rarityOrder[currentIdx + 1];

  let possibleOutcomes = [];

  if (inputRarity === "Covert") {
     // Knife/Glove Logic
     possibleOutcomes = allSkins.filter(skin => {
        const colId = typeof skin.collection === 'object' ? skin.collection.id : skin.collection;
        // Simple check: Is it in the same collection?
        // Note: For actual knives, rarity might be "Contraband" or null in some APIs, 
        // but usually they share the collection ID.
        return inputCollections.includes(colId) && (skin.category?.name === "Knives" || skin.category?.name === "Gloves");
     });
  } else {
     // Standard Logic
     possibleOutcomes = allSkins.filter(skin => {
        const skinRarity = typeof skin.rarity === 'object' ? skin.rarity.name : skin.rarity;
        const colId = typeof skin.collection === 'object' ? skin.collection.id : skin.collection;
        
        return inputCollections.includes(colId) && skinRarity === nextRarity;
     });
  }

  // Calculate probabilities
  return possibleOutcomes.map(outSkin => {
    const outColId = typeof outSkin.collection === 'object' ? outSkin.collection.id : outSkin.collection;
    
    // How many inputs are from this specific collection?
    const inputsFromThisCol = inputs.filter(i => {
        const iColId = typeof i.collection === 'object' ? i.collection.id : i.collection;
        return iColId === outColId;
    }).length;

    const outcomesInThisCol = possibleOutcomes.filter(o => {
        const oColId = typeof o.collection === 'object' ? o.collection.id : o.collection;
        return oColId === outColId;
    }).length;
    
    const chance = (inputsFromThisCol / inputs.length) / outcomesInThisCol;
    const calculatedFloat = calculateOutcomeFloat(inputs, outSkin);

    return {
      ...outSkin,
      chance: chance * 100,
      resultFloat: calculatedFloat
    };
  });
}