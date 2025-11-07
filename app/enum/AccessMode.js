// Access Mode enum for Operations portal
export const AccessMode = {
  OPERATIONS: 'Operations'
};

// Helper function to check if user has Operations access (case-insensitive)
export const hasOperationsAccess = (userAccessMode) => {
  if (!userAccessMode) return false;
  return userAccessMode.toLowerCase() === AccessMode.OPERATIONS.toLowerCase();
};

