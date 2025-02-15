
// app/(tabs)/gantt.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GanttScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coming soon...</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5A4C77',
  },
});