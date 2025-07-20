/**
 * Comprehensive image utilities for compression and validation
 * Ensures all platform images are optimized and valid
 */

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  fileSize: number;
  dimensions: { width: number; height: number };
}

export interface CompressionResult {
  compressedDataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Validates image file before processing
 */
export function validateImageFile(file: File): Promise<ImageValidationResult> {
  return new Promise((resolve, reject) => {
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      resolve({
        isValid: false,
        error: 'File size too large (max 50MB)',
        fileSize: file.size,
        dimensions: { width: 0, height: 0 }
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      resolve({
        isValid: false,
        error: 'Please select a valid image file',
        fileSize: file.size,
        dimensions: { width: 0, height: 0 }
      });
      return;
    }

    // Validate image by loading it
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      // Check dimensions (minimum 100x100, maximum 8000x8000)
      if (img.width < 100 || img.height < 100) {
        resolve({
          isValid: false,
          error: 'Image too small (minimum 100x100 pixels)',
          fileSize: file.size,
          dimensions: { width: img.width, height: img.height }
        });
        return;
      }
      
      if (img.width > 8000 || img.height > 8000) {
        resolve({
          isValid: false,
          error: 'Image too large (maximum 8000x8000 pixels)',
          fileSize: file.size,
          dimensions: { width: img.width, height: img.height }
        });
        return;
      }
      
      resolve({
        isValid: true,
        fileSize: file.size,
        dimensions: { width: img.width, height: img.height }
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        isValid: false,
        error: 'Invalid or corrupted image file',
        fileSize: file.size,
        dimensions: { width: 0, height: 0 }
      });
    };
    
    img.src = objectUrl;
  });
}

/**
 * Compresses image with intelligent quality settings
 */
export function compressImage(file: File, maxSize: number = 1200, quality: number = 0.8): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Use better image rendering
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }
      
      // Compress to JPEG with specified quality
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      
      // Calculate compression stats
      const originalSize = file.size;
      const compressedSize = Math.round((compressedDataUrl.length * 3) / 4);
      const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
      
      resolve({
        compressedDataUrl,
        originalSize,
        compressedSize,
        compressionRatio
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = objectUrl;
  });
}

/**
 * All-in-one image processing: validate + compress
 */
export async function processImage(file: File, options: {
  maxSize?: number;
  quality?: number;
} = {}): Promise<{
  success: boolean;
  dataUrl?: string;
  validation?: ImageValidationResult;
  compression?: CompressionResult;
  error?: string;
}> {
  try {
    // First validate the image
    const validation = await validateImageFile(file);
    
    if (!validation.isValid) {
      return {
        success: false,
        validation,
        error: validation.error
      };
    }
    
    // Then compress it
    const compression = await compressImage(file, options.maxSize, options.quality);
    
    return {
      success: true,
      dataUrl: compression.compressedDataUrl,
      validation,
      compression
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to process image'
    };
  }
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
 * Generate image preview from file
 */
export function generateImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Check if file is a valid image type
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(file.type.toLowerCase());
}

/**
 * Check if image dimensions are within acceptable range
 */
export function checkImageDimensions(width: number, height: number): {
  isValid: boolean;
  error?: string;
} {
  if (width < 100 || height < 100) {
    return {
      isValid: false,
      error: 'Image too small (minimum 100x100 pixels)'
    };
  }
  
  if (width > 8000 || height > 8000) {
    return {
      isValid: false,
      error: 'Image too large (maximum 8000x8000 pixels)'
    };
  }
  
  return { isValid: true };
}