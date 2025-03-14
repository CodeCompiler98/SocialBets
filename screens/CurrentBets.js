import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const CurrentBets = ({ user, token }) => {
  const [userBets, setUserBets] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const fetchUserBets = async () => {
        try {
          console.log('Token being sent:', token);
          if (!token) {
            alert('Not authenticated. Please log in.');
            return;
          }
          const response = await axios.get('http://192.168.12.248:3000/user_bets', {
            headers: { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` },
          });
          console.log('Fetched user bets:', response.data);
          setUserBets(response.data);
        } catch (err) {
          console.error('Error fetching user bets:', err.response ? err.response.data : err.message);
          if (err.response && err.response.status === 401) {
            alert('Session expired. Please log in again.');
            // navigation.navigate('Login'); // Uncomment if using React Navigation
          }
        }
      };
      fetchUserBets();
      return () => {
        console.log('CurrentBets unfocused');
      };
    }, [token])
  );

  const renderUserBetItem = ({ item }) => (
    <TouchableOpacity style={styles.betItem}>
      <Ionicons name={item.icon} size={24} color="blue" style={styles.betIcon} />
      <View style={styles.betDetails}>
        <Text style={styles.betDescription}>{item.description} (by {item.username})</Text>
        <Text style={styles.betAmount}>Position: {item.position} - ${item.amount / 100}</Text>
        <Text style={styles.betAmount}>Current Yes Price: {item.yes_price}¢</Text>
        <Text style={styles.betAmount}>Current No Price: {item.no_price}¢</Text>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 60 },
    listContainer: { paddingHorizontal: 10, paddingTop: 60 },
    betItem: {
      flexDirection: 'row',
      backgroundColor: 'white',
      borderRadius: 8,
      padding: 10,
      marginVertical: 5,
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    betIcon: { marginRight: 10 },
    betDetails: { flex: 1 },
    betDescription: { fontSize: 16, fontWeight: 'bold' },
    betAmount: { fontSize: 14, color: 'gray' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 18, color: 'gray' },
  });

  return (
    <View style={styles.container}>
      {userBets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't placed any bets yet!</Text>
        </View>
      ) : (
        <FlatList
          data={userBets}
          renderItem={renderUserBetItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

export default CurrentBets;