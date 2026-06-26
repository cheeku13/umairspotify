import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { databaseService } from './services/database';
import { metadataService } from './services/metadata';
import { playerService } from './services/player';
import { queueService } from './services/queue';
import { useMusicStore } from './store/musicStore';
import { appEventBus } from './core/EventBus';

function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#ffffff', fontSize: 18 }}>Loading Harmony Player...</Text>
      </View>
    );
  }

  return (
      <View>
        <Text>Harmony Player</Text>
      </View>
    );
}

export default App;
