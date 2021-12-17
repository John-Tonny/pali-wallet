import { Menu, Transition } from '@headlessui/react';
import { Icon } from 'components/Icon';
import { Select } from 'components/Select';
import { useStore } from 'hooks/useStore';
import React, { FC, Fragment } from 'react';

import * as Views from './views';

interface ISettings {
  accountSettings?: boolean;
  generalSettings?: boolean;
  networkSettings?: boolean;
  onClose?: () => void;
  open: boolean;
}

export const Settings: FC<ISettings> = ({
  onClose,
  open,
  generalSettings = true,
  accountSettings = false,
  networkSettings = false,
}) => {
  const { changingNetwork } = useStore();

  return (
    <div>
      {open && !changingNetwork && (
        <div className="transition-all duration-300 ease-in-out">
          <div
            onClick={onClose}
            className="transition-all duration-300 ease-in-out fixed -inset-0 w-full z-0 bg-brand-darktransparent"
          />

          {/* <div
            className={
              generalSettings ?
                'transition-all duration-300 ease-in-out fixed z-10 flex flex-col bg-brand-royalBlue max-w-70 top-3rem right-4 p-6 rounded-3xl' :
                networkSettings ?
                  'transition-all duration-300 ease-in-out fixed z-10 flex flex-col bg-brand-lightnavyborder max-w-70 top-3rem left-4 py-6 rounded-3xl' :
                  'transition-all duration-300 ease-in-out fixed z-10 flex flex-col bg-brand-deepPink max-w-70 top-3rem right-4 p-6 rounded-3xl'
            }
          >
            <h2 className="pb-4 text-brand-white border-b border-dashed border-brand-graylight w-full text-center mb-4">
              {generalSettings ?
                'GENERAL SETTINGS' :
                networkSettings ?
                  'NETWORK SETTINGS' :
                  'ACCOUNT SETTINGS'
              }
            </h2>

            <Views.MainView
              accountSettings={accountSettings}
              generalSettings={generalSettings}
              networkSettings={networkSettings}
              onClose={onClose}
            />
          </div> */}
        </div>
      )}
    </div>
  );
};
