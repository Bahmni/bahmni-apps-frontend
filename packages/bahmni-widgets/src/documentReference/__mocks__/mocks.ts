import { QueryClient } from '@tanstack/react-query';
import { DocumentReference } from 'fhir/r4';
import { DocumentReferenceViewModel } from '../models';

export const createMockDocumentReference = (
  overrides?: Partial<DocumentReference>,
): DocumentReference => ({
  resourceType: 'DocumentReference',
  id: 'doc-123',
  status: 'current',
  content: [],
  type: {
    text: 'Passport',
    coding: [
      {
        code: 'passport',
        display: 'Passport',
      },
    ],
  },
  masterIdentifier: {
    value: 'ABC123456',
  },
  author: [
    {
      reference: 'Practitioner/d7a67c17-5e07-11ef-8f7c-0242ac120002',
      type: 'Practitioner',
      identifier: {
        value: 'superman',
      },
      display: 'Super Man',
    },
  ],
  extension: [
    {
      url: 'https://fhir.bahmni.org/ext/document-reference/attribute#issuing-country',
      valueString: 'USA',
    },
  ],
  context: {
    period: {
      start: '2020-01-15T00:00:00.000Z',
      end: '2030-01-15T00:00:00.000Z',
    },
  },
  ...overrides,
});

export const mockDocumentReferenceViewModels: DocumentReferenceViewModel[] = [
  {
    id: 'doc-1',
    documentType: 'Passport',
    masterIdentifier: 'P123456',
    issuingDate: new Date('2020-01-15T00:00:00.000Z'),
    expiryDate: new Date('2030-01-15T00:00:00.000Z'),
    author: 'Super Man',
    attributes: { issuingCountry: 'USA' },
    attachment: [{ contentType: 'application/pdf' }],
  },
  {
    id: 'doc-2',
    documentType: 'National ID',
    masterIdentifier: 'N789012',
    issuingDate: new Date('2019-05-10T00:00:00.000Z'),
    expiryDate: new Date('2029-05-10T00:00:00.000Z'),
    author: 'Super Man',
    attributes: {},
    attachment: [{ contentType: 'application/pdf' }],
  },
];

export const mockDocumentReferenceWithMissingValues: DocumentReferenceViewModel[] =
  [
    {
      id: 'doc-1',
      documentType: 'Passport',
      masterIdentifier: 'P123456',
      issuingDate: null,
      expiryDate: null,
      author: '-',
      attributes: {},
      attachment: [],
    },
    {
      id: 'doc-2',
      documentType: '',
      masterIdentifier: '',
      issuingDate: new Date('2019-05-10T00:00:00.000Z'),
      expiryDate: null,
      author: '-',
      attributes: { issuingCountry: null },
      attachment: [{ contentType: 'application/pdf' }],
    },
  ];

export const mockSingleDocumentReference: DocumentReferenceViewModel = {
  id: 'doc-1',
  documentType: 'Passport',
  masterIdentifier: 'P123456',
  issuingDate: new Date('2020-01-15T00:00:00.000Z'),
  expiryDate: new Date('2030-01-15T00:00:00.000Z'),
  author: 'Super Man',
  attributes: { issuingCountry: 'USA' },
  attachment: [{ contentType: 'application/pdf' }],
};

export const mockDocumentReferenceWithAttachments: DocumentReferenceViewModel =
  {
    id: 'doc-1',
    documentType: 'Identity Documents',
    masterIdentifier: 'ID123456',
    issuingDate: new Date('2020-01-15T00:00:00.000Z'),
    expiryDate: new Date('2030-01-15T00:00:00.000Z'),
    author: 'Super Man',
    attributes: { issuingCountry: 'USA' },
    attachment: [
      {
        id: 'image-attachment',
        contentType: 'image/png',
        url: 'https://example.com/image.png',
        title: 'Passport Photo',
      },
      {
        id: 'video-attachment',
        contentType: 'video/mp4',
        url: 'https://example.com/video.mp4',
      },
      {
        id: 'file-attachment',
        contentType: 'application/pdf',
        url: 'https://example.com/document.pdf',
      },
    ],
  };

export const mockDocumentReferences: DocumentReference[] = [
  {
    resourceType: 'DocumentReference',
    id: 'doc-1',
    status: 'current',
    type: {
      text: 'Passport',
    },
    masterIdentifier: {
      value: 'P123456',
    },
    author: [
      {
        reference: 'Practitioner/d7a67c17-5e07-11ef-8f7c-0242ac120002',
        type: 'Practitioner',
        identifier: {
          value: 'superman',
        },
        display: 'Super Man',
      },
    ],
    context: {
      period: {
        start: '2020-01-15T00:00:00.000Z',
        end: '2030-01-15T00:00:00.000Z',
      },
    },
    content: [
      {
        attachment: {
          contentType: 'application/pdf',
        },
      },
    ],
  },
  {
    resourceType: 'DocumentReference',
    id: 'doc-2',
    status: 'current',
    type: {
      text: 'National ID',
    },
    masterIdentifier: {
      value: 'N789012',
    },
    author: [
      {
        reference: 'Practitioner/d7a67c17-5e07-11ef-8f7c-0242ac120002',
        type: 'Practitioner',
        identifier: {
          value: 'superman',
        },
        display: 'Super Man',
      },
    ],
    context: {
      period: {
        start: '2019-05-10T00:00:00.000Z',
        end: '2029-05-10T00:00:00.000Z',
      },
    },
    content: [
      {
        attachment: {
          contentType: 'application/pdf',
        },
      },
    ],
  },
];

export const mockConfig = {
  fields: [
    'documentType',
    'masterIdentifier',
    'issuingDate',
    'expiryDate',
    'author',
  ],
};

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
