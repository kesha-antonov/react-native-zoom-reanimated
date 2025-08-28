# react-native-zoom-reanimated

Zoom component on React Native + react-native-reanimated + react-native-gesture-handler

* You can zoom any View, Image or whatever
* Can be used in FlatList (see Preview below)
* Double tap to zoom in or zoom out
* Automatically bounces to borders when paning outside of container and leaving the touch

## Preview

**iOS preview**

[iOS Preview](https://user-images.githubusercontent.com/11584712/174407015-2cd13692-a32e-4591-8cce-b47f6edb3cb9.mp4)

**Android preview**

[Android Preview](https://github.com/kesha-antonov/react-native-zoom-reanimated/assets/11584712/7e8a572b-8130-4aea-88c7-2ca035a155a1)

## Getting started

Install the library using either Yarn:

```bash
yarn add react-native-zoom-reanimated
```

or npm:

```bash
npm install --save react-native-zoom-reanimated
```

## Required peer dependencies

|          dependency          | required version |
|:----------------------------:|:----------------:|
|   react-native-reanimated    |    \>= 2.0.0     |
| react-native-gesture-handler |      \>= *       |


## Usage

```javascript
import Zoom from 'react-native-zoom-reanimated'
```

## Example

```jsx
import Zoom from 'react-native-zoom-reanimated'

...
  <Zoom>
    <Image
      source={{ uri: ... }}
      resizeMode='contain'
      style={{
        width: deviceWidth,
        height: imageHeight * deviceWidth / imageWidth,
       }}
    />
  </Zoom>
...
```

### Example with zoom callbacks

```jsx
import Zoom from 'react-native-zoom-reanimated'

....
  const handleZoomStart = () => {
    console.log('Zoom animation started!')
    // You can perform any action when zoom starts
  }

  const handleZoomEnd = () => {
    console.log('Zoom animation ended!')
    // You can perform any action when zoom ends
  }

  <Zoom
    onZoomStart={handleZoomStart}
    onZoomEnd={handleZoomEnd}
  >
    <Image
      source={{ uri: ... }}
      resizeMode='contain'
      style={{
        width: deviceWidth,
        height: imageHeight * deviceWidth / imageWidth,
       }}
    />
  </Zoom>
....
```

## Parameters

| Name                  | Type                   | Required | Description                                                                                                                                                                                                              |
|-----------------------|------------------------|----------|------------------|
| style                 | `StyleProp<ViewStyle>` | No       | Container style |
| contentContainerStyle | `StyleProp<ViewStyle>` | No       | Content container style |
| animationFunction     | function               | No       | Animation function from `react-native-reanimated`. Default: `withTiming`. For example, you can use `withSpring` instead: https://docs.swmansion.com/react-native-reanimated/docs/api/animations/withSpring |
| animationConfig       | object                 | No       | Config for animation function from `react-native-reanimated`. For example, avaiable options for `withSpring` animation: https://docs.swmansion.com/react-native-reanimated/docs/api/animations/withSpring#options-object |
| doubleTapConfig       | { defaultScale?: number, minZoomScale?: number, maxZoomScale?: number } | No | Config for zoom on double tap. `defaultScale` - if you want to have fixed zoom on double tap, or calculated based on dimensions then leave it as it is. `minZoomScale` and `maxZoomScale` define range with min zoom & max zoom on double tap |
| onZoomStart           | `() => void`           | No       | Callback function called when zoom animation starts (for both zoom in and zoom out) |
| onZoomEnd             | `() => void`           | No       | Callback function called when zoom animation ends (for both zoom in and zoom out) |


## License

The library is released under the MIT licence. For more information see [`LICENSE`](/LICENSE).

## TODO

- document useZoomGesture
- add examples of usage Zoom (with or without different configs), useZoomGesture with react-native app code
- add examples of list of images with FlatList
- make list component with https://github.com/callstack/react-native-pager-view and export it for galleries usecase
