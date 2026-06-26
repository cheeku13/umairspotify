import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MiniPlayer } from '@components/index';
import {
  DiscoverScreen,
  LibraryScreen,
  PlayerScreen,
  SettingsScreen,
  CreateSmartPlaylistScreen,
  InsightsScreen,
} from '@screens/index';
import { playerService } from '@services/player';
import { useMusicStore } from '@store/musicStore';
import { BlurView } from '@react-native-community/blur';
import { Compass, Library, Settings as SettingsIcon, BarChart3 } from 'lucide-react-native';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  MainTabs: undefined;
  PlayerModal: undefined;
  CreateSmartPlaylist: undefined;
};

export type TabParamList = {
  Discover: undefined;
  Library: undefined;
  Insights: undefined;
  Settings: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const BottomTabNavigator: React.FC = () => {
  const navigation = useNavigation();
  const tracks = useMusicStore(state => state.tracks);
  const playback = useMusicStore(state => state.playback);
  const currentTrack = useMemo(
    () => tracks.find(track => track.id === playback.currentTrackId) ?? null,
    [playback.currentTrackId, tracks],
  );

  const handlePlayPause = (): void => {
    if (playback.status === 'playing') {
      void playerService.pause();
    } else {
      void playerService.play();
    }
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            height: 65,
            paddingBottom: 8,
          },
          tabBarBackground: () => (
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType="dark"
              blurAmount={20}
              reducedTransparencyFallbackColor={colors.background.secondary}
            />
          ),
          tabBarActiveTintColor: colors.brand.primary,
          tabBarInactiveTintColor: colors.text.secondary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarIcon: ({ color, focused }) => {
            const iconSize = 24;
            if (route.name === 'Discover') {
              return <Compass color={color} size={iconSize} strokeWidth={focused ? 2.5 : 2} />;
            }
            if (route.name === 'Library') {
              return <Library color={color} size={iconSize} strokeWidth={focused ? 2.5 : 2} />;
            }
            if (route.name === 'Insights') {
              return <BarChart3 color={color} size={iconSize} strokeWidth={focused ? 2.5 : 2} />;
            }
            return <SettingsIcon color={color} size={iconSize} strokeWidth={focused ? 2.5 : 2} />;
          },
        })}
      >
        <Tab.Screen name="Discover" component={DiscoverScreen} />
        <Tab.Screen name="Library" component={LibraryScreen} />
        <Tab.Screen name="Insights" component={InsightsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
      <MiniPlayer
        track={currentTrack}
        isPlaying={playback.status === 'playing'}
        onPlayPause={handlePlayPause}
        onExpand={() => navigation.navigate('PlayerModal' as never)}
      />
    </>
  );
};

const AppNavigator: React.FC = () => (
  <NavigationContainer>
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_bottom',
      }}
    >
      <RootStack.Screen name="MainTabs" component={BottomTabNavigator} />
      <RootStack.Screen
        name="PlayerModal"
        component={PlayerScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <RootStack.Screen
        name="CreateSmartPlaylist"
        component={CreateSmartPlaylistScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </RootStack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;


// L10 PATCH: Gesture Conflict Resolution
// ──────────────────────────────────────────────────────────────────────────────
// On screens where the MiniPlayer is visible, the swipe-back gesture can
// conflict with the MiniPlayer's pan gesture (both listen for horizontal swipes).
//
// To fix, add gestureEnabled={false} to screens that show the MiniPlayer:
//
//   <Stack.Screen
//     name="Discover"
//     component={DiscoverScreen}
//     options={{ gestureEnabled: false }}  // ← disables swipe-back on this screen
//   />
//
// Or use Gesture.Exclusive() in the MiniPlayer to prioritize its pan gesture.
