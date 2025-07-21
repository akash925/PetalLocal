/**
 * Image utility functions for compression, validation, and processing
 */

export interface CompressionResult {
  compressedImage: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  isValid: boolean;
  error?: string;
}

/**
 * Compress an image to reduce file size while maintaining quality
 */
export function compressImage(
  file: File, 
  maxWidth: number = 1200, 
  quality: number = 0.8
): Promise<CompressionResult> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({
        compressedImage: '',
        originalSize: file.size,
        compressedSize: 0,
        compressionRatio: 0,
        isValid: false,
        error: 'File is not an image'
      });
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      const { width, height } = calculateDimensions(img.width, img.height, maxWidth);
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve({
            compressedImage: '',
            originalSize: file.size,
            compressedSize: 0,
            compressionRatio: 0,
            isValid: false,
            error: 'Failed to compress image'
          });
          return;
        }
        
        const reader = new FileReader();
        reader.onload = () => {
          const compressedImage = reader.result as string;
          const compressedSize = blob.size;
          const compressionRatio = ((file.size - compressedSize) / file.size) * 100;
          
          resolve({
            compressedImage,
            originalSize: file.size,
            compressedSize,
            compressionRatio,
            isValid: true
          });
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', quality);
    };

    img.onerror = () => {
      resolve({
        compressedImage: '',
        originalSize: file.size,
        compressedSize: 0,
        compressionRatio: 0,
        isValid: false,
        error: 'Failed to load image'
      });
    };

    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number, 
  originalHeight: number, 
  maxWidth: number
): { width: number; height: number } {
  if (originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight };
  }
  
  const aspectRatio = originalHeight / originalWidth;
  return {
    width: maxWidth,
    height: Math.round(maxWidth * aspectRatio)
  };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please select a JPEG, PNG, or WebP image file'
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Image file must be smaller than 10MB'
    };
  }
  
  return { isValid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Convert base64 data URL to File object
 */
export function dataURLtoFile(dataURL: string, filename: string): File {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}