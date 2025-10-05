// Build-time database configuration
export const isDatabaseEnabled = () => {
  return Boolean(process.env.MONGODB_URI);
};

export const getDatabaseConfig = () => {
  return {
    mongoUri: process.env.MONGODB_URI || '',
    isEnabled: isDatabaseEnabled(),
  };
};