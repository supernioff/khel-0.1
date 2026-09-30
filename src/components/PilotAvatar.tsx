import { PILOT_AVATARS } from '../types/game';

export interface PilotAvatarInfo {
  icon: string;
  color: string;
  isImage: boolean;
  imageUrl?: string;
  label?: string;
}

export function parsePilotAvatar(photoURL?: string, fallbackLetter = 'P'): PilotAvatarInfo {
  if (!photoURL) {
    return {
      icon: fallbackLetter.charAt(0).toUpperCase() || 'P',
      color: '#00F0FF',
      isImage: false,
    };
  }

  // 1. Check if it matches a predefined avatar ID (e.g. "valkyrie", "solaris", etc.)
  const found = PILOT_AVATARS.find((a) => a.id === photoURL || a.color.toLowerCase() === photoURL.toLowerCase());
  if (found) {
    return {
      icon: found.icon,
      color: found.color,
      isImage: false,
      label: found.label,
    };
  }

  // 2. Check if it's formatted as "icon:EMOJI|COLOR"
  if (photoURL.startsWith('icon:')) {
    const parts = photoURL.replace('icon:', '').split('|');
    return {
      icon: parts[0] || '⚡',
      color: parts[1] || '#00F0FF',
      isImage: false,
    };
  }

  // 3. Check if it's a Hex color (e.g. "#FF4500")
  if (photoURL.startsWith('#')) {
    const matchByColor = PILOT_AVATARS.find((a) => a.color.toLowerCase() === photoURL.toLowerCase());
    if (matchByColor) {
      return {
        icon: matchByColor.icon,
        color: matchByColor.color,
        isImage: false,
        label: matchByColor.label,
      };
    }
    return {
      icon: fallbackLetter.charAt(0).toUpperCase() || 'P',
      color: photoURL,
      isImage: false,
    };
  }

  // 4. Check if it's a web image URL
  if (photoURL.startsWith('http://') || photoURL.startsWith('https://') || photoURL.startsWith('data:image')) {
    return {
      icon: fallbackLetter.charAt(0).toUpperCase(),
      color: '#00F0FF',
      isImage: true,
      imageUrl: photoURL,
    };
  }

  // 5. Fallback: single emoji or string
  if (photoURL.length <= 4) {
    return {
      icon: photoURL,
      color: '#00F0FF',
      isImage: false,
    };
  }

  return {
    icon: fallbackLetter.charAt(0).toUpperCase() || 'P',
    color: '#00F0FF',
    isImage: false,
  };
}

interface Props {
  photoURL?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm',
  md: 'w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base',
  lg: 'w-12 h-12 text-xl',
  xl: 'w-14 h-14 sm:w-16 sm:h-16 text-2xl',
};

export function PilotAvatar({
  photoURL,
  name = 'Cadet',
  size = 'sm',
  className = '',
  showGlow = true,
}: Props) {
  const info = parsePilotAvatar(photoURL, name);
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.sm;

  if (info.isImage && info.imageUrl) {
    return (
      <img
        src={info.imageUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover border-2 shrink-0 ${className}`}
        style={{
          borderColor: info.color,
          boxShadow: showGlow ? `0 0 14px ${info.color}60` : undefined,
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center shrink-0 border-2 transition-transform select-none font-bold ${className}`}
      style={{
        backgroundColor: `${info.color}25`,
        borderColor: info.color,
        boxShadow: showGlow ? `0 0 14px ${info.color}60` : undefined,
      }}
      title={`Pilot Insignia: ${info.label || name}`}
    >
      <span className="drop-shadow-sm leading-none">{info.icon}</span>
    </div>
  );
}
