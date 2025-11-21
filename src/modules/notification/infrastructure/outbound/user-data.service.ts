import { Injectable } from '@nestjs/common';

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  companyName: string;
  phone?: string;
}

@Injectable()
export class UserDataService {
  private readonly mockUsers: Map<string, UserData> = new Map([
    [
      'user-001',
      {
        id: 'user-001',
        email: 'john.doe@techcorp.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        companyName: 'TechCorp Solutions',
        phone: '+1-555-0123',
      },
    ],
    [
      'user-002',
      {
        id: 'user-002',
        email: 'sarah.smith@innovatetech.com',
        firstName: 'Sarah',
        lastName: 'Smith',
        fullName: 'Sarah Smith',
        companyName: 'InnovateTech Ltd',
        phone: '+1-555-0456',
      },
    ],
    [
      'user-003',
      {
        id: 'user-003',
        email: 'mike.johnson@globaltech.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        fullName: 'Mike Johnson',
        companyName: 'GlobalTech Industries',
        phone: '+1-555-0789',
      },
    ],
  ]);

  /**
   * Get user data by user ID - returns static mock data
   * @param userId - The ID of the user
   * @returns Promise<UserData> - User data object
   */
  getUserById(userId: string): Promise<UserData> {
    const user = this.mockUsers.get(userId);

    if (!user) {
      const defaultUser: UserData = {
        id: userId,
        email: `user-${userId}@example.com`,
        firstName: 'Unknown',
        lastName: 'User',
        fullName: 'Unknown User',
        companyName: 'Unknown Company',
      };
      return Promise.resolve(defaultUser);
    }

    return Promise.resolve(user);
  }
}
