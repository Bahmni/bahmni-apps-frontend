import { createContext } from 'react';
import { OrdersConfigContextType } from './models';

export const OrdersConfigContext = createContext<
  OrdersConfigContextType | undefined
>(undefined);
