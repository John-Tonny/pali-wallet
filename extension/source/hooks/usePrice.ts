import { PRICE_SYS_ID, DEFAULT_CURRENCY } from 'constants/index';

import { useSelector } from 'react-redux';
import IPriceState from 'state/price/types';
import { RootState } from 'state/store';

export function useFiat() {
  const price: IPriceState = useSelector((state: RootState) => state.price);

  return (amount: number, fraction = 4) => {
    const value = amount * price.fiat[PRICE_SYS_ID];

    if (DEFAULT_CURRENCY && value && price) {
      return `${DEFAULT_CURRENCY.symbol}${value.toLocaleString(
        navigator.language,
        {
          minimumFractionDigits: fraction,
          maximumFractionDigits: fraction,
        }
      )} ${DEFAULT_CURRENCY.name}`;
    }

    return `-- ${DEFAULT_CURRENCY.name}`;
  };
}
