import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SmartRule, SmartOperator } from '@apptypes/index';
import { databaseService } from '@services/database';
import { useMusicStore } from '@store/musicStore';
import { colors } from '../theme/colors';
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react-native';

const FIELDS = [
  { label: 'Play Count', value: 'playCount' },
  { label: 'Added Date', value: 'addedAt' },
  { label: 'Duration', value: 'durationMs' },
  { label: 'Artist', value: 'artistName' },
  { label: 'Favorite', value: 'isFavorite' },
];

const OPERATORS: { label: string, value: SmartOperator }[] = [
  { label: 'Equals', value: '=' },
  { label: 'Greater Than', value: '>' },
  { label: 'Less Than', value: '<' },
  { label: 'Contains', value: 'contains' },
];

const CreateSmartPlaylistScreen: React.FC = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState<SmartRule[]>([
    { field: 'playCount', operator: '>', value: 10 }
  ]);
  const upsertPlaylist = useMusicStore(state => state.upsertPlaylist);

  const handleAddRule = () => {
    setRules([...rules, { field: 'playCount', operator: '>', value: 10 }]);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleUpdateRule = (index: number, key: keyof SmartRule, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [key]: value };
    setRules(newRules);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      const playlist = await databaseService.createPlaylist(name, description, true, rules);
      upsertPlaylist(playlist);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create smart playlist', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Smart Playlist</Text>
        <TouchableOpacity style={[styles.iconButton, !name.trim() && { opacity: 0.5 }]} onPress={handleSave} disabled={!name.trim()}>
          <Check color={colors.brand.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="E.g., Heavy Rotation"
            placeholderTextColor={colors.text.secondary}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Automatically generated playlist..."
            placeholderTextColor={colors.text.secondary}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.label}>Rules</Text>
          <TouchableOpacity onPress={handleAddRule} style={styles.addButton}>
            <Plus color={colors.brand.primary} size={20} />
            <Text style={styles.addButtonText}>Add Rule</Text>
          </TouchableOpacity>
        </View>

        {rules.map((rule, index) => (
          <View key={index} style={styles.ruleCard}>
            <View style={styles.ruleRow}>
              {/* Field Select (simplified for this example as text input/buttons for now) */}
              <View style={styles.ruleInputGroup}>
                 <Text style={styles.ruleLabel}>Field</Text>
                 <TextInput 
                   style={styles.ruleInput} 
                   value={rule.field} 
                   onChangeText={(v) => handleUpdateRule(index, 'field', v)}
                 />
              </View>
              <View style={styles.ruleInputGroup}>
                 <Text style={styles.ruleLabel}>Operator</Text>
                 <TextInput 
                   style={styles.ruleInput} 
                   value={rule.operator} 
                   onChangeText={(v) => handleUpdateRule(index, 'operator', v)}
                 />
              </View>
            </View>
            <View style={styles.ruleRow}>
              <View style={[styles.ruleInputGroup, { flex: 1 }]}>
                 <Text style={styles.ruleLabel}>Value</Text>
                 <TextInput 
                   style={styles.ruleInput} 
                   value={String(rule.value)} 
                   onChangeText={(v) => handleUpdateRule(index, 'value', v)}
                 />
              </View>
              <TouchableOpacity onPress={() => handleRemoveRule(index)} style={styles.removeButton}>
                <Trash2 color={colors.system.error} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.light,
  },
  iconButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.glass.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.medium,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: colors.brand.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  ruleCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.glass.light,
  },
  ruleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  ruleInputGroup: {
    flex: 1,
    marginRight: 8,
  },
  ruleLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  ruleInput: {
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: 10,
    color: colors.text.primary,
    fontSize: 14,
  },
  removeButton: {
    padding: 10,
    backgroundColor: colors.glass.light,
    borderRadius: 8,
  },
});

export default CreateSmartPlaylistScreen;
