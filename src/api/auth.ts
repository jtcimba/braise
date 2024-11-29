import {AuthUser, getCurrentUser} from 'aws-amplify/auth';

class AuthService {
  async getUser(): Promise<AuthUser | null> {
    try {
      const user = await getCurrentUser();
      return user;
    } catch (error) {
      console.error('Error getting AWS ID:', error);
      return null;
    }
  }

  async getUserId(): Promise<string | null> {
    try {
      const user = await this.getUser();
      const awsId = user?.userId;
      if (!awsId) {
        console.log('AWS ID not found');
        throw new Error('AWS ID not found');
      }

      const response = await fetch(
        `${process.env.API_URL}users?awsid=${awsId}`,
      );
      if (!response.ok) {
        console.log('Failed to fetch user ID');
        throw new Error('Failed to fetch user ID');
      }

      const data = await response.json();
      return data[0]?.id;
    } catch (error) {
      console.error('Error getting User ID:', error);
      return null;
    }
  }
}

export default new AuthService();
