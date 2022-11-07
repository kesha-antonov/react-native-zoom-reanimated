# react-native-zoom-reanimated

Zoom component on React Native + react-native-reanimated + react-native-gesture-handler

* You can zoom any View, Image or whatever
* Can be used in FlatList (see Preview below)
* Double tap to zoom in or zoom out
* Automatically bounces to borders when paning outside of container and leaving the touch

## Preview

https://user-images.githubusercontent.com/11584712/174407015-2cd13692-a32e-4591-8cce-b47f6edb3cb9.mp4

## Getting started

Install the library using either Yarn:

```
yarn add react-native-zoom-reanimated
```

or npm:

```
npm install --save react-native-zoom-reanimated
```




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
      style={[
        { width: deviceWidth, height:imageHeight * deviceWidth / imageWidth },
      ]}
    />
  </Zoom>

...
```

## Parameters

| Name    | Type   | Required | Description                               |
| ------- | ------ | -------- | ----------------------------------------- |
| style  | ViewPropTypes.style | No      | Container style |
| contentContainerStyle  | ViewPropTypes.style | No      | Content container style |


## License

The library is released under the MIT licence. For more information see [`LICENSE`](/LICENSE).
