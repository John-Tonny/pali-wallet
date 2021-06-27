import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction } from '../../scripts/types';

import { SYS_NETWORK } from 'constants/index';
import { getHost } from './../../scripts/Background/helpers';
import IWalletState, {
  IAccountUpdateState,
  IAccountState,
  IAccountUpdateAddress,
  IAccountUpdateXpub
} from './types';

const initialState: IWalletState = {
  status: 0,
  accounts: [],
  activeAccountId: 0,
  activeNetwork: SYS_NETWORK.main.id,
  encriptedMnemonic: null,
  currentSenderURL: '',
  currentURL: '',
  canConnect: false,
  connections: [],
  confirmingTransaction: false,
  creatingAsset: false,
  issuingAsset: false,
  issuingNFT: false,
  updatingAsset: false,
  transferringOwnership: false,
  blockbookURL: '',
  sendingSys: false,
  changingNetwork: false,
};

const WalletState = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearAllTransactions(state: IWalletState) {
      return {
        ...state,
        confirmingTransaction: false,
        creatingAsset: false,
        issuingAsset: false,
        issuingNFT: false,
        updatingAsset: false,
        transferringOwnership: false,
      }
    },
    updateSendingSys(state: IWalletState, action: PayloadAction<boolean>) {
      return {
        ...state,
        sendingSys: action.payload
      }
    },
    updateSwitchNetwork(state: IWalletState, action: PayloadAction<boolean>) {
      return {
        ...state,
        changingNetwork: action.payload
      }
    },
    updateBlockbookURL(state: IWalletState, action: PayloadAction<string>) {
      return {
        ...state,
        blockbookURL: action.payload
      }
    },
    updateCanConfirmTransaction(state: IWalletState, action: PayloadAction<boolean>) {
      return {
        ...state,
        confirmingTransaction: action.payload,
      }
    },
    createAsset(state: IWalletState, action: PayloadAction<boolean>) {
      return {
        ...state,
        creatingAsset: action.payload,
      }
    },
    issueAsset(state: IWalletState, action: PayloadAction<boolean>) {
      return {
        ...state,
        issuingAsset: action.payload,
      }
    },
    issueNFT(state: IWalletState, action: PayloadAction<boolean>) {
      return {
        ...state,
        issuingNFT: action.payload,
      }
    },
    setUpdateAsset(state: IWalletState, action: PayloadAction<boolean>) {
      return {
        ...state,
        updatingAsset: action.payload,
      }
    },
    setTransferOwnership(state: IWalletState, action: PayloadAction<boolean>) {
      return {
        ...state,
        transferringOwnership: action.payload,
      }
    },
    removeConnection(state: IWalletState, action: PayloadAction<any>) {
      console.log('remove connection action payload', action.payload)
      const connectionIndex: number = state.connections.findIndex(connection => connection.url === getHost(action.payload.url));

      if (connectionIndex === -1) {
        return;
      }

      state.connections.splice(connectionIndex, 1);
      let indexof = state.accounts.findIndex((element: IAccountState) => element.id == action.payload.accountId)
      state.accounts[indexof].connectedTo.splice(state.accounts[indexof].connectedTo.indexOf(getHost(action.payload.url)), 1);
    },
    updateConnectionsArray(state: IWalletState, action: PayloadAction<{ accountId: number, url: string }>) {
      console.log('connections array action payload', action.payload)
      const index: number = state.connections.findIndex(connection => connection.accountId !== action.payload.accountId && connection.url === getHost(action.payload.url));
      console.log("index" + index)
      console.log(state.connections[index])
      if (state.connections[index]) {
        state.accounts[state.connections[index].accountId].connectedTo.splice(state.connections.findIndex(url => url == state.connections[index].url), 1);

        state.connections[index] = {
          accountId: action.payload.accountId,
          url: getHost(action.payload.url)
        };
        let indexof = state.accounts.findIndex((element: IAccountState) => element.id == state.connections[index].accountId)
        state.accounts[indexof].connectedTo.push(state.connections[index].url);

        return;
      }

      const alreadyExistsIndex: number = state.connections.findIndex(connection => connection.accountId == action.payload.accountId && connection.url === action.payload.url);

      if (state.connections[alreadyExistsIndex]) {
        state.connections[alreadyExistsIndex] = {
          accountId: action.payload.accountId,
          url: getHost(action.payload.url)
        };

        state.accounts[alreadyExistsIndex].connectedTo[alreadyExistsIndex] = getHost(action.payload.url);

        return;
      }

      state.connections.push({
        accountId: action.payload.accountId,
        url: getHost(action.payload.url)
      });
      let indexof = state.accounts.findIndex((element: IAccountState) => element.id == action.payload.accountId)
      state.accounts[indexof].connectedTo.push(getHost(action.payload.url));
    },
    updateCanConnect(state: IWalletState, action: PayloadAction<boolean>) {
      return {
        ...state,
        canConnect: action.payload,
      }
    },
    updateCurrentURL(state: IWalletState, action: PayloadAction<string>) {
      return {
        ...state,
        currentURL: action.payload,
      }
    },
    setSenderURL(state: IWalletState, action: PayloadAction<string>) {
      return {
        ...state,
        currentSenderURL: action.payload
      }
    },
    setEncriptedMnemonic(state: IWalletState, action: PayloadAction<CryptoJS.lib.CipherParams>) {
      state.encriptedMnemonic = action.payload.toString();
    },
    updateStatus(state: IWalletState) {
      state.status = Date.now();
    },
    createAccount(state: IWalletState, action: PayloadAction<IAccountState>) {
      return {
        ...state,
        accounts: [
          ...state.accounts,
          action.payload
        ]
      };
    },
    removeAccount(state: IWalletState, action: PayloadAction<number>) {
      if (state.accounts.length <= 1) {
        return;
      }

      if (state.activeAccountId === action.payload) {
        state.activeAccountId = state.accounts[0].id;
      }

      state.accounts.splice(action.payload, 1);
      // state.activeAccountId = 0;
    },

    removeAccounts(state: IWalletState) {
      state.accounts = [];
      state.activeAccountId = 0;
    },
    updateAccount(state: IWalletState, action: PayloadAction<IAccountUpdateState>) {
      let indexof = state.accounts.findIndex((element: IAccountState) => element.id == action.payload.id)
      state.accounts[indexof] = {
        ...state.accounts[indexof],
        ...action.payload,
      };
    },
    updateAccountAddress(state: IWalletState, action: PayloadAction<IAccountUpdateAddress>) {
      let indexof = state.accounts.findIndex((element: IAccountState) => element.id == action.payload.id)
      console.log(indexof)
      state.accounts[indexof] = {
        ...state.accounts[indexof],
        ...action.payload,
      };
    },
    updateAccountXpub(state: IWalletState, action: PayloadAction<IAccountUpdateXpub>) {
      state.accounts[action.payload.id] = {
        ...state.accounts[action.payload.id],
        ...action.payload,
      };
    },
    deleteWallet(state: IWalletState) {
      state.accounts = [];
      state.activeAccountId = 0;
      state.encriptedMnemonic = null;
      state.activeNetwork = SYS_NETWORK.main.id;
    },
    changeAccountActiveId(state: IWalletState, action: PayloadAction<number>) {
      state.activeAccountId = action.payload;
    },
    changeActiveNetwork(state: IWalletState, action: PayloadAction<string>) {
      state.activeNetwork = action.payload;
    },
    updateTransactions(
      state: IWalletState,
      action: PayloadAction<{ id: number; txs: Transaction[] }>
    ) {
      let indexof = state.accounts.findIndex((element: IAccountState) => element.id == action.payload.id)
      state.accounts[indexof].transactions = action.payload.txs;
    },
    updateLabel(
      state: IWalletState,
      action: PayloadAction<{ id: number; label: string }>
    ) {
      let indexof = state.accounts.findIndex((element: IAccountState) => element.id == action.payload.id)
      state.accounts[indexof].label = action.payload.label;
    },
  },
});

export const {
  updateStatus,
  createAccount,
  removeAccount,
  removeAccounts,
  deleteWallet,
  changeAccountActiveId,
  changeActiveNetwork,
  updateAccount,
  updateTransactions,
  updateLabel,
  setEncriptedMnemonic,
  updateAccountAddress,
  updateAccountXpub,
  setSenderURL,
  updateCurrentURL,
  updateCanConnect,
  updateConnectionsArray,
  removeConnection,
  updateCanConfirmTransaction,
  createAsset,
  issueAsset,
  issueNFT,
  updateBlockbookURL,
  setUpdateAsset,
  setTransferOwnership,
  updateSendingSys,
  updateSwitchNetwork,
  clearAllTransactions
} = WalletState.actions;

export default WalletState.reducer;
