import { Dialog, Transition } from '@headlessui/react';
import { useUtils } from 'hooks/useUtils';
import React, { FC, Fragment } from 'react';

type IModal = {
  children?: any;
  closeMessage?: string;
  closePopup?: any;
  connectedAccount?: any;
  description?: string;
  doNothing?: boolean;
  log?: any;
  onClose: any;
  open: boolean;
  title?: string;
  type: string;
};

type DefaltModalType = {
  background?: string;
  closeMessage?: string;
  closePopup?: any;
  description?: string;
  doNothing?: boolean;
  goTo?: string;
  onClose: any;
  open: boolean;
  textColor?: string;
  title?: string;
};

type ErrorModalType = {
  background?: string;
  closeMessage?: string;
  closePopup?: any;
  description?: string;
  doNothing?: boolean;
  goTo?: string;
  log?: string;
  onClose: any;
  open: boolean;
  textColor?: string;
  title?: string;
};

const DefaultModal = ({
  onClose,
  open,
  goTo = '/home',
  background = 'bg-bkg-4',
  textColor = 'text-white',
  title = '',
  description = '',
  closeMessage = 'Ok',
  doNothing = false,
  closePopup,
}: DefaltModalType) => {
  const { navigate } = useUtils();

  const chooseAction = goTo && !doNothing ? () => navigate(goTo) : onClose;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={onClose}
      >
        <div
          onClick={goTo && doNothing ? () => null : chooseAction}
          className="transition-all duration-300 ease-in-out fixed -inset-0 w-full z-0 bg-brand-black bg-opacity-50"
        />

        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0" />
          </Transition.Child>

          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div
              className={`font-poppins inline-block w-full max-w-md p-6 my-8 overflow-hidden text-center align-middle transition-all transform ${background} shadow-xl rounded-2xl`}
            >
              <Dialog.Title
                as="h3"
                className="text-lg font-medium pt-2 pb-4 border-b border-dashed border-gray-600 leading-6 text-brand-white"
              >
                {title}
              </Dialog.Title>

              <div className="mt-2">
                <p className={`text-sm ${textColor}`}>{description}</p>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center px-10 transition-all duration-200 py-2 text-sm font-medium hover:text-brand-royalblue text-brand-white bg-transparent border border-brand-white rounded-full hover:bg-button-popuphover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-royalblue"
                  onClick={
                    goTo ? closePopup || (() => navigate(goTo)) : onClose
                  }
                >
                  {closeMessage}
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

const ErrorModal = ({
  onClose,
  open,
  goTo = '/home',
  background = 'bg-bkg-3',
  textColor = 'text-gray-300',
  title = '',
  description = '',
  closeMessage = 'Ok',
  doNothing = false,
  log = '',
}: ErrorModalType) => {
  const { navigate } = useUtils();

  const chooseAction = goTo && !doNothing ? () => navigate(goTo) : onClose;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={onClose}
      >
        <div
          onClick={goTo && doNothing ? () => null : chooseAction}
          className="transition-all duration-300 ease-in-out fixed -inset-0 w-full z-0 bg-brand-black bg-opacity-50"
        />

        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0" />
          </Transition.Child>

          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div
              className={`font-poppins inline-block w-full max-w-md p-6 my-8 overflow-hidden text-center align-middle transition-all border border-red-500 transform ${background} shadow-xl rounded-2xl`}
            >
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-brand-white"
              >
                {title}
              </Dialog.Title>
              <div className="mt-4">
                <p className={`text-sm ${textColor}`}>{description}</p>
              </div>

              <p className="text-sm text-red-500 my-4">
                Error description:
                {log}
              </p>

              <div className="mt-8 flex justify-between items-center">
                <button
                  type="button"
                  className="inline-flex justify-center px-12 py-2 text-sm font-medium text-red-500 bg-blue-100 border border-red-500 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-royalblue"
                  onClick={onClose}
                >
                  {closeMessage}
                </button>

                <button
                  type="button"
                  className="inline-flex justify-center px-12 py-2 text-sm font-medium text-brand-white bg-red-500 border border-transparent rounded-full hover:bg-opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-royalblue"
                  onClick={() =>
                    window.open(
                      `mailto:amanda.gonsalves@pollum.io?subject="Pali Error Report: Token creation"&body=${log}`
                    )
                  }
                >
                  Report
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export const Modal: FC<IModal> = ({
  onClose,
  open,
  type = '',
  description,
  title,
  doNothing,
  log,
  closePopup,
  children,
}) => (
  <>
    {type === 'default' && (
      <DefaultModal
        closePopup={closePopup}
        onClose={onClose}
        open={open}
        closeMessage="Got it"
        title={title}
        description={description}
        doNothing={doNothing}
      />
    )}

    {type === 'error' && (
      <ErrorModal
        onClose={onClose}
        open={open}
        closeMessage="Got it"
        title={title}
        description={description}
        doNothing={doNothing}
        log={log}
      />
    )}

    {type === '' && (
      <Transition appear show={open} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={onClose}
        >
          <div
            onClick={onClose}
            className="transition-all duration-300 ease-in-out fixed -inset-0 w-full z-0 bg-brand-black bg-opacity-50"
          />

          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0" />
            </Transition.Child>

            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              {children}
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    )}
  </>
);
