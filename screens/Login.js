import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    bio: '',
  });

  const handleSubmit = async () => {
    try {
      console.log('Sending login request with data:', { username: formData.username, password: formData.password });
      let response;
      if (isRegistering) {
        console.log('Sending register request with data:', formData);
        response = await axios.post('http://192.168.12.248:3000/register', formData);
        console.log('Register response:', response.data);
        onLogin(response.data.user, response.data.token);
      } else {
        console.log('Sending login request with data:', { username: formData.username, password: formData.password });
        response = await axios.post('http://192.168.12.248:3000/login', {
          username: formData.username,
          password: formData.password,
        });
        console.log('Login response:', response.data); // Log the response
        onLogin(response.data.user, response.data.token); // Trigger navigation
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err.response ? err.response.data : err.message); // Log the error
      alert('Failed to login/register: ' + (err.response ? err.response.data : 'Network error'));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegistering ? 'Register' : 'Login'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={formData.username}
        onChangeText={(text) => setFormData({ ...formData, username: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
      />
      {isRegistering && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Bio"
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
          />
        </>
      )}
      <Button title={isRegistering ? 'Register' : 'Login'} onPress={handleSubmit} />
      <Button
        title={isRegistering ? 'Switch to Login' : 'Switch to Register'}
        onPress={() => setIsRegistering(!isRegistering)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, padding: 5 },
});

export default Login;