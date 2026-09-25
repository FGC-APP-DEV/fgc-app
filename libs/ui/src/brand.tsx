// Ambient asset typings must reach every consumer that compiles this file from source.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./assets.d.ts" />
import React from 'react'
import { Image, ScrollView, Text, View } from 'react-native'
import loginSource from './assets/login-image.webp'
import { BrandLogo } from './logo'
import { Body, Card, elevation, layout, radius, tokens } from './operations'

/** Signed-out page frame: logo, event photo, the sign-in card(s) and the legal footer. */
export function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={layout.screen}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 32,
        paddingVertical: 32,
        paddingHorizontal: 16,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <BrandLogo height={44} />
      <View style={{ width: '100%', maxWidth: 384, gap: 32 }}>
        <View
          style={[
            {
              aspectRatio: 16 / 9,
              borderRadius: radius.card,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: tokens.border,
              backgroundColor: tokens.surfaceHigh,
            },
            elevation.sm,
          ]}
        >
          <Image
            alt=""
            source={loginSource}
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
          />
        </View>
        {children}
      </View>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: tokens.outline,
        }}
      >
        © 2026 FIRST Global Challenge
      </Text>
    </ScrollView>
  )
}

/** Sign-in card: title, short instruction, the form, then the "secure portal" footer. */
export function LoginCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <Card title={title}>
      <Body>{subtitle}</Body>
      {children}
      <View
        style={{
          alignItems: 'center',
          paddingTop: 16,
          borderTopWidth: 1,
          borderColor: tokens.border,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: tokens.muted,
          }}
        >
          Secure portal
        </Text>
      </View>
    </Card>
  )
}
