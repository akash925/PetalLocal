import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Sparkles, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SmartImageUploaderProps {
  onImageSelect: (imageData: string) => void;
  onAnalysisComplete?: (analysis: {
    plantType?: string;
    category?: string;
    estimatedQuantity?: number;
    unit?: string;
    suggestions?: {
      name?: string;
      description?: string;
      priceRange?: string;
    };
  }) => void;
  existingImage?: string;
  showAnalyzeButton?: boolean;
  className?: string;
}

export function SmartImageUploader({
  onImageSelect,
  onAnalysisComplete,
  existingImage,
  showAnalyzeButton = true,
  className = "",
}: SmartImageUploaderProps) {
  const [imageData, setImageData] = useState<string | null>(existingImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const compressImage = useCallback((file: File, quality: number = 0.8): Promise<{ dataUrl: string; compressedSize: number }> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const objectUrl = URL.createObjectURL(file);
      
      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
      };
      
      img.onerror = () => {
        cleanup();
        reject(new Error('Failed to load image'));
      };
      
      img.onload = () => {
        cleanup();
        try {
          // Calculate new dimensions (max 1200px width/height)
          const maxSize = 1200;
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
          
          if (!ctx) {
            throw new Error('Could not get canvas context');
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Calculate compressed size (rough estimate)
          const compressedSize = Math.round((compressedDataUrl.length * 3) / 4);
          
          resolve({ dataUrl: compressedDataUrl, compressedSize });
        } catch (error) {
          reject(error);
        }
      };
      
      img.src = objectUrl;
    });
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const originalSize = file.size;
      const { dataUrl, compressedSize } = await compressImage(file);
      
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
      
      setCompressionStats({
        originalSize,
        compressedSize,
        compressionRatio,
      });
      
      setImageData(dataUrl);
      onImageSelect(dataUrl);
      
      toast({
        title: "Image uploaded successfully",
        description: `Compressed ${compressionRatio.toFixed(1)}% (${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(compressedSize / 1024 / 1024).toFixed(1)}MB)`,
      });
      
      // Auto-analyze if enabled
      if (showAnalyzeButton) {
        handleAnalyze(dataUrl);
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [compressImage, onImageSelect, showAnalyzeButton, toast]);

  const handleAnalyze = async (imageDataToAnalyze?: string) => {
    const targetImage = imageDataToAnalyze || imageData;
    if (!targetImage) {
      toast({
        title: "No image to analyze",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Extract base64 data from data URL
      const base64Data = targetImage.split(',')[1];
      
      const response = await apiRequest("POST", "/api/analyze-plant", {
        image: base64Data,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalysisResult(result);
        if (onAnalysisComplete) {
          onAnalysisComplete({
            plantType: result.plantType,
            category: result.category,
            estimatedQuantity: result.estimatedQuantity,
            unit: result.unit,
            suggestions: result.suggestions,
          });
        }
        
        toast({
          title: "Analysis complete!",
          description: `Identified: ${result.plantType || 'Unknown plant'} ${result.estimatedQuantity ? `(~${result.estimatedQuantity} ${result.unit || 'items'})` : ''}`,
        });
      } else {
        toast({
          title: "Analysis failed",
          description: result.error || "Could not analyze the image",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Analysis error",
        description: "Failed to analyze the image. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const removeImage = () => {
    setImageData(null);
    setAnalysisResult(null);
    setCompressionStats(null);
    onImageSelect('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Product Image</h3>
            {showAnalyzeButton && imageData && (
              <Button
                onClick={() => handleAnalyze()}
                disabled={isAnalyzing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isAnalyzing ? "Analyzing..." : "AI Analyze"}
              </Button>
            )}
          </div>
          
          <p className="text-sm text-gray-600">
            Add a high-quality image of your produce (max 10MB, auto-compressed)
          </p>

          {!imageData ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h4 className="text-lg font-medium mb-2">Upload a photo</h4>
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop or click to select an image (max 10MB, auto-compressed)
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isUploading ? "Processing..." : "Select Image"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={imageData}
                  alt="Product preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  onClick={removeImage}
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {compressionStats && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Valid Image</span>
                  <Badge variant="secondary">
                    Compressed {compressionStats.compressionRatio.toFixed(0)}% 
                    ({formatFileSize(compressionStats.originalSize)} → {formatFileSize(compressionStats.compressedSize)})
                  </Badge>
                </div>
              )}
              
              {analysisResult && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">AI Analysis Results</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {analysisResult.plantType && (
                      <p><strong>Plant:</strong> {analysisResult.plantType}</p>
                    )}
                    {analysisResult.category && (
                      <p><strong>Category:</strong> {analysisResult.category}</p>
                    )}
                    {analysisResult.estimatedQuantity && (
                      <p><strong>Estimated Quantity:</strong> {analysisResult.estimatedQuantity} {analysisResult.unit || 'items'}</p>
                    )}
                    {analysisResult.suggestions?.name && (
                      <p><strong>Suggested Name:</strong> {analysisResult.suggestions.name}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}