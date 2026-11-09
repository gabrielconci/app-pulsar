import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors } from '@/theme';

export type SocialApp = 'whatsapp' | 'instagram' | 'tiktok' | 'facebook' | 'more';

// Round app icons of the "Compartilhar com" sheet.
export function SocialIcon({ app, size = 44 }: { app: SocialApp; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {app === 'whatsapp' && (
        <>
          <Circle cx="12" cy="12" r="12" fill="#25D366" />
          <Path d="M12 5a7 7 0 0 0-6 10.6L5 19l3.5-1A7 7 0 1 0 12 5z" stroke={colors.white} strokeWidth={1.4} fill="none" />
          <Path
            d="M9.3 8.6c.2-.3.4-.3.6-.3h.4c.2 0 .3 0 .4.3l.6 1.4c.1.2 0 .3-.1.5l-.4.5c-.1.1-.1.3 0 .4.5.8 1.2 1.5 2.1 2 .2.1.3.1.4 0l.5-.6c.1-.2.3-.2.4-.1l1.4.6c.2.1.3.2.3.4v.4c0 .5-.4 1-.9 1.1-.8.2-1.9 0-3.4-1.1-1.3-.9-2.2-2.3-2.4-3-.2-.8 0-1.5.4-1.9z"
            fill={colors.white}
          />
        </>
      )}
      {app === 'instagram' && (
        <>
          <Defs>
            <LinearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor="#FEDA75" />
              <Stop offset="0.35" stopColor="#FA7E1E" />
              <Stop offset="0.6" stopColor="#D62976" />
              <Stop offset="1" stopColor="#4F5BD5" />
            </LinearGradient>
          </Defs>
          <Rect width="24" height="24" rx="7" fill="url(#ig)" />
          <Rect x="6" y="6" width="12" height="12" rx="3.5" stroke={colors.white} strokeWidth={1.5} fill="none" />
          <Circle cx="12" cy="12" r="2.8" stroke={colors.white} strokeWidth={1.5} fill="none" />
          <Circle cx="15.6" cy="8.4" r="0.9" fill={colors.white} />
        </>
      )}
      {app === 'tiktok' && (
        <>
          <Circle cx="12" cy="12" r="12" fill="#111111" />
          <Path d="M13.6 5.5c.3 1.7 1.4 2.8 3.1 3v2.1a5.3 5.3 0 0 1-3.1-1v4.7a3.9 3.9 0 1 1-3.9-3.9v2.1a1.8 1.8 0 1 0 1.8 1.8V5.5z" fill="#25F4EE" transform="translate(-0.6 -0.4)" />
          <Path d="M13.6 5.5c.3 1.7 1.4 2.8 3.1 3v2.1a5.3 5.3 0 0 1-3.1-1v4.7a3.9 3.9 0 1 1-3.9-3.9v2.1a1.8 1.8 0 1 0 1.8 1.8V5.5z" fill="#FE2C55" transform="translate(0.6 0.4)" />
          <Path d="M13.6 5.5c.3 1.7 1.4 2.8 3.1 3v2.1a5.3 5.3 0 0 1-3.1-1v4.7a3.9 3.9 0 1 1-3.9-3.9v2.1a1.8 1.8 0 1 0 1.8 1.8V5.5z" fill={colors.white} />
        </>
      )}
      {app === 'facebook' && (
        <>
          <Circle cx="12" cy="12" r="12" fill="#1877F2" />
          <Path
            d="M13.4 24v-8.6h2.5l.4-3h-2.9v-1.9c0-.9.3-1.5 1.5-1.5h1.5V6.3a20 20 0 0 0-2.2-.1c-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.5V24z"
            fill={colors.white}
          />
        </>
      )}
      {app === 'more' && (
        <>
          <Circle cx="12" cy="12" r="11.5" fill={colors.surface} stroke={colors.line} strokeWidth={1} />
          <Circle cx="7.5" cy="12" r="1.5" fill={colors.text2} />
          <Circle cx="12" cy="12" r="1.5" fill={colors.text2} />
          <Circle cx="16.5" cy="12" r="1.5" fill={colors.text2} />
        </>
      )}
    </Svg>
  );
}
