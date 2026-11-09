import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme';

export type IconName =
  | 'chevron-left'
  | 'camera'
  | 'mail'
  | 'home'
  | 'discover'
  | 'notifications'
  | 'profile'
  | 'plus'
  | 'more-vertical'
  | 'clap'
  | 'description'
  | 'comment'
  | 'send'
  | 'edit'
  | 'trash'
  | 'close'
  | 'eye'
  | 'heart'
  | 'heart-filled'
  | 'image'
  | 'video'
  | 'carousel'
  | 'project'
  | 'play';

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
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...stroke} strokeWidth={2.5} />}
      {name === 'more-vertical' && (
        <>
          <Circle cx="12" cy="5" r="2" fill={color} />
          <Circle cx="12" cy="12" r="2" fill={color} />
          <Circle cx="12" cy="19" r="2" fill={color} />
        </>
      )}
      {name === 'clap' && (
        <Path
          d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 5.5v-2a1.5 1.5 0 1 1 3 0V12M14 5.5a1.5 1.5 0 0 1 3 0V12M17 7.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-1.8a6 6 0 0 1-5-2.7l-.2-.3c-.3-.5-1.4-2.4-3.3-5.7a1.5 1.5 0 0 1 .5-2 1.9 1.9 0 0 1 2.3.3L8 13"
          {...stroke}
        />
      )}
      {name === 'description' && <Path d="M4 5h16M4 10h16M4 15h16M8 20h12" {...stroke} />}
      {name === 'comment' && <Path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" {...stroke} />}
      {name === 'send' && <Path d="M10 14L21 3M21 3l-6.5 18a.55.55 0 0 1-1 0L10 14l-7-3.5a.55.55 0 0 1 0-1z" {...stroke} />}
      {name === 'edit' && (
        <>
          <Path d="M4 20h4L18.5 9.5a2.83 2.83 0 0 0-4-4L4 16z" fill={color} />
          <Path d="M13.5 6.5l4 4" stroke={colors.black} strokeOpacity={0.25} strokeWidth={1.5} />
        </>
      )}
      {name === 'trash' && (
        <Path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" {...stroke} />
      )}
      {name === 'close' && <Path d="M18 6L6 18M6 6l12 12" {...stroke} />}
      {name === 'eye' && (
        <>
          <Path d="M21 12c-2.4 4-5.4 6-9 6s-6.6-2-9-6c2.4-4 5.4-6 9-6s6.6 2 9 6z" fill={color} />
          <Circle cx="12" cy="12" r="2.5" fill={colors.white} />
        </>
      )}
      {(name === 'heart' || name === 'heart-filled') && (
        <Path
          d="M19.5 12.6L12 20l-7.5-7.4a5 5 0 1 1 7.5-6.6 5 5 0 1 1 7.5 6.6"
          {...stroke}
          fill={name === 'heart-filled' ? color : 'none'}
        />
      )}
      {name === 'image' && (
        <>
          <Rect x="3" y="3" width="18" height="18" rx="3" {...stroke} />
          <Path d="M3 16l5-5c.9-.9 2.1-.9 3 0l5 5M14 14l1-1c.9-.9 2.1-.9 3 0l3 3M15 8h.01" {...stroke} />
        </>
      )}
      {name === 'video' && (
        <Path
          d="M15 10l4.55-2.28A1 1 0 0 1 21 8.62v6.76a1 1 0 0 1-1.45.9L15 14zM5 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
          {...stroke}
        />
      )}
      {name === 'carousel' && (
        <>
          <Rect x="6" y="4" width="12" height="16" rx="2" {...stroke} />
          <Path d="M3 7v10M21 7v10" {...stroke} />
        </>
      )}
      {name === 'project' && (
        <Path
          d="M14 3v4a1 1 0 0 0 1 1h4M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2zM9 9h1M9 13h6M9 17h6"
          {...stroke}
        />
      )}
      {name === 'play' && <Path d="M7 4v16l13-8z" fill={color} />}
    </Svg>
  );
}
