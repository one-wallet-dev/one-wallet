module.exports = {
  TokenType: {
    0: 'ERC20',
    1: 'ERC721',
    2: 'ERC1155',
    3: 'NONE',
    'ERC20': 0,
    'ERC721': 1,
    'ERC1155': 2,
    'NONE': 3,
  },
  TokenInterfaces: {
    ERC721: '0x80ac58cd',
    ERC1155: '0xd9b67a26',
  },
  OperationType: {
    TRACK: 0,
    UNTRACK: 1,
    TRANSFER_TOKEN: 2,
    OVERRIDE_TRACK: 3,
    TRANSFER: 4,
    SET_RECOVERY_ADDRESS: 5,
    RECOVER: 6,
    DISPLACE: 7,
    FORWARD: 8,
    RECOVER_SELECTED_TOKENS: 9,
    BUY_DOMAIN: 10,
    COMMAND: 11,
    BACKLINK_ADD: 12,
    BACKLINK_DELETE: 13,
    BACKLINK_OVERRIDE: 14,
    RENEW_DOMAIN: 15,
    TRANSFER_DOMAIN: 16,
    RECLAIM_REVERSE_DOMAIN: 17,
    RECLAIM_DOMAIN_FROM_BACKLINK: 18,
    SIGN: 19,
    REVOKE: 20,
    CALL: 21,
    BATCH: 22,
    NOOP: 23,
    CHANGE_SPENDING_LIMIT: 24,
    JUMP_SPENDING_LIMIT: 25,

    0: 'TRACK',
    1: 'UNTRACK',
    2: 'TRANSFER_TOKEN',
    3: 'OVERRIDE_TRACK',
    4: 'TRANSFER',
    5: 'SET_RECOVERY_ADDRESS',
    6: 'RECOVER',
    7: 'DISPLACE',
    8: 'UPGRADE',
    9: 'RECOVER_SELECTED_TOKENS',
    10: 'BUY_DOMAIN',
    11: 'COMMAND',
    12: 'BACKLINK_ADD',
    13: 'BACKLINK_DELETE',
    14: 'BACKLINK_OVERRIDE',
    15: 'RENEW_DOMAIN',
    16: 'TRANSFER_DOMAIN',
    17: 'RECLAIM_REVERSE_DOMAIN',
    18: 'RECLAIM_DOMAIN_FROM_BACKLINK',
    19: 'SIGN',
    20: 'REVOKE',
    21: 'CALL',
    22: 'BATCH',
    23: 'NOOP',
    24: 'CHANGE_SPENDING_LIMIT',
    25: 'JUMP_SPENDING_LIMIT'
  },
  EmptyAddress: '0x0000000000000000000000000000000000000000',
  EmptyBech32Address: 'one1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqquzw7vz',
  TreasuryAddress: '0x7534978F9fa903150eD429C486D1f42B7fDB7a61',
  OldTreasuryAddresses: ['0x02F2cF45DD4bAcbA091D78502Dba3B2F431a54D3'],
  MajorVersion: 15,
  MinorVersion: 1,
  DefaultSpendingInterval: 86400, // 3600 * 24
  Domain: {
    DEFAULT_RENT_DURATION: 31536000, // 365 * 24 * 3600,
    DEFAULT_TLD: 'one',
    DEFAULT_PARENT_LABEL: 'crazy',
    // DEFAULT_PARENT_LABEL_HASH: '0x51b6263929ecb564e08720c5cf4cadf9907935b9d35f951b1b557917272d210f', // keccak256(DEFAULT_PARENT_LABEL)
    DEFAULT_RESOLVER: '0x48D421c223E32B68a8973ef05e1314C97BBbc4bE',
    DEFAULT_REVERSE_RESOLVER: '0x7e1c6695D2563c27E49C4F0adA5F20AA7d978aD8',
    DEFAULT_REVERSE_REGISTRAR: '0xF791552B1B634b2b2ad7C235AF93AEba150F7FFb',
    DEFAULT_SUBDOMAIN_REGISTRAR: '0x43B2b112ef03725B5FD42e3ad9b7f2d857ed4642',
    ADDR_REVERSE_NODE: '0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2'
  },
  NullProof: {
    address: '0x0000000000000000000000000000000000000000', neighbors: [], index: 0, eotp: '0x0000000000000000000000000000000000000000000000000000000000000000',
  },
  get NullOperationParams () {
    return { operationType: this.OperationType.NOOP, tokenType: this.TokenType.NONE, contractAddress: this.EmptyAddress, tokenId: 0, dest: this.EmptyAddress, amount: 0 }
  },
  Sushi: {
    ROUTER: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506',
    FACTORY: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
    WONE: '0xcF664087a5bB0237a0BAd6742852ec6c8d69A27a',
  },

}
