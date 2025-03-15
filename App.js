import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Poppins_500Medium } from '@expo-google-fonts/poppins';
import BetFeed from './screens/BetFeed';
import CardBattle from './screens/CardBattle';
import CardWall from './screens/CardWall';
import CommunityFeed from './screens/CommunityFeed';
import CurrentBets from './screens/CurrentBets';
import Profile from './screens/Profile';
import Login from './screens/Login';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = ({ user, token }) => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'BetFeed') iconName = 'stats-chart';
        else if (route.name === 'CardBattle') iconName = 'game-controller';
        else if (route.name === 'CardWall') iconName = 'map-outline';
        else if (route.name === 'CommunityFeed') iconName = 'people';
        else if (route.name === 'CurrentBets') iconName = 'wallet';
        else if (route.name === 'Profile') iconName = 'person';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#6A0DAD', // Lime/neon green for active tabs
      tabBarInactiveTintColor: '#B0BEC5', // Light gray for inactive tabs
      tabBarStyle: { backgroundColor: '#1C2526' }, // Dark gray tab bar
      headerStyle: { backgroundColor: '#1C2526' }, // Dark gray header
      headerTintColor: '#FFFFFF', // White text/icons in header
      headerTitleStyle: { fontFamily: 'Poppins_500Medium' },
    })}
  >
    <Tab.Screen name="BetFeed">
      {() => <BetFeed user={user} token={token} />}
    </Tab.Screen>
    <Tab.Screen name="CurrentBets" options={{ title: 'User Bets' }}>
      {() => <CurrentBets user={user} token={token} />}
    </Tab.Screen>
    <Tab.Screen name="CardWall" component={CardWall} options={{ title: 'Card Wall' }} />
    <Tab.Screen name="CardBattle" component={CardBattle} options={{ title: 'Battle' }} />
    <Tab.Screen name="CommunityFeed" component={CommunityFeed} options={{ title: 'Chat Feed' }} />
    <Tab.Screen name="Profile">
      {() => <Profile user={user} token={token} />}
    </Tab.Screen>
  </Tab.Navigator>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const [fontsLoaded] = useFonts({
    Poppins_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleLogin = (userData, userToken) => {
    console.log('handleLogin called with:', userData, userToken);
    setUser(userData);
    setToken(userToken);
  };

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar style="light" backgroundColor="#1C2526" />
      <NavigationContainer>
        <Stack.Navigator>
          {user ? (
            <Stack.Screen name="Main" options={{ headerShown: false }}>
              {() => <TabNavigator user={user} token={token} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Login" options={{ headerShown: false }}>
              {() => <Login onLogin={handleLogin} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#1C2526', // Dark gray background for the entire app
  },
});