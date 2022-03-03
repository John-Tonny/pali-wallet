import React from 'react';
import LogoImage from 'assets/images/logo-s.svg';
import { PrimaryButton, Link } from 'components/index';
import { useController, useStore, useUtils } from 'hooks/index';
import { Form, Input } from 'antd';

export const Start = () => {
  const { navigate } = useUtils();
  const {
    wallet: { unLock },
  } = useController();
  const { encriptedMnemonic } = useStore();

  const getStarted = (
    <>
      <PrimaryButton type="submit" onClick={() => navigate('/create-password')}>
        Get started
      </PrimaryButton>
      <Link
        className="mt-20 hover:text-brand-graylight text-brand-royalbluemedium font-poppins text-base font-light transition-all duration-300"
        to="/import"
        id="import-wallet-link"
      >
        Import using wallet seed phrase
      </Link>
    </>
  );

  const onSubmit = async (data: any) => {
    await unLock(data.password);
  };

  const unlock = (
    <>
      <Form
        className="flex flex-col gap-8 items-center justify-center w-full max-w-xs text-center"
        name="basic"
        onFinish={onSubmit}
        autoComplete="off"
        id="login"
      >
        <Form.Item
          name="password"
          hasFeedback
          className="w-full"
          rules={[
            {
              required: true,
              message: '',
            },
            () => ({
              async validator(_, value) {
                if (await unLock(value)) {
                  return Promise.resolve();
                }

                return Promise.reject();
              },
            }),
          ]}
        >
          <Input.Password placeholder="Enter your password" />
        </Form.Item>

        <PrimaryButton type="submit" id="unlock-btn">
          Unlock
        </PrimaryButton>
      </Form>
      <Link
        className="mt-20 hover:text-brand-graylight text-brand-royalblue text-base font-light transition-all duration-300"
        to="/import"
        id="import-wallet-link"
      >
        Import using wallet seed phrase
      </Link>
    </>
  );

  return (
    <div className="flex flex-col items-center justify-center mt-20 p-2 min-w-full">
      <p className="mb-2 text-center text-brand-deepPink100 text-lg font-normal tracking-wider">
        WELCOME TO
      </p>

      <h1 className="m-0 text-center text-brand-royalblue font-poppins text-4xl font-bold tracking-wide leading-4">
        Pali Wallet
      </h1>

      <img src={LogoImage} className="my-8 w-52" alt="syscoin" />

      {encriptedMnemonic ? unlock : getStarted}
    </div>
  );
};