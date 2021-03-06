
export declare interface ServiceError {
  code: number;
  message: String;
}

export const ErrorCodes = {

  UNKNOWN_ERROR: 0,

  LOAD_ACCOUNT_ERROR: 1,
  BAD_PASSWORD: 2,
  UNKNOWN_ACCOUNT_EMAIL: 3,
  EMAIL_ALREADY_REGISTERED: 4,
  UNREACHABLE_NETWORK_ERROR: 4,
  UNKNOWN_NETWORK_ERROR: 5,
  SENT_CONFIRMATION_EMAIL_FAILED: 6,
  CONFIRM_EMAIL_FAILED: 7,
  SAVE_ACCOUNT_ERROR: 8,
  ACCOUNT_NOT_EXISTS: 9,

  LOAD_REFERENTIALS_ERROR: 10,
  LOAD_REFERENTIAL_ENTITIES_ERROR: 11,
  SAVE_REFERENTIAL_ERROR: 12,
  SAVE_REFERENTIALS_ERROR: 13,
  DELETE_REFERENTIALS_ERROR: 14,
  LOAD_REFERENTIAL_LEVELS_ERROR: 15,

  // DATA errors (load error)
  LOAD_PERSONS_ERROR: 100,

  LOAD_TRIPS_ERROR: 200,
  SAVE_TRIP_ERROR: 201,
  SAVE_TRIPS_ERROR: 202,
  LOAD_OPERATIONS_ERROR: 203,

  LOAD_VESSELS_ERROR: 301,
  SAVE_VESSEL_ERROR: 302,
  SAVE_VESSELS_ERROR: 303,

  TABLE_INVALID_ROW_ERROR: 350,

  UNAUTHORIZED: 401,
  AUTH_CHALLENGE_ERROR: 601,
  AUTH_SERVER_ERROR: 602
};

export const ServerErrorCodes = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401, // not authentifcated
  FORBIDDEN: 403, // authentifcated but no access right
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  DATA_LOCKED: 520,
  BAD_UPDATE_DATE: 521,
  DENY_DELETION: 522
}