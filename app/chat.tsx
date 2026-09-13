import { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { MockAiBadge } from '@/src/components/MockAiBadge';
import { PaywallSheet } from '@/src/components/PaywallSheet';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useApp, useEffectivePro } from '@/src/context/AppContext';
import { ChatMessage, chatReply } from '@/src/lib/chat';
import { canUseChat, consumeChat, FREE_LIMITS } from '@/src/lib/limits';
import { colors, DISCLAIMER } from '@/src/theme/colors';

export default function ChatScreen() {
  const { profile } = useApp();
  const { effectivePro } = useEffectivePro();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Xin chào! Mình là Van Su AI. Hỏi gì về ngày hôm nay cũng được — nhớ đây chỉ là giải trí nhé.\n\n— ${DISCLAIMER} —`,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [paywall, setPaywall] = useState(false);

  const refreshLimit = useCallback(async () => {
    const r = await canUseChat(effectivePro);
    setRemaining(r.remaining);
  }, [effectivePro]);

  useFocusEffect(
    useCallback(() => {
      refreshLimit();
    }, [refreshLimit]),
  );

  const send = async () => {
    const q = input.trim();
    if (!q || !profile) return;

    const gate = await canUseChat(effectivePro);
    if (!gate.ok) {
      setPaywall(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: q,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      await consumeChat(effectivePro);
      const reply = await chatReply(q, profile);
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: reply.text,
          createdAt: new Date().toISOString(),
          source: reply.source,
          showMockBadge: reply.showMockBadge,
        },
      ]);
      await refreshLimit();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <Text style={styles.limit}>
        {effectivePro
          ? 'Pro / Trial · Chat không giới hạn'
          : `Free · Còn ${remaining ?? '…'}/${FREE_LIMITS.chatMessages} tin hôm nay`}
      </Text>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === 'user' ? styles.user : styles.assistant,
            ]}
          >
            {item.role === 'assistant' ? (
              <MockAiBadge show={item.showMockBadge} />
            ) : null}
            <Text style={styles.bubbleText}>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập câu hỏi…"
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          editable={!loading}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <PrimaryButton
          title="Gửi"
          onPress={send}
          loading={loading}
          style={{ paddingHorizontal: 16, paddingVertical: 12 }}
        />
      </View>

      <PaywallSheet
        visible={paywall}
        feature="chat"
        remaining={remaining ?? 0}
        onClose={() => setPaywall(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  limit: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 12,
  },
  list: { padding: 16, paddingBottom: 8 },
  bubble: {
    maxWidth: '88%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  user: {
    alignSelf: 'flex-end',
    backgroundColor: colors.purple,
  },
  assistant: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { color: colors.text, lineHeight: 20 },
  composer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },
});
