import {AuthService} from './index';

class ImageService {
  async uploadImage(imageUri: string, fileName?: string): Promise<string> {
    try {
      const idToken = await AuthService.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get ID token');
      }

      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix (data:image/jpeg;base64,)
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const requestBody = {
        image_data: base64,
        filename: fileName || 'image.jpg',
      };

      const uploadResponse = await fetch(
        `${process.env.API_URL}images/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Failed to upload image. Status:', uploadResponse.status);
        console.error('Error response:', errorText);
        throw new Error(
          `Failed to upload image: ${uploadResponse.status} ${errorText}`,
        );
      }

      const result = await uploadResponse.json();
      return result.image_url; // Return the URL of the uploaded image
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const userId = await AuthService.getUserId();
      const idToken = await AuthService.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get ID token');
      }

      const response = await fetch(`${process.env.API_URL}images/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to delete image. Status:', response.status);
        console.error('Error response:', errorText);

        // If image not found (404), don't throw error - just log and continue
        if (response.status === 404) {
          console.warn('Image not found for deletion, continuing...');
          return;
        }

        throw new Error(
          `Failed to delete image: ${response.status} ${errorText}`,
        );
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
}

export default new ImageService();
