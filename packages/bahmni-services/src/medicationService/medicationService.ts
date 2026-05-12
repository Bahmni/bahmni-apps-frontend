import { Medication } from 'fhir/r4';
import { get } from '../api';
import { MEDICATION_URL } from './constants';

export async function getMedicationByUuid(uuid: string): Promise<Medication> {
  return await get<Medication>(MEDICATION_URL(uuid));
}
