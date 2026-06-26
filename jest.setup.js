// ─── React Native ──────────────────────────────────────────────────────────
jest.unmock('react-native');

// ─── react-native-reanimated ────────────────────────────────────────────────
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

// ─── react-native-track-player ──────────────────────────────────────────────
jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    registerPlaybackService: jest.fn(),
    setupPlayer: jest.fn(() => Promise.resolve()),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    skip: jest.fn(() => Promise.resolve()),
    skipToNext: jest.fn(() => Promise.resolve()),
    skipToPrevious: jest.fn(() => Promise.resolve()),
    seekTo: jest.fn(() => Promise.resolve()),
    setVolume: jest.fn(() => Promise.resolve()),
    setRate: jest.fn(() => Promise.resolve()),
    getProgress: jest.fn(() => Promise.resolve({ position: 0, duration: 0, buffered: 0 })),
    getPlaybackState: jest.fn(() => Promise.resolve({ state: 'idle' })),
    getQueue: jest.fn(() => Promise.resolve([])),
    getCurrentTrack: jest.fn(() => Promise.resolve(null)),
    add: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve()),
    move: jest.fn(() => Promise.resolve()),
    reset: jest.fn(() => Promise.resolve()),
    State: { Playing: 'playing', Paused: 'paused', Stopped: 'stopped', Ready: 'ready', Buffering: 'buffering', Connecting: 'connecting', Error: 'error', End: 'ended' },
    Event: {
      PlaybackState: 'playback-state',
      PlaybackQueueEnded: 'playback-queue-ended',
      PlaybackTrackChanged: 'playback-track-changed',
      PlaybackProgressUpdated: 'playback-progress-updated',
      RemotePlay: 'remote-play',
      RemotePause: 'remote-pause',
      RemoteStop: 'remote-stop',
      RemoteNext: 'remote-next',
      RemotePrevious: 'remote-previous',
      RemoteSeek: 'remote-seek',
    },
    Capability: {
      Play: 'play',
      Pause: 'pause',
      Stop: 'stop',
      SkipToNext: 'skipToNext',
      SkipToPrevious: 'skipToPrevious',
      SeekTo: 'seekTo',
    },
    RepeatMode: { Off: 0, Track: 1, Queue: 2 },
    PitchAlgorithm: { linear: 0, linearMusic: 1 },
  },
  useTrackPlayerProgress: jest.fn(() => ({ position: 0, duration: 0, buffered: 0 })),
  usePlaybackState: jest.fn(() => ({ state: 'idle' })),
  useProgress: jest.fn(() => ({ position: 0, duration: 0, buffered: 0 })),
  useTrackPlayerEvents: jest.fn(),
}));

// ─── react-native-mmkv ──────────────────────────────────────────────────────
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn((key) => undefined),
    getNumber: jest.fn((key) => undefined),
    getBoolean: jest.fn((key) => undefined),
    getStringAsync: jest.fn(() => Promise.resolve(undefined)),
    set: jest.fn(),
    delete: jest.fn(),
    contains: jest.fn(() => false),
    getAllKeys: jest.fn(() => []),
    clearAll: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    transactions: jest.fn(() => ({ remove: jest.fn() })),
  })),
  enableMMKVFlipper: jest.fn(),
}));

// ─── @op-engineering/op-sqlite ──────────────────────────────────────────────
jest.mock('@op-engineering/op-sqlite', () => {
  const mockDb = {
    execute: jest.fn(() => ({
      rows: { _array: [], length: 0, item: jest.fn(() => null) },
      insertId: 1,
      rowsAffected: 0,
    })),
    executeBatch: jest.fn(() => ({ rowsAffected: 0 })),
    executeWithListeners: jest.fn(),
    close: jest.fn(),
    attach: jest.fn(),
    detach: jest.fn(),
    exec: jest.fn(),
    loadFile: jest.fn(() => ({ commands: 0, rowsAffected: 0 })),
  };
  return {
    open: jest.fn(() => mockDb),
    close: jest.fn(),
    SQLiteConnection: jest.fn(() => mockDb),
    SQLite3: { serialize: jest.fn(), deserialize: jest.fn() },
    Type: { INT: 1, INTEGER: 1, REAL: 2, FLOAT: 2, TEXT: 3, STRING: 3, BLOB: 4 },
    Status: { Ok: 0, Error: 1, Misuse: 2 },
  };
});

// ─── @react-native-community/blur ───────────────────────────────────────────
jest.mock('@react-native-community/blur', () => ({
  BlurView: jest.fn(({ children }) => children),
  BlurType: { light: 'light', dark: 'dark', xlight: 'xlight', extraLight: 'xlight' },
}));

// ─── react-native-fs ────────────────────────────────────────────────────────
jest.mock('react-native-fs', () => ({
  readFile: jest.fn(() => Promise.resolve('')),
  writeFile: jest.fn(() => Promise.resolve()),
  readDir: jest.fn(() => Promise.resolve([])),
  exists: jest.fn(() => Promise.resolve(false)),
  mkdir: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
  moveFile: jest.fn(() => Promise.resolve()),
  copyFile: jest.fn(() => Promise.resolve()),
  stat: jest.fn(() => Promise.resolve({ isFile: () => false, isDirectory: () => true })),
  DocumentDirectoryPath: '/mock/documents',
  ExternalStorageDirectoryPath: '/mock/storage',
  TemporaryDirectoryPath: '/mock/tmp',
  CachesDirectoryPath: '/mock/caches',
  MainBundlePath: '/mock/bundle',
}));

// ─── react-native-linear-gradient ───────────────────────────────────────────
jest.mock('react-native-linear-gradient', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => children),
}));

// ─── react-native-svg ───────────────────────────────────────────────────────
jest.mock('react-native-svg', () => {
  const React = require('react');
  const Mock = (name) => {
    const Comp = React.forwardRef((props, ref) =>
      React.createElement(name, { ...props, ref }, props.children)
    );
    Comp.displayName = name;
    return Comp;
  };
  return {
    __esModule: true,
    default: Mock('Svg'),
    Svg: Mock('Svg'),
    Circle: Mock('Circle'),
    Ellipse: Mock('Ellipse'),
    G: Mock('G'),
    Text: Mock('Text'),
    TSpan: Mock('TSpan'),
    TextPath: Mock('TextPath'),
    Path: Mock('Path'),
    Polygon: Mock('Polygon'),
    Polyline: Mock('Polyline'),
    Line: Mock('Line'),
    Rect: Mock('Rect'),
    Use: Mock('Use'),
    Image: Mock('Image'),
    Symbol: Mock('Symbol'),
    Defs: Mock('Defs'),
    LinearGradient: Mock('LinearGradient'),
    RadialGradient: Mock('RadialGradient'),
    Stop: Mock('Stop'),
    ClipPath: Mock('ClipPath'),
    Pattern: Mock('Pattern'),
    Mask: Mock('Mask'),
    ForeignObject: Mock('ForeignObject'),
  };
});

// ─── react-native-safe-area-context ─────────────────────────────────────────
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => React.createElement('View', null, children),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
    SafeAreaInsetsContext: React.createContext(inset),
    SafeAreaFrameContext: React.createContext({ x: 0, y: 0, width: 375, height: 812 }),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: inset,
    },
  };
});

// ─── react-native-gesture-handler ───────────────────────────────────────────
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const View = React.forwardRef((props, ref) =>
    React.createElement('View', { ...props, ref }, props.children)
  );
  return {
    __esModule: true,
    default: {
      Directions: { RIGHT: 1, LEFT: 2, UP: 3, DOWN: 4 },
      State: {
        BEGAN: 'began', ACTIVE: 'active', CANCELLED: 'cancelled',
        END: 'end', FAILED: 'failed', UNDETERMINED: 'undetermined',
      },
    },
    Swipeable: View,
    DrawerLayout: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    ScrollView: React.forwardRef((props, ref) =>
      React.createElement('ScrollView', { ...props, ref }, props.children)
    ),
    Slider: View,
    Switch: View,
    TextInput: React.forwardRef((props, ref) =>
      React.createElement('TextInput', { ...props, ref }, props.children)
    ),
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandlerGestureEvent: {},
    NativeViewGestureHandlerStateChangeEvent: {},
    FlatList: React.forwardRef((props, ref) =>
      React.createElement('FlatList', { ...props, ref }, props.children)
    ),
    gestureHandlerRootHOC: jest.fn((Component) => Component),
    Gesture: {
      Pan: () => ({ onStart: jest.fn(), onUpdate: jest.fn(), onEnd: jest.fn(), enabled: jest.fn() }),
      Tap: () => ({ onStart: jest.fn(), onEnd: jest.fn() }),
      Pinch: () => ({ onStart: jest.fn(), onEnd: jest.fn() }),
      Exclusive: (...args) => args[0],
      Race: (...args) => args[0],
      Simultaneous: (...args) => args[0],
    },
  };
});

// ─── @react-native-community/slider ─────────────────────────────────────────
jest.mock('@react-native-community/slider', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) =>
      React.createElement('View', { ...props, ref })
    ),
  };
});

// ─── eventemitter3 ──────────────────────────────────────────────────────────
jest.mock('eventemitter3', () => {
  return class MockEventEmitter {
    constructor() {
      this.listeners = {};
    }
    on(event, cb) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(cb);
      return this;
    }
    off(event, cb) {
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter(l => l !== cb);
      }
      return this;
    }
    emit(event, ...args) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(cb => cb(...args));
      }
    }
    removeAllListeners(event) {
      if (event) { this.listeners[event] = []; }
      else { this.listeners = {}; }
    }
  };
});

// ─── Silence console.warn for known benign warnings in tests ─────────────────
const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args.join(' ');
  if (msg.includes('Animated') || msg.includes('useNativeDriver')) return;
  originalWarn(...args);
};
