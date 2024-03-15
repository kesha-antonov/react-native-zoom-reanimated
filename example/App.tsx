import React from 'react'
import type {PropsWithChildren} from 'react'
import {
  SafeAreaView,
  Image,
  StatusBar,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
} from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Zoom from 'react-native-zoom-reanimated'

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen'


function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark'

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  }

  const { width: deviceWidth } = useWindowDimensions()
  const imageWidth = 1100
  const imageHeight = 910

  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaView style={[styles.fill, backgroundStyle]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <Zoom
          doubleTapConfig={{
            defaultScale: 5,
            minZoomScale: 1,
            maxZoomScale: 10,
          }}
        >
          <Image
            source={{ uri: 'https://fujifilm-x.com/wp-content/uploads/2021/01/gfx100s_sample_04_thum-1.jpg' }}
            resizeMode='contain'
            style={{
              width: deviceWidth,
              height: imageHeight * deviceWidth / imageWidth,
            }}
          />
        </Zoom>
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
})

export default App
