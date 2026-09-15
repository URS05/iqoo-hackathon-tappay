import { useEffect, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Colors, Spacing, type ToneColor, toneColor, withAlpha } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonTone = ToneColor | "ghost";

const SPRING = { damping: 18, stiffness: 320, mass: 0.7 };

function usePressScale(disabled?: boolean | null) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function onPressIn() {
    if (disabled) {
      return;
    }
    scale.value = withSpring(0.97, SPRING);
  }

  function onPressOut() {
    scale.value = withSpring(1, SPRING);
  }

  return { animatedStyle, onPressIn, onPressOut };
}

export function Screen({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.screen, style]} {...rest}>
      {children}
    </View>
  );
}

type CardProps = ViewProps & {
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function Card({ children, style, onPress, disabled, accessibilityLabel, ...rest }: CardProps) {
  const spotlightX = useSharedValue(0);
  const spotlightY = useSharedValue(0);
  const spotlightOpacity = useSharedValue(0);
  const { animatedStyle, onPressIn: scaleIn, onPressOut: scaleOut } = usePressScale(disabled);

  const spotlightStyle = useAnimatedStyle(() => ({
    opacity: spotlightOpacity.value,
    transform: [
      { translateX: spotlightX.value - 72 },
      { translateY: spotlightY.value - 72 },
    ],
  }));

  const body = (
    <Animated.View style={[styles.card, style, onPress ? animatedStyle : null]} {...rest}>
      <Animated.View pointerEvents="none" style={[styles.spotlight, spotlightStyle]} />
      {children}
    </Animated.View>
  );

  if (!onPress) {
    return body;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      onPressIn={(event) => {
        spotlightX.value = event.nativeEvent.locationX;
        spotlightY.value = event.nativeEvent.locationY;
        spotlightOpacity.value = withTiming(0.55, { duration: 120 });
        scaleIn();
      }}
      onPressOut={() => {
        spotlightOpacity.value = withTiming(0, { duration: 220 });
        scaleOut();
      }}
    >
      {body}
    </Pressable>
  );
}

export function Title({ children, color }: { children: string; color?: string }) {
  return <Text style={[styles.title, color ? { color } : null]}>{children}</Text>;
}

export function Sub({ children }: { children: string }) {
  return <Text style={styles.sub}>{children}</Text>;
}

export function Label({ children, color }: { children: string; color?: string }) {
  return <Text style={[styles.label, color ? { color } : null]}>{children}</Text>;
}

export function Badge({ label, tone }: { label: string; tone: ToneColor }) {
  const color = toneColor(tone);
  return (
    <View style={[styles.badge, { backgroundColor: withAlpha(color, 0.15) }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function Button({
  label,
  tone = "accent",
  style,
  ...rest
}: PressableProps & { label: string; tone?: ButtonTone }) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(rest.disabled);
  const pressed = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor:
      tone === "ghost"
        ? withAlpha(Colors.line, pressed.value ? 1 : 0.9)
        : withAlpha(toneColor(tone as ToneColor), pressed.value ? 0.8 : 0.4),
  }));

  const bg =
    tone === "ghost"
      ? "transparent"
      : tone === "muted"
        ? Colors.cardAlt
        : toneColor(tone as ToneColor);
  const fg = tone === "ghost" || tone === "muted" ? Colors.text : "#0B0F14";

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[animatedStyle, style as StyleProp<ViewStyle>]}
      onPressIn={() => {
        pressed.value = 1;
        onPressIn();
      }}
      onPressOut={() => {
        pressed.value = 0;
        onPressOut();
      }}
      {...rest}
    >
      <Animated.View style={[styles.btn, { backgroundColor: bg }, borderStyle]}>
        <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
      </Animated.View>
    </AnimatedPressable>
  );
}

export function KeypadKey({
  label,
  onPress,
  tone = "ghost",
  flex = 1,
}: {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  flex?: number;
}) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(false);
  const pressed = useSharedValue(0);
  const accent = tone === "ghost" ? Colors.text : toneColor(tone as ToneColor);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: withAlpha(accent, pressed.value ? 0.55 : 0.22),
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = 1;
        onPressIn();
      }}
      onPressOut={() => {
        pressed.value = 0;
        onPressOut();
      }}
      style={[{ flex }, animatedStyle]}
    >
      <Animated.View style={[styles.keypadKey, borderStyle]}>
        <Text style={[styles.keypadKeyText, tone === "merchant" ? { color: Colors.merchant } : null]}>
          {label}
        </Text>
      </Animated.View>
    </AnimatedPressable>
  );
}

export function TransactionRow({
  title,
  subtitle,
  amount,
  time,
  tone = "accent",
}: {
  title: string;
  subtitle: string;
  amount: string;
  time: string;
  tone?: ToneColor;
}) {
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, SPRING);
    opacity.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const dotColor = toneColor(tone);

  return (
    <Animated.View style={[styles.txnRow, animatedStyle]}>
      <View style={[styles.txnDot, { backgroundColor: dotColor }]} />
      <View style={styles.txnBody}>
        <Text style={styles.txnTitle}>{title}</Text>
        <Text style={styles.txnSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.txnMeta}>
        <Text style={styles.txnAmount}>{amount}</Text>
        <Text style={styles.txnTime}>{time}</Text>
      </View>
    </Animated.View>
  );
}

export function Toast({
  message,
  tone,
  visible,
  onDismiss,
}: {
  message: string;
  tone: "ok" | "danger";
  visible: boolean;
  onDismiss?: () => void;
}) {
  const translateY = useSharedValue(24);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRING);
      opacity.value = withTiming(1, { duration: 220 });
      const timer = setTimeout(() => onDismiss?.(), 3000);
      return () => clearTimeout(timer);
    }
    translateY.value = withTiming(24, { duration: 180 });
    opacity.value = withTiming(0, { duration: 180 });
  }, [message, onDismiss, opacity, translateY, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) {
    return null;
  }

  const barColor = tone === "ok" ? Colors.ok : Colors.danger;

  return (
    <Animated.View pointerEvents="none" style={[styles.toastWrap, animatedStyle]}>
      <View style={styles.toast}>
        <View style={[styles.toastBar, { backgroundColor: barColor }]} />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
}

export function PulsingText({ children, color }: { children: string; color: string }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.pulsingText, { color }, animatedStyle]}>{children}</Animated.Text>
  );
}

export function SectionHeader({ children }: { children: string }) {
  return <Text style={styles.sectionHeader}>{children}</Text>;
}

export function Field(props: TextInputProps) {
  return <TextInput placeholderTextColor={Colors.muted} style={styles.input} {...props} />;
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderColor: Colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.md,
    gap: 8,
    overflow: "hidden",
  },
  spotlight: {
    position: "absolute",
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: withAlpha(Colors.text, 0.12),
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  sub: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
  sectionHeader: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  badge: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  btnText: {
    fontWeight: "700",
    fontSize: 16,
  },
  keypadKey: {
    backgroundColor: Colors.card,
    borderColor: Colors.line,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  keypadKeyText: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "600",
  },
  input: {
    backgroundColor: Colors.cardAlt,
    borderColor: Colors.line,
    borderWidth: 1,
    borderRadius: 12,
    color: Colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.line,
  },
  txnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  txnBody: {
    flex: 1,
    gap: 2,
  },
  txnTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  txnSubtitle: {
    color: Colors.muted,
    fontSize: 12,
  },
  txnMeta: {
    alignItems: "flex-end",
    gap: 2,
  },
  txnAmount: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  txnTime: {
    color: Colors.muted,
    fontSize: 11,
  },
  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 32,
    alignItems: "center",
    zIndex: 100,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 320,
    width: "90%",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: "hidden",
  },
  toastBar: {
    width: 3,
    alignSelf: "stretch",
  },
  toastText: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontWeight: "500",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pulsingText: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1.2,
    textAlign: "center",
  },
});
