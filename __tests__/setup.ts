// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-12345';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-67890';
  process.env.JWT_ACCESS_EXPIRES_IN = '1000m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.MONGO_URI = 'mongodb+srv://himelhimu6_db_user:nestral-app@cluster0.vxlpsqd.mongodb.net/?appName=Cluster0';
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Cleanup if needed
});

afterEach(() => {
  jest.clearAllMocks();
});
