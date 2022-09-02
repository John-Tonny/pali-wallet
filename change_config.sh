#!/bin/bash

file1=./source/constants/index.ts
file2=./source/state/wallet/index.ts
file3=./source/components/Header/NormalHeader.tsx

SYS_MAINNET_BLOCKBOOK='69.234.192.199:9130'

VAR1=sys-mainnet-blockbook
VAR2=sys-testnet-blockbook
VAR3=eth-mainnet-blockbook
VAR4=eth-testnet-blockbook


if [ "x${SYS_MAINNET_BLOCKBOOK}" != "x" ]; then
  sed -i "s/$VAR1/$SYS_MAINNET_BLOCKBOOK/g" $file1
  sed -i "s/$VAR1/$SYS_MAINNET_BLOCKBOOK/g" $file2
  sed -i "s/$VAR1/$SYS_MAINNET_BLOCKBOOK/g" $file3
fi

if [ "x${SYS_TESTNET_BLOCKBOOK}" != "x" ]; then
  sed -i "s/$VAR2/$SYS_TESTNET_BLOCKBOOK/g" $file1
  sed -i "s/$VAR2/$SYS_TESTNET_BLOCKBOOK/g" $file2
  sed -i "s/$VAR2/$SYS_TESTNET_BLOCKBOOK/g" $file3
fi

if [ "x${ETH_MAINNET_BLOCKBOOK}" != "x" ]; then
  sed -i "s/$VAR3/$ETH_MAINNET_BLOCKBOOK/g" $file1
  sed -i "s/$VAR3/$ETH_MAINNET_BLOCKBOOK/g" $file2
  sed -i "s/$VAR4/$ETH_MAINNET_BLOCKBOOK/g" $file3
fi

if [ "x${ETH_TESTNET_BLOCKBOOK}" != "x" ]; then
  sed -i "s/$VAR4/$ETH_TESTNET_BLOCKBOOK/g" $file1
  sed -i "s/$VAR4/$ETH_TESTNET_BLOCKBOOK/g" $file2
  sed -i "s/$VAR4/$ETH_TESTNET_BLOCKBOOK/g" $file3
fi
