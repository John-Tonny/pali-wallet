import React, { FC } from 'react';
import { useUtils } from 'hooks/index';
import { Layout, Icon, SecondaryButton, SimpleCard } from 'components/index';

const AboutView: FC = () => {
  const handleRedirect = (url: string) => {
    window.open(url);
  };

  const { navigate } = useUtils();

  return (
    <Layout title="INFO & HELP" id="info-help-title">
      <div className="flex flex-col gap-y-4 mt-8 pl-8 w-full text-brand-white text-sm">
        <p>Pali Wallet Browser Extension v2.0</p>
        <p>Version: 1.0.23</p>

        <p
          className="hover:text-brand-royalblue transition-all duration-200"
          onClick={() => handleRedirect('https://docs.paliwallet.com/')}
        >
          Pali API
        </p>
      </div>

      <div
        className="flex flex-col items-center justify-center w-full"
        id="user-support-btn"
      >
        <SimpleCard
          onClick={() =>
            handleRedirect('https://discord.com/invite/8QKeyurHRd')
          }
          className="cursor-pointer"
        >
          <div className="flex items-center justify-start mb-4 font-poppins text-base font-bold">
            <Icon
              name="message"
              className="mb-1 text-brand-white"
              wrapperClassname="w-6"
            />

            <p className="text-sm">User support</p>
          </div>

          <p className="text-brand-white text-xs">
            Click here to be redirected to Syscoin Discord, please contact
            support team at #pali_support.
          </p>
        </SimpleCard>

        <div className="absolute bottom-12">
          <SecondaryButton type="button" onClick={() => navigate('/home')}>
            Close
          </SecondaryButton>
        </div>
      </div>
    </Layout>
  );
};

export default AboutView;
