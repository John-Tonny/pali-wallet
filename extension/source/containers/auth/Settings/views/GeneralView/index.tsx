import * as React from 'react';
import { ChangeEvent } from 'react';
import { useSelector } from 'react-redux';
import NetworkIcon from '@material-ui/icons/Timeline';
import ListIcon from '@material-ui/icons/ListAltRounded';
import InfoIcon from '@material-ui/icons/InfoRounded';
import DeleteIcon from '@material-ui/icons/Delete';

import Select from 'components/Select';
import Icon from 'components/Icon';
import { useController, useSettingsView } from 'hooks/index';
import { ABOUT_VIEW, DELETE_WALLET_VIEW, PHRASE_VIEW } from '../routes';
import { SYS_NETWORK } from 'constants/index';
import { RootState } from 'state/store';

import styles from './index.scss';

const GeneralView = () => {
  const controller = useController();
  const showView = useSettingsView();
  const network = useSelector(
    (state: RootState) => state.wallet!.activeNetwork
  );

  return (
    <div className={styles.general}>
      <ul>
        <li onClick={() => showView(PHRASE_VIEW)}>
          <Icon Component={ListIcon} />
          Wallet seed phrase
        </li>
        <li onClick={() => showView(ABOUT_VIEW)}>
          <Icon Component={InfoIcon} />
          About
        </li>
        <li onClick={() => showView(DELETE_WALLET_VIEW)}>
          <Icon Component={DeleteIcon} />
          Delete wallet
        </li>
      </ul>
    </div>
  );
};

export default GeneralView;
