import React from 'react'
import type {PropsWithChildren} from 'react'
import {
  SafeAreaView,
  Image,
  StatusBar,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  Alert,
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

  const handleZoomStart = () => {
    console.log('Zoom animation started!')
    // You could also use Alert.alert for visual feedback in the app
  }

  const handleZoomEnd = () => {
    console.log('Zoom animation ended!')
    // You could also use Alert.alert for visual feedback in the app
  }

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
          onZoomStart={handleZoomStart}
          onZoomEnd={handleZoomEnd}
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

// SAMPLE IMAGES
// https://cdn.hasselblad.com/hasselblad-com/6cb604081ef3086569319ddb5adcae66298a28c5_x1d-ii-sample-01-web.jpg?auto=format&q=97
// https://vgl.ucdavis.edu/sites/g/files/dgvnsk15116/files/styles/sf_landscape_4x3/public/images/marketing_highlight/Sample-Collection-Box-Cat-640px.jpg?h=52d3fcb6&itok=4r75E_w2
// https://cdn.pixabay.com/photo/2022/01/28/18/32/leaves-6975462_1280.png
// https://static.remove.bg/sample-gallery/graphics/bird-thumbnail.jpg
