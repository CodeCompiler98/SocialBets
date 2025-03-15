import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_500Medium } from '@expo-google-fonts/poppins';

const Profile = ({ user, token }) => {
  const [userStats, setUserStats] = useState({ totalBets: 0, totalWins: 0 }); // Initializing with 0s
  const [fontsLoaded] = useFonts({
    Poppins_500Medium,
  });

  // Placeholder for stats - no API call yet since /user-stats caused 404
  // TODO: Update this effect to fetch from /user-bets or similar when backend is ready
  // Note: total_wins will be added to the users table later; for now, set to 0
  useEffect(() => {
    if (!user || !token) return;
    // Simulated data as placeholder; replace with API call later
    setUserStats({ totalBets: 0, totalWins: 0 }); // Placeholder until total_wins is added to users table
  }, [user, token]);

  if (!fontsLoaded) {
    return null;
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.backgroundGradientLayer1} />
        <View style={styles.backgroundGradientLayer2} />
        <Text style={styles.emptyText}>No user data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.backgroundGradientLayer1} />
      <View style={styles.backgroundGradientLayer2} />
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user.avatar || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
        </View>
        <Text style={styles.username}>{user.username || 'Unknown User'}</Text>
        <Text style={styles.email}>{user.email || 'No email provided'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.glow} />
          <Text style={styles.statTitle}>Total Bets</Text>
          <Text style={styles.statValue}>{userStats.totalBets}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.glow} />
          <Text style={styles.statTitle}>Total Wins</Text>
          <Text style={styles.statValue}>{userStats.totalWins}</Text>
        </View>
      </View>

      {/* Logout button placeholder - to be implemented with onLogout prop later */}
      <TouchableOpacity style={styles.logoutButton} disabled>
        <Text style={styles.logoutText}>Logout (Not Implemented Yet)</Text>
      </TouchableOpacity>
    </ScrollView>
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
    backgroundColor: 'rgba(18, 18, 18, 0.5)', // Subtle black overlay
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 60,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#26C6DA', // Teal border
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
    overflow: 'hidden',
    marginBottom: 15,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  username: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#B0BEC5',
    fontFamily: 'Poppins_500Medium',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 10,
    padding: 15,
    backgroundColor: '#2A2E32',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26C6DA',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
    position: 'relative',
    overflow: 'visible',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    bottom: -5,
    left: 0,
    right: 0,
    height: 5,
    shadowColor: '#4B0082', // Indigo purple glow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  statTitle: {
    fontSize: 16,
    color: '#B0BEC5',
    fontFamily: 'Poppins_500Medium',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
  },
  logoutButton: {
    backgroundColor: '#42A5F5', // Deep blue for button
    paddingVertical: 12,
    marginHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
    opacity: 0.6, // Dimmed since disabled
  },
  logoutText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
  },
  emptyText: {
    fontSize: 18,
    color: '#B0BEC5',
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default Profile;