import {AuthUser, getCurrentUser, fetchAuthSession} from 'aws-amplify/auth';

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

  async getIdToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      console.log('Auth session:', session);
      const idToken = session.tokens?.idToken?.toString();
      console.log('ID token:', idToken ? 'present' : 'missing');
      if (!idToken) {
        throw new Error('ID token not found');
      }
      return idToken;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  async getUserId(): Promise<string | null> {
    try {
      const user = await this.getUser();
      const awsId = user?.userId;
      if (!awsId) {
        throw new Error('AWS ID not found');
      }

      const idToken = await this.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get ID token');
      }

      const apiUrl = `${process.env.API_URL}users?awsid=${awsId}`;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('User lookup failed. Status:', response.status);
        console.error('Error response:', errorText);

        if (response.status === 401 || response.status === 403) {
          console.error(
            'Authentication error - token may be invalid or expired',
          );
        }

        throw new Error(
          `Failed to fetch user ID: ${response.status} ${errorText}`,
        );
      }

      const data = await response.json();

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('No user found for AWS ID:', awsId);
        return null;
      }

      return data[0]?.id;
    } catch (error) {
      console.error('Error getting User ID:', error);
      return null;
    }
  }
}

export default new AuthService();
