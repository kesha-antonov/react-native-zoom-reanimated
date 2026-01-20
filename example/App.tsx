import React, { useState } from 'react'
import {
  Image,
  StatusBar,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
} from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Zoom from 'react-native-zoom-reanimated'
import FlatListExample from './FlatListExample'
import UseZoomGestureExample from './UseZoomGestureExample'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

const Colors = {
  darker: '#121212',
  lighter: '#F3F3F3',
}

type Screen = 'menu' | 'basic' | 'gallery' | 'hook'

interface MenuButtonProps {
  title: string
  subtitle: string
  onPress: () => void
  isDarkMode: boolean
}

const MenuButton: React.FC<MenuButtonProps> = ({ title, subtitle, onPress, isDarkMode }) => (
  <TouchableOpacity
    style={[styles.menuButton, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.menuButtonTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
      {title}
    </Text>
    <Text style={[styles.menuButtonSubtitle, { color: isDarkMode ? '#888' : '#666' }]}>
      {subtitle}
    </Text>
  </TouchableOpacity>
)

interface HeaderProps {
  title: string
  onBack: () => void
  isDarkMode: boolean
}

const Header: React.FC<HeaderProps> = ({ title, onBack, isDarkMode }) => (
  <View style={[styles.header, { borderBottomColor: isDarkMode ? '#333' : '#ddd' }]}>
    <TouchableOpacity style={styles.backButton} onPress={onBack}>
      <Text style={[styles.backButtonText, { color: '#007AFF' }]}>← Back</Text>
    </TouchableOpacity>
    <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
      {title}
    </Text>
    <View style={styles.headerSpacer} />
  </View>
)

const BasicExample: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const { width: deviceWidth } = useWindowDimensions()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentScale, setCurrentScale] = useState(1)
  const [isZoomed, setIsZoomed] = useState(false)
  const imageWidth = 1100
  const imageHeight = 910
  const calculatedHeight = imageHeight * deviceWidth / imageWidth

  return (
    <View style={styles.exampleContainer}>
      <Zoom
        style={{ width: deviceWidth, height: calculatedHeight }}
        doubleTapConfig={{
          defaultScale: 5,
          minZoomScale: 1,
          maxZoomScale: 10,
        }}
        onZoomChange={setCurrentScale}
        onZoomStateChange={setIsZoomed}
      >
        <Image
          source={{ uri: 'https://picsum.photos/1100/910' }}
          resizeMode="contain"
          style={{
            width: deviceWidth,
            height: calculatedHeight,
          }}
          onLoadStart={() => {
            setIsLoading(true)
            setHasError(false)
          }}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setHasError(true)
          }}
        />
        {isLoading && (
          <View style={styles.overlayCenter}>
            <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
          </View>
        )}
        {hasError && (
          <View style={styles.overlayCenter}>
            <Text style={[styles.errorText, { color: isDarkMode ? '#ff6b6b' : '#d32f2f' }]}>
              Failed to load image
            </Text>
          </View>
        )}
      </Zoom>
      <View style={[styles.zoomIndicator, { backgroundColor: isDarkMode ? 'rgba(42,42,42,0.9)' : 'rgba(255,255,255,0.9)' }]}>
        <Text style={[styles.zoomIndicatorText, { color: isDarkMode ? '#fff' : '#000' }]}>
          {isZoomed ? '🔍' : '🖼️'}{' '}{currentScale.toFixed(1)}x
        </Text>
      </View>
    </View>
  )
}

const MainMenu: React.FC<{ onSelect: (screen: Screen) => void, isDarkMode: boolean }> = ({
  onSelect,
  isDarkMode,
}) => (
  <View style={styles.menuContainer}>
    <Text style={[styles.menuTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
      Zoom Examples
    </Text>
    <Text style={[styles.menuSubtitle, { color: isDarkMode ? '#888' : '#666' }]}>
      react-native-zoom-reanimated
    </Text>

    <View style={styles.buttonList}>
      <MenuButton
        title="Basic Example"
        subtitle="Simple zoomable image with pinch & double-tap"
        onPress={() => onSelect('basic')}
        isDarkMode={isDarkMode}
      />
      <MenuButton
        title="Gallery Example"
        subtitle="FlatList with multiple zoomable images"
        onPress={() => onSelect('gallery')}
        isDarkMode={isDarkMode}
      />
      <MenuButton
        title="Custom Hook Example"
        subtitle="Using useZoomGesture for custom implementations"
        onPress={() => onSelect('hook')}
        isDarkMode={isDarkMode}
      />
    </View>
  </View>
)

const Content: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark'
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu')

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  }

  const getHeaderTitle = () => {
    switch (currentScreen) {
      case 'basic': return 'Basic Example'
      case 'gallery': return 'Gallery Example'
      case 'hook': return 'Custom Hook'
      default: return ''
    }
  }

  return (
    <SafeAreaView style={[styles.fill, backgroundStyle]} edges={['top']}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      {currentScreen === 'menu' ? (
        <MainMenu onSelect={setCurrentScreen} isDarkMode={isDarkMode} />
      ) : (
        <>
          <Header
            title={getHeaderTitle()}
            onBack={() => setCurrentScreen('menu')}
            isDarkMode={isDarkMode}
          />
          {currentScreen === 'basic' && <BasicExample isDarkMode={isDarkMode} />}
          {currentScreen === 'gallery' && <FlatListExample isDarkMode={isDarkMode} />}
          {currentScreen === 'hook' && <UseZoomGestureExample isDarkMode={isDarkMode} />}
        </>
      )}
    </SafeAreaView>
  )
}

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <Content />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  menuTitle: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  menuSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonList: {
    gap: 16,
  },
  menuButton: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuButtonSubtitle: {
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  exampleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  zoomIndicatorText: {
    fontSize: 13,
    fontWeight: '500',
  },
})

export default App
