import React, { useState } from 'react'
import {
  SafeAreaView,
  Image,
  StatusBar,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  TouchableOpacity,
  Text,
  View,
} from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Zoom from 'react-native-zoom-reanimated'
import FlatListExample from './FlatListExample'
import UseZoomGestureExample from './UseZoomGestureExample'

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen'

type ExampleType = 'single' | 'gallery' | 'hook'

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark'
  const [currentExample, setCurrentExample] = useState<ExampleType>('single')

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  }

  const { width: deviceWidth } = useWindowDimensions()
  const imageWidth = 1100
  const imageHeight = 910

  const cycleExample = () => {
    setCurrentExample((prev) => {
      if (prev === 'single') return 'gallery'
      if (prev === 'gallery') return 'hook'
      return 'single'
    })
  }

  const getButtonText = () => {
    if (currentExample === 'single') return 'Show Image Gallery'
    if (currentExample === 'gallery') return 'Show useZoomGesture Hook'
    return 'Show Single Image'
  }

  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaView style={[styles.fill, backgroundStyle]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />

        {/* Toggle Button */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.toggleButton} onPress={cycleExample}>
            <Text style={[styles.toggleButtonText, { color: isDarkMode ? '#fff' : '#000' }]}>
              {getButtonText()}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.exampleLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>
            {currentExample === 'single' && 'Zoom Component Example'}
            {currentExample === 'gallery' && 'FlatList Gallery Example'}
            {currentExample === 'hook' && 'useZoomGesture Hook Example'}
          </Text>
        </View>

        {currentExample === 'gallery' ? (
          <FlatListExample isDarkMode={isDarkMode} />
        ) : currentExample === 'hook' ? (
          <UseZoomGestureExample isDarkMode={isDarkMode} />
        ) : (
          <Zoom
            doubleTapConfig={{
              defaultScale: 5,
              minZoomScale: 1,
              maxZoomScale: 10,
            }}
          >
            <Image
              source={{ uri: 'https://fujifilm-x.com/wp-content/uploads/2021/01/gfx100s_sample_04_thum-1.jpg' }}
              resizeMode="contain"
              style={{
                width: deviceWidth,
                height: imageHeight * deviceWidth / imageWidth,
              }}
            />
          </Zoom>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  toggleButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '500',
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
