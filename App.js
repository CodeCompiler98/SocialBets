import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
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
      tabBarActiveTintColor: 'blue',
      tabBarInactiveTintColor: 'gray',
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
    <Tab.Screen name="Profile" component={Profile} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const handleLogin = (userData, userToken) => {
    console.log('handleLogin called with:', userData, userToken);
    setUser(userData);
    setToken(userToken);
  };

  return (
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
  );
}