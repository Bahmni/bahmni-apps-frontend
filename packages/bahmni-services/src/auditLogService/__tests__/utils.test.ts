import { RawAuditLogEntry } from '../models';
import {
  cleanAuditLogParams,
  interpolateMessage,
  parseAuditLogEntry,
  parseAuditLogMessage,
} from '../utils';

describe('auditLogService/utils', () => {
  describe('cleanAuditLogParams', () => {
    it('strips undefined and empty-string values', () => {
      const result = cleanAuditLogParams({
        username: '',
        patientId: undefined,
        startFrom: '2024-01-01',
        lastAuditLogId: 10,
      });

      expect(result).toEqual({ startFrom: '2024-01-01', lastAuditLogId: 10 });
    });

    it('keeps falsy-but-defined values like `false` and `0`', () => {
      const result = cleanAuditLogParams({
        prev: false,
        lastAuditLogId: 0,
      });

      expect(result).toEqual({ prev: false, lastAuditLogId: 0 });
    });

    it('returns an empty object when all values are empty', () => {
      expect(
        cleanAuditLogParams({ username: '', patientId: undefined }),
      ).toEqual({});
    });
  });

  describe('parseAuditLogMessage', () => {
    it('splits a message with a `~<JSON>` params suffix', () => {
      const result = parseAuditLogMessage(
        'EDIT_ENCOUNTER_MESSAGE~{"encounterUuid":"abc-123"}',
      );

      expect(result).toEqual({
        message: 'EDIT_ENCOUNTER_MESSAGE',
        messageParams: { encounterUuid: 'abc-123' },
      });
    });

    it('returns just the message when there is no `~` separator', () => {
      const result = parseAuditLogMessage('Plain audit message');

      expect(result).toEqual({ message: 'Plain audit message' });
    });

    it('falls back to just the message when the params are not valid JSON', () => {
      const result = parseAuditLogMessage('SOME_KEY~not-json');

      expect(result).toEqual({ message: 'SOME_KEY' });
    });
  });

  describe('interpolateMessage', () => {
    it('replaces `{{key}}` tokens with matching context values', () => {
      expect(
        interpolateMessage('User {{userId}} logged in.', {
          userId: 'superman',
        }),
      ).toBe('User superman logged in.');
    });

    it('resolves dotted paths against nested context values', () => {
      expect(
        interpolateMessage('Stopped {{params.drugName}}', {
          params: { drugName: 'Paracetamol' },
        }),
      ).toBe('Stopped Paracetamol');
    });

    it('leaves unresolved tokens untouched', () => {
      expect(interpolateMessage('User {{userId}} logged in.', {})).toBe(
        'User {{userId}} logged in.',
      );
    });

    it('returns the template unchanged when it has no tokens', () => {
      expect(interpolateMessage('Plain message', { userId: 'x' })).toBe(
        'Plain message',
      );
    });
  });

  describe('parseAuditLogEntry', () => {
    it('parses a raw entry with message params into the display shape', () => {
      const raw: RawAuditLogEntry = {
        auditLogId: 42,
        dateCreated: '2024-01-01T10:00:00.000Z',
        eventType: 'EDIT_ENCOUNTER',
        userId: 'superman',
        patientId: 'PID-1',
        message: 'EDIT_ENCOUNTER_MESSAGE~{"encounterUuid":"abc-123"}',
        module: 'MODULE_LABEL_CLINICAL_KEY',
      };

      expect(parseAuditLogEntry(raw)).toEqual({
        id: '42',
        auditLogId: 42,
        dateCreated: '2024-01-01T10:00:00.000Z',
        eventType: 'EDIT_ENCOUNTER',
        userId: 'superman',
        patientId: 'PID-1',
        message: 'EDIT_ENCOUNTER_MESSAGE',
        messageParams: { encounterUuid: 'abc-123' },
        module: 'MODULE_LABEL_CLINICAL_KEY',
      });
    });

    it('parses a raw entry with a plain message (no `~`)', () => {
      const raw: RawAuditLogEntry = {
        auditLogId: 7,
        dateCreated: '2024-02-02T00:00:00.000Z',
        eventType: 'OPEN_VISIT',
        userId: 'batman',
        patientId: 'PID-2',
        message: 'Opened a visit',
        module: 'MODULE_LABEL_REGISTRATION_KEY',
      };

      const result = parseAuditLogEntry(raw);

      expect(result.id).toBe('7');
      expect(result.message).toBe('Opened a visit');
      expect(result.messageParams).toBeUndefined();
    });
  });
});
