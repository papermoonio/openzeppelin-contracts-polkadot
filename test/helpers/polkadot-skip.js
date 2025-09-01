// Helper to skip tests that are incompatible with Polkadot
const usePolkaVM = process.env.USE_POLKAVM === "true";

// List of exposed contracts that use unsupported opcodes
const UNSUPPORTED_CONTRACTS = [
  '$EIP7702Utils',
  '$Clones',
  // Add more as needed
];

// Helper function to conditionally skip tests
function skipIfPolkadot(contractName) {
  if (usePolkaVM && UNSUPPORTED_CONTRACTS.includes(contractName)) {
    return describe.skip;
  }
  return describe;
}

// Helper to check if a contract is supported
function isContractSupported(contractName) {
  return !(usePolkaVM && UNSUPPORTED_CONTRACTS.includes(contractName));
}

module.exports = {
  skipIfPolkadot,
  isContractSupported,
  usePolkaVM,
};