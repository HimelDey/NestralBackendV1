import AuthService from '../src/modules/auth/auth.service';
import User from '../src/modules/auth/user.model';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';

// Mock the User model
jest.mock('../src/modules/auth/user.model');

describe('AuthService - Landlord Registration Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // TEST 1: Register landlord with valid data
  // ========================================
  describe('✅ Test 1: Register landlord with valid data', () => {
    it('should register landlord with PENDING status (approved: false)', async () => {

      const validLandlordData = {
        email: 'landlord@example.com',
        password: 'SecureLandlord123!',
        phoneNumber: '+1234567890',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'landlord' as const
      };

      // Mock: User doesn't exist
      (User.findOne as jest.Mock).mockResolvedValue(null);

      // Mock: User creation with approved: false (PENDING)
      const mockCreatedUser = {
        _id: 'landlord123',
        email: validLandlordData.email,
        phoneNumber: validLandlordData.phoneNumber,
        firstName: validLandlordData.firstName,
        lastName: validLandlordData.lastName,
        userType: 'landlord',
        approved: false, // PENDING status
        password: 'salt:hashedpassword',
        toObject: jest.fn().mockReturnValue({
          email: validLandlordData.email,
          phoneNumber: validLandlordData.phoneNumber,
          firstName: validLandlordData.firstName,
          lastName: validLandlordData.lastName,
          userType: 'landlord',
          approved: false
        })
      };
      (User.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      // Mock: Update with refresh token
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockCreatedUser);

      // Act
      const result = await AuthService.registerUser(validLandlordData);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      
      // Verify PENDING status
      expect(result.user.approved).toBe(false);
      expect(result.user.userType).toBe('landlord');
      expect(result.user.email).toBe(validLandlordData.email);
      
      // Verify password not in response
      expect(result.user).not.toHaveProperty('password');
      
      // Verify DB calls
      expect(User.findOne).toHaveBeenCalledWith({ email: validLandlordData.email });
      expect(User.create).toHaveBeenCalledTimes(1);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'landlord123',
        { refreshToken: expect.any(String) }
      );
    });

    it('should generate valid JWT tokens for landlord', async () => {
      // Arrange
      const validLandlordData = {
        email: 'landlord@example.com',
        password: 'SecureLandlord123!',
        userType: 'landlord' as const
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      const mockUser = {
        _id: 'landlord123',
        email: validLandlordData.email,
        userType: 'landlord',
        approved: false,
        toObject: jest.fn().mockReturnValue({
          email: validLandlordData.email,
          userType: 'landlord',
          approved: false
        })
      };
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await AuthService.registerUser(validLandlordData);

      // Assert - Verify access token
      const decodedAccess = jwt.verify(result.token, config.jwtAccessSecret) as any;
      expect(decodedAccess.id).toBe('landlord123');
      expect(decodedAccess.email).toBe(validLandlordData.email);

      // Assert - Verify refresh token
      const decodedRefresh = jwt.verify(result.refreshToken, config.jwtRefreshSecret) as any;
      expect(decodedRefresh.id).toBe('landlord123');
      expect(decodedRefresh.email).toBe(validLandlordData.email);
    });
  });

  // ========================================
  // TEST 2: Missing mandatory fields
  // ========================================
  describe('❌ Test 2: Missing mandatory fields - 400 validation error', () => {
    it('should return 400 when email is missing', async () => {
      // Arrange
      const incompleteData = {
        password: 'SecureLandlord123!',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'landlord' as const
      };

      // Act & Assert
      await expect(AuthService.registerUser(incompleteData as any))
        .rejects
        .toThrow('Email is required');

      // Verify no DB calls made
      expect(User.findOne).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should return 400 when password is missing', async () => {
      // Arrange
      const incompleteData = {
        email: 'landlord@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'landlord' as const
      };

      // Act & Assert
      await expect(AuthService.registerUser(incompleteData as any))
        .rejects
        .toThrow('Password is required');

      // Verify no DB calls made
      expect(User.findOne).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should return 400 when email is empty string', async () => {
      // Arrange
      const incompleteData = {
        email: '',
        password: 'SecureLandlord123!',
        userType: 'landlord' as const
      };

      // Act & Assert
      await expect(AuthService.registerUser(incompleteData))
        .rejects
        .toThrow('Email is required');
    });

    it('should return 400 when password is empty string', async () => {
      // Arrange
      const incompleteData = {
        email: 'landlord@example.com',
        password: '',
        userType: 'landlord' as const
      };

      // Act & Assert
      await expect(AuthService.registerUser(incompleteData))
        .rejects
        .toThrow('Password is required');
    });

    it('should return 400 when both email and password are missing', async () => {
      // Arrange
      const incompleteData = {
        firstName: 'John',
        lastName: 'Doe',
        userType: 'landlord' as const
      };

      // Act & Assert
      await expect(AuthService.registerUser(incompleteData as any))
        .rejects
        .toThrow('Email is required');
    });
  });

  // ========================================
  // TEST 3: Duplicate email registration
  // ========================================
  describe('❌ Test 3: Duplicate email registration', () => {
    it('should throw "User already exists" error when email exists', async () => {
      // Arrange
      const duplicateEmailData = {
        email: 'existing@example.com',
        password: 'SecureLandlord123!',
        userType: 'landlord' as const
      };

      // Mock: User already exists
      const existingUser = {
        _id: 'existing123',
        email: duplicateEmailData.email,
        userType: 'landlord'
      };
      (User.findOne as jest.Mock).mockResolvedValue(existingUser);

      // Act & Assert
      await expect(AuthService.registerUser(duplicateEmailData))
        .rejects
        .toThrow('User already exists');

      // Verify User.create was NOT called
      expect(User.findOne).toHaveBeenCalledWith({ email: duplicateEmailData.email });
      expect(User.create).not.toHaveBeenCalled();
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should check email existence before creating user', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        password: 'SecurePass123!',
        userType: 'landlord' as const
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      const mockUser = {
        _id: 'user123',
        email: userData.email,
        approved: false,
        toObject: jest.fn().mockReturnValue({ email: userData.email, approved: false })
      };
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await AuthService.registerUser(userData);

      // Assert - User.findOne called BEFORE User.create
      const findOneCallOrder = (User.findOne as jest.Mock).mock.invocationCallOrder[0];
      const createCallOrder = (User.create as jest.Mock).mock.invocationCallOrder[0];
      expect(findOneCallOrder).toBeLessThan(createCallOrder);
    });
  });

  // ========================================
  // TEST 4: Password encryption
  // ========================================
  describe('🔐 Test 4: Password encryption - Password stored as hash', () => {
    it('should store password as hash in salt:hash format', async () => {
      // Arrange
      const userData = {
        email: 'landlord@example.com',
        password: 'PlainTextPassword123',
        userType: 'landlord' as const
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      const mockUser = {
        _id: 'user123',
        email: userData.email,
        approved: false,
        toObject: jest.fn().mockReturnValue({ email: userData.email, approved: false })
      };
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await AuthService.registerUser(userData);

      // Assert
      const createCallArgs = (User.create as jest.Mock).mock.calls[0][0];
      const storedPassword = createCallArgs.password;

      // Verify password is hashed (contains colon separator)
      expect(storedPassword).toContain(':');
      
      // Verify it's not plain text
      expect(storedPassword).not.toBe(userData.password);
      
      // Verify format: salt:hash (both should be hex strings)
      const [salt, hash] = storedPassword.split(':');
      expect(salt).toMatch(/^[a-f0-9]+$/); // hex string
      expect(hash).toMatch(/^[a-f0-9]+$/); // hex string
      expect(salt.length).toBe(32); // 16 bytes = 32 hex chars
      expect(hash.length).toBe(128); // 64 bytes = 128 hex chars
    });

    it('should generate different hashes for same password (due to salt)', async () => {
      // Arrange
      const userData1 = {
        email: 'user1@example.com',
        password: 'SamePassword123',
        userType: 'landlord' as const
      };
      const userData2 = {
        email: 'user2@example.com',
        password: 'SamePassword123',
        userType: 'landlord' as const
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      const mockUser = {
        _id: 'user123',
        approved: false,
        toObject: jest.fn().mockReturnValue({ email: 'test', approved: false })
      };
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await AuthService.registerUser(userData1);
      const hash1 = (User.create as jest.Mock).mock.calls[0][0].password;

      await AuthService.registerUser(userData2);
      const hash2 = (User.create as jest.Mock).mock.calls[1][0].password;

      // Assert - Different salts = different hashes
      expect(hash1).not.toBe(hash2);
    });

    it('should never store plain text password', async () => {
      // Arrange
      const userData = {
        email: 'landlord@example.com',
        password: 'MySecretPassword',
        userType: 'landlord' as const
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      const mockUser = {
        _id: 'user123',
        approved: false,
        toObject: jest.fn().mockReturnValue({ email: userData.email, approved: false })
      };
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await AuthService.registerUser(userData);

      // Assert
      const createCallArgs = (User.create as jest.Mock).mock.calls[0][0];
      expect(createCallArgs.password).not.toContain('MySecretPassword');
      expect(createCallArgs.password).not.toBe(userData.password);
    });
  });

  // ========================================
  // TEST 5: DB failure handling
  // ========================================
  describe('💥 Test 5: DB failure handling - Proper error response', () => {
    it('should handle DB connection failure during User.findOne', async () => {
      // Arrange
      const userData = {
        email: 'landlord@example.com',
        password: 'SecurePass123!',
        userType: 'landlord' as const
      };

      // Mock DB failure
      const dbError = new Error('Database connection failed');
      (User.findOne as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(AuthService.registerUser(userData))
        .rejects
        .toThrow('Database connection failed');

      // Verify User.create was not called
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should handle DB failure during User.create', async () => {
      // Arrange
      const userData = {
        email: 'landlord@example.com',
        password: 'SecurePass123!',
        userType: 'landlord' as const
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      // Mock DB failure on create
      const dbError = new Error('Cannot insert document');
      (User.create as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(AuthService.registerUser(userData))
        .rejects
        .toThrow('Cannot insert document');

      // Verify findByIdAndUpdate was not called
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should handle DB failure during refresh token update', async () => {
      // Arrange
      const userData = {
        email: 'landlord@example.com',
        password: 'SecurePass123!',
        userType: 'landlord' as const
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      const mockUser = {
        _id: 'user123',
        email: userData.email,
        approved: false,
        toObject: jest.fn().mockReturnValue({ email: userData.email, approved: false })
      };
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      
      // Mock DB failure on update
      const dbError = new Error('Update operation failed');
      (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(AuthService.registerUser(userData))
        .rejects
        .toThrow('Update operation failed');
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      const userData = {
        email: 'landlord@example.com',
        password: 'SecurePass123!',
        userType: 'landlord' as const
      };

      // Mock network timeout
      const timeoutError = new Error('ETIMEDOUT');
      timeoutError.name = 'MongoNetworkError';
      (User.findOne as jest.Mock).mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(AuthService.registerUser(userData))
        .rejects
        .toThrow('ETIMEDOUT');
    });

    it('should propagate Mongoose validation errors', async () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        userType: 'landlord' as const
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      // Mock Mongoose validation error
      const validationError = new Error('Validation failed: email is invalid');
      validationError.name = 'ValidationError';
      (User.create as jest.Mock).mockRejectedValue(validationError);

      // Act & Assert
      await expect(AuthService.registerUser(userData))
        .rejects
        .toThrow('Validation failed');
    });
  });
});
