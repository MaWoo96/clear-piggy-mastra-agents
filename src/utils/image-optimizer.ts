/**
 * Image Optimization Utilities for Clear Piggy Mobile
 * Advanced image analysis, WebP conversion, and responsive image generation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  ImageOptimizationAnalysis,
  ImageOptimization,
  ResponsiveImageRecommendation,
  ResponsiveBreakpoint
} from '../types/performance-optimization-types';

export class ImageOptimizer {
  private projectPath: string;
  private outputPath: string;

  constructor(projectPath: string, outputPath: string = 'optimized-images') {
    this.projectPath = projectPath;
    this.outputPath = outputPath;
  }

  /**
   * Analyze all images in the project for optimization opportunities
   */
  async analyzeImages(): Promise<ImageOptimizationAnalysis> {
    console.log('🖼️ Analyzing images for optimization opportunities...');

    const imagePaths = await this.findAllImages();
    const optimizations: ImageOptimization[] = [];
    let totalSize = 0;

    for (const imagePath of imagePaths) {
      const optimization = await this.analyzeImage(imagePath);
      if (optimization) {
        optimizations.push(optimization);
        totalSize += optimization.originalSize;
      }
    }

    const webpCandidates = optimizations
      .filter(opt => opt.format !== 'webp' && opt.originalSize > 10000)
      .map(opt => opt.filePath);

    const responsiveImageNeeds = await this.generateResponsiveImageRecommendations(optimizations);

    return {
      totalImages: optimizations.length,
      totalSize,
      optimizationOpportunities: optimizations.sort((a, b) => 
        (b.originalSize - b.optimizedSize) - (a.originalSize - a.optimizedSize)
      ),
      webpCandidates,
      responsiveImageNeeds
    };
  }

  /**
   * Generate optimized images and responsive variants
   */
  async optimizeImages(analysis: ImageOptimizationAnalysis): Promise<void> {
    console.log('🔧 Generating optimized images...');

    const outputDir = path.join(this.projectPath, this.outputPath);
    await this.ensureDirectoryExists(outputDir);

    // Generate WebP conversions
    for (const imagePath of analysis.webpCandidates) {
      await this.generateWebPVersion(imagePath, outputDir);
    }

    // Generate responsive image variants
    for (const responsive of analysis.responsiveImageNeeds) {
      await this.generateResponsiveVariants(responsive, outputDir);
    }

    // Generate optimized versions of existing images
    for (const optimization of analysis.optimizationOpportunities) {
      if (optimization.originalSize > optimization.optimizedSize) {
        await this.generateOptimizedVersion(optimization, outputDir);
      }
    }
  }

  /**
   * Generate React components for optimized images
   */
  generateOptimizedImageComponents(): Record<string, string> {
    return {
      responsiveImage: this.generateResponsiveImageComponent(),
      lazyImage: this.generateLazyImageComponent(),
      webpImage: this.generateWebPImageComponent(),
      pictureElement: this.generatePictureElementComponent(),
      imageLoader: this.generateImageLoaderComponent()
    };
  }

  /**
   * Generate image optimization configuration
   */
  generateImageOptimizationConfig(): string {
    return `// Image optimization configuration for Clear Piggy Mobile
import { ImageConfig } from './types/image-config';

export const imageOptimizationConfig: ImageConfig = {
  // Format preferences (in order of preference)
  formats: ['avif', 'webp', 'jpeg', 'png'],
  
  // Quality settings for different use cases
  quality: {
    hero: 90,        // High quality for hero images
    content: 85,     // Good quality for content images
    thumbnail: 75,   // Lower quality for thumbnails
    icon: 95         // High quality for icons
  },
  
  // Responsive breakpoints
  breakpoints: [
    { name: 'mobile', width: 640, quality: 80 },
    { name: 'tablet', width: 768, quality: 85 },
    { name: 'desktop', width: 1024, quality: 90 },
    { name: 'large', width: 1920, quality: 95 }
  ],
  
  // Lazy loading settings
  lazyLoading: {
    enabled: true,
    threshold: '50px',
    placeholderType: 'blur', // 'blur' | 'skeleton' | 'color' | 'none'
    fadeInDuration: 300
  },
  
  // WebP fallback strategy
  webpFallback: {
    enabled: true,
    fallbackFormat: 'jpeg',
    quality: 85
  },
  
  // AVIF support (next-gen format)
  avifSupport: {
    enabled: true,
    quality: 80,
    fallback: 'webp'
  },
  
  // Optimization settings
  optimization: {
    removeMetadata: true,
    progressive: true,
    interlace: false,
    optimizeTransparency: true
  }
};

// Webpack configuration for image optimization
export const webpackImageConfig = {
  module: {
    rules: [
      {
        test: /\\.(png|jpe?g|gif|svg)$/i,
        type: 'asset',
        generator: {
          filename: 'images/[name].[hash][ext]'
        },
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8KB - inline small images
          }
        }
      },
      {
        test: /\\.(png|jpe?g)$/i,
        use: [
          {
            loader: 'responsive-loader',
            options: {
              adapter: require('responsive-loader/sharp'),
              sizes: [640, 768, 1024, 1920],
              quality: 85,
              format: 'webp',
              placeholder: true,
              placeholderSize: 40
            }
          }
        ]
      }
    ]
  }
};`;
  }

  /**
   * Generate build-time image optimization scripts
   */
  generateImageOptimizationScripts(): Record<string, string> {
    return {
      optimizeScript: `#!/bin/bash
# Image optimization script for Clear Piggy Mobile

echo "🖼️ Optimizing images for Clear Piggy Mobile..."

# Create output directories
mkdir -p optimized-images/webp
mkdir -p optimized-images/avif
mkdir -p optimized-images/responsive

# Convert JPEG/PNG to WebP
find src/assets -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | while read img; do
  filename=$(basename "$img")
  name="\${filename%.*}"
  
  # Generate WebP
  cwebp -q 85 "$img" -o "optimized-images/webp/\${name}.webp"
  
  # Generate AVIF (if supported)
  if command -v avifenc &> /dev/null; then
    avifenc -q 80 "$img" "optimized-images/avif/\${name}.avif"
  fi
  
  # Generate responsive variants
  convert "$img" -resize 640x -quality 80 "optimized-images/responsive/\${name}-640w.webp"
  convert "$img" -resize 768x -quality 85 "optimized-images/responsive/\${name}-768w.webp"
  convert "$img" -resize 1024x -quality 90 "optimized-images/responsive/\${name}-1024w.webp"
  convert "$img" -resize 1920x -quality 95 "optimized-images/responsive/\${name}-1920w.webp"
done

echo "✅ Image optimization complete!"`,

      nodeOptimizationScript: `// Node.js image optimization script
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

async function optimizeImages() {
  console.log('🖼️ Starting image optimization...');
  
  const imageFiles = glob.sync('src/assets/**/*.{jpg,jpeg,png}');
  const outputDir = 'optimized-images';
  
  await fs.ensureDir(outputDir);
  await fs.ensureDir(path.join(outputDir, 'webp'));
  await fs.ensureDir(path.join(outputDir, 'avif'));
  await fs.ensureDir(path.join(outputDir, 'responsive'));
  
  for (const imagePath of imageFiles) {
    const filename = path.basename(imagePath, path.extname(imagePath));
    
    try {
      // Generate WebP
      await sharp(imagePath)
        .webp({ quality: 85 })
        .toFile(path.join(outputDir, 'webp', \`\${filename}.webp\`));
      
      // Generate AVIF
      await sharp(imagePath)
        .avif({ quality: 80 })
        .toFile(path.join(outputDir, 'avif', \`\${filename}.avif\`));
      
      // Generate responsive variants
      const breakpoints = [
        { width: 640, quality: 80 },
        { width: 768, quality: 85 },
        { width: 1024, quality: 90 },
        { width: 1920, quality: 95 }
      ];
      
      for (const bp of breakpoints) {
        await sharp(imagePath)
          .resize(bp.width)
          .webp({ quality: bp.quality })
          .toFile(path.join(outputDir, 'responsive', \`\${filename}-\${bp.width}w.webp\`));
      }
      
      console.log(\`✅ Optimized: \${filename}\`);
    } catch (error) {
      console.error(\`❌ Failed to optimize \${filename}:\`, error.message);
    }
  }
  
  console.log('🎉 Image optimization complete!');
}

optimizeImages().catch(console.error);`,

      packageJsonScripts: `// Add these scripts to package.json
{
  "scripts": {
    "optimize:images": "node scripts/optimize-images.js",
    "optimize:images:build": "./scripts/optimize-images.sh",
    "generate:webp": "node scripts/generate-webp.js",
    "generate:responsive": "node scripts/generate-responsive.js"
  },
  "devDependencies": {
    "sharp": "^0.32.0",
    "fs-extra": "^11.0.0",
    "glob": "^8.0.0"
  }
}`
    };
  }

  /**
   * Analyze individual image file
   */
  private async analyzeImage(imagePath: string): Promise<ImageOptimization | null> {
    try {
      const stats = await fs.stat(imagePath);
      const ext = path.extname(imagePath).toLowerCase();
      const filename = path.basename(imagePath);
      
      // Skip if already optimized format
      if (ext === '.webp' || ext === '.avif') {
        return null;
      }

      const originalSize = stats.size;
      const estimatedOptimizedSize = this.estimateOptimizedSize(originalSize, ext);
      const usage = this.determineImageUsage(imagePath);
      const dimensions = await this.getImageDimensions(imagePath);

      return {
        filePath: imagePath,
        originalSize,
        optimizedSize: estimatedOptimizedSize,
        format: this.getOptimalFormat(ext, usage),
        quality: this.getOptimalQuality(usage),
        dimensions,
        usage,
        lazyLoadCandidate: this.isLazyLoadCandidate(originalSize, usage, dimensions)
      };
    } catch (error) {
      console.warn(`Failed to analyze image ${imagePath}:`, error);
      return null;
    }
  }

  /**
   * Find all images in the project
   */
  private async findAllImages(): Promise<string[]> {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif'];
    const searchDirs = [
      path.join(this.projectPath, 'src', 'assets'),
      path.join(this.projectPath, 'public'),
      path.join(this.projectPath, 'src', 'images')
    ];

    const images: string[] = [];

    for (const dir of searchDirs) {
      try {
        const files = await this.findImagesInDirectory(dir, imageExtensions);
        images.push(...files);
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }

    return [...new Set(images)]; // Remove duplicates
  }

  /**
   * Recursively find images in directory
   */
  private async findImagesInDirectory(dir: string, extensions: string[]): Promise<string[]> {
    const images: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subImages = await this.findImagesInDirectory(fullPath, extensions);
          images.push(...subImages);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            images.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Handle permission errors or missing directories
    }

    return images;
  }

  /**
   * Generate responsive image recommendations
   */
  private async generateResponsiveImageRecommendations(
    optimizations: ImageOptimization[]
  ): Promise<ResponsiveImageRecommendation[]> {
    const recommendations: ResponsiveImageRecommendation[] = [];

    for (const opt of optimizations) {
      if (this.shouldGenerateResponsiveVariants(opt)) {
        const breakpoints = this.generateBreakpoints(opt);
        const srcSet = this.generateSrcSet(opt.filePath, breakpoints);
        const sizesAttribute = this.generateSizesAttribute(opt.usage);

        recommendations.push({
          filePath: opt.filePath,
          breakpoints,
          srcSetGeneration: srcSet,
          sizesAttribute
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate optimized image components
   */
  private generateResponsiveImageComponent(): string {
    return `import React, { useState, useRef, useEffect } from 'react';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty' | 'skeleton';
  onLoad?: () => void;
  onError?: () => void;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  sizes = '100vw',
  className = '',
  priority = false,
  placeholder = 'blur',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  // Generate srcSet for different formats and sizes
  const generateSrcSet = (baseSrc: string) => {
    const name = baseSrc.replace(/\\.[^.]+$/, '');
    return \`
      \${name}-640w.avif 640w,
      \${name}-768w.avif 768w,
      \${name}-1024w.avif 1024w,
      \${name}-1920w.avif 1920w
    \`;
  };

  const generateWebPSrcSet = (baseSrc: string) => {
    const name = baseSrc.replace(/\\.[^.]+$/, '');
    return \`
      \${name}-640w.webp 640w,
      \${name}-768w.webp 768w,
      \${name}-1024w.webp 1024w,
      \${name}-1920w.webp 1920w
    \`;
  };

  if (isError) {
    return (
      <div className={\`bg-gray-200 flex items-center justify-center \${className}\`}>
        <span className="text-gray-500">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={\`relative overflow-hidden \${className}\`}>
      {/* Placeholder */}
      {!isLoaded && placeholder !== 'empty' && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse">
          {placeholder === 'skeleton' && (
            <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
          )}
        </div>
      )}

      {/* Actual image with progressive enhancement */}
      {isInView && (
        <picture>
          {/* AVIF format (next-gen, best compression) */}
          <source
            srcSet={generateSrcSet(src)}
            sizes={sizes}
            type="image/avif"
          />
          
          {/* WebP format (good compression, wide support) */}
          <source
            srcSet={generateWebPSrcSet(src)}
            sizes={sizes}
            type="image/webp"
          />
          
          {/* Fallback to original format */}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className={\`w-full h-full object-cover transition-opacity duration-300 \${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }\`}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        </picture>
      )}
    </div>
  );
};`;
  }

  private generateLazyImageComponent(): string {
    return `import React, { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciPjxzdG9wIHN0b3AtY29sb3I9IiNmM2YzZjMiIG9mZnNldD0iMjAlIi8+PHN0b3Agc3RvcC1jb2xvcj0iI2U5ZTllOSIgb2Zmc2V0PSI1MCUiLz48c3RvcCBzdG9wLWNvbG9yPSIjZjNmM2YzIiBvZmZzZXQ9IjgwJSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=',
  threshold = 0.1,
  rootMargin = '50px'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setIsError(true);

  return (
    <div ref={imgRef} className={\`relative \${className}\`}>
      {/* Placeholder image */}
      <img
        src={placeholder}
        alt=""
        className={\`w-full h-full object-cover transition-opacity duration-300 \${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }\`}
        aria-hidden="true"
      />
      
      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={\`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 \${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }\`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}
      
      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <span className="text-gray-500 text-sm">Failed to load</span>
        </div>
      )}
    </div>
  );
};`;
  }

  private generateWebPImageComponent(): string {
    return `import React from 'react';

interface WebPImageProps {
  src: string;
  webpSrc?: string;
  alt: string;
  className?: string;
  fallbackFormat?: 'jpeg' | 'png';
}

export const WebPImage: React.FC<WebPImageProps> = ({
  src,
  webpSrc,
  alt,
  className = '',
  fallbackFormat = 'jpeg'
}) => {
  // Generate WebP source if not provided
  const webpSource = webpSrc || src.replace(/\\.(jpe?g|png)$/i, '.webp');
  
  // Generate AVIF source for even better compression
  const avifSource = src.replace(/\\.(jpe?g|png|webp)$/i, '.avif');

  return (
    <picture className={className}>
      {/* AVIF format (best compression) */}
      <source srcSet={avifSource} type="image/avif" />
      
      {/* WebP format (good compression) */}
      <source srcSet={webpSource} type="image/webp" />
      
      {/* Fallback to original format */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
};`;
  }

  private generatePictureElementComponent(): string {
    return `import React from 'react';

interface PictureElementProps {
  src: string;
  alt: string;
  sources: Array<{
    srcSet: string;
    media?: string;
    type?: string;
    sizes?: string;
  }>;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export const PictureElement: React.FC<PictureElementProps> = ({
  src,
  alt,
  sources,
  className = '',
  loading = 'lazy'
}) => {
  return (
    <picture className={className}>
      {sources.map((source, index) => (
        <source
          key={index}
          srcSet={source.srcSet}
          media={source.media}
          type={source.type}
          sizes={source.sizes}
        />
      ))}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading={loading}
        decoding="async"
      />
    </picture>
  );
};

// Usage example:
/*
<PictureElement
  src="/images/hero.jpg"
  alt="Clear Piggy Dashboard"
  sources={[
    {
      srcSet: "/images/hero-mobile.avif",
      media: "(max-width: 640px)",
      type: "image/avif"
    },
    {
      srcSet: "/images/hero-mobile.webp",
      media: "(max-width: 640px)",
      type: "image/webp"
    },
    {
      srcSet: "/images/hero-desktop.avif",
      media: "(min-width: 641px)",
      type: "image/avif"
    },
    {
      srcSet: "/images/hero-desktop.webp",
      media: "(min-width: 641px)",
      type: "image/webp"
    }
  ]}
/>
*/`;
  }

  private generateImageLoaderComponent(): string {
    return `import React, { useState } from 'react';

interface ImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  blurDataURL?: string;
}

export const ImageLoader: React.FC<ImageLoaderProps> = ({
  src,
  alt,
  className = '',
  skeletonClassName = '',
  blurDataURL
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setIsError(true);
  };

  if (isError) {
    return (
      <div className={\`bg-gray-200 flex items-center justify-center \${className}\`}>
        <div className="text-gray-500 text-center">
          <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Image not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={\`relative \${className}\`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className={\`absolute inset-0 bg-gray-200 animate-pulse \${skeletonClassName}\`}>
          {blurDataURL && (
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover filter blur-sm"
              aria-hidden="true"
            />
          )}
        </div>
      )}
      
      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        className={\`w-full h-full object-cover transition-opacity duration-500 \${
          isLoading ? 'opacity-0' : 'opacity-100'
        }\`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};`;
  }

  // Helper methods
  private estimateOptimizedSize(originalSize: number, format: string): number {
    const compressionRates = {
      '.jpg': 0.8,
      '.jpeg': 0.8,
      '.png': 0.6,
      '.gif': 0.7,
      '.svg': 0.9
    };

    const rate = compressionRates[format as keyof typeof compressionRates] || 0.8;
    return Math.floor(originalSize * rate);
  }

  private determineImageUsage(imagePath: string): 'hero' | 'thumbnail' | 'icon' | 'background' {
    const filename = path.basename(imagePath).toLowerCase();
    
    if (filename.includes('hero') || filename.includes('banner') || filename.includes('cover')) {
      return 'hero';
    }
    if (filename.includes('thumb') || filename.includes('small') || filename.includes('preview')) {
      return 'thumbnail';
    }
    if (filename.includes('icon') || filename.includes('logo') || filename.includes('symbol')) {
      return 'icon';
    }
    if (filename.includes('bg') || filename.includes('background') || filename.includes('pattern')) {
      return 'background';
    }
    
    return 'thumbnail';
  }

  private getOptimalFormat(currentFormat: string, usage: string): 'webp' | 'avif' | 'jpeg' | 'png' {
    if (usage === 'icon' && currentFormat === '.svg') return 'webp';
    if (usage === 'hero') return 'avif';
    return 'webp';
  }

  private getOptimalQuality(usage: string): number {
    const qualityMap = {
      'hero': 90,
      'background': 85,
      'thumbnail': 75,
      'icon': 95
    };
    
    return qualityMap[usage as keyof typeof qualityMap] || 85;
  }

  private async getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
    // In a real implementation, this would use sharp or similar to get actual dimensions
    // For now, return mock dimensions
    return { width: 800, height: 600 };
  }

  private isLazyLoadCandidate(size: number, usage: string, dimensions: { width: number; height: number }): boolean {
    // Images larger than 50KB or below the fold are good candidates
    if (size > 50000) return true;
    if (usage === 'hero') return false; // Hero images should load immediately
    if (usage === 'icon') return false; // Icons are usually small
    return true;
  }

  private shouldGenerateResponsiveVariants(optimization: ImageOptimization): boolean {
    // Generate responsive variants for large images or hero images
    return optimization.originalSize > 100000 || 
           optimization.usage === 'hero' || 
           optimization.dimensions.width > 800;
  }

  private generateBreakpoints(optimization: ImageOptimization): ResponsiveBreakpoint[] {
    const baseQuality = optimization.quality;
    
    return [
      { breakpoint: 640, width: 640, quality: Math.max(baseQuality - 10, 60), format: 'webp' },
      { breakpoint: 768, width: 768, quality: Math.max(baseQuality - 5, 70), format: 'webp' },
      { breakpoint: 1024, width: 1024, quality: baseQuality, format: 'webp' },
      { breakpoint: 1920, width: 1920, quality: Math.min(baseQuality + 5, 95), format: 'webp' }
    ];
  }

  private generateSrcSet(imagePath: string, breakpoints: ResponsiveBreakpoint[]): string {
    const name = path.basename(imagePath, path.extname(imagePath));
    
    return breakpoints
      .map(bp => `${name}-${bp.width}w.${bp.format} ${bp.width}w`)
      .join(', ');
  }

  private generateSizesAttribute(usage: string): string {
    const sizesMap = {
      'hero': '100vw',
      'thumbnail': '(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw',
      'icon': '(max-width: 640px) 24px, 32px',
      'background': '100vw'
    };
    
    return sizesMap[usage as keyof typeof sizesMap] || '100vw';
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private async generateWebPVersion(imagePath: string, outputDir: string): Promise<void> {
    // Mock WebP generation - in real implementation would use sharp
    console.log(`📷 Would generate WebP for: ${imagePath}`);
  }

  private async generateResponsiveVariants(responsive: ResponsiveImageRecommendation, outputDir: string): Promise<void> {
    // Mock responsive variant generation
    console.log(`📐 Would generate responsive variants for: ${responsive.filePath}`);
  }

  private async generateOptimizedVersion(optimization: ImageOptimization, outputDir: string): Promise<void> {
    // Mock optimization
    console.log(`🔧 Would optimize: ${optimization.filePath}`);
  }
}