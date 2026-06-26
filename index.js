import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import TrackPlayer from 'react-native-track-player';


TrackPlayer.registerPlaybackService(() =>
  require('./src/services/playbackService').default
);
AppRegistry.registerComponent(appName, () => App);
