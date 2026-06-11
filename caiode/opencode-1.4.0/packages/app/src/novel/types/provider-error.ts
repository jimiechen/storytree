export type ProviderErrorCode =
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'DENIED'
  | 'QUOTA'
  | 'CONFLICT'
  | 'UNAUTHORIZED';

export interface ProviderError {
  code: ProviderErrorCode;
  message: string;
  details?: unknown;
}
