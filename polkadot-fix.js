// polkadot-fix.js
// Defensive fix patch: Handle potential compatibility issues in hardhat-polkadot plugin ecosystem
//
// Background:
// hardhat-polkadot plugin may encounter undefined/null configuration objects in complex plugin ecosystems
// causing "Cannot convert undefined or null to object" errors
//
// Current status:
// Main conflicts resolved by optimizing plugin loading order (hardhat-polkadot loaded last)
// 
// Retention reasons:
// 1. Defensive programming: Prevent future plugin version updates or new plugin introductions from reintroducing issues
// 2. Backward compatibility: Ensure stability across various environment configurations
// 3. Ecosystem insurance: Acts as a buffer layer for plugin ecosystem changes

console.log('Applying Polkadot compatibility fix patch (defensive protection)...');

const originalObjectValues = Object.values;
const originalObjectKeys = Object.keys;
const originalObjectAssign = Object.assign;
const originalObjectEntries = Object.entries;

// Override Object.values to safely handle null/undefined
Object.values = function(obj) {
  if (obj === null || obj === undefined) {
    return [];
  }
  return originalObjectValues(obj);
};

// Override Object.keys to safely handle null/undefined
Object.keys = function(obj) {
  if (obj === null || obj === undefined) {
    return [];
  }
  return originalObjectKeys(obj);
};

// Override Object.assign for better null/undefined handling
Object.assign = function(target, ...sources) {
  if (target === null || target === undefined) {
    target = {};
  }
  const safeSources = sources.map(source => {
    if (source === null || source === undefined) {
      return {};
    }
    // Special handling for array case, ensure elements are not null
    if (Array.isArray(source)) {
      return source.filter(item => item !== null && item !== undefined);
    }
    return source;
  });
  
  try {
    return originalObjectAssign(target, ...safeSources);
  } catch (error) {
    console.warn('Object.assign patch caught error:', error.message);
    return target;
  }
};

// Override Object.entries to safely handle null/undefined
Object.entries = function(obj) {
  if (obj === null || obj === undefined) {
    return [];
  }
  return originalObjectEntries(obj);
};

console.log('Applied Object methods patch for hardhat-polkadot-node compatibility');
