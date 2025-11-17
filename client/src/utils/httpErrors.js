export const extractValidationMessages = (details) => {
  if (!details) return [];
  const messages = [];
  const formErrors = Array.isArray(details.formErrors) ? details.formErrors : [];
  messages.push(...formErrors.filter(Boolean));
  const fieldErrors = details.fieldErrors && typeof details.fieldErrors === 'object' ? details.fieldErrors : {};
  Object.entries(fieldErrors).forEach(([field, errors]) => {
    if (!Array.isArray(errors)) return;
    errors.filter(Boolean).forEach((message) => {
      messages.push(field ? `${field}: ${message}` : message);
    });
  });
  return messages;
};

export const formatRequestError = (error, fallbackMessage = 'Request failed') => {
  const details = error?.response?.data?.details;
  const messages = extractValidationMessages(details);
  if (messages.length > 0) {
    return messages[0];
  }
  return error?.response?.data?.error || error?.message || fallbackMessage;
};
