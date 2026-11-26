import AuthService from '../src/modules/auth/auth.service';
import User from '../src/modules/auth/user.model';
import Lease from '../src/modules/properties/lease.model';

jest.mock('../src/modules/auth/user.model');
jest.mock('../src/modules/properties/lease.model');

const mockUser = (roles: string[]) => ({
  _id: { toString: () => 'user123' },
  phoneNumber: '+15550000000',
  roles,
  approved: false,
});

describe('AuthService.verifyOtp', () => {
  beforeEach(() => {
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
    (User.updateOne as jest.Mock).mockResolvedValue({});
  });

  it('returns null for an invalid OTP', async () => {
    const result = await AuthService.verifyOtp('+15550000000', '000000');

    expect(result).toBeNull();
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('creates a new user with no roles', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (User.create as jest.Mock).mockResolvedValue(mockUser([]));
    (Lease.findOne as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

    const result = await AuthService.verifyOtp('+15550000000', '123456');

    expect(User.create).toHaveBeenCalledWith({ phoneNumber: '+15550000000', roles: [] });
    expect(result?.user.roles).toEqual([]);
  });

  it('skips the lease lookup for a property owner who is not a tenant', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser(['propertyOwner']));

    const result = await AuthService.verifyOtp('+15550000000', '123456');

    expect(Lease.findOne).not.toHaveBeenCalled();
    expect(result?.user).not.toHaveProperty('lease');
    expect(result?.user).not.toHaveProperty('property');
  });

  it('returns the active lease for a user who is both owner and tenant', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser(['propertyOwner', 'tenant']));
    (Lease.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: { toString: () => 'lease123' },
        monthlyRent: 1500,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-01-01'),
        propertyId: { _id: { toString: () => 'prop123' }, streetAddress: '1 Main St' },
      }),
    });

    const result = await AuthService.verifyOtp('+15550000000', '123456');

    expect(Lease.findOne).toHaveBeenCalledWith({ tenantId: expect.anything(), status: 'active' });
    expect(result?.user).toMatchObject({
      property: { id: 'prop123', streetAddress: '1 Main St' },
      lease: { id: 'lease123', monthlyRent: 1500, durationMonths: 12, term: '1-Year Lease' },
    });
  });
});
