import React from 'react';
import { TxConfirmLayout, TxLayout } from 'components/Layout';

// confirmCreateNFT
export const CreateAndIssueNFTConfirm = () => (
  <TxConfirmLayout title="NFT CREATION" txName="newNFT" />
);

export const CreateAndIssueNFT = () => (
  <TxLayout
    confirmRoute="/transaction/asset/nft/issue/confirm"
    temporaryTransactionAsString="newNFT"
    layoutTitle="Create NFT"
  />
);
