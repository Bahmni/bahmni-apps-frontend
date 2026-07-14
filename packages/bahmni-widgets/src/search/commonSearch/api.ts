import { SearchPayload } from './models';

const makePatient = (
  name: string,
  applicantId: string,
  birthdate: string,
  age: number,
  sex: 'M' | 'F',
) => ({ name, applicantId, birthdate, age, sex });

const PATIENTS = [
  makePatient('John Doe', 'APP-001', '1990-05-15', 34, 'M'),
  makePatient('Jane Smith', 'APP-002', '1985-11-22', 39, 'F'),
  makePatient('Carlos Rivera', 'APP-003', '1978-03-08', 46, 'M'),
  makePatient('Amina Yusuf', 'APP-004', '1995-07-30', 29, 'F'),
  makePatient('Wei Zhang', 'APP-005', '1982-12-01', 42, 'M'),
  makePatient('Sara Petrov', 'APP-006', '1993-04-17', 31, 'F'),
  makePatient('James Okafor', 'APP-007', '1975-09-25', 49, 'M'),
  makePatient('Leila Mansouri', 'APP-008', '1988-06-11', 36, 'F'),
];

const PATIENT_CONTACTS = [
  { phone: '+251911234567', email: 'john.doe@example.com' },
  { phone: '+251922345678', email: 'jane.smith@example.com' },
  { phone: '+251933456789', email: 'carlos.rivera@example.com' },
  { phone: '+251944567890', email: 'amina.yusuf@example.com' },
  { phone: '+251955678901', email: 'wei.zhang@example.com' },
  { phone: '+251966789012', email: 'sara.petrov@example.com' },
  { phone: '+251977890123', email: 'james.okafor@example.com' },
  { phone: '+251988901234', email: 'leila.mansouri@example.com' },
];

const PATIENT_MOCK = {
  results: PATIENTS.map((p, i) => ({ ...p, ...PATIENT_CONTACTS[i] })),
};

const APPOINTMENT_MOCK = {
  results: [
    {
      appointmentNumber: 'APT-001',
      status: 'Scheduled',
      date: '2025-01-05',
      time: '08:00',
      reason: 'Initial Medical Exam',
      service: 'US Health Assessment',
      patient: PATIENTS[0],
    },
    {
      appointmentNumber: 'APT-002',
      status: 'Completed',
      date: '2025-01-08',
      time: '09:30',
      reason: 'TB Screening',
      service: 'Canada Health Assessment',
      patient: PATIENTS[1],
    },
    {
      appointmentNumber: 'APT-003',
      status: 'Scheduled',
      date: '2025-01-10',
      time: '11:00',
      reason: 'Follow-up Consultation',
      service: 'Australia Health Assessment',
      patient: PATIENTS[2],
    },
    {
      appointmentNumber: 'APT-004',
      status: 'No Show',
      date: '2025-01-12',
      time: '13:00',
      reason: 'Panel Physician Review',
      service: 'UK Health Assessment',
      patient: PATIENTS[3],
    },
    {
      appointmentNumber: 'APT-005',
      status: 'Completed',
      date: '2025-01-15',
      time: '14:30',
      reason: 'Vaccination',
      service: 'US Health Assessment',
      patient: PATIENTS[4],
    },
    {
      appointmentNumber: 'APT-006',
      status: 'Cancelled',
      date: '2025-01-18',
      time: '10:00',
      reason: 'Lab Results Review',
      service: 'Germany Health Assessment',
      patient: PATIENTS[5],
    },
    {
      appointmentNumber: 'APT-007',
      status: 'Scheduled',
      date: '2025-01-22',
      time: '15:00',
      reason: 'Initial Medical Exam',
      service: 'New Zealand Assessment',
      patient: PATIENTS[6],
    },
    {
      appointmentNumber: 'APT-008',
      status: 'Confirmed',
      date: '2025-01-25',
      time: '09:00',
      reason: 'PDMP Assessment',
      service: 'Canada Health Assessment',
      patient: PATIENTS[7],
    },
  ],
};

const EPISODE_OF_CARE_MOCK = {
  results: [
    {
      umi: 'UMI-001',
      hapid: 'HAP-001',
      startDate: '2024-01-10',
      endDate: null,
      status: 'In Progress',
      programType: 'Health Assessment',
      destinationCountry: 'USA',
      careProvider: 'Dr. Smith',
      patient: PATIENTS[0],
    },
    {
      umi: 'UMI-002',
      hapid: 'HAP-002',
      startDate: '2024-02-14',
      endDate: '2024-08-14',
      status: 'Finalized',
      programType: 'TB',
      destinationCountry: 'Canada',
      careProvider: 'Dr. Johnson',
      patient: PATIENTS[1],
    },
    {
      umi: 'UMI-003',
      hapid: 'HAP-003',
      startDate: '2024-03-01',
      endDate: null,
      status: 'In Progress',
      programType: 'PDMP',
      destinationCountry: 'Australia',
      careProvider: 'Dr. Patel',
      patient: PATIENTS[2],
    },
    {
      umi: 'UMI-004',
      hapid: 'HAP-004',
      startDate: '2024-04-20',
      endDate: '2024-10-20',
      status: 'Submitted',
      programType: 'Health Assessment',
      destinationCountry: 'UK',
      careProvider: 'Dr. Müller',
      patient: PATIENTS[3],
    },
    {
      umi: 'UMI-005',
      hapid: 'HAP-005',
      startDate: '2024-05-05',
      endDate: '2024-11-05',
      status: 'Completed',
      programType: 'TB',
      destinationCountry: 'USA',
      careProvider: 'Dr. Smith',
      patient: PATIENTS[4],
    },
    {
      umi: 'UMI-006',
      hapid: 'HAP-006',
      startDate: '2024-06-18',
      endDate: null,
      status: 'In Progress',
      programType: 'Health Assessment',
      destinationCountry: 'Germany',
      careProvider: 'Dr. Fischer',
      patient: PATIENTS[5],
    },
    {
      umi: 'UMI-007',
      hapid: 'HAP-007',
      startDate: '2024-07-22',
      endDate: '2025-01-22',
      status: 'Finalized',
      programType: 'PDMP',
      destinationCountry: 'New Zealand',
      careProvider: 'Dr. Walker',
      patient: PATIENTS[6],
    },
    {
      umi: 'UMI-008',
      hapid: 'HAP-008',
      startDate: '2024-08-30',
      endDate: null,
      status: 'In Progress',
      programType: 'Health Assessment',
      destinationCountry: 'Canada',
      careProvider: 'Dr. Johnson',
      patient: PATIENTS[7],
    },
  ],
};

const MOCK_BY_ENTITY: Record<string, unknown> = {
  appointment: APPOINTMENT_MOCK,
  patient: PATIENT_MOCK,
  episodeOfCare: EPISODE_OF_CARE_MOCK,
};

// TODO: Replace mock with real API call — post<T>(url, payload) from @bahmni/services
export const post = async <T = unknown>(
  _url: string,
  payload: unknown,
): Promise<T> => {
  const entity = (payload as SearchPayload).entity;
  return (MOCK_BY_ENTITY[entity] ?? { results: [] }) as T;
};
