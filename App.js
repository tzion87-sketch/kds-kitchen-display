import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import KitchenDisplayScreen from './screens/KitchenDisplayScreen';
import AdminScreen from './screens/AdminScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Kitchen" component={KitchenDisplayScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
