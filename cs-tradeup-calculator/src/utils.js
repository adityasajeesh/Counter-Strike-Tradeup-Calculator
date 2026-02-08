// src/utils.js

// 1. Calculate the Normalized Float (The Math from your image)
export function calculateOutcomeFloat(inputs, outputSkin) {
  let sumNormalized = 0;
  
  inputs.forEach(skin => {
    const range = skin.max_float - skin.min_float;
    // If range is 0 (rare), assume 0 wear
    const normalized = range === 0 ? 0 : (skin.float - skin.min_float) / range;
    sumNormalized += normalized;
  });

  const avgNormalized = sumNormalized / inputs.length;

  // Apply average wear to the output skin's caps
  const outputRange = outputSkin.max_float - outputSkin.min_float;
  const resultFloat = (avgNormalized * outputRange) + outputSkin.min_float;

  // Ensure result never exceeds the skin's hard caps
  return Math.min(Math.max(resultFloat, outputSkin.min_float), outputSkin.max_float);
}

// 2. Logic to find what skins you can get
export function getPossibleOutcomes(inputs, allSkins) {
  if (inputs.length === 0) return [];

  // Get unique collections from inputs
  const inputCollections = [...new Set(inputs.map(s => s.collection))];
  const inputRarity = inputs[0].rarity;
  
  // Determine the next tier rarity
  const rarityOrder = ["Consumer Grade", "Industrial Grade", "Mil-Spec Grade", "Restricted", "Classified", "Covert"];
  const currentIdx = rarityOrder.indexOf(inputRarity);
  const nextRarity = rarityOrder[currentIdx + 1]; // Undefined if input is Covert (Knife/Glove logic handled later)

  let possibleOutcomes = [];

  // SPECIAL CASE: 5 Covert Skins -> Gold (Knives/Gloves)
  if (inputRarity === "Covert") {
     // For Covert tradeups, the output is a "Special Rare" (Gold) from the same case
     // Note: In API data, knives/gloves usually don't have a standard "rarity" field like guns.
     // We filter for matching collection + weapon types that are knives/gloves.
     possibleOutcomes = allSkins.filter(skin => 
        inputCollections.includes(skin.collection) && 
        (skin.category === "Knives" || skin.category === "Gloves" || skin.rarity === "Contraband") // Simplification for API data
     );
  } else {
     // Standard Logic: Next rarity tier in the same collection
     possibleOutcomes = allSkins.filter(skin => 
        inputCollections.includes(skin.collection) && 
        skin.rarity === nextRarity
     );
  }

  // Calculate probabilities
  // Rule: (Inputs from Collection A / Total Inputs) / (Number of outcomes in Collection A)
  return possibleOutcomes.map(outSkin => {
    const inputsFromThisCol = inputs.filter(i => i.collection === outSkin.collection).length;
    const outcomesInThisCol = possibleOutcomes.filter(o => o.collection === outSkin.collection).length;
    
    const chance = (inputsFromThisCol / inputs.length) / outcomesInThisCol;
    const calculatedFloat = calculateOutcomeFloat(inputs, outSkin);

    return {
      ...outSkin,
      chance: chance * 100, // Convert to percentage
      resultFloat: calculatedFloat
    };
  });
}