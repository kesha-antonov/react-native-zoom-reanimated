import React, { useState } from 'react'
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import Zoom, {
  isGestureApiV3Supported,
  type GestureApiVersion,
} from 'react-native-zoom-reanimated'

interface GestureApiExampleProps {
  isDarkMode?: boolean
}

const IMAGE_WIDTH = 1100
const IMAGE_HEIGHT = 910

const VERSIONS: GestureApiVersion[] = ['v2', 'v3']

/**
 * Demonstrates picking the react-native-gesture-handler API used to build the zoom gesture.
 *
 * The default is `"auto"`, which follows the installed react-native-gesture-handler version.
 * `<Zoom gestureApi="v2" | "v3" />` overrides it per component, `setGestureApiVersion()` changes
 * the app-wide default, and the `useZoomGestureV2` / `useZoomGestureV3` hooks pin a version for
 * custom implementations.
 *
 * This example app depends on react-native-gesture-handler 2.x, so the v3 option is disabled
 * here - install react-native-gesture-handler 3.x to enable it.
 */
export default function GestureApiExample({ isDarkMode = false }: GestureApiExampleProps) {
  const { width: deviceWidth } = useWindowDimensions()
  const v3Supported = isGestureApiV3Supported()
  const [gestureApi, setGestureApi] = useState<GestureApiVersion>(v3Supported ? 'v3' : 'v2')
  const calculatedHeight = IMAGE_HEIGHT * deviceWidth / IMAGE_WIDTH

  return (
    <View style={styles.container}>
      <View style={styles.switcher}>
        {VERSIONS.map(version => {
          const disabled = version === 'v3' && !v3Supported
          const selected = gestureApi === version

          return (
            <TouchableOpacity
              key={version}
              disabled={disabled}
              style={[
                styles.switchButton,
                { backgroundColor: selected ? '#007AFF' : (isDarkMode ? '#2a2a2a' : '#fff') },
                disabled && styles.switchButtonDisabled,
              ]}
              onPress={() => setGestureApi(version)}
            >
              <Text
                style={[
                  styles.switchButtonText,
                  { color: selected ? '#fff' : (isDarkMode ? '#fff' : '#000') },
                ]}
              >
                {`RNGH ${version}`}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={[styles.hint, { color: isDarkMode ? '#888' : '#666' }]}>
        {v3Supported
          ? 'react-native-gesture-handler v3 gestures API detected - used by default'
          : 'react-native-gesture-handler v3 gestures API not available - v2 used by default'}
      </Text>

      <Zoom
        key={gestureApi}
        gestureApi={gestureApi}
        style={{ width: deviceWidth, height: calculatedHeight }}
        maxScale={6}
      >
        <Image
          source={{ uri: 'https://picsum.photos/1100/910' }}
          resizeMode="contain"
          style={{ width: deviceWidth, height: calculatedHeight }}
        />
      </Zoom>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  switcher: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
  },
  switchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  switchButtonDisabled: {
    opacity: 0.4,
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
})
