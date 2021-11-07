import React, { FC, useEffect, useState } from 'react';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import IconButton from '@material-ui/core/IconButton';
import Settings from 'containers/auth/Settings';
import Select from 'components/Select';
import { SYS_NETWORK } from 'constants/index';
import { RootState } from 'state/store';
import { useSelector } from 'react-redux';
import Modal from 'components/Modal';
import { getHost } from '../../../scripts/Background/helpers';
import IWalletState from 'state/wallet/types';
import { browser } from 'webextension-polyfill-ts';
import { useController } from 'hooks/index';

const NormalHeader: FC<any> = ({
  encriptedMnemonic,
  importSeed,
  showed,
  showSettings,
  isUnlocked,
  handleChangeNetwork,
  handleCloseSettings,
}) => {
  const controller = useController();

  const {
    accounts,
    activeAccountId,
    tabs,
    changingNetwork,
    activeNetwork,
  }: IWalletState = useSelector((state: RootState) => state.wallet);
  const { currentURL } = tabs;

  const [currentTabURL, setCurrentTabURL] = useState<string>(currentURL);
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const network = useSelector(
    (state: RootState) => state.wallet!.activeNetwork
  );

  const handleSetModalIsOpen = () => {
    setIsOpenModal(!isOpenModal);
  };

  useEffect(() => {
    browser.windows.getAll({ populate: true }).then((windows) => {
      for (const window of windows) {
        const views = browser.extension.getViews({ windowId: window.id });

        if (views) {
          browser.tabs
            .query({ active: true, currentWindow: true })
            .then((tabs) => {
              setCurrentTabURL(String(tabs[0].url));
            });

          return;
        }
      }
    });
  }, [!controller.wallet.isLocked()]);

  useEffect(() => {
    const acc = accounts.find((element) => element.id === activeAccountId);

    if (acc && acc.connectedTo !== undefined) {
      if (acc.connectedTo.length > 0) {
        setIsConnected(
          acc.connectedTo.findIndex((url: any) => {
            return url == getHost(currentTabURL);
          }) > -1
        );
        return;
      }

      setIsConnected(false);
    }
  }, [accounts, activeAccountId, currentTabURL]);

  return (
    <div className="flex justify-between items-center bg-brand-gray200">
      <Select
        value={network || SYS_NETWORK.main.id}
        className=""
        onChange={handleChangeNetwork}
        options={[
          { [SYS_NETWORK.main.id]: SYS_NETWORK.main.label },
          { [SYS_NETWORK.testnet.id]: SYS_NETWORK.testnet.label },
        ]}
      />

      {isOpenModal && (
        <div
          onClick={() => setIsOpenModal(false)}
        />
      )}

      {isOpenModal && isConnected && (
        <Modal
          title={currentTabURL}
          connected
          callback={handleSetModalIsOpen}
        />
      )}

      {isOpenModal && !isConnected && (
        <Modal
          title={currentTabURL}
          message="This account is not connected to this site. To connect to a sys platform site, find the connect button on their site."
          callback={handleSetModalIsOpen}
        />
      )}

      {isConnected ? (
        <small
          onClick={() => setIsOpenModal(!isOpenModal)}
        >
          Connected
        </small>
      ) : (
        <small
          onClick={() => setIsOpenModal(!isOpenModal)}
        >
          Not connected
        </small>
      )}

      {encriptedMnemonic && !importSeed ? (
        <IconButton
          onClick={() => {
            showed ? handleCloseSettings() : showSettings(!showed)
          }
          }
        >
          <MoreVertIcon />
        </IconButton>
      ) : (
        <i />
      )}

      <Settings open={showed && isUnlocked} onClose={handleCloseSettings} />
    </div>
  )
}

export default NormalHeader;