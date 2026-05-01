import { storageModular as storage } from './config';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';

export async function uploadProductImages(
  images: string[], 
  productId: string, 
  onProgress?: (progress: number) => void
): Promise<string[]> {
  const totalFiles = images.length;
  let completedFiles = 0;

  const uploadTask = async (imageUri: string, retryCount = 0): Promise<string> => {
    try {
      // 1. Read file as Base64 using Expo FileSystem (Most reliable for iOS/Android)
      // This bypasses Blob/XHR issues entirely
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 2. Create reference
      const filename = imageUri.split('/').pop() || `image_${Date.now()}.jpg`;
      const fileRef = ref(storage, `products/${productId}/${Date.now()}_${filename}`);
      
      // 3. Upload as Base64 string
      const metadata = {
        contentType: 'image/jpeg',
      };
      
      await uploadString(fileRef, base64, 'base64', metadata);
      
      // 4. Get URL
      const url = await getDownloadURL(fileRef);
      
      completedFiles++;
      if (onProgress) {
        onProgress(completedFiles / totalFiles);
      }
      return url;
    } catch (error: any) {
      console.error(`Upload error for ${imageUri}:`, error);
      
      if (error.code) {
        console.error(`Firebase Storage Error Code: ${error.code}`);
      }

      if (retryCount < 2) {
        console.log(`Retrying upload (${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return uploadTask(imageUri, retryCount + 1);
      }
      throw error;
    }
  };

  // Upload sequentially
  const urls: string[] = [];
  for (const img of images) {
    const url = await uploadTask(img);
    urls.push(url);
  }
  
  return urls;
}
