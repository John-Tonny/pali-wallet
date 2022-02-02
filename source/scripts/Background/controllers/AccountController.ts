import store from 'state/store';
import IWalletState, { IAccountState } from 'state/wallet/types';
import { bech32 } from 'bech32';
import { fromZPub } from 'bip84';
import CryptoJS from 'crypto-js';
import {
  createAccount,
  updateStatus,
  updateAccount,
  updateLabel,
  updateTransactions,
  updateAccountAddress,
  updateAccountXpub,
  updateSwitchNetwork,
  updateAllTokens,
  setTimer,
  updateNetwork,
  setTemporaryTransactionState,
} from 'state/wallet';
import {
  Assets,
  IAccountInfo,
  SendAsset,
  TemporaryTransaction,
  Transaction,
} from 'types/transactions';
import { IAccountController } from 'types/controllers';

import { sortList, isNFT, countDecimals } from './utils';

const syscointx = require('syscointx-js');
const coinSelectSyscoin = require('coinselectsyscoin');
const { each } = require('neo-async');
const sys = require('syscoinjs-lib');

const AccountController = (actions: {
  checkPassword: (pwd: string) => boolean;
}): IAccountController => {
  let intervalId: any;
  let globalAccount: IAccountState | undefined;
  let sysjs: any;
  let resAddress: any;
  let encode: any;
  let TrezorSigner: any;

  type AssetMap = [
    [
      token: any,
      map: {
        changeAddress: string | null;
        outputs: [
          {
            address: string | null;
            value: any;
          }
        ];
      }
    ]
  ];

  const decryptAES = (encryptedString: any, key: string) =>
    CryptoJS.AES.decrypt(encryptedString, key).toString(CryptoJS.enc.Utf8);

  const setAutolockTimer = (minutes: number) => {
    store.dispatch(setTimer(minutes));
  };

  const updateNetworkData = ({ id, label, beUrl }: any) => {
    store.dispatch(
      updateNetwork({
        id,
        label,
        beUrl,
      })
    );
  };

  const temporaryTransaction: TemporaryTransaction = {
    newAsset: null,
    mintAsset: null,
    newNFT: null,
    updateAsset: null,
    transferAsset: null,
    sendAsset: null,
    signPSBT: null,
    signAndSendPSBT: null,
    mintNFT: null,
  };

  const getTemporaryTransaction = (type: string) => temporaryTransaction[type];

  const clearTemporaryTransaction = (item: string) => {
    temporaryTransaction[item] = null;
  };

  const updateTemporaryTransaction = ({ tx, type }) => {
    temporaryTransaction[type] = { ...tx };
  };

  const getConnectedAccount = (): IAccountState => {
    const { accounts, tabs }: IWalletState = store.getState().wallet;
    const { currentURL } = tabs;

    return accounts.find((account: IAccountState) =>
      account.connectedTo.find(
        (url: string) => url === new URL(currentURL).host
      )
    ) as IAccountState;
  };

  const connectedAccountXpub = getConnectedAccount()
    ? getConnectedAccount().xpub
    : null;

  const coventPendingType = (txid: string) =>
    ({
      txid,
      value: 0,
      confirmations: 0,
      fees: 0,
      blockTime: Date.now() / 1e3,
    } as Transaction);

  const updateTransactionData = (txinfo: any) => {
    const transactionItem =
      store.getState().wallet.temporaryTransactionState.type === 'sendAsset';

    let transactions: Transaction[] = [];

    if (transactionItem && globalAccount) {
      transactions = globalAccount?.transactions;
    }

    if (!transactionItem && getConnectedAccount()) {
      transactions = getConnectedAccount().transactions;
    }

    store.dispatch(
      updateTransactions({
        id: transactionItem
          ? Number(globalAccount?.id)
          : Number(getConnectedAccount().id),
        txs: [coventPendingType(txinfo), ...transactions],
      })
    );
  };

  const getTransactionInfoByTxId = (txid: any) =>
    sys.utils.fetchBackendRawTx(sysjs.blockbookURL, txid);

  const getRawTransaction = (txid: any) =>
    sys.utils.fetchBackendRawTx(sysjs.blockbookURL, txid);

  const getDataAsset = (assetGuid: any) =>
    sys.utils.fetchBackendAsset(sysjs.blockbookURL, assetGuid);

  const getSysExplorerSearch = () => sysjs.blockbookURL;

  const updateAccountLabel = (
    id: number,
    label: string,
    isHardwareWallet?: boolean
  ) => {
    if (isHardwareWallet) {
      return;
    }

    store.dispatch(updateLabel({ id, label }));
  };

  const getRecommendFee = async () =>
    (await sys.utils.fetchEstimateFee(sysjs.blockbookURL, 1)) / 10 ** 8;

  const fetchAccountInfo = async (isHardwareWallet?: boolean, xpub?: any) => {
    let response: any = null;
    let address: any = null;

    if (isHardwareWallet) {
      response = await sys.utils.fetchBackendAccount(
        sysjs.blockbookURL,
        xpub,
        'tokens=nonzero&details=txs',
        true
      );

      const account0: any = new fromZPub(
        xpub,
        sysjs.Signer.Signer.pubtypes,
        sysjs.Signer.Signer.networks
      );
      let receivingIndex = -1;

      if (response.tokens) {
        response.tokens.forEach((token: any) => {
          if (token.path) {
            const splitPath = token.path.split('/');

            if (splitPath.length >= 6) {
              const change = parseInt(splitPath[4], 10);
              const index = parseInt(splitPath[5], 10);

              if (change === 1) {
                return;
              }

              if (index > receivingIndex) {
                receivingIndex = index;
              }
            }
          }
        });
      }

      address = account0.getAddress(receivingIndex + 1);

      return {
        address,
        response,
      };
    }

    response = await sys.utils.fetchBackendAccount(
      sysjs.blockbookURL,
      sysjs.Signer.getAccountXpub(),
      'tokens=nonzero&details=txs',
      true
    );

    return {
      address,
      response,
    };
  };

  const getAccountInfo = async (
    isHardwareWallet?: boolean,
    xpub?: any
  ): Promise<IAccountInfo> => {
    const { address, response } = await fetchAccountInfo(
      isHardwareWallet,
      xpub
    );

    const assets: Assets[] = [];
    let transactions: Transaction[] = [];

    if (response.transactions) {
      transactions = response.transactions
        .map(
          ({
            txid,
            value,
            confirmations,
            fees,
            blockTime,
            tokenType,
          }: Transaction) =>
            <Transaction>{
              txid,
              value,
              confirmations,
              fees,
              blockTime,
              tokenType,
            }
        )
        .slice(0, 20);
    }

    if (response.tokensAsset) {
      const transform = response.tokensAsset.reduce(
        (item: any, { type, assetGuid, symbol, balance, decimals }: any) => {
          item[assetGuid] = <Assets>{
            type,
            assetGuid,
            symbol: symbol ? atob(String(symbol)) : '',
            balance:
              (item[assetGuid] ? item[assetGuid].balance : 0) + Number(balance),
            decimals,
          };

          return item;
        },
        {}
      );

      for (const key in transform) {
        assets.push(transform[key]);
      }
    }

    if (address) {
      return {
        balance: response.balance / 1e8,
        assets,
        transactions,
        address,
      };
    }

    return {
      balance: response.balance / 1e8,
      assets,
      transactions,
    };
  };

  const getLatestUpdate = async () => {
    const { activeAccountId, accounts }: IWalletState = store.getState().wallet;

    if (
      !accounts.find((account: IAccountState) => account.id === activeAccountId)
    ) {
      return;
    }

    globalAccount = accounts.find(
      (account: IAccountState) => account.id === activeAccountId
    );

    if (!globalAccount?.isTrezorWallet) {
      sysjs.Signer.setAccountIndex(activeAccountId);

      const accLatestInfo = await getAccountInfo();

      if (!accLatestInfo) return;

      const { balance, transactions, assets } = accLatestInfo;

      store.dispatch(
        updateAccount({
          id: activeAccountId,
          balance,
          transactions,
          assets,
        })
      );

      store.dispatch(updateSwitchNetwork(false));

      return;
    }

    const trezorAccountLatestInfo = await getAccountInfo(
      true,
      globalAccount?.xpub
    );

    if (!trezorAccountLatestInfo) return;

    const trezorData = trezorAccountLatestInfo;

    store.dispatch(
      updateAccount({
        id: activeAccountId,
        balance: trezorData.balance,
        transactions: trezorData.transactions,
        assets: trezorData.assets,
      })
    );

    store.dispatch(updateSwitchNetwork(false));
  };

  const updateTxs = () => {
    if (!globalAccount) {
      return;
    }

    getLatestUpdate();
  };

  const setNewAddress = (addr: string) => {
    const { activeAccountId }: IWalletState = store.getState().wallet;

    store.dispatch(
      updateAccountAddress({
        id: activeAccountId,
        address: { main: addr },
      })
    );

    return true;
  };

  const setNewXpub = (id: number, xpub: string, xprv: string, key: string) => {
    store.dispatch(
      updateAccountXpub({
        id,
        xpub,
        xprv: CryptoJS.AES.encrypt(xprv, String(key)).toString(),
      })
    );

    return true;
  };

  const getPrimaryAccount = (pwd: string, sjs: any) => {
    const { accounts, activeAccountId }: IWalletState = store.getState().wallet;

    if (sjs) {
      sysjs = sjs;
    }

    if (!actions.checkPassword(pwd)) return;

    getLatestUpdate();

    if (!globalAccount && accounts) {
      globalAccount =
        accounts.find(
          (account: IAccountState) => account.id === activeAccountId
        ) || accounts[activeAccountId];

      store.dispatch(updateStatus());
    }
  };

  const watchMemPool = (currentAccount: IAccountState | undefined) => {
    if (intervalId) {
      return true;
    }

    intervalId = setInterval(() => {
      getLatestUpdate();

      const { accounts }: IWalletState = store.getState().wallet;

      const activeAccount = accounts.find(
        (account: IAccountState) => account.id === currentAccount?.id
      );

      if (
        !activeAccount ||
        !activeAccount?.transactions ||
        !activeAccount?.transactions.filter(
          (tx: Transaction) => tx.confirmations > 0
        ).length
      ) {
        clearInterval(intervalId);

        return false;
      }
    }, 30 * 1000);

    return true;
  };

  const getNewChangeAddress = async (fromConnectionsController: boolean) => {
    let userAccount: IAccountState;
    if (fromConnectionsController) {
      userAccount = getConnectedAccount();
    } else {
      const { activeAccountId, accounts }: IWalletState =
        store.getState().wallet;
      userAccount = accounts.find(
        (account: IAccountState) => account.id === activeAccountId
      ) as IAccountState;
    }
    let address = '';

    if (userAccount?.isTrezorWallet) {
      const response = await sys.utils.fetchBackendAccount(
        sysjs.blockbookURL,
        userAccount.xpub,
        'tokens=nonzero&details=txs',
        true
      );

      const TrezorAccount = new fromZPub(
        userAccount.xpub,
        sysjs.Signer.Signer.pubtypes,
        sysjs.Signer.Signer.networks
      );
      let receivingIndex = -1;
      let changeIndex = -1;

      if (response.tokens) {
        response.tokens.forEach((token: any) => {
          if (token.path) {
            const splitPath = token.path.split('/');

            if (splitPath.length >= 6) {
              const change = parseInt(splitPath[4], 10);
              const index = parseInt(splitPath[5], 10);

              if (change === 1) {
                changeIndex = index;

                return;
              }

              if (index > receivingIndex) {
                receivingIndex = index;
              }
            }
          }
        });
      }

      address = TrezorAccount.getAddress(changeIndex + 1, true);

      return address;
    }

    return null;
  };

  const fetchBackendConnectedAccount = async (
    connectedAccount: IAccountState
  ) => {
    const fetchTrezorBackendAccount = await sys.utils.fetchBackendAccount(
      sysjs.blockbookURL,
      globalAccount?.xpub,
      'tokens=nonzero&details=txs',
      true
    );

    const fetchPaliAccount = await sys.utils.fetchBackendAccount(
      sysjs.blockbookURL,
      connectedAccount.xpub,
      'details=txs&assetMask=non-token-transfers',
      true
    );

    return connectedAccount.isTrezorWallet
      ? fetchTrezorBackendAccount
      : fetchPaliAccount;
  };

  const getChangeAddress = async () => {
    const connectedAccount: IAccountState = getConnectedAccount();

    if (!sysjs) {
      console.log('SYSJS not defined');

      return 'Error: wallet is locked, ask client to unlock it to get change address';
    }

    if (connectedAccount.isTrezorWallet) {
      let addr = 'Error: Failed to fetch trezor change address';

      const inter = await getNewChangeAddress(true);

      if (inter !== null) {
        addr = inter;
      }

      return addr;
    }

    return sysjs.Signer.getNewChangeAddress(true);
  };

  const updateTokensState = async () => {
    if (!sysjs) {
      return;
    }

    const { accounts }: IWalletState = store.getState().wallet;

    return Promise.all(
      accounts.map(async (account: IAccountState) => {
        const assetsData: any = {};

        const { tokensAsset } = await sys.utils.fetchBackendAccount(
          sysjs.blockbookURL,
          account.xpub,
          'tokens=derived&details=txs',
          true
        );
        const { transactions } = await fetchBackendConnectedAccount(account);

        const tokensMap: any = {};
        const mintedTokens: any = {};

        if (!tokensAsset) {
          store.dispatch(
            updateAllTokens({
              accountId: account.id,
              accountXpub: account.xpub,
              tokens: tokensMap,
              holdings: sortList(Object.values(assetsData)),
              mintedTokens: sortList(Object.values(mintedTokens)),
            })
          );

          return;
        }

        await new Promise((resolve) => {
          each(
            tokensAsset,
            (
              { balance, symbol, assetGuid, decimals, type }: any,
              done: any
            ) => {
              tokensMap[assetGuid] = {
                balance:
                  Number(
                    tokensMap[assetGuid] ? tokensMap[assetGuid].balance : 0
                  ) + Number(balance),
                type,
                decimals,
                symbol: symbol ? atob(String(symbol)) : '',
                assetGuid,
              };

              done();
            },
            () => {
              resolve('ok');
            }
          );
        });

        try {
          if (transactions) {
            await new Promise((resolve) => {
              each(
                transactions,
                ({ tokenType, tokenTransfers }: any, done: any) => {
                  if (tokenType === 'SPTAssetActivate') {
                    for (const token of tokenTransfers) {
                      try {
                        getDataAsset(token.token).then((assetData: any) => {
                          mintedTokens[token.token] = {
                            assetGuid: token.token,
                            symbol: token.symbol
                              ? atob(String(token.symbol))
                              : '',
                            maxSupply: Number(assetData.maxSupply),
                            totalSupply: Number(assetData.totalSupply),
                          };
                        });
                      } catch (error) {
                        console.log(error);
                      }
                    }
                  }

                  done();
                },
                () => {
                  resolve('ok');
                }
              );
            });
          }

          await Promise.all(
            Object.values(tokensMap).map(async (value) => {
              try {
                const { balance, type, decimals, symbol, assetGuid }: any =
                  value;

                const {
                  pubData,
                  contract,
                  totalSupply,
                  maxSupply,
                  updateCapabilityFlags,
                } = await getDataAsset(assetGuid);

                const { baseAssetID, NFTID } = sys.utils.getAssetIDs(assetGuid);

                const assetData = {
                  contract,
                  totalSupply,
                  maxSupply,
                  updateCapabilityFlags,
                  balance,
                  type,
                  decimals,
                  symbol,
                  assetGuid,
                  baseAssetID,
                  childAssetID: isNFT(assetGuid)
                    ? sys.utils.createAssetID(NFTID, assetGuid)
                    : null,
                  NFTID,
                  description:
                    pubData && pubData.desc ? atob(pubData.desc) : '',
                };

                assetsData[assetData.assetGuid] = assetData;

                return;
              } catch (error) {
                console.log('error minted tokens', error);
              }
            })
          );

          store.dispatch(
            updateAllTokens({
              accountId: account.id,
              accountXpub: account.xpub,
              tokens: tokensMap,
              holdings: sortList(Object.values(assetsData)),
              mintedTokens: sortList(Object.values(mintedTokens)),
            })
          );

          return;
        } catch (error) {
          console.log(error);
        }
      })
    );
  };

  const getHoldingsData = async () => {
    const { walletTokens }: IWalletState = store.getState().wallet;

    if (walletTokens) {
      const connectedAccountId = walletTokens.findIndex(
        (accountTokens: any) =>
          accountTokens.accountId === getConnectedAccount().id
      );

      if (connectedAccountId > -1) {
        return walletTokens[connectedAccountId].holdings;
      }
    }

    return [];
  };

  const getUserMintedTokens = async () => {
    const { walletTokens }: IWalletState = store.getState().wallet;

    if (walletTokens) {
      const connectedAccountId = walletTokens.findIndex(
        (accountTokens: any) =>
          accountTokens.accountId === getConnectedAccount().id
      );

      if (connectedAccountId > -1) {
        return walletTokens[connectedAccountId].mintedTokens;
      }
    }

    return [];
  };

  const signTransaction = async (jsonData: any, sendPSBT: boolean) => {
    const base64 =
      /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/;

    if (!base64.test(jsonData.psbt) || typeof jsonData.assets !== 'string') {
      throw new Error(
        'PSBT must be in Base64 format and assets must be a JSON string. Please check the documentation to see the correct formats.'
      );
    }

    try {
      const response = sys.utils.importPsbtFromJson(jsonData);

      if (!TrezorSigner) {
        TrezorSigner = new sys.utils.TrezorSigner();

        new sys.SyscoinJSLib(TrezorSigner, sysjs.blockbookURL);
      }

      if (sendPSBT) {
        if (getConnectedAccount().isTrezorWallet) {
          return sys.utils.exportPsbtToJson(
            await TrezorSigner.sign(response.psbt)
          );
        }

        return sys.utils.exportPsbtToJson(
          await sysjs.Signer.sign(response.psbt)
        );
      }

      if (getConnectedAccount().isTrezorWallet) {
        return sys.utils.exportPsbtToJson(
          await sysjs.signAndSend(response.psbt, response.assets, TrezorSigner)
        );
      }

      return sys.utils.exportPsbtToJson(
        await sysjs.signAndSend(response.psbt, response.assets)
      );
    } catch (error) {
      throw new Error(String(error));
    }
  };

  const importPsbt = (psbt: any) => {
    try {
      return sys.utils.importPsbtFromJson(psbt);
    } catch (error) {
      return psbt;
    }
  };

  const subscribeAccount = async (
    encriptedPassword: any,
    isHardwareWallet = false,
    sjs?: any,
    label?: string,
    walletCreation?: boolean
  ) => {
    if (isHardwareWallet) {
      if (TrezorSigner === null || TrezorSigner === undefined) {
        TrezorSigner = sjs;
        new sys.SyscoinJSLib(TrezorSigner, sysjs.blockbookURL);
      }
      const { accounts }: IWalletState = store.getState().wallet;
      const trezorID: number = accounts.reduce(
        (currentTrezorID: number, account: IAccountState) => {
          if (account.trezorId) {
            if (currentTrezorID > account.trezorId) {
              return currentTrezorID;
            }

            return account.trezorId;
          }

          return currentTrezorID;
        },
        0
      );

      const trezorinfo: IAccountInfo | null = await getAccountInfo(
        isHardwareWallet,
        sjs.getAccountXpub()
      );

      if (trezorinfo.address) {
        globalAccount = {
          id: 9999 + trezorID,
          label: `Trezor ${trezorID + 1}`,
          balance: trezorinfo.balance / 10 ** 8,
          transactions: trezorinfo.transactions,
          xpub: sjs.getAccountXpub(),
          xprv: '',
          address: { main: trezorinfo.address },
          assets: trezorinfo.assets,
          connectedTo: [],
          isTrezorWallet: true,
          trezorId: trezorID + 1,
        };

        store.dispatch(createAccount(globalAccount));

        return globalAccount?.xpub;
      }

      return null;
    }

    if (sjs) {
      sysjs = sjs;
    }

    if (!walletCreation) {
      await sysjs.Signer.createAccount();
    }

    const res: IAccountInfo | null = await getAccountInfo();

    let mainAddress = '';

    try {
      mainAddress = await sysjs.Signer.getNewReceivingAddress(true);

      console.log('sysjs signer', sysjs.Signer.Signer.blockbookURL);
      console.log('sysjs signer', sysjs.Signer);

      console.log('main address get new receiving address', mainAddress);
    } catch (error: any) {
      console.log('error getting receiving address from sys', error);

      throw new Error(error);
    }

    globalAccount = {
      id:
        sysjs.Signer.Signer.accountIndex === 0
          ? 0
          : sysjs.Signer.Signer.accountIndex,
      label: label || `Account ${sysjs.Signer.Signer.accountIndex + 1}`,
      balance: res.balance,
      transactions: res.transactions,
      xpub: sysjs.Signer.getAccountXpub(),
      xprv: CryptoJS.AES.encrypt(
        sysjs.Signer.Signer.accounts[
          sysjs.Signer.Signer.accountIndex
        ].getAccountPrivateKey(),
        encriptedPassword
      ).toString(),
      address: { main: mainAddress },
      assets: res.assets,
      connectedTo: [],
      isTrezorWallet: false,
    };

    store.dispatch(createAccount(globalAccount));

    return globalAccount?.xpub;
  };

  const isValidSYSAddress = (
    address: string,
    network: string,
    verification = true
  ) => {
    if (!verification) {
      return true;
    }

    if (address && typeof address === 'string') {
      try {
        resAddress = bech32.decode(address);

        if (network === 'main' && resAddress.prefix === 'sys') {
          encode = bech32.encode(resAddress.prefix, resAddress.words);

          return encode === address.toLowerCase();
        }

        if (network === 'testnet' && resAddress.prefix === 'tsys') {
          encode = bech32.encode(resAddress.prefix, resAddress.words);

          return encode === address.toLowerCase();
        }
      } catch (error) {
        return false;
      }
    }

    return false;
  };

  const handleTransactions = async (
    item: any,
    executeTransaction: any,
    condition?: boolean
  ) => {
    if (!sysjs) {
      throw new Error('Error: No signed account exists');
    }

    if (!globalAccount) {
      throw new Error("Error: Can't find active account info");
    }

    if (!item) {
      throw new Error("Error: Can't find item info");
    }

    return new Promise((resolve: any, reject: any) => {
      executeTransaction(item, condition)
        .then((response: any) => {
          resolve(response);
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  };

  const confirmSPTCreation = async (item: any) => {
    const {
      capabilityflags,
      notarydetails,
      auxfeedetails,
      precision,
      symbol,
      description,
      initialSupply,
      maxsupply,
      fee,
      notaryAddress,
      payoutAddress,
      receiver,
    } = item;

    const newMaxSupply = maxsupply * 10 ** precision;

    let assetOpts = {
      precision,
      symbol,
      description,
      maxsupply: new sys.utils.BN(newMaxSupply),
      updatecapabilityflags: capabilityflags ? String(capabilityflags) : '127',
      notarydetails,
      auxfeedetails,
      notarykeyid: Buffer.from('', 'hex'),
    };

    if (notaryAddress) {
      const vNotaryPayment = sys.utils.bitcoinjs.payments.p2wpkh({
        address: notaryAddress,
        network: sysjs.Signer.Signer.network,
      });

      assetOpts = {
        ...assetOpts,
        notarydetails: {
          ...notarydetails,
          endpoint: Buffer.from(
            syscointx.utils.encodeToBase64(notarydetails.endpoint)
          ),
        },
        notarykeyid: Buffer.from(vNotaryPayment.hash.toString('hex'), 'hex'),
      };
    }

    if (notarydetails) {
      assetOpts = {
        ...assetOpts,
        notarydetails,
      };
    }

    if (payoutAddress) {
      const payment = sys.utils.bitcoinjs.payments.p2wpkh({
        address: payoutAddress,
        network: sysjs.Signer.Signer.network,
      });

      const auxFeeKeyID = Buffer.from(payment.hash.toString('hex'), 'hex');

      assetOpts = {
        ...assetOpts,
        auxfeedetails: {
          ...assetOpts.auxfeedetails,
          auxfeekeyid: auxFeeKeyID,
        },
      };
    }

    if (auxfeedetails) {
      assetOpts = {
        ...assetOpts,
        auxfeedetails,
      };
    }

    const txOpts = { rbf: true };

    if (getConnectedAccount().isTrezorWallet) {
      throw new Error("Trezor don't support burning of coins");
    }

    sysjs.Signer.setAccountIndex(getConnectedAccount().id);

    const pendingTx = await sysjs.assetNew(
      assetOpts,
      txOpts,
      await sysjs.Signer.getNewChangeAddress(true),
      receiver,
      new sys.utils.BN(fee * 1e8)
    );

    const txInfoNew = pendingTx.extractTransaction().getId();

    updateTransactionData(txInfoNew);

    const transactionData = await getTransactionInfoByTxId(txInfoNew);
    const assets = syscointx.getAssetsFromTx(pendingTx.extractTransaction());
    const createdAsset = assets.keys().next().value;

    if (initialSupply && initialSupply < newMaxSupply) {
      try {
        return await new Promise((resolve: any, reject: any) => {
          const interval = setInterval(async () => {
            const sptCreated = await getTransactionInfoByTxId(txInfoNew);

            if (sptCreated?.confirmations > 1) {
              console.log('confirmations > 1', createdAsset);
              const changeaddress = await sysjs.Signer.getNewChangeAddress(
                true
              );

              try {
                const assetMap = new Map([
                  [
                    String(createdAsset),
                    {
                      changeAddress: changeaddress,
                      outputs: [
                        {
                          value: new sys.utils.BN(
                            initialSupply * 10 ** precision
                          ),
                          address: receiver,
                        },
                      ],
                    },
                  ],
                ]);

                const pendingAssetSend = await sysjs.assetSend(
                  txOpts,
                  assetMap,
                  receiver,
                  new sys.utils.BN(fee * 1e8)
                );

                if (!pendingAssetSend) {
                  console.log(
                    'Could not create transaction, not enough funds?'
                  );

                  return;
                }

                const txInfo = pendingAssetSend.extractTransaction().getId();

                updateTransactionData(txInfo);

                watchMemPool(getConnectedAccount());

                clearInterval(interval);

                resolve({
                  sptCreated,
                  txid: txInfo,
                  txConfirmations: sptCreated.confirmations,
                  txAssetGuid: createdAsset,
                });
              } catch (error) {
                clearInterval(interval);

                reject(error);
              }
            }
          }, 16000);
        });
      } catch (error: any) {
        console.log(error);

        throw new Error(error);
      }
    }

    return {
      transactionData,
      txid: txInfoNew,
      txConfirmations: transactionData.confirmations,
      txAssetGuid: createdAsset,
    };
  };

  const confirmMintSPT = async (item: any) => {
    const { fee, assetGuid, amount } = item;

    const feeRate = new sys.utils.BN(fee * 1e8);
    const txOpts = { rbf: true };

    let txInfo;

    if (!getConnectedAccount().isTrezorWallet) {
      sysjs.Signer.setAccountIndex(getConnectedAccount().id);
    }

    const { decimals } = await getDataAsset(assetGuid);
    const receivingAddress = await sysjs.Signer.getNewReceivingAddress(true);

    const assetMap = new Map([
      [
        assetGuid,
        {
          changeAddress: getConnectedAccount().isTrezorWallet
            ? await getNewChangeAddress(true)
            : await sysjs.Signer.getNewChangeAddress(true),
          outputs: [
            {
              value: new sys.utils.BN(amount * 10 ** decimals),
              address: receivingAddress,
            },
          ],
        },
      ],
    ]);

    if (getConnectedAccount().isTrezorWallet) {
      const txData = await sysjs.assetSend(
        txOpts,
        assetMap,
        await getNewChangeAddress(true),
        feeRate,
        globalAccount?.xpub
      );

      if (!txData) {
        console.log('Could not create transaction, not enough funds?');

        return;
      }

      if (TrezorSigner === null || TrezorSigner === undefined) {
        TrezorSigner = new sys.utils.TrezorSigner();

        new sys.SyscoinJSLib(TrezorSigner, sysjs.blockbookURL);
      }

      try {
        sysjs
          .signAndSend(txData.psbt, txData.assets, TrezorSigner)
          .then((signTxInfo: string) => {
            updateTransactionData(signTxInfo);

            watchMemPool(getConnectedAccount());

            return { txid: signTxInfo };
          });

        return;
      } catch (error) {
        console.log(`error processing tx: ${error}`);

        return;
      }
    } else {
      const pendingTx = await sysjs.assetSend(
        txOpts,
        assetMap,
        await sysjs.Signer.getNewChangeAddress(true),
        feeRate
      );

      if (!pendingTx) {
        console.log('Could not create transaction, not enough funds?');

        return;
      }

      txInfo = pendingTx.extractTransaction().getId();
    }

    updateTransactionData(txInfo);

    watchMemPool(getConnectedAccount());

    return { txid: txInfo };
  };

  const createParentAsset = async (assetOpts: any, fee: number) => {
    const txOpts: any = { rbf: true };
    const feeRate = new sys.utils.BN(fee * 1e8);

    if (!getConnectedAccount().isTrezorWallet) {
      sysjs.Signer.setAccountIndex(getConnectedAccount().id);
    }

    const assetChangeAddress = await sysjs.Signer.getNewChangeAddress(true);

    const psbt = await sysjs.assetNew(
      assetOpts,
      txOpts,
      assetChangeAddress,
      assetChangeAddress,
      feeRate
    );

    if (!psbt) {
      console.log('Could not create transaction, not enough funds?');

      return;
    }

    const assets = syscointx.getAssetsFromTx(psbt.extractTransaction());
    const txInfo = psbt.extractTransaction().getId();

    return {
      asset_guid: assets.keys().next().value,
      txid: txInfo,
    };
  };

  /**
   * This function executs do multiples transactions in sys
   * blockchain  which must be executed in series
   * WARNING: It might take a few minutes to execute it be carefull
   * when using it
   */

  const confirmCreateNFT = async (item: any) => {
    const { fee, symbol, description, issuer, precision } = item;

    if (getConnectedAccount().isTrezorWallet) {
      throw new Error('trezor does not support nft creation');
    }

    if (!getConnectedAccount().isTrezorWallet) {
      sysjs.Signer.setAccountIndex(getConnectedAccount().id);
    }

    const assetOpts = {
      precision,
      symbol,
      maxsupply: new sys.utils.BN(1 * 10 ** precision),
      description,
    };

    const newParentAsset = await createParentAsset(assetOpts, fee);

    console.log('current parent asset', newParentAsset);

    if (newParentAsset?.asset_guid) {
      let theNFTTx: any = null;
      let parentConfirmed = false;
      let txInfo: any = null;

      try {
        return await new Promise((resolve) => {
          const interval = setInterval(async () => {
            const newParentTx = await getTransactionInfoByTxId(
              newParentAsset.txid
            );
            const feeRate = new sys.utils.BN(fee * 1e8);
            const txOpts = { rbf: true };

            if (newParentTx.confirmations >= 1 && !parentConfirmed) {
              parentConfirmed = true;

              console.log('confirmations parent tx > 1', newParentAsset);

              const assetMap = new Map([
                [
                  newParentAsset?.asset_guid,
                  {
                    changeAddress: null,
                    outputs: [
                      {
                        value: new sys.utils.BN(1 * 10 ** precision),
                        address: issuer,
                      },
                    ],
                  },
                ],
              ]);

              try {
                const pendingTx = await sysjs.assetSend(
                  txOpts,
                  assetMap,
                  null,
                  feeRate
                );

                if (!pendingTx) {
                  console.log(
                    'Could not create transaction, not enough funds?'
                  );

                  return;
                }

                txInfo = pendingTx.extractTransaction().getId();

                updateTransactionData(txInfo);

                theNFTTx = txInfo;
              } catch (error) {
                parentConfirmed = false;

                return error;
              }

              return;
            }

            if (theNFTTx && txInfo) {
              try {
                theNFTTx = await getTransactionInfoByTxId(txInfo);
              } catch (error) {
                console.log(
                  'Transaction still not indexed by explorer:',
                  error
                );

                return;
              }

              if (theNFTTx.confirmations > 1) {
                const newFeeRateForNFT = new sys.utils.BN(10);
                const newTxOptsForNFT = { rbf: true };
                const assetGuid = newParentAsset?.asset_guid;
                const newAssetOptsForNFT = { updatecapabilityflags: '0' };

                const assetMap = new Map([
                  [
                    assetGuid,
                    {
                      changeAddress: null,
                      outputs: [
                        {
                          value: new sys.utils.BN(0),
                          address: issuer,
                        },
                      ],
                    },
                  ],
                ]);

                const psbt = await sysjs.assetUpdate(
                  assetGuid,
                  newAssetOptsForNFT,
                  newTxOptsForNFT,
                  assetMap,
                  issuer,
                  newFeeRateForNFT
                );

                console.log('after update psbt', psbt);

                if (!psbt) {
                  console.log(
                    'Could not create transaction, not enough funds?'
                  );
                }

                clearInterval(interval);

                resolve({ txid: psbt.extractTransaction().getId() });
              }
            }
          }, 16000);
        });
      } catch (error) {
        console.log('error sending child nft to creator', error);
      }
    }
  };

  const confirmMintNFT = async (item: any) => {
    const { fee, amount, assetGuid }: any = item;

    const { decimals } = await getDataAsset(assetGuid);
    const feeRate = new sys.utils.BN(fee * 1e8);
    const txOpts = { rbf: true };

    const assetMap = new Map([
      [
        assetGuid,
        {
          changeAddress: await sysjs.Signer.getNewChangeAddress(true),
          outputs: [
            {
              value: new sys.utils.BN(amount * 10 ** decimals),
              address: await sysjs.Signer.getNewReceivingAddress(true),
            },
          ],
        },
      ],
    ]);

    try {
      if (!getConnectedAccount().isTrezorWallet) {
        sysjs.Signer.setAccountIndex(getConnectedAccount().id);
      }

      const pendingTx = await sysjs.assetSend(
        txOpts,
        assetMap,
        await sysjs.Signer.getNewChangeAddress(true),
        feeRate
      );

      if (!pendingTx) {
        console.log('Could not create transaction, not enough funds?');
      }

      const txInfo = pendingTx.extractTransaction().getId();

      updateTransactionData(txInfo);

      return { txid: txInfo };
    } catch (error) {
      return error;
    }
  };

  const estimateSysTxFee = async (items: any) => {
    const { outputsArray, changeAddress, feeRateBN } = items;

    const txOpts = { rbf: false };

    const utxos = await sys.utils.fetchBackendUTXOS(
      sysjs.blockbookURL,
      globalAccount?.xpub
    );
    const utxosSanitized = sys.utils.sanitizeBlockbookUTXOs(
      null,
      utxos,
      sysjs.network
    );

    // 0 feerate to create tx, then find bytes and multiply feeRate by bytes to get estimated txfee
    const tx = await syscointx.createTransaction(
      txOpts,
      utxosSanitized,
      changeAddress,
      outputsArray,
      new sys.utils.BN(0)
    );
    const bytes = coinSelectSyscoin.utils.transactionBytes(
      tx.inputs,
      tx.outputs
    );
    const txFee = feeRateBN.mul(new sys.utils.BN(bytes));

    return txFee;
  };

  const confirmSendAssetTransaction = async (items: SendAsset) => {
    const { toAddress, amount, fee, token, isToken, rbf } = items;

    const feeRateBN = new sys.utils.BN(fee * 1e8);

    store.dispatch(
      setTemporaryTransactionState({
        executing: true,
        type: 'sendAsset',
      })
    );

    if (isToken && token) {
      let txInfo;
      const { decimals } = await getDataAsset(token);
      const txOpts = { rbf };
      const value = new sys.utils.BN(amount * 10 ** decimals);
      const valueDecimals = countDecimals(amount);
      if (valueDecimals > decimals) {
        throw new Error(
          `This token has ${decimals} decimals and you are trying to send a value with ${valueDecimals} decimals, please check your tx`
        );
      }

      const map: AssetMap = [
        [
          token,
          {
            changeAddress: globalAccount?.isTrezorWallet
              ? await getNewChangeAddress(true)
              : null,
            outputs: [
              {
                value,
                address: toAddress,
              },
            ],
          },
        ],
      ];

      const assetMap = new Map(map);

      if (globalAccount?.isTrezorWallet) {
        const txData = await sysjs.assetAllocationSend(
          txOpts,
          assetMap,
          await getNewChangeAddress(true),
          feeRateBN,
          globalAccount?.xpub
        );

        if (!txData) {
          console.log('Could not create transaction, not enough funds?');
        }
        if (TrezorSigner === null || TrezorSigner === undefined) {
          TrezorSigner = new sys.utils.TrezorSigner();
          new sys.SyscoinJSLib(TrezorSigner, sysjs.blockbookURL);
        }
        try {
          sysjs
            .signAndSend(txData.psbt, txData.assets, TrezorSigner)
            .then(() => {
              const confirmingAccount = store.getState().wallet
                .confirmingTransaction
                ? getConnectedAccount()
                : globalAccount;

              watchMemPool(confirmingAccount);
            });

          updateTransactionData(txInfo);

          clearTemporaryTransaction('sendAsset');

          return;
        } catch (e) {
          return;
        }
      } else {
        const pendingTx = await sysjs.assetAllocationSend(
          txOpts,
          assetMap,
          null,
          feeRateBN
        );

        txInfo = pendingTx.extractTransaction().getId();
      }

      updateTransactionData(txInfo);
    } else {
      const backendAccount = await sys.utils.fetchBackendAccount(
        sysjs.blockbookURL,
        globalAccount?.xpub,
        {},
        true
      );
      const value = new sys.utils.BN(amount * 1e8);

      let outputsArray = [
        {
          address: toAddress,
          value,
        },
      ];

      const txOpts = { rbf: false };

      let txInfo;

      const txFee = await estimateSysTxFee({
        outputsArray,
        changeAddress: await sysjs.Signer.getNewChangeAddress(true),
        feeRateBN,
      });

      if (value.add(txFee).gte(backendAccount.balance)) {
        outputsArray = [
          {
            address: toAddress,
            value: value.sub(txFee),
          },
        ];
      }

      if (globalAccount?.isTrezorWallet) {
        const txData = await sysjs.createTransaction(
          txOpts,
          await getNewChangeAddress(true),
          outputsArray,
          feeRateBN,
          globalAccount?.xpub
        );

        if (!txData) {
          console.log('Could not create transaction, not enough funds?');
        }

        if (TrezorSigner === null || TrezorSigner === undefined) {
          TrezorSigner = new sys.utils.TrezorSigner();
          new sys.SyscoinJSLib(TrezorSigner, sysjs.blockbookURL);
        }

        try {
          sysjs
            .signAndSend(txData.psbt, txData.assets, TrezorSigner)
            .then(() => {
              const sendAssetDeclaration =
                store.getState().wallet.temporaryTransactionState.type ===
                'sendAsset';

              const currentAccount = sendAssetDeclaration
                ? globalAccount
                : getConnectedAccount();

              watchMemPool(currentAccount);
            });

          updateTransactionData(txInfo);

          clearTemporaryTransaction('sendAsset');

          return;
        } catch (e) {
          console.log(`Error processing tx: ${e}`);
          return;
        }
      } else {
        try {
          const pendingTx = await sysjs.createTransaction(
            txOpts,
            await sysjs.Signer.getNewChangeAddress(true),
            outputsArray,
            feeRateBN
          );

          txInfo = pendingTx.extractTransaction().getId();
        } catch (error) {
          throw new Error(String(error));
        }
      }

      updateTransactionData(txInfo);
    }

    const transactionItem =
      store.getState().wallet.temporaryTransactionState.type === 'sendAsset';

    const acc = transactionItem ? globalAccount : getConnectedAccount();

    clearTemporaryTransaction('sendAsset');

    watchMemPool(acc);
  };

  const confirmTemporaryTransaction = ({ type, callback }) =>
    new Promise((resolve, reject) => {
      try {
        const response = handleTransactions(
          getTemporaryTransaction(type),
          callback
        );

        resolve(response);
      } catch (error: any) {
        reject(error);
      }
    });

  const setHDSigner = (accountId: number) => {
    if (!globalAccount?.isTrezorWallet) {
      sysjs.Signer.setAccountIndex(accountId);
    }
  };

  const confirmUpdateAsset = async (item: any) => {
    const {
      fee,
      assetGuid,
      assetWhiteList,
      capabilityflags,
      contract,
      description,
      notarydetails,
      auxfeedetails,
      notaryAddress,
      payoutAddress,
    } = item;

    let txOpts: any = { rbf: true };

    let assetOpts: any = {
      updatecapabilityflags: capabilityflags ? String(capabilityflags) : '127',
      description,
    };

    if (assetWhiteList) {
      txOpts = {
        ...txOpts,
        assetWhiteList,
      };
    }

    if (notarydetails) {
      assetOpts = {
        ...assetOpts,
        notarydetails,
        auxfeedetails,
        notarykeyid: null,
      };
    }

    if (contract) {
      assetOpts = {
        ...assetOpts,
        contract: Buffer.from(contract, 'hex'),
      };
    }

    if (auxfeedetails) {
      const scalarPct = 1000;
      const payment = sys.utils.bitcoinjs.payments.p2wpkh({
        address: payoutAddress,
        network: sysjs.Signer.Signer.network,
      });
      const auxfeekeyid = Buffer.from(payment.hash.toString('hex'), 'hex');

      assetOpts = {
        ...assetOpts,
        auxfeedetails: {
          auxfees: [
            {
              bound: new sys.utils.BN(0),
              percent: 1 * scalarPct,
            },
          ],
          auxfeekeyid,
        },
      };
    }

    if (notaryAddress) {
      const vNotaryPayment = sys.utils.bitcoinjs.payments.p2wpkh({
        address: notaryAddress,
        network: sysjs.Signer.Signer.network,
      });

      assetOpts = {
        ...assetOpts,
        notarykeyid: Buffer.from(vNotaryPayment.hash.toString('hex'), 'hex'),
      };
    }

    console.log('asset opts update asset', assetOpts, assetGuid);

    const thisAssetMap = new Map([
      [
        assetGuid,
        {
          changeAddress: await sysjs.Signer.getNewChangeAddress(true),
          outputs: [
            {
              value: new sys.utils.BN(0),
              address: await sysjs.Signer.getNewReceivingAddress(true),
            },
          ],
        },
      ],
    ]);

    if (!getConnectedAccount().isTrezorWallet) {
      sysjs.Signer.setAccountIndex(getConnectedAccount().id);
    }

    const pendingTx = await sysjs.assetUpdate(
      assetGuid,
      assetOpts,
      txOpts,
      thisAssetMap,
      null,
      new sys.utils.BN(fee * 1e8)
    );

    const txInfo = pendingTx.extractTransaction().getId();

    if (!pendingTx || !txInfo) {
      console.log('Could not create transaction, not enough funds?');

      return;
    }

    updateTransactionData(txInfo);

    watchMemPool(getConnectedAccount());

    return { txid: txInfo };
  };

  const confirmAssetTransfer = async (item: any) => {
    const { fee, assetGuid, newOwner } = item;

    if (!getConnectedAccount().isTrezorWallet) {
      sysjs.Signer.setAccountIndex(getConnectedAccount().id);
    }

    const feeRate = new sys.utils.BN(fee * 1e8);
    const txOpts = { rbf: true };
    const assetOpts = {};

    let txInfo = null;

    const assetMap = new Map([
      [
        assetGuid,
        {
          changeAddress: getConnectedAccount().isTrezorWallet
            ? await getNewChangeAddress(true)
            : await sysjs.Signer.getNewChangeAddress(true),
          outputs: [
            {
              value: new sys.utils.BN(0),
              address: newOwner,
            },
          ],
        },
      ],
    ]);

    if (getConnectedAccount().isTrezorWallet) {
      const txData = await sysjs.assetUpdate(
        assetGuid,
        assetOpts,
        txOpts,
        assetMap,
        await getNewChangeAddress(true),
        feeRate
      );

      if (!txData) {
        console.log('Could not create transaction, not enough funds?');
      }
      if (TrezorSigner === null || TrezorSigner === undefined) {
        TrezorSigner = new sys.utils.TrezorSigner();
        new sys.SyscoinJSLib(TrezorSigner, sysjs.blockbookURL);
      }
      try {
        // TODO: test might have same problem as them mintSPT
        txInfo = await sysjs.signAndSend(
          txData.psbt,
          txData.assets,
          TrezorSigner
        );

        updateTransactionData(txInfo);

        watchMemPool(getConnectedAccount());
      } catch (e) {
        console.log(`Error processing tx: ${e}`);
        return;
      }
      return;
    }

    const pendingTx = await sysjs.assetUpdate(
      assetGuid,
      assetOpts,
      txOpts,
      assetMap,
      null,
      feeRate
    );

    if (!pendingTx) {
      console.log('Could not create transaction, not enough funds?');
    }

    txInfo = pendingTx.extractTransaction().getId();

    updateTransactionData(txInfo);

    watchMemPool(getConnectedAccount());

    return { txid: txInfo };
  };

  return {
    updateNetworkData,
    subscribeAccount,
    getPrimaryAccount,
    updateAccountLabel,
    getLatestUpdate,
    watchMemPool,
    confirmTemporaryTransaction,
    isValidSYSAddress,
    updateTxs,
    getRecommendFee,
    setNewAddress,
    setNewXpub,
    getUserMintedTokens,
    getTransactionInfoByTxId,
    getSysExplorerSearch,
    getHoldingsData,
    getDataAsset,
    clearTemporaryTransaction,
    getConnectedAccount,
    getChangeAddress,
    updateTokensState,
    getRawTransaction,
    setHDSigner,
    importPsbt,
    decryptAES,
    setAutolockTimer,
    updateTemporaryTransaction,
    getTemporaryTransaction,
    confirmSendAssetTransaction,
    confirmSPTCreation,
    confirmMintSPT,
    confirmCreateNFT,
    signTransaction,
    confirmAssetTransfer,
    confirmMintNFT,
    confirmUpdateAsset,
    connectedAccountXpub,
  };
};

export default AccountController;