/// ENVVAR
// - COMPILER:      compiler version (default: 0.8.27)
// - SRC:           contracts folder to compile (default: contracts)
// - RUNS:          number of optimization runs (default: 200)
// - IR:            enable IR compilation (default: false)
// - COVERAGE:      enable coverage report (default: false)
// - GAS:           enable gas report (default: false)
// - COINMARKETCAP: coinmarketcap api key for USD value in gas report
// - CI:            output gas report to file instead of stdout

require('dotenv').config();

// Defensive fix patch: Prevent future plugin conflicts causing undefined/null conversion errors
// Conflicts currently resolved through plugin loading order, but keeping this fix to prevent future plugin ecosystem changes
if (process.env.USE_POLKAVM === "true") {
  require('./polkadot-fix.js');
}

const fs = require('fs');
const path = require('path');

const { argv } = require('yargs/yargs')()
  .env('')
  .options({
    // Compilation settings
    compiler: {
      alias: 'compileVersion',
      type: 'string',
      default: '0.8.27',
    },
    src: {
      alias: 'source',
      type: 'string',
      default: 'contracts',
    },
    runs: {
      alias: 'optimizationRuns',
      type: 'number',
      default: 200,
    },
    ir: {
      alias: 'enableIR',
      type: 'boolean',
      default: false,
    },
    evm: {
      alias: 'evmVersion',
      type: 'string',
      default: 'prague',
    },
    // Extra modules
    coverage: {
      type: 'boolean',
      default: false,
    },
    gas: {
      alias: 'enableGasReport',
      type: 'boolean',
      default: false,
    },
    coinmarketcap: {
      alias: 'coinmarketcapApiKey',
      type: 'string',
    },
  });

  const usePolkaVM = process.env.USE_POLKAVM === "true";

// Validate PolkaVM configuration
if (usePolkaVM) {
  const nodePath = process.env.POLKAVM_NODE_PATH || "../revive-dev-node";
  const adapterPath = process.env.POLKAVM_ADAPTER_PATH || "../eth-rpc";
  console.log(`PolkaVM enabled - Node: ${nodePath}, Adapter: ${adapterPath}`);
}

// Plugin loading order optimization: hardhat-polkadot loaded last to avoid configuration conflicts
// This order ensures hardhat-polkadot can properly handle other plugins' configuration expectations
require('@nomicfoundation/hardhat-chai-matchers');
require('@nomicfoundation/hardhat-ethers');
require('hardhat-exposed');
require('hardhat-gas-reporter');
// require('hardhat-ignore-warnings');
require('hardhat-predeploy');
require('solidity-coverage');
require('solidity-docgen');
// Critical: hardhat-polkadot must be loaded last to properly override and handle configuration conflicts
require('@parity/hardhat-polkadot');

// Custom task file loading: Selectively load to avoid specific conflicts
const hardhatDir = path.join(__dirname, 'hardhat');
const hardhatFiles = fs.readdirSync(hardhatDir);

for (const f of hardhatFiles) {
  // Skip files with known conflicts in PolkaVM mode
  if (usePolkaVM && f === 'common-contracts.js') {
    console.log(`Skipping ${f} in PolkaVM mode to avoid conflicts`);
    continue;
  }
  
  console.log(`Loading hardhat task file: ${f}`);
  require(path.join(hardhatDir, f));
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: argv.compiler,
    settings: {
      optimizer: {
        enabled: true,
        runs: argv.runs,
      },
      evmVersion: argv.evm,
      viaIR: argv.ir,
      outputSelection: { '*': { '*': ['storageLayout'] } },
    },
  },
  resolc: {
    compilerSource: "binary",
    resolcPath: "resolc-0.3.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: argv.runs,

      },
    },
  },
  // warnings: {
  //   'contracts-exposed/**/*': {
  //     'code-size': 'off',
  //     'initcode-size': 'off',
  //   },
  //   '*': {
  //     'unused-param': !argv.coverage, // coverage causes unused-param warnings
  //     'transient-storage': false,
  //     default: 'error',
  //   },
  // },
  networks: {
    hardhat: usePolkaVM
    ? {
        polkavm: true,
        nodeConfig: {
          nodeBinaryPath: process.env.POLKAVM_NODE_PATH || "../revive-dev-node",
          rpcPort: parseInt(process.env.POLKAVM_RPC_PORT) || 8000,
          dev: true,
        },
        adapterConfig: {
          adapterBinaryPath: process.env.POLKAVM_ADAPTER_PATH || "../eth-rpc",
          dev: true,
        },
      }
    : {
      hardfork: argv.evm,
      // Exposed contracts often exceed the maximum contract size. For normal contract,
      // we rely on the `code-size` compiler warning, that will cause a compilation error.
      allowUnlimitedContractSize: true,
      initialBaseFeePerGas: argv.coverage ? 0 : undefined,
      enableRip7212: true,
    },
    local: {
      polkavm: true,
      url: `http://127.0.0.1:8545`,
      accounts: [
        process.env.LOCAL_PRIV_KEY ??
        "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133",
        process.env.AH_PRIV_KEY ?? '',
      ],
    },
  },
  exposed: {
    imports: true,
    initializers: true,
    exclude: [
      'vendor/**/*', 
      '**/*WithInit.sol',
      // Exclude contracts with EXTCODECOPY usage for Polkadot compatibility
      ...(usePolkaVM ? [
        '**/EIP7702Utils.sol',  // Uses account.code directly
        '**/Clones.sol',         // Uses instance.code.length
        // Add more as needed based on compilation errors
      ] : [])
    ],
  },
  gasReporter: {
    enabled: argv.gas,  // PolkaVM mode also supports gas reporting (implemented through plugin order optimization)
    showMethodSig: true,
    includeBytecodeInJSON: true,
    currency: 'USD',
    coinmarketcap: argv.coinmarketcap,
  },
  paths: {
    sources: argv.src,
  },
  docgen: require('./docs/config'),
};
