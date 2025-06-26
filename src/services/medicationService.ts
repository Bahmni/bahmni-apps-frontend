import { MEDICATION_ORDERS_METADATA_URL } from '@constants/app';
import { get } from './api';
import { MedicationOrdersMetadataResponse } from '@types/medicationConfig';

export async function fetchMedicationOrdersMetadata(): Promise<MedicationOrdersMetadataResponse> {
  return await get<MedicationOrdersMetadataResponse>(
    MEDICATION_ORDERS_METADATA_URL,
  );
}
