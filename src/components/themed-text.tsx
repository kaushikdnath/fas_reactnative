import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'headline'
    | 'subtitle'
    | 'body'
    | 'bodyBold'
    | 'small'
    | 'smallBold'
    | 'label'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

/** Typed text scale shared by every screen -- kept intentionally close to
 * a Material 3 type scale (title/headline/body/label) so screens never
 * hand-roll font sizes. */
export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'headline' && styles.headline,
        type === 'subtitle' && styles.subtitle,
        type === 'body' && styles.body,
        type === 'bodyBold' && styles.bodyBold,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'label' && styles.label,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  title: { fontSize: 34, fontWeight: '800', lineHeight: 40 },
  headline: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  subtitle: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyBold: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  smallBold: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.4 },
  link: { lineHeight: 22, fontSize: 14 },
  linkPrimary: { lineHeight: 22, fontSize: 14, color: '#3c87f7' },
  code: {
    fontFamily: Fonts?.mono,
    fontWeight: Platform.select({ android: '700' as const }) ?? '500',
    fontSize: 12,
  },
});
