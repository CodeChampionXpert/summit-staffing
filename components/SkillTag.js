import React from 'react';
import {Pressable, Text, View} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

import {Colors, Radius, Spacing, Typography} from '../constants/theme';

export const SkillTag = ({skill, onRemove, removable = true, disabled = false}) => {
  const canRemove = removable && !disabled;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: disabled ? `${Colors.primary}55` : Colors.primary,
        borderRadius: Radius.full,
        paddingVertical: 6,
        paddingHorizontal: 10,
        opacity: disabled ? 0.6 : 1,
      }}>
      <Text style={{color: Colors.text.white, fontSize: Typography.fontSize.sm, fontWeight: '700'}}>
        {skill}
      </Text>
      {canRemove ? (
        <Pressable onPress={onRemove} hitSlop={10} style={{marginLeft: 6}}>
          <Icon name="close" size={16} color={Colors.text.white} />
        </Pressable>
      ) : null}
    </View>
  );
};
