import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Button, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LineChart } from 'react-native-chart-kit';
import { useFonts, Poppins_500Medium } from '@expo-google-fonts/poppins';

const BetFeed = ({ user, token }) => {
  const [bets, setBets] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newBet, setNewBet] = useState({ description: '', amount: '', icon: 'stats-chart' });
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [shareCount, setShareCount] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState(null);

  const [fontsLoaded] = useFonts({
    Poppins_500Medium,
  });

  useEffect(() => {
    const fetchBets = async () => {
      try {
        const response = await axios.get('http://localhost:3000/bets', {
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
    if (!user || !newBet.description || !newBet.icon) {
      alert('Please fill in all fields');
      return;
    }
    try {
      const betData = { description: newBet.description, icon: newBet.icon }; // Removed amount
      console.log('Sending bet data:', betData);
      const response = await axios.post('http://localhost:3000/bets', betData, {
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
    try {
      const response = await axios.get(`http://localhost:3000/bets/${bet.id}/comments`, {
        headers: { Authorization: token },
      });
      setComments(response.data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleSelectPosition = (position) => {
    setSelectedPosition(position === selectedPosition ? null : position);
  };

  const handleBuy = async () => {
    if (!selectedPosition || shareCount <= 0) {
      alert('Please select a position and enter a valid number of shares');
      return;
    }
    const pricePerShare = selectedPosition === 'Yes' ? selectedBet.yes_price : selectedBet.no_price;
    const totalAmount = shareCount * pricePerShare; // Total cost in cents
    try {
      await axios.post(
        'http://localhost:3000/bets/buy',
        { bet_id: selectedBet.id, position: selectedPosition, amount: totalAmount },
        { headers: { Authorization: token } }
      );
      const response = await axios.get('http://localhost:3000/bets', {
        headers: { Authorization: token },
      });
      setBets(response.data);
      setDetailsModalVisible(false);
      alert(`Successfully bought ${shareCount} ${selectedPosition} shares for $${totalAmount / 100}`);
      setShareCount(0);
      setSelectedPosition(null);
    } catch (err) {
      console.error('Error buying shares:', err);
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
        `http://localhost:3000/bets/${selectedBet.id}/comments`,
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
      <View style={styles.glow} />
      <Ionicons name={item.icon} size={32} color="#26C6DA" style={styles.betIcon} />
      <View style={styles.betDetails}>
        <View style={styles.titleAndOddsContainer}>
          <Text style={styles.betTitle} numberOfLines={2} ellipsizeMode="tail">
            {item.description}
          </Text>
          <View style={styles.oddsAndVolumeContainer}>
            <Text style={styles.oddsText}>
              {item.yes_price}%
            </Text>
            <Text style={styles.volumeText}>
              Vol: ${(item.total_volume || 0) / 100}
            </Text>
          </View>
        </View>
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
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
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
            backgroundColor: '#2A2E32',
            backgroundGradientFrom: '#2A2E32',
            backgroundGradientTo: '#2A2E32',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(176, 190, 197, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '6', strokeWidth: '2', stroke: '#4CAF50' },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }}
        />
      </View>
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {user && (
        <TouchableOpacity style={styles.plusButton} onPress={() => setModalVisible(true)}>
          <View style={styles.glow} />
          <Ionicons name="add-circle" size={40} color="#FFFFFF" style={styles.plusIcon} />
          <View style={styles.buttonOutline} />
        </TouchableOpacity>
      )}

      {/* Create New Bet Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.fullScreenModal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create a New Bet</Text>
              <TextInput
                style={styles.input}
                placeholder="Bet description"
                placeholderTextColor="#B0BEC5"
                value={newBet.description}
                onChangeText={(text) => setNewBet({ ...newBet, description: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Amount (e.g., $10)"
                placeholderTextColor="#B0BEC5"
                value={newBet.amount}
                onChangeText={(text) => setNewBet({ ...newBet, amount: text })}
              />
              <View style={styles.buttonContainer}>
                <Button title="Cancel" onPress={() => setModalVisible(false)} color="#666" />
                <Button title="Create Bet" onPress={handleAddBet} color="#4B0082" />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Bet Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.fullScreenModal}>
            <View style={styles.modalContent}>
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
                  <Text style={styles.modalText}>Yes Price: {selectedBet.yes_price}¢/share</Text>
                  <Text style={styles.modalText}>No Price: {selectedBet.no_price}¢/share</Text>

                  {/* Price Graph */}
                  {renderPriceGraph()}

                  {/* Buy Shares Section */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Buy Shares</Text>
                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={[styles.positionButton, selectedPosition === 'Yes' && styles.selectedButton]}
                        onPress={() => handleSelectPosition('Yes')}
                      >
                        <Text style={styles.positionButtonText}>Yes {selectedBet.yes_price}¢/share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.positionButton, selectedPosition === 'No' && styles.selectedButton]}
                        onPress={() => handleSelectPosition('No')}
                      >
                        <Text style={styles.positionButtonText}>No {selectedBet.no_price}¢/share</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Number of shares"
                      placeholderTextColor="#B0BEC5"
                      keyboardType="numeric"
                      value={shareCount.toString()}
                      onChangeText={(text) => setShareCount(parseInt(text) || 0)}
                    />
                    <Text style={styles.totalCostText}>
                      Total Cost: ${(shareCount * (selectedPosition === 'Yes' ? selectedBet.yes_price : selectedPosition === 'No' ? selectedBet.no_price : 0) / 100).toFixed(2)}
                    </Text>
                    <Button title="Buy" onPress={handleBuy} color="#4CAF50" disabled={!selectedPosition || shareCount <= 0} />
                  </View>

                  {/* Comment Section */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Comments</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Add a comment"
                      placeholderTextColor="#B0BEC5"
                      value={newComment}
                      onChangeText={setNewComment}
                    />
                    <Button title="Post Comment" onPress={handleAddComment} color="#42A5F5" />
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
              <View style={styles.buttonContainer}>
                <Button title="Close" onPress={() => setDetailsModalVisible(false)} color="#666" />
              </View>
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
    backgroundColor: '#1C2526',
  },
  backgroundGradientLayer2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 18, 18, 0.5)',
  },
  plusButton: {
    position: 'absolute',
    top: 20,
    right: 10,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C0FF33',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  plusIcon: {
    position: 'absolute',
  },
  buttonOutline: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderColor: '#99CC00',
    borderRadius: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullScreenModal: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#2A2E32',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: 40,
  },
  modalTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
    marginBottom: 15,
  },
  input: {
    height: 50,
    borderColor: '#26C6DA',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    color: '#FFFFFF',
    backgroundColor: '#333',
    borderRadius: 8,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#B0BEC5',
    fontFamily: 'Poppins_500Medium',
    marginBottom: 10,
  },
  positionButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: '#333',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26C6DA',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  positionButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
  },
  commentContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#B0BEC5',
    paddingTop: 10,
  },
  comment: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
  },
  commentMeta: {
    fontSize: 12,
    color: '#B0BEC5',
    fontFamily: 'Poppins_500Medium',
    marginTop: 5,
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingTop: 80,
  },
  betItem: {
    flexDirection: 'row',
    backgroundColor: '#2A2E32',
    borderRadius: 12,
    padding: 10,
    marginVertical: 5,
    alignItems: 'center',
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
  betIcon: {
    marginRight: 10,
  },
  betDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleAndOddsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: '70%',
  },
  oddsAndVolumeContainer: {
    alignItems: 'flex-end',
  },
  oddsText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
    backgroundColor: 'rgba(43, 0, 130, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  volumeText: {
    fontSize: 12,
    color: '#B0BEC5',
    fontFamily: 'Poppins_500Medium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#B0BEC5',
    fontFamily: 'Poppins_500Medium',
  },
  glow: {
    position: 'absolute',
    bottom: -5,
    left: 0,
    right: 0,
    height: 5,
    shadowColor: '#4B0082',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  totalCostText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default BetFeed;
