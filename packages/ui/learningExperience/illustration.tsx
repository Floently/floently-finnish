import type { PropsWithChildren } from 'react';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image, type ImageProps } from 'expo-image';
import type { FloentlyPalette } from '../theme/floentlyPalette';
import { learningRadius, learningSpacing } from './tokens';

type IllustrationAccessibility =
  | { decorative: true; accessibilityLabel?: never }
  | { decorative?: false; accessibilityLabel: string };

export type IllustrationFrameProps = PropsWithChildren<
  IllustrationAccessibility & {
    palette: FloentlyPalette;
    style?: StyleProp<ViewStyle>;
    restrained?: boolean;
  }
>;

/**
 * One accessibility stop for semantic illustrations; decorative art is hidden.
 * `restrained` is intended for B1/B2+/formal learning where imagery is contextual,
 * not the dominant surface.
 */
export function IllustrationFrame({
  decorative,
  accessibilityLabel,
  palette,
  restrained = false,
  style,
  children,
}: IllustrationFrameProps) {
  return (
    <View
      accessible={!decorative}
      accessibilityRole={!decorative ? 'image' : undefined}
      accessibilityLabel={!decorative ? accessibilityLabel : undefined}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      style={[
        styles.frame,
        restrained && styles.restrained,
        { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type RasterIllustrationProps = IllustrationAccessibility &
  Omit<ImageProps, 'accessible' | 'accessibilityLabel' | 'alt' | 'transition'> & {
    palette: FloentlyPalette;
    restrained?: boolean;
  };

export function RasterIllustration({
  decorative,
  accessibilityLabel,
  palette,
  restrained,
  contentFit = 'contain',
  style,
  ...imageProps
}: RasterIllustrationProps) {
  const frameAccessibility: IllustrationAccessibility = decorative
    ? { decorative: true }
    : { decorative: false, accessibilityLabel: accessibilityLabel as string };

  return (
    <IllustrationFrame {...frameAccessibility} palette={palette} restrained={restrained}>
      <Image
        {...imageProps}
        accessible={false}
        alt=""
        contentFit={contentFit}
        transition={0}
        style={[styles.image, style]}
      />
    </IllustrationFrame>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: learningSpacing.sm,
    borderWidth: 1,
    borderRadius: learningRadius.large,
  },
  restrained: {
    minHeight: 88,
    maxHeight: 180,
  },
  image: {
    width: '100%',
    minHeight: 96,
    aspectRatio: 16 / 9,
  },
});
