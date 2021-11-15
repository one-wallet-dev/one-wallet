const config = require('./config')
const ONEConfig = require('../lib/config/common')
const ONEUtil = require('../lib/util')
const contract = require('@truffle/contract')
const { TruffleProvider } = require('@harmony-js/core')
const { Account } = require('@harmony-js/account')
const WalletGraph = require('../build/contracts/WalletGraph.json')
const CommitManager = require('../build/contracts/CommitManager.json')
const SignatureManager = require('../build/contracts/SignatureManager.json')
const TokenTracker = require('../build/contracts/TokenTracker.json')
const DomainManager = require('../build/contracts/DomainManager.json')
const SpendingManager = require('../build/contracts/SpendingManager.json')
const CoreManager = require('../build/contracts/CoreManager.json')
const Executor = require('../build/contracts/Executor.json')
const ONEWalletFactory = require('../build/contracts/ONEWalletFactory.json')
const ONEWalletFactoryHelper = require('../build/contracts/ONEWalletFactoryHelper.json')
const ONEWalletCodeHelper = require('../build/contracts/ONEWalletCodeHelper.json')
const Reveal = require('../build/contracts/Reveal.json')
const ONEWallet = require('../build/contracts/ONEWallet.json')
const ONEWalletV5 = require('../build/contracts/ONEWalletV5.json')
const ONEWalletV6 = require('../build/contracts/ONEWalletV6.json')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const fs = require('fs/promises')
const path = require('path')
const { pick } = require('lodash')
const { backOff } = require('exponential-backoff')

const baseLibraries = [DomainManager, TokenTracker, WalletGraph, CommitManager, SignatureManager, SpendingManager, Reveal, CoreManager, Executor]
const factoryLibraries = [ONEWalletCodeHelper]
const factoryContracts = { ONEWalletFactory, ONEWalletFactoryHelper }
const libraryList = [...baseLibraries, ...factoryLibraries]
const dependencies = {
  WalletGraph: [DomainManager],
  Reveal: [CommitManager],
  Executor: [WalletGraph, SpendingManager, SignatureManager, TokenTracker, DomainManager],
  ONEWalletCodeHelper: baseLibraries,
  ONEWalletFactoryHelper: [...baseLibraries, ONEWalletCodeHelper],
}

const networks = []
const providers = {}
const contracts = {}
const contractsV5 = {}
const contractsV6 = {}
const factories = {}
const libraries = {}

const knownAddresses = {
  ONEWalletFactory: (network) => ONEConfig.networks[network]?.deploy?.factory,
  ONEWalletFactoryHelper: (network) => ONEConfig.networks[network]?.deploy?.deployer,
  ONEWalletCodeHelper: (network) => ONEConfig.networks[network]?.deploy?.codeHelper,
}

const constructorArguments = {
  ONEWalletFactoryHelper: (network) => [factories[network]['ONEWalletFactory'].address]
}

const ensureDir = async (p) => {
  try {
    await fs.access(p)
  } catch (ex) {
    await fs.mkdir(p, { recursive: true })
  }
}

// including libraries
const initCachedContracts = async () => {
  const p = path.join(config.cache, ONEConfig.lastLibraryUpdateVersion || ONEConfig.version)
  await ensureDir(p)
  for (let network of networks) {
    if (config.networks[network].skip) {
      console.log(`[${network}] Skipped`)
      continue
    }
    libraries[network] = {}
    factories[network] = {}
    for (let lib of [...libraryList, ...Object.values(factoryContracts)]) {
      const libName = lib.contractName
      const f = [libName, network].join('-')
      const fp = path.join(p, f)
      const key = config.networks[network].key
      const account = new Account(key)
      const c = contract(lib)
      c.setProvider(providers[network])
      c.defaults({ from: account.address })
      const expectedHash = ONEUtil.hexString(ONEUtil.keccak(ONEUtil.hexToBytes(lib.bytecode)))
      try {
        if (knownAddresses[libName]) {
          const libAddress = knownAddresses[libName](network)
          if (libAddress) {
            console.log(`[${network}][${libName}] Found contract known address at ${libAddress}`)
            const instance = new c(libAddress)
            if (!factoryContracts[libName]) {
              libraries[network][libName] = instance
            } else {
              factories[network][libName] = instance
            }
            continue
          }
        }
        await fs.access(fp)
        const content = await fs.readFile(fp, { encoding: 'utf-8' })
        const [address, hash] = content.split(',')
        if (hash === expectedHash) {
          console.log(`[${network}][${libName}] Found existing deployed contract at address ${address}`)
          const instance = new c(address)
          if (!factoryContracts[libName]) {
            libraries[network][libName] = instance
          } else {
            factories[network][libName] = instance
          }
          console.log(`[${network}][${libName}] Initialized contract at ${address}`)
          continue
        } else {
          console.log(`[${network}][${libName}] Contract code is changed. Redeploying`)
        }
      } catch {}
      console.log(`[${network}][${libName}] Library address is not cached or is outdated. Deploying new instance`)
      if (dependencies[libName]) {
        for (let dep of dependencies[libName]) {
          console.log(`[${network}][${libName}] Library depends on ${dep.contractName}. Linking...`)
          if (!libraries[network][dep.contractName]) {
            throw new Error(`[${network}][${dep.contractName}] Library is not deployed yet`)
          }
          await c.detectNetwork()
          await c.link(libraries[network][dep.contractName])
        }
      }
      try {
        await backOff(async () => {
          let args = []
          if (constructorArguments[libName]) {
            args = constructorArguments[libName](network)
          }
          const instance = await c.new(...args)
          libraries[network][libName] = instance
          await fs.writeFile(fp, `${instance.address},${expectedHash}`, { encoding: 'utf-8' })
        }, {
          retry: (ex, n) => {
            console.error(`[${network}] Failed to deploy ${libName} (attempted ${n}/10)`)
            console.error(ex)
            return true
          }
        })
      } catch (ex) {
        console.error(`Failed to deploy ${libName} after all attempts. Exiting`)
        process.exit(1)
      }
    }
  }
}

const HarmonyProvider = ({ key, url, chainId, gasLimit, gasPrice }) => {
  const truffleProvider = new TruffleProvider(
    url,
    {},
    { shardID: 0, chainId },
    gasLimit && gasPrice && { gasLimit, gasPrice },
  )
  truffleProvider.addByPrivateKey(key)
  const account = new Account(key)
  truffleProvider.setSigner(account.checksumAddress)
  return truffleProvider
}

const init = () => {
  Object.keys(config.networks).forEach(k => {
    if (config.networks[k].skip) {
      console.log(`[${k}] Skipped initialization`)
      return
    }
    const n = config.networks[k]
    // console.log(n)
    if (n.key) {
      try {
        if (k.startsWith('eth')) {
          providers[k] = new HDWalletProvider({ mnemonic: n.mnemonic, privateKeys: !n.mnemonic && [n.key], providerOrUrl: n.url, sharedNonce: false })
        } else {
          providers[k] = HarmonyProvider({ key: n.key,
            url: n.url,
            chainId: n.chainId,
            gasLimit: config.gasLimit,
            gasPrice: config.gasPrice
          })
          // providers[k] = new HDWalletProvider({ privateKeys: [n.key], providerOrUrl: n.url })
        }
        networks.push(k)
      } catch (ex) {
        console.error(ex)
        console.trace(ex)
      }
    }
  })
  Object.keys(providers).forEach(k => {
    const c = contract(ONEWallet)
    c.setProvider(providers[k])
    const c5 = contract(ONEWalletV5)
    c5.setProvider(providers[k])
    const c6 = contract(ONEWalletV6)
    c6.setProvider(providers[k])
    const key = config.networks[k].key
    const account = new Account(key)
    // console.log(k, account.address, account.bech32Address)
    const params = k.startsWith('eth') ? { from: account.address } : { from: account.address, gas: config.gasLimit, gasPrice: config.gasPrice }
    c.defaults(params)
    c5.defaults(params)
    c6.defaults(params)
    contracts[k] = c
    contractsV5[k] = c5
    contractsV6[k] = c6
  })
  console.log('init complete:', {
    networks,
    providers: JSON.stringify(Object.keys(providers).map(k => pick(providers[k], ['gasLimit', 'gasPrice', 'addresses']))),
    contracts: Object.keys(contracts),
    contractsV5: Object.keys(contractsV5),
    contractsV6: Object.keys(contractsV6),
  })
  initCachedContracts().then(async () => {
    console.log('library initialization complete')
    for (let network in libraries) {
      for (let libraryName in libraries[network]) {
        const n = await contracts[network].detectNetwork()
        try {
          await backOff(() => contracts[network].link(libraries[network][libraryName]), {
            retry: (ex, n) => {
              console.error(`[${network}] Failed to link ${libraryName} (attempted ${n}/10)`)
            }
          })
        } catch (ex) {
          console.error(`Failed to link ${libraryName} after all attempts. Exiting`)
          process.exit(2)
        }

        console.log(`Linked ${network} (${JSON.stringify(n)}) ${libraryName} with ${libraries[network][libraryName].address}`)
      }
    }
    console.log({
      factories,
      libraries,
    })
  })
}

module.exports = {
  init,
  getNetworks: () => networks,
  getProvider: (network) => providers[network],
  getWalletContract: (network, version) => {
    if (!version) {
      return contracts[network]
    }
    if (version === 5) {
      return contractsV5[network]
    }
    if (version === 6) {
      return contractsV6[network]
    }
  },
  getLibraries: (network) => libraries[network],
  getFactory: (network, name) => factories[network][name || 'ONEWalletFactoryHelper'],
}
