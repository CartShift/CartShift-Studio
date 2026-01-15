export enum PortalErrorCode {
  // Authentication Errors
  AUTH_USER_NOT_FOUND = 'AUTH_001',
  AUTH_WRONG_PASSWORD = 'AUTH_002',
  AUTH_EMAIL_ALREADY_IN_USE = 'AUTH_003',
  AUTH_WEAK_PASSWORD = 'AUTH_004',
  AUTH_INVALID_EMAIL = 'AUTH_005',
  AUTH_INTERNAL_ERROR = 'AUTH_006',
  AUTH_TOO_MANY_REQUESTS = 'AUTH_007',
  AUTH_POPUP_CLOSED = 'AUTH_008',
  AUTH_NETWORK_REQUEST_FAILED = 'AUTH_009',
  AUTH_UNAUTHORIZED = 'AUTH_010',

  // Request Errors
  REQ_NOT_FOUND = 'REQ_001',
  REQ_PERMISSION_DENIED = 'REQ_002',
  REQ_INVALID_DATA = 'REQ_003',
  REQ_UPDATE_FAILED = 'REQ_004',

  // Network/General Errors
  NETWORK_ERROR = 'NET_001',
  UNKNOWN_ERROR = 'GEN_001',
}

export const ERROR_MESSAGES: Record<PortalErrorCode, string> = {
  [PortalErrorCode.AUTH_USER_NOT_FOUND]: 'portal.auth.errors.userNotFound',
  [PortalErrorCode.AUTH_WRONG_PASSWORD]: 'portal.auth.errors.wrongPassword',
  [PortalErrorCode.AUTH_EMAIL_ALREADY_IN_USE]: 'portal.auth.errors.emailInUse',
  [PortalErrorCode.AUTH_WEAK_PASSWORD]: 'portal.auth.errors.weakPassword',
  [PortalErrorCode.AUTH_INVALID_EMAIL]: 'portal.auth.errors.invalidEmail',
  [PortalErrorCode.AUTH_INTERNAL_ERROR]: 'portal.auth.errors.internalError',
  [PortalErrorCode.AUTH_TOO_MANY_REQUESTS]: 'portal.auth.errors.tooManyRequests',
  [PortalErrorCode.AUTH_POPUP_CLOSED]: 'portal.auth.errors.popupClosed',
  [PortalErrorCode.AUTH_NETWORK_REQUEST_FAILED]: 'portal.auth.errors.networkError',
  [PortalErrorCode.AUTH_UNAUTHORIZED]: 'portal.auth.errors.unauthorized',

  [PortalErrorCode.REQ_NOT_FOUND]: 'portal.requests.errors.notFound',
  [PortalErrorCode.REQ_PERMISSION_DENIED]: 'portal.requests.errors.permissionDenied',
  [PortalErrorCode.REQ_INVALID_DATA]: 'portal.requests.errors.invalidData',
  [PortalErrorCode.REQ_UPDATE_FAILED]: 'portal.requests.errors.updateFailed',

  [PortalErrorCode.NETWORK_ERROR]: 'portal.errors.network',
  [PortalErrorCode.UNKNOWN_ERROR]: 'portal.errors.unknown',
};

export function getPortalError(error: unknown): PortalErrorCode {
  if (!error) return PortalErrorCode.UNKNOWN_ERROR;

  const code = (error as { code?: string }).code || (error as Error).message;

  // Map Firebase Auth errors
  switch (code) {
    case 'auth/user-not-found':
      return PortalErrorCode.AUTH_USER_NOT_FOUND;
    case 'auth/wrong-password':
      return PortalErrorCode.AUTH_WRONG_PASSWORD;
    case 'auth/email-already-in-use':
      return PortalErrorCode.AUTH_EMAIL_ALREADY_IN_USE;
    case 'auth/weak-password':
      return PortalErrorCode.AUTH_WEAK_PASSWORD;
    case 'auth/invalid-email':
      return PortalErrorCode.AUTH_INVALID_EMAIL;
    case 'auth/too-many-requests':
      return PortalErrorCode.AUTH_TOO_MANY_REQUESTS;
    case 'auth/popup-closed-by-user':
      return PortalErrorCode.AUTH_POPUP_CLOSED;
    case 'auth/network-request-failed':
      return PortalErrorCode.AUTH_NETWORK_REQUEST_FAILED;
    case 'permission-denied':
      return PortalErrorCode.REQ_PERMISSION_DENIED;
    case 'unavailable':
      return PortalErrorCode.NETWORK_ERROR;
  }

  return PortalErrorCode.UNKNOWN_ERROR;
}
