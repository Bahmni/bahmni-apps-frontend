import { get } from '../api';
import { ORDERS_URL } from './constants';

export interface OrderSearchParams {
  locationUuid: string;
  providerUuid: string;
  q: string;
}
export interface OrderResponseItem {
  name: string;
  identifier: string;
  uuid: string;
  activeVisitUuid: string;
  hasBeenAdmitted: string;
  kid: string;
  orders: string;
  birthdate: number;
  gender: string;
}

export async function fetchOrders(
  params: OrderSearchParams,
): Promise<OrderResponseItem[]> {
  if (!params.locationUuid || !params.providerUuid) {
    throw new Error(
      'Location UUID and Provider UUID are required to fetch orders.',
    );
  } else {
    const { locationUuid, providerUuid, q } = params;
    const searchParams = new URLSearchParams({
      location_uuid: locationUuid,
      provider_uuid: providerUuid,
      q: q || '',
      v: 'full',
    });
    const url = `${ORDERS_URL}?${searchParams.toString()}`;
    return await get(url);
  }
}
