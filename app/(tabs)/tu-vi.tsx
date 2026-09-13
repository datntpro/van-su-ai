import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { AdPlaceholder } from '@/src/components/AdPlaceholder';
import { DisclaimerBanner } from '@/src/components/DisclaimerBanner';
import { MockAiBadge } from '@/src/components/MockAiBadge';
import { PaywallSheet } from '@/src/components/PaywallSheet';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { TrialErrorBanner } from '@/src/components/TrialErrorBanner';
import { useApp, useEffectivePro } from '@/src/context/AppContext';
import { useAuth } from '@/src/context/AuthContext';
import { horoscopeIntakeTurn } from '@/src/lib/horoscopeConversation';
import {
  appendHoroscopeChat,
  clearHoroscopeChats,
  loadHoroscopeChats,
} from '@/src/lib/horoscopeChatStore';
import { canUseHoroscope, consumeHoroscope, FREE_LIMITS } from '@/src/lib/limits';
import { traitsSummaryLines, type IntakeField } from '@/src/lib/traits';
import { colors, DISCLAIMER } from '@/src/theme/colors';

type TuViMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  source?: 'api' | 'mock';
  showMockBadge?: boolean;
};

const WELCOME: TuViMessage = {
  id: 'welcome',
  role: 'assistant',
  text: `Mình sẽ hỏi vài câu để luận giải tử vi sát với bạn hơn — giờ sinh, giới tính, tình cảm, công việc, điều đang quan tâm, mục tiêu năm nay. Bạn trả lời từng câu, hoặc bỏ qua để xem ngay.\n\n— ${DISCLAIMER} —`,
  createdAt: new Date().toISOString(),
};

export default function TuViScreen() {
  const { profile, traits, patchTraits, setProfile } = useApp();
  const { effectivePro } = useEffectivePro();
  const { user, isDemoAuth } = useAuth();
  const [messages, setMessages] = useState<TuViMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [pendingField, setPendingField] = useState<IntakeField | null>(null);
  const [intakeDone, setIntakeDone] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const listRef = useRef<FlatList<TuViMessage>>(null);

  const cloudUser =
    Boolean(user && !isDemoAuth && user.id && !user.id.startsWith('demo-'));

  const refreshLimit = useCallback(async () => {
    const r = await canUseHoroscope(effectivePro);
    setRemaining(r.remaining);
  }, [effectivePro]);

  useFocusEffect(
    useCallback(() => {
      refreshLimit();
    }, [refreshLimit]),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cloudUser || !user) {
        setHydrated(true);
        return;
      }
      const rows = await loadHoroscopeChats(user.id);
      if (cancelled) return;
      if (rows.length) {
        setMessages(
          rows.map((r) => ({
            id: r.id,
            role: r.role === 'system' ? 'assistant' : r.role,
            text: r.content,
            createdAt: r.createdAt,
          })),
        );
        const last = rows[rows.length - 1];
        if (last && last.role === 'assistant' && last.content.length > 280) {
          setIntakeDone(true);
        }
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [cloudUser, user?.id]);

  const persist = async (role: 'user' | 'assistant', content: string) => {
    if (!cloudUser || !user) return;
    await appendHoroscopeChat(user.id, role, content);
  };

  const pushAssistant = (m: Omit<TuViMessage, 'id' | 'role' | 'createdAt'> & { text: string }) => {
    const msg: TuViMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      createdAt: new Date().toISOString(),
      ...m,
    };
    setMessages((prev) => [...prev, msg]);
    void persist('assistant', msg.text);
  };

  const saveTraitsFromTurn = async (turn: {
    traits: typeof traits;
    birthTime?: string;
  }) => {
    await patchTraits(turn.traits);
    if (turn.birthTime && profile && turn.birthTime !== profile.birthTime) {
      await setProfile({ ...profile, birthTime: turn.birthTime });
    }
  };

  const runTurn = async (opts: {
    userMessage?: string | null;
    skip?: boolean;
  }) => {
    if (!profile) return;
    setLoading(true);
    try {
      const turn = await horoscopeIntakeTurn({
        profile,
        traits,
        pendingField,
        userMessage: opts.userMessage,
        skip: opts.skip,
        history: messages
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({ role: m.role, text: m.text })),
      });
      await saveTraitsFromTurn(turn);
      setPendingField(turn.nextField);
      if (turn.readyForReading) {
        const gate = await canUseHoroscope(effectivePro);
        if (!gate.ok) {
          setPaywall(true);
          setLoading(false);
          return;
        }
        await consumeHoroscope(effectivePro);
        await refreshLimit();
        setIntakeDone(true);
      }
      pushAssistant({
        text: turn.assistantText,
        source: turn.source,
        showMockBadge: turn.showMockBadge,
      });
    } finally {
      setLoading(false);
    }
  };

  const onStart = async () => {
    if (!profile) return;
    await runTurn({ userMessage: null });
  };

  const onSkip = async () => {
    if (!profile) return;
    const gate = await canUseHoroscope(effectivePro);
    if (!gate.ok) {
      setPaywall(true);
      return;
    }
    await runTurn({ skip: true });
  };

  const send = async () => {
    const q = input.trim();
    if (!q || !profile) return;

    const userMsg: TuViMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: q,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    await persist('user', q);

    if (intakeDone) {
      // Follow-up after reading — still conversational, may produce another reading
      const gate = await canUseHoroscope(effectivePro);
      if (!gate.ok) {
        setPaywall(true);
        return;
      }
      await runTurn({ userMessage: q });
      return;
    }

    await runTurn({ userMessage: q });
  };

  const onReset = () => {
    Alert.alert('Làm lại hội thoại?', 'Xóa tin nhắn tử vi trên tài khoản này.', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          if (cloudUser && user) await clearHoroscopeChats(user.id);
          setMessages([WELCOME]);
          setPendingField(null);
          setIntakeDone(false);
        },
      },
    ]);
  };

  const known = profile ? traitsSummaryLines(profile.birthTime, traits) : [];
  const started = messages.length > 1;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Tử vi hôm nay</Text>
        <Text style={styles.sub}>
          {effectivePro
            ? 'Pro / Trial · Không giới hạn luận giải'
            : `Free · Còn ${remaining ?? '…'}/${FREE_LIMITS.horoscopePerDay} lượt luận giải hôm nay`}
        </Text>
        <TrialErrorBanner />
        {known.length ? (
          <Text style={styles.known}>Đã biết: {known.join(' · ')}</Text>
        ) : (
          <Text style={styles.known}>
            Hội thoại để thu thập hồ sơ cá nhân — không generic.
          </Text>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
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

      {!started && hydrated ? (
        <View style={styles.actions}>
          <PrimaryButton
            title="Bắt đầu trò chuyện"
            onPress={onStart}
            loading={loading}
            variant="gold"
          />
          <View style={{ height: 8 }} />
          <PrimaryButton
            title="Bỏ qua, luận giải ngay"
            onPress={onSkip}
            loading={loading}
            variant="ghost"
          />
        </View>
      ) : (
        <View style={styles.actions}>
          {!intakeDone ? (
            <PrimaryButton
              title="Bỏ qua, luận giải ngay"
              onPress={onSkip}
              loading={loading}
              variant="ghost"
              disabled={loading}
            />
          ) : (
            <PrimaryButton title="Làm lại hội thoại" onPress={onReset} variant="ghost" />
          )}
        </View>
      )}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder={
            intakeDone ? 'Hỏi thêm về lá số…' : 'Trả lời câu hỏi của Van Su AI…'
          }
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          editable={!loading && started}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <PrimaryButton
          title="Gửi"
          onPress={send}
          loading={loading}
          disabled={!started}
          style={{ paddingHorizontal: 16, paddingVertical: 12 }}
        />
      </View>

      {!effectivePro ? <AdPlaceholder placement="banner_home" /> : null}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <DisclaimerBanner />
      </View>

      <PaywallSheet
        visible={paywall}
        feature="horoscope"
        remaining={remaining ?? 0}
        onClose={() => setPaywall(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingTop: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  sub: { color: colors.textMuted, marginTop: 4, marginBottom: 8 },
  known: { color: colors.goldSoft, fontSize: 12, marginBottom: 8, lineHeight: 18 },
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
  actions: { paddingHorizontal: 16, paddingBottom: 8 },
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
