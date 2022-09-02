export const STORE_PORT = 'SYSCOIN';

export const SYS_NETWORK: {
  [networkId: string]: {
    beUrl: string;
    id: string;
    label: string;
  };
} = {
  main: {
    id: 'main',
    label: 'Mainnet',
    beUrl: 'http://69.234.192.199:9130/',
  },
  testnet: {
    id: 'testnet',
    label: 'Testnet',
    beUrl: 'http://sys-testnet-blockbook/',
  },
};

export const ETH_NETWORK: {
  [networkId: string]: {
    beUrl: string;
    id: string;
    label: string;
  };
} = {
  main: {
    id: 'main',
    label: 'Mainnet',
    beUrl: 'http://eth-mainnet-blockbook/',
  },
  testnet: {
    id: 'testnet',
    label: 'Testnet',
    beUrl: 'http://eth-testnet-blockbook/',
  },
};

export const ASSET_PRICE_API =
  'https://blockbook.elint.services/api/v2/tickers/';
export const SYS_EXPLORER_SEARCH = 'http://69.234.192.199:9130/';

export const PRICE_SYS_ID = 'syscoin';
export const PRICE_BTC_ID = 'bitcoin';
export const PRICE_ETH_ID = 'ethereum';

export const DEFAULT_CURRENCY = {
  id: 'usd',
  symbol: '$',
  name: 'USD',
};
