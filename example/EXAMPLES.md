# react-native-zoom-reanimated Examples

This directory contains examples demonstrating different usage patterns of the `react-native-zoom-reanimated` library.

## Available Examples

### 1. Single Image Zoom (Default)
A simple example showing how to zoom a single image using the `Zoom` component.

**Features:**
- Double tap to zoom in/out
- Pinch to zoom gestures
- Pan when zoomed in
- Custom zoom scale configuration

### 2. Image Gallery with FlatList 
A comprehensive example demonstrating how to use the `Zoom` component within a horizontal `FlatList` to create a swipeable image gallery.

**Features:**
- Horizontal scrolling between images (sliding pages)
- Each image is individually zoomable
- Paging enabled for smooth transitions between images  
- Image titles/captions
- Responsive image sizing

**Code Location:** `FlatListExample.tsx`

## Usage

The main `App.tsx` file includes a toggle button to switch between the two examples:
- **"Show Single Image"** - Displays the basic single image zoom example
- **"Show Image Gallery"** - Displays the FlatList gallery example

## Key Implementation Details

### FlatList Configuration
```javascript
<FlatList
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  // ... other props
/>
```

### Zoom Configuration for Gallery
```javascript
<Zoom
  doubleTapConfig={{
    defaultScale: 2,
    minZoomScale: 1,
    maxZoomScale: 5,
  }}
>
  <Image {...imageProps} />
</Zoom>
```

This addresses the user's request for "sliding pages" functionality as mentioned in issue #6.