import { getUserPreferredLocale, searchConceptByName } from '@bahmni/services';
import type { Bundle, ServiceRequest } from 'fhir/r4';
import { DispositionViewModel } from './models';

export const DISPOSITION_ORDER_TYPE = 'ADT Order';

const DISPOSITION_CONCEPT_NAME = 'Disposition';
const DISPOSITION_CUSTOM_VIEW =
  'custom:(uuid,name,answers:(uuid,name,names:(name,locale,conceptNameType)))';

interface DispositionAnswer {
  uuid: string;
  name?: { name: string };
  names?: Array<{ name: string; locale?: string; conceptNameType?: string }>;
}

const getLocalizedName = (answer: DispositionAnswer, locale: string) => {
  const inLocale = (answer.names ?? []).filter((n) => n.locale === locale);
  const localized =
    inLocale.find((n) => n.conceptNameType === 'FULLY_SPECIFIED') ??
    inLocale[0];
  return localized?.name ?? answer.name?.name;
};

export const fetchDispositionTypeNames = async (): Promise<
  Map<string, string>
> => {
  const concept = (await searchConceptByName(
    DISPOSITION_CONCEPT_NAME,
    DISPOSITION_CUSTOM_VIEW,
  )) as { answers?: DispositionAnswer[] } | null;
  const locale = getUserPreferredLocale();
  const names = new Map<string, string>();
  (concept?.answers ?? []).forEach((answer) => {
    const name = getLocalizedName(answer, locale);
    if (name) names.set(answer.uuid, name);
  });
  return names;
};

const toTime = (value?: string): number => {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(time) ? 0 : time;
};

export const mapDispositions = (
  bundle: Bundle<ServiceRequest>,
): DispositionViewModel[] => {
  const orders = (bundle.entry ?? [])
    .map((entry) => entry.resource)
    .filter((resource): resource is ServiceRequest => !!resource);

  return orders
    .map((order) => ({
      id: order.id as string,
      conceptUuid: order.code?.coding?.[0]?.code,
      type: order.code?.text ?? order.code?.coding?.[0]?.display ?? '',
      date: order.occurrencePeriod?.start ?? order.occurrenceDateTime,
      notes: order.note?.[0]?.text,
      recordedTime: order.authoredOn,
      recordedBy: order.requester?.display,
    }))
    .sort(
      (a, b) =>
        toTime(b.date) - toTime(a.date) ||
        toTime(b.recordedTime) - toTime(a.recordedTime),
    );
};
