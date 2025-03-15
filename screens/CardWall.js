import React from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { useFonts, Poppins_500Medium } from '@expo-google-fonts/poppins';

const CardWall = () => {
  const [fontsLoaded] = useFonts({
    Poppins_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  const renderCardItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.glow} />
      <Text style={styles.cardText}>Card Not Found</Text>
      <View style={styles.underline} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.backgroundGradientLayer1} />
      <View style={styles.backgroundGradientLayer2} />
      <FlatList
        data={Array(15).fill(null).map((_, index) => ({ id: index.toString(), found: false }))}
        renderItem={renderCardItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 60, paddingHorizontal: 10 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundGradientLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1C2526', // Dark gray base
  },
  backgroundGradientLayer2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 18, 18, 0.5)', // Subtle near-black overlay
  },
  card: {
    flex: 1,
    margin: 5,
    height: 150,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2E32', // Ensure solid background
    borderWidth: 1,
    borderColor: '#26C6DA',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
    position: 'relative',
    overflow: 'visible',
  },
  glow: {
    position: 'absolute',
    bottom: -5, // Closer to the card edge
    left: 0,
    right: 0,
    height: 5, // Thinner glow
    shadowColor: '#AB47BC', // Dark purple glow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 12, // Increased for a softer glow
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 10,
    zIndex: 1, // Ensure text is above glow
  },
  underline: {
    width: 50,
    height: 2,
    backgroundColor: '#26C6DA',
    marginTop: 5,
    zIndex: 1, // Ensure underline is above glow
  },
});

export default CardWall;