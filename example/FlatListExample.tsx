import React from 'react'
import {
  FlatList,
  Image,
  useWindowDimensions,
  View,
  StyleSheet,
  Text,
} from 'react-native'
import Zoom from 'react-native-zoom-reanimated'

const SAMPLE_IMAGES = [
  {
    id: '1',
    uri: 'https://fujifilm-x.com/wp-content/uploads/2021/01/gfx100s_sample_04_thum-1.jpg',
    width: 1100,
    height: 910,
    title: 'Fujifilm Sample 1',
  },
  {
    id: '2',
    uri: 'https://cdn.hasselblad.com/hasselblad-com/6cb604081ef3086569319ddb5adcae66298a28c5_x1d-ii-sample-01-web.jpg?auto=format&q=97',
    width: 1200,
    height: 800,
    title: 'Hasselblad Sample',
  },
  {
    id: '3',
    uri: 'https://vgl.ucdavis.edu/sites/g/files/dgvnsk15116/files/styles/sf_landscape_4x3/public/images/marketing_highlight/Sample-Collection-Box-Cat-640px.jpg?h=52d3fcb6&itok=4r75E_w2',
    width: 640,
    height: 480,
    title: 'Cat Sample',
  },
  {
    id: '4',
    uri: 'https://cdn.pixabay.com/photo/2022/01/28/18/32/leaves-6975462_1280.png',
    width: 1280,
    height: 853,
    title: 'Leaves Sample',
  },
  {
    id: '5',
    uri: 'https://static.remove.bg/sample-gallery/graphics/bird-thumbnail.jpg',
    width: 626,
    height: 626,
    title: 'Bird Sample',
  },
]

export default function FlatListExample ({ isDarkMode = false }) {
  const { width: deviceWidth, height: deviceHeight } = useWindowDimensions()

  const renderImageItem = ({ item }) => {
    // Calculate the image dimensions to fit the screen width while maintaining aspect ratio
    const imageAspectRatio = item.width / item.height
    const imageHeight = deviceWidth / imageAspectRatio

    return (
      <View style={[styles.imageContainer, { width: deviceWidth, height: deviceHeight }]}>
        <Zoom
          style={styles.zoomContainer}
          doubleTapConfig={{
            defaultScale: 2,
            minZoomScale: 1,
            maxZoomScale: 5,
          }}
        >
          <Image
            source={{ uri: item.uri }}
            resizeMode="contain"
            style={{
              width: deviceWidth,
              height: imageHeight,
            }}
          />
        </Zoom>
        {item.title && (
          <Text style={[styles.imageTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            {item.title}
          </Text>
        )}
      </View>
    )
  }

  return (
    <FlatList
      data={SAMPLE_IMAGES}
      renderItem={renderImageItem}
      keyExtractor={(item) => item.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.flatList}
    />
  )
}

const styles = StyleSheet.create({
  flatList: {
    flex: 1,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTitle: {
    position: 'absolute',
    bottom: 50,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
})
