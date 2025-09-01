// Polkadot/PolkaVM compatible fixture loader
// Since PolkaVM doesn't support Hardhat Network snapshots,
// we provide a simpler alternative with basic caching

const isPolkaVM = process.env.USE_POLKAVM === 'true';

// Simple cache for fixture results within a test suite
// Use a WeakMap to avoid memory leaks and better scope isolation
const fixtureCache = new Map();

// Clear cache between test suites
beforeEach(function() {
  // Only clear if we're starting a new test suite
  if (this.currentTest?.parent?.title !== this.lastTestSuite) {
    fixtureCache.clear();
    this.lastTestSuite = this.currentTest?.parent?.title;
  }
});

async function loadFixturePolkaVM(fixtureFunction) {
  // For PolkaVM, we execute the fixture fresh each time to avoid state issues
  // This is safer than caching for now
  const result = await fixtureFunction();
  
  // Ensure the result is properly structured
  if (!result || typeof result !== 'object') {
    throw new Error('Fixture function must return an object');
  }
  
  // Validate accounts array
  if (result.accounts && (!Array.isArray(result.accounts) || result.accounts.length === 0)) {
    throw new Error('Fixture accounts must be a non-empty array');
  }
  
  return result;
}

// Export a loadFixture function that automatically chooses the right implementation
async function loadFixture(fixtureFunction) {
  if (isPolkaVM) {
    // Use our simple implementation for PolkaVM
    return await loadFixturePolkaVM(fixtureFunction);
  } else {
    // Use the standard Hardhat implementation for regular networks
    const { loadFixture: hardhatLoadFixture } = require('@nomicfoundation/hardhat-network-helpers');
    return await hardhatLoadFixture(fixtureFunction);
  }
}

module.exports = {
  loadFixture,
};