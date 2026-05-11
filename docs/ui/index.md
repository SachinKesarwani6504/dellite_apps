# UI Components & Theming

## Overview

Dellite uses NativeWind (Tailwind CSS for React Native) for styling.

## Component Structure

```
src/components/
├── common/                  # Shared across all screens
│   ├── Button.tsx
│   ├── TextInput.tsx
│   ├── Card.tsx
│   ├── LoadingSpinner.tsx
│   ├── ErrorMessage.tsx
│   └── [ReusableComponent].tsx
├── home/                    # Home screen components
├── booking/                 # Booking flow components (customer)
├── jobs/                    # Job/task components (worker)
└── [feature-name]/          # Feature-specific components
```

## Component Naming

- File: `PascalCase.tsx`
- Export: Match filename
- Props interface: `ComponentNameProps`

```typescript
// src/components/common/Button.tsx
export interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`p-4 rounded-lg ${
        variant === 'primary' ? 'bg-blue-500' : 'bg-gray-200'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <Text className="text-white font-semibold">{title}</Text>
    </TouchableOpacity>
  );
}
```

## Theming

### Theme Structure

```
src/constants/
└── theme.ts
```

```typescript
// src/constants/theme.ts
export const COLORS = {
  // Brand
  primary: '#2563EB',        // Blue
  secondary: '#10B981',      // Green
  accent: '#F59E0B',         // Amber
  
  // Neutral
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const TYPOGRAPHY = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  fontFamily: {
    sans: 'Inter',
    serif: 'Merriweather',
  },
};

export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
```

### Using Theme in Components

```typescript
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

export function Card({ children, variant = 'default' }) {
  const bgColor = variant === 'highlighted' ? COLORS.gray[50] : COLORS.white;
  
  return (
    <View
      style={{
        backgroundColor: bgColor,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray[200],
      }}
    >
      {children}
    </View>
  );
}
```

## Icons

```
src/icons/
└── index.tsx
```

Use icon library (e.g., react-native-vector-icons):

```typescript
// src/icons/index.tsx
import Icon from 'react-native-vector-icons/MaterialIcons';

export const Icons = {
  home: (size: number, color: string) => (
    <Icon name="home" size={size} color={color} />
  ),
  search: (size: number, color: string) => (
    <Icon name="search" size={size} color={color} />
  ),
  menu: (size: number, color: string) => (
    <Icon name="menu" size={size} color={color} />
  ),
  back: (size: number, color: string) => (
    <Icon name="arrow-back" size={size} color={color} />
  ),
  // ... more icons
};
```

Usage:

```typescript
import { Icons } from '../icons';
import { COLORS } from '../constants/theme';

export function Header() {
  return (
    <View>
      {Icons.back(24, COLORS.primary)}
      <Text>Title</Text>
      {Icons.menu(24, COLORS.primary)}
    </View>
  );
}
```

## Typography

```typescript
// src/components/common/Text.tsx
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

export interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'body' | 'caption';
  color?: keyof typeof COLORS;
  weight?: 'normal' | 'bold' | 'semibold';
}

export function Text({
  variant = 'body',
  color = 'black',
  weight = 'normal',
  style,
  ...props
}: TextProps) {
  const variants = {
    h1: { fontSize: TYPOGRAPHY.fontSize['3xl'], fontWeight: '700' },
    h2: { fontSize: TYPOGRAPHY.fontSize['2xl'], fontWeight: '600' },
    body: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: '400' },
    caption: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: '400' },
  };

  return (
    <RNText
      {...props}
      style={[
        variants[variant],
        { color: COLORS[color] },
        { fontWeight: weight === 'bold' ? '700' : weight === 'semibold' ? '600' : '400' },
        style,
      ]}
    />
  );
}
```

## Common Components

### Button

```typescript
// src/components/common/Button.tsx
export interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ title, onPress, disabled, loading, variant, size }: ButtonProps) {
  // Implementation
}
```

### TextInput

```typescript
// src/components/common/TextInput.tsx
export interface TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function TextInput({ label, placeholder, value, onChangeText, error, required, disabled }: TextInputProps) {
  // Implementation with red asterisk (*) for required fields
}
```

### Card

```typescript
// src/components/common/Card.tsx
export interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'highlighted' | 'interactive';
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', onPress, style }: CardProps) {
  // Implementation
}
```

### LoadingSpinner

```typescript
// src/components/common/LoadingSpinner.tsx
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function LoadingSpinner({ size = 'md', color = COLORS.primary }: LoadingSpinnerProps) {
  // Implementation
}
```

### ErrorMessage

```typescript
// src/components/common/ErrorMessage.tsx
export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  // Implementation
}
```

## Styling Rules

- Use NativeWind className syntax where possible
- For complex styles, use StyleSheet.create()
- Keep colors/spacing/typography from theme constants
- Never hardcode colors or dimensions
- Use flexbox for layout
- Default to hiding scroll indicators: `showsVerticalScrollIndicator={false}`

## Dark Mode

```typescript
// src/utils/theme-utils.ts
import { useColorScheme } from 'react-native';

export function useDarkMode() {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark';
}
```

```typescript
// Component with dark mode support
export function ThemedCard() {
  const isDark = useDarkMode();
  
  return (
    <View
      style={{
        backgroundColor: isDark ? COLORS.gray[900] : COLORS.white,
        padding: SPACING.md,
      }}
    >
      {/* Content */}
    </View>
  );
}
```

## Component Library Structure

Create `src/components/common/index.ts` for re-exports:

```typescript
// src/components/common/index.ts
export { Button } from './Button';
export { TextInput } from './TextInput';
export { Card } from './Card';
export { LoadingSpinner } from './LoadingSpinner';
export { ErrorMessage } from './ErrorMessage';
export { Text } from './Text';
```

Then import from one place:

```typescript
import { Button, TextInput, Card, Text } from '../components/common';
```

## Parity Rules

Both apps must have identical:

- `src/components/common/*` (shared components)
- `src/constants/theme.ts` (theme tokens)
- Component naming conventions
- Prop interface patterns
- Dark/light behavior
