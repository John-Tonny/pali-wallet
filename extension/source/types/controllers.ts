import { IAccountState } from 'state/wallet/types';

import {
  MintAsset,
  NewAsset,
  NewNFT,
  SendAsset,
  TransferAsset,
  UpdateAsset,
} from './transactions';

export interface IWalletController {
  account: Readonly<IAccountController>;
  addNewAccount: (label?: string) => Promise<string | null>;
  checkPassword: (pwd: string) => boolean;
  createHardwareWallet: () => void;
  createWallet: (isUpdated?: boolean) => void;
  deleteWallet: (pwd: string) => void;
  generatePhrase: () => string | null;
  getNewAddress: () => Promise<boolean>;
  getPhrase: (pwd: string) => string | null;
  importPhrase: (phr: string) => boolean;
  isLocked: () => boolean;
  logOut: () => void;
  setWalletPassword: (pwd: string) => void;
  switchNetwork: (networkId: string) => void;
  switchWallet: (id: number) => void;
  unLock: (pwd: string) => Promise<boolean>;
}

export interface IAccountController {
  clearTemporaryTransaction: (item: string) => void;
  confirmAssetTransfer: (item: TransferAsset) => any;
  confirmCreateNFT: (item: NewNFT) => any;
  confirmMintNFT: (item: any) => any;
  confirmMintSPT: (item: MintAsset) => any;
  confirmSPTCreation: (item: NewAsset) => any;
  confirmSendAssetTransaction: (items: SendAsset) => any;
  confirmTemporaryTransaction: ({
    type: string,
    callback: any,
  }) => Promise<any>;
  confirmUpdateAsset: (item: UpdateAsset) => any;
  connectedAccountXpub: string | null;
  decryptAES: (encryptedString: any, key: string) => any;
  getChangeAddress: () => Promise<string>;
  getConnectedAccount: () => IAccountState;
  getDataAsset: (assetGuid: any) => any;
  getHoldingsData: () => any;
  getLatestUpdate: () => void;
  getPrimaryAccount: (pwd: string, sjs: any) => void;
  getRawTransaction: (txid: string) => any;
  getRecommendFee: () => Promise<number>;
  getSysExplorerSearch: () => string;
  getTemporaryTransaction: (type: string) => any;
  getTransactionInfoByTxId: (txid: any) => any;
  getUserMintedTokens: () => any;
  importPsbt: (psbt: any) => any;
  isValidSYSAddress: (
    address: string,
    network: string,
    verification?: boolean
  ) => boolean | undefined;
  setAutolockTimer: (minutes: number) => any;
  setHDSigner: (accountId: number) => any;
  setNewAddress: (addr: string) => boolean;
  setNewXpub: (id: number, xpub: string, xprv: string, key: string) => boolean;
  signTransaction: (psbt: any, type: boolean) => any;
  subscribeAccount: (
    encriptedPassword: any,
    isHardwareWallet: boolean,
    sjs?: any,
    label?: string,
    walletCreation?: boolean
  ) => Promise<string | null>;
  updateAccountLabel: (id: number, label: string) => void;
  updateNetworkData: ({ id, label, beUrl }: any) => any;
  updateTemporaryTransaction: ({ tx: any, type: string }) => any;
  updateTokensState: () => any;
  updateTxs: () => void;
  watchMemPool: (currentAccount: IAccountState) => void;
}

export interface IConnectionsController {
  connectWallet: () => any;
  getChangeAddress: () => any | null;
  getConnectedAccount: () => any | null;
  getConnectedAccountXpub: () => any | null;
  getDataAsset: (assetGuid: any) => any | null;
  getHoldingsData: () => any | null;
  getUserMintedTokens: () => Promise<any> | null;
  getWalletState: () => any | null;
  handleCreateNFT: (items: NewNFT) => Promise<any> | null;
  handleCreateToken: (items: NewAsset) => Promise<any> | null;
  handleIssueNFT: (amount: number, assetGuid: string) => Promise<any> | null;
  handleIssueSPT: (items: MintAsset) => Promise<any> | null;
  handleSendToken: (items: SendAsset) => Promise<any> | null;
  handleTransferOwnership: (items: TransferAsset) => Promise<any> | null;
  handleUpdateAsset: (items: UpdateAsset) => Promise<any> | null;
  isLocked: () => any;
  isNFT: (guid: number) => boolean | null;
  isValidSYSAddress: (address: string) => any | null;
  onWalletUpdate: (callback: any) => any;
  signAndSend: (psbt: any) => Promise<any> | null;
  signPSBT: (psbtToSign: any) => Promise<any> | null;
}