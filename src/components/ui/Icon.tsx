import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme';

export type IconName = 'chevron-left' | 'camera' | 'mail' | 'home' | 'discover' | 'notifications' | 'profile';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

// Outline icons in the Tabler style used by the Figma file.
export function Icon({ name, size = 24, color = colors.text }: Props) {
  const stroke = { stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'chevron-left' && <Path d="M15 5l-7 7 7 7" {...stroke} strokeWidth={3} />}
      {name === 'camera' && (
        <>
          <Path d="M5 7h2a2 2 0 0 0 2-2 1 1 0 0 1 1-1h4a1 1 0 0 1 1 1 2 2 0 0 0 2 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2" {...stroke} />
          <Circle cx="12" cy="13" r="3" {...stroke} />
        </>
      )}
      {name === 'mail' && (
        <>
          <Rect x="3" y="5" width="18" height="14" rx="2.5" {...stroke} />
          <Path d="M3.5 7l8.5 6 8.5-6" {...stroke} />
        </>
      )}
      {name === 'home' && <Path d="M12 3l9 8h-3v9h-4.5v-6h-3v6H6v-9H3z" fill={color} />}
      {name === 'discover' && (
        <>
          <Rect x="4" y="3" width="7" height="18" rx="2" fill={color} />
          <Rect x="13" y="3" width="7" height="8" rx="2" fill={color} />
          <Rect x="13" y="13" width="7" height="8" rx="2" fill={color} />
        </>
      )}
      {name === 'notifications' && <Path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4z" fill={color} />}
      {name === 'profile' && (
        <>
          <Rect x="5" y="3" width="14" height="18" rx="3" fill={color} />
          <Path d="M9 9h6M9 13h6M9 17h3" stroke={colors.white} strokeWidth={2} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
