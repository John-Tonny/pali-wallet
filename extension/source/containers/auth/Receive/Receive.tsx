import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useController, useCopyClipboard } from 'hooks/index';
import QRCode from 'qrcode.react';
import { IconButton, Icon } from 'components/index';
import Header from 'containers/common/Header';
import { RootState } from 'state/store';
import IWalletState from 'state/wallet/types';
import { useHistory } from 'react-router-dom';

const WalletReceive = () => {
  const [isCopied, copyText] = useCopyClipboard();
  const controller = useController();
  const [loaded, setLoaded] = useState<boolean>(false);
  const { accounts, activeAccountId }: IWalletState = useSelector(
    (state: RootState) => state.wallet
  );
  const history = useHistory();

  useEffect(() => {
    const getNewAddress = async () => {
      if (await controller.wallet.getNewAddress()) {
        setLoaded(true);
      }
    }

    getNewAddress();
  }, []);

  return (
    <div className="bg-brand-gray">
      <Header normalHeader />
      <IconButton
        type="primary"
        shape="circle"
        onClick={() => history.push('/home')}
      >
        <Icon name="arrow-left" className="w-4 bg-brand-graydark100 text-brand-white" />
      </IconButton>
      <section>Receive SYS</section>

      <section>
        {loaded ? (
          <div>
            <div>
              <QRCode
                value={accounts.find(element => element.id === activeAccountId)!.address.main}
                bgColor="#fff"
                fgColor="#000"
                size={180}
              />
              {accounts.find(element => element.id === activeAccountId)!.address.main}
            </div>
            <div>
              <IconButton
                type="primary"
                shape="circle"
                onClick={() =>
                  copyText(accounts.find(element => element.id === activeAccountId)!.address.main)
                }
              >
                <Icon name="copy" className="w-4 bg-brand-graydark100 text-brand-white" />
              </IconButton>
              <span>
                {isCopied ? 'Copied address' : 'Copy'}
              </span>
            </div>
          </div>
        ) : <Icon name="loading" className="w-4 bg-brand-graydark100 text-brand-white" />}

      </section>
    </div>
  );
};

export default WalletReceive;
