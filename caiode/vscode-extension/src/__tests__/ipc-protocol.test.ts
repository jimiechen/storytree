import { IPCMessage, IPCResponse, IPCEvent, IPCErrorCode } from '../types/ipc-protocol';

describe('IPC Protocol Types', () => {
  describe('IPCMessage', () => {
    it('should create a valid IPC message', () => {
      const message: IPCMessage = {
        id: '123',
        method: 'test.method',
        params: { key: 'value' },
      };
      
      expect(message.id).toBe('123');
      expect(message.method).toBe('test.method');
      expect(message.params).toEqual({ key: 'value' });
    });

    it('should create a valid IPC message without params', () => {
      const message: IPCMessage = {
        id: '456',
        method: 'test.noParams',
      };
      
      expect(message.id).toBe('456');
      expect(message.method).toBe('test.noParams');
      expect(message.params).toBeUndefined();
    });
  });

  describe('IPCResponse', () => {
    it('should create a valid success response', () => {
      const response: IPCResponse = {
        id: '789',
        result: { success: true, data: 'test' },
      };
      
      expect(response.id).toBe('789');
      expect(response.result).toEqual({ success: true, data: 'test' });
      expect(response.error).toBeUndefined();
    });

    it('should create a valid error response', () => {
      const response: IPCResponse = {
        id: '987',
        error: {
          code: IPCErrorCode.METHOD_NOT_FOUND,
          message: 'Method not found',
        },
      };
      
      expect(response.id).toBe('987');
      expect(response.error).toEqual({
        code: IPCErrorCode.METHOD_NOT_FOUND,
        message: 'Method not found',
      });
      expect(response.result).toBeUndefined();
    });
  });

  describe('IPCEvent', () => {
    it('should create a valid IPC event', () => {
      const event: IPCEvent = {
        type: 'test.event',
        data: { timestamp: Date.now() },
      };
      
      expect(event.type).toBe('test.event');
      expect(event.data).toBeDefined();
    });

    it('should create a valid IPC event without data', () => {
      const event: IPCEvent = {
        type: 'test.emptyEvent',
      };
      
      expect(event.type).toBe('test.emptyEvent');
      expect(event.data).toBeUndefined();
    });
  });

  describe('IPCErrorCode', () => {
    it('should have correct error code values', () => {
      expect(IPCErrorCode.INVALID_REQUEST).toBe(-32600);
      expect(IPCErrorCode.METHOD_NOT_FOUND).toBe(-32601);
      expect(IPCErrorCode.INVALID_PARAMS).toBe(-32602);
      expect(IPCErrorCode.INTERNAL_ERROR).toBe(-32603);
      expect(IPCErrorCode.PARSE_ERROR).toBe(-32700);
    });
  });
});
