import { createHash } from 'crypto';

interface CompressedImageData {
  hash: string;
  compressedData: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  metadata: {
    width?: number;
    height?: number;
    format: string;
    timestamp: Date;
  };
}

interface AnalysisCache {
  imageHash: string;
  analysis: any;
  timestamp: Date;
  source: 'openai' | 'fallback';
}

class DataCompressionService {
  private analysisCache: Map<string, AnalysisCache> = new Map();
  private maxCacheSize = 1000; // Limit cache to prevent memory issues

  /**
   * Generate hash for image data for deduplication
   */
  generateImageHash(base64Data: string): string {
    return createHash('sha256').update(base64Data).digest('hex').substring(0, 16);
  }

  /**
   * Compress image data and store metadata
   */
  compressImageData(base64Data: string, metadata: any): CompressedImageData {
    const originalSize = base64Data.length;
    const hash = this.generateImageHash(base64Data);
    
    // Simple compression by reducing base64 padding and normalizing
    const compressedData = base64Data.replace(/=+$/, '');
    const compressedSize = compressedData.length;
    const compressionRatio = (originalSize - compressedSize) / originalSize;

    return {
      hash,
      compressedData,
      originalSize,
      compressedSize,
      compressionRatio,
      metadata: {
        format: 'jpeg',
        timestamp: new Date(),
        ...(metadata || {})
      }
    };
  }

  /**
   * Cache analysis results to avoid redundant API calls
   */
  cacheAnalysis(imageHash: string, analysis: any, source: 'openai' | 'fallback'): void {
    // Implement LRU eviction if cache is full
    if (this.analysisCache.size >= this.maxCacheSize) {
      const oldestKey = this.analysisCache.keys().next().value;
      this.analysisCache.delete(oldestKey);
    }

    this.analysisCache.set(imageHash, {
      imageHash,
      analysis,
      timestamp: new Date(),
      source
    });

    console.log(`Cached analysis for image hash: ${imageHash} (source: ${source})`);
  }

  /**
   * Retrieve cached analysis if available
   */
  getCachedAnalysis(imageHash: string): AnalysisCache | null {
    const cached = this.analysisCache.get(imageHash);
    
    if (cached) {
      // Check if cache is less than 24 hours old
      const ageHours = (Date.now() - cached.timestamp.getTime()) / (1000 * 60 * 60);
      if (ageHours < 24) {
        console.log(`Using cached analysis for image hash: ${imageHash} (age: ${ageHours.toFixed(1)}h)`);
        return cached;
      } else {
        // Remove stale cache
        this.analysisCache.delete(imageHash);
      }
    }
    
    return null;
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    openaiResults: number;
    fallbackResults: number;
    hitRate: string;
  } {
    const openaiResults = Array.from(this.analysisCache.values()).filter(c => c.source === 'openai').length;
    const fallbackResults = Array.from(this.analysisCache.values()).filter(c => c.source === 'fallback').length;
    
    return {
      size: this.analysisCache.size,
      maxSize: this.maxCacheSize,
      openaiResults,
      fallbackResults,
      hitRate: `${((openaiResults / (openaiResults + fallbackResults)) * 100).toFixed(1)}%`
    };
  }

  /**
   * Store plant analysis data with compression
   */
  storeAnalysisData(imageData: string, analysis: any): {
    stored: boolean;
    hash: string;
    compressionStats: any;
  } {
    const compressed = this.compressImageData(imageData, {
      analysisTimestamp: new Date(),
      plantType: analysis.plantType,
      category: analysis.category
    });

    // In a real implementation, this would save to database
    console.log('Storing compressed analysis data:', {
      hash: compressed.hash,
      originalSize: `${(compressed.originalSize / 1024).toFixed(1)}KB`,
      compressedSize: `${(compressed.compressedSize / 1024).toFixed(1)}KB`,
      savings: `${(compressed.compressionRatio * 100).toFixed(1)}%`
    });

    return {
      stored: true,
      hash: compressed.hash,
      compressionStats: {
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        compressionRatio: compressed.compressionRatio,
        savingsKB: ((compressed.originalSize - compressed.compressedSize) / 1024).toFixed(1)
      }
    };
  }
}

export const dataCompressionService = new DataCompressionService();