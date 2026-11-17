// Job Description Validation Constraints (Shared with backend)
export const JOB_DESCRIPTION_MIN_LENGTH = 100;
export const JOB_DESCRIPTION_MAX_LENGTH = 10000;

export const JOB_DESCRIPTION_VALIDATION_MESSAGES = {
  TOO_SHORT: 'Job description must be at least 100 characters.',
  TOO_LONG: 'Job description must be 10,000 characters or less.',
  REQUIRED: 'Job description is required and cannot be empty.',
};
