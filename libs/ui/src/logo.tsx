// Ambient asset typings must reach every consumer that compiles this file from source.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./assets.d.ts" />
import React from 'react'
import { Image, View } from 'react-native'
import logoSource from './assets/fg-header-black.png'

// The logo file is 1000x360 with wide white margins; the visible mark spans this box.
const LOGO = { width: 1000, height: 360, x: 95, y: 80, w: 820, h: 210 }

/** FIRST GLOBAL wordmark, cropped to the visible mark so `height` is the height people see. */
export function BrandLogo({ height = 32 }: { height?: number }) {
  const scale = height / LOGO.h
  return (
    <View
      accessibilityRole="header"
      style={{ width: LOGO.w * scale, height, overflow: 'hidden' }}
    >
      <Image
        accessibilityLabel="FIRST GLOBAL"
        source={logoSource}
        resizeMode="stretch"
        style={{
          position: 'absolute',
          width: LOGO.width * scale,
          height: LOGO.height * scale,
          left: -LOGO.x * scale,
          top: -LOGO.y * scale,
        }}
      />
    </View>
  )
}
