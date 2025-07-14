import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, Link, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  description?: string;
  placeholder?: string;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  label = "Image",
  description = "Add an image URL",
  placeholder = "Enter image URL (e.g., https://example.com/image.jpg)",
  className = "",
}: ImageUploaderProps) {
  const [url, setUrl] = useState(value || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const { toast } = useToast();

  const validateImageUrl = async (imageUrl: string) => {
    if (!imageUrl) {
      setIsValid(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      
      if (response.ok && contentType && contentType.startsWith('image/')) {
        setIsValid(true);
        onChange(imageUrl);
        toast({
          title: "Image validated",
          description: "Image URL is valid and accessible",
        });
      } else {
        setIsValid(false);
        toast({
          title: "Invalid image URL",
          description: "Please provide a valid image URL",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsValid(false);
      toast({
        title: "Image validation failed",
        description: "Could not validate image URL. Please check the URL.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (newUrl !== value) {
      setIsValid(false);
    }
  };

  const handleValidate = () => {
    if (url.trim()) {
      validateImageUrl(url.trim());
    }
  };

  const getImageSuggestions = () => [
    {
      title: "Unsplash",
      description: "High-quality free images",
      url: "https://unsplash.com/s/photos/farm",
    },
    {
      title: "Pexels",
      description: "Free stock photos",
      url: "https://www.pexels.com/search/agriculture/",
    },
    {
      title: "Pixabay",
      description: "Free images and vectors",
      url: "https://pixabay.com/images/search/farm/",
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label htmlFor="image-url" className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            id="image-url"
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleValidate}
            disabled={!url.trim() || isLoading}
            className="px-3"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            ) : isValid ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Link className="w-4 h-4" />
            )}
          </Button>
        </div>

        {url && (
          <div className="relative">
            <img
              src={url}
              alt="Preview"
              className="w-full h-32 object-cover rounded-lg border"
              onError={() => {
                setIsValid(false);
                toast({
                  title: "Image failed to load",
                  description: "Please check the image URL",
                  variant: "destructive",
                });
              }}
              onLoad={() => {
                if (!isValid && url === value) {
                  setIsValid(true);
                }
              }}
            />
            {isValid && (
              <Badge className="absolute top-2 right-2 bg-green-500">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Valid
              </Badge>
            )}
          </div>
        )}
      </div>

      <Card className="bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <ImagePlus className="w-4 h-4 mr-2" />
            Need images? Try these sources:
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {getImageSuggestions().map((source) => (
              <div key={source.title} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{source.title}</span>
                  <span className="text-gray-600 ml-2">{source.description}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(source.url, '_blank')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Visit
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Image Requirements:</p>
          <ul className="mt-1 text-xs space-y-1">
            <li>• Use publicly accessible URLs (https://)</li>
            <li>• Supported formats: JPG, PNG, GIF, WebP</li>
            <li>• Recommended size: 800x600 pixels or larger</li>
            <li>• Ensure you have rights to use the image</li>
          </ul>
        </div>
      </div>
    </div>
  );
}