import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Button, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LineChart } from 'react-native-chart-kit';

const BetFeed = ({ user, token }) => {
  const [bets, setBets] = useState([]);
  const [modalVisible, setModalVisible] = useState(false); // For creating a new bet
  const [newBet, setNewBet] = useState({ description: '', amount: '', icon: 'stats-chart' });
  const [detailsModalVisible, setDetailsModalVisible] = useState(false); // For showing bet details
  const [selectedBet, setSelectedBet] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [buyAmount, setBuyAmount] = useState(0);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        const response = await axios.get('http://192.168.12.248:3000/bets', {
          headers: { Authorization: token },
        });
        console.log('Fetched bets:', response.data);
        setBets(response.data);
      } catch (err) {
        console.error('Error fetching bets:', err);
      }
    };
    fetchBets();
  }, [user, token]);

  const handleAddBet = async () => {
    if (!user || !newBet.description || !newBet.amount) {
      alert('Please fill in all fields');
      return;
    }
    try {
      const betData = { description: newBet.description, amount: newBet.amount, icon: newBet.icon };
      const response = await axios.post('http://192.168.12.248:3000/bets', betData, {
        headers: { Authorization: token },
      });
      setBets([response.data, ...bets]);
      setNewBet({ description: '', amount: '', icon: 'stats-chart' });
      setModalVisible(false);
    } catch (err) {
      console.error('Error adding bet:', err);
      alert('Failed to create bet: ' + (err.response ? err.response.data : 'Network error'));
    }
  };

  const handleBetClick = async (bet) => {
    setSelectedBet(bet);
    setDetailsModalVisible(true);
    // Fetch comments for the selected bet
    try {
      const response = await axios.get(`http://192.168.12.248:3000/bets/${bet.id}/comments`, {
        headers: { Authorization: token },
      });
      setComments(response.data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleBuy = async (position) => {
    if (buyAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    try {
      await axios.post(
        'http://192.168.12.248:3000/bets/buy',
        { bet_id: selectedBet.id, position, amount: buyAmount },
        { headers: { Authorization: token } }
      );
      // Remove the bet from BetFeed
      setBets(bets.filter((bet) => bet.id !== selectedBet.id));
      setDetailsModalVisible(false);
      alert(`Successfully bought ${position} position for $${buyAmount / 100}`);
    } catch (err) {
      console.error('Error buying position:', err);
      alert('Failed to buy: ' + (err.response ? err.response.data : 'Network error'));
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert('Please enter a comment');
      return;
    }
    try {
      const response = await axios.post(
        `http://192.168.12.248:3000/bets/${selectedBet.id}/comments`,
        { message: newComment },
        { headers: { Authorization: token } }
      );
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment: ' + (err.response ? err.response.data : 'Network error'));
    }
  };

  const renderBetItem = ({ item }) => (
    <TouchableOpacity style={styles.betItem} onPress={() => handleBetClick(item)}>
      <Ionicons name={item.icon} size={24} color="blue" style={styles.betIcon} />
      <View style={styles.betDetails}>
        <Text style={styles.betDescription}>{item.description} (by {item.username})</Text>
        <Text style={styles.betAmount}>{item.amount}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderPriceGraph = () => {
    if (!selectedBet || !selectedBet.odds_history || selectedBet.odds_history.length === 0) {
      return <Text style={styles.modalText}>No odds history available</Text>;
    }

    const data = {
      labels: selectedBet.odds_history.map((entry) => new Date(entry.timestamp).toLocaleDateString()),
      datasets: [
        {
          data: selectedBet.odds_history.map((entry) => entry.yes_price),
          color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`, // Green for Yes
          strokeWidth: 2,
        },
      ],
    };

    return (
      <View>
        <Text style={styles.modalText}>Yes Price Over Time</Text>
        <LineChart
          data={data}
          width={300}
          height={200}
          chartConfig={{
            backgroundColor: '#e26a00',
            backgroundGradientFrom: '#fb8c00',
            backgroundGradientTo: '#ffa726',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '6', strokeWidth: '2', stroke: '#ffa726' },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 60 },
    plusButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      zIndex: 1,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center',
    },
    modalText: {
      fontSize: 16,
      marginBottom: 10,
    },
    input: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 10,
      padding: 5,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    commentContainer: {
      marginTop: 20,
      borderTopWidth: 1,
      borderTopColor: '#ddd',
      paddingTop: 10,
    },
    comment: {
      marginBottom: 10,
      padding: 10,
      backgroundColor: '#f9f9f9',
      borderRadius: 5,
    },
    commentText: {
      fontSize: 14,
    },
    commentMeta: {
      fontSize: 12,
      color: 'gray',
      marginTop: 5,
    },
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
      {user && (
        <TouchableOpacity style={styles.plusButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={50} color="blue" />
        </TouchableOpacity>
      )}

      {/* Modal for Creating a New Bet */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create a New Bet</Text>
            <TextInput
              style={styles.input}
              placeholder="Bet description"
              value={newBet.description}
              onChangeText={(text) => setNewBet({ ...newBet, description: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount (e.g., $10)"
              value={newBet.amount}
              onChangeText={(text) => setNewBet({ ...newBet, amount: text })}
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} color="gray" />
              <Button title="Create Bet" onPress={handleAddBet} color="blue" />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for Viewing Bet Details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>Bet Details</Text>
            {selectedBet && (
              <>
                <Text style={styles.modalText}>Description: {selectedBet.description}</Text>
                <Text style={styles.modalText}>Amount: {selectedBet.amount}</Text>
                <Text style={styles.modalText}>Created by: {selectedBet.username}</Text>
                <Text style={styles.modalText}>Icon: {selectedBet.icon}</Text>
                {selectedBet.created_at && (
                  <Text style={styles.modalText}>
                    Created on: {new Date(selectedBet.created_at).toLocaleString()}
                  </Text>
                )}
                <Text style={styles.modalText}>Yes Price: {selectedBet.yes_price}¢</Text>
                <Text style={styles.modalText}>No Price: {selectedBet.no_price}¢</Text>

                {/* Price Graph */}
                {renderPriceGraph()}

                {/* Buy/Sell Section */}
                <View style={{ marginTop: 20 }}>
                  <Text style={styles.modalText}>Buy Position</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Button title={`Yes ${selectedBet.yes_price}¢`} color="green" onPress={() => handleBuy('Yes')} />
                    <Button title={`No ${selectedBet.no_price}¢`} color="red" onPress={() => handleBuy('No')} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Amount in cents (e.g., 100 for $1)"
                    keyboardType="numeric"
                    value={buyAmount.toString()}
                    onChangeText={(text) => setBuyAmount(parseInt(text) || 0)}
                  />
                </View>

                {/* Comment Section */}
                <View style={styles.commentContainer}>
                  <Text style={styles.modalText}>Comments</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Add a comment"
                    value={newComment}
                    onChangeText={setNewComment}
                  />
                  <Button title="Post Comment" onPress={handleAddComment} color="blue" />
                  {comments.map((comment) => (
                    <View key={comment.id} style={styles.comment}>
                      <Text style={styles.commentText}>{comment.message}</Text>
                      <Text style={styles.commentMeta}>
                        {comment.username} • {new Date(comment.created_at).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            <View style={styles.modalButtons}>
              <Button title="Close" onPress={() => setDetailsModalVisible(false)} color="gray" />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {bets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No current bets, go create one!</Text>
        </View>
      ) : (
        <FlatList
          data={bets}
          renderItem={renderBetItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

export default BetFeed;