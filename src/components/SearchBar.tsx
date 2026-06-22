import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Search, XCircle } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface SearchBarProps {
  placeholder?: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  value: string;
  debounceMs?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search songs, artists, albums',
  onChangeText,
  onClear,
  value,
  debounceMs = 180,
}) => {
  const [draft, setDraft] = useState(value);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const emitChange = useCallback(
    (text: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => onChangeText(text), debounceMs);
    },
    [debounceMs, onChangeText],
  );

  const handleChangeText = useCallback(
    (text: string) => {
      setDraft(text);
      emitChange(text);
    },
    [emitChange],
  );

  const handleClear = useCallback(() => {
    setDraft('');
    onChangeText('');
    onClear?.();
  }, [onChangeText, onClear]);

  return (
    <View style={styles.container}>
      <View style={styles.searchInputContainer}>
        <Search color={colors.text.secondary} size={18} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.text.secondary}
          onChangeText={handleChangeText}
          value={draft}
          autoCorrect={false}
          returnKeyType="search"
          selectionColor={colors.brand.primary}
        />
        {draft.length > 0 && (
          <TouchableOpacity 
            onPress={handleClear} 
            style={styles.clearButton} 
            accessibilityLabel="Clear search"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <XCircle color={colors.text.secondary} size={18} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.glass.light,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
});

export default SearchBar;
