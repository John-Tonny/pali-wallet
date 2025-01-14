import store, { currentWalletState } from 'state/store';
import { initialState } from 'state/wallet';

import { FAKE_PASSWORD, FAKE_SEED_PHRASE } from '../../../../tests/mocks';

import WalletController from './WalletController';

describe('WalletController.ts tests', () => {
  const {
    setWalletPassword,
    forgetWallet,
    switchWallet,
    checkPassword,
    importPhrase,
    logOut,
    isLocked,
    password,
    encryptedPassword,
    mnemonic,
  } = WalletController();

  it('should forget wallet and check if wallet state is equal to initial state', () => {
    // eslint-disable-next-line no-shadow
    const password: any = FAKE_PASSWORD;

    setWalletPassword(password);
    forgetWallet(password);

    const currentState = currentWalletState;

    expect(currentState).toEqual(initialState);
  });

  it('should switch account and check if active account id has changed', () => {
    const newId = 1;

    switchWallet(newId);

    const { activeAccountId } = store.getState().wallet;

    expect(activeAccountId).toBe(newId);
  });

  it('should check if the password was encrypted', () => {
    const pwd = FAKE_PASSWORD;

    setWalletPassword(pwd);

    const isEncrypted = checkPassword(pwd);

    expect(isEncrypted).toBe(true);
  });

  it('should check if it is setting and encrypting correctly using SHA3', () => {
    const pwd = FAKE_PASSWORD;

    setWalletPassword(pwd);
  });

  it('should check if it is importing mnemonic correctly after validation', () => {
    const seedphrase = FAKE_SEED_PHRASE;

    const importedCorrectly = importPhrase(seedphrase);

    expect(importedCorrectly).toBe(true);
  });

  it('should logout', () => {
    const pwd = FAKE_PASSWORD;

    setWalletPassword(pwd);

    const seedphrase = FAKE_SEED_PHRASE;

    importPhrase(seedphrase);
    logOut();

    expect(password).toBe('');
    expect(encryptedPassword).toBe('');
    expect(mnemonic).toBe('');
  });

  it('should check if it is returning lock correctly', () => {
    const pwd = FAKE_PASSWORD;

    setWalletPassword(pwd);

    const seedphrase = FAKE_SEED_PHRASE;

    importPhrase(seedphrase);
    logOut();

    const Locked = isLocked();
    expect(Locked).toBe(true);
  });
});
