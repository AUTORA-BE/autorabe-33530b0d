/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'AutoRa'

interface SellerNotificationProps {
  vehicleName?: string
  messagePreview?: string
  senderName?: string
}

const SellerNotificationEmail = ({
  vehicleName,
  messagePreview,
  senderName,
}: SellerNotificationProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>
      Nouveau message concernant {vehicleName || 'votre véhicule'} – {SITE_NAME}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🚗 Nouveau message reçu</Heading>
        <Text style={text}>Bonjour,</Text>
        <Text style={text}>
          Vous avez reçu un nouveau message
          {senderName ? ` de ${senderName}` : ''} concernant{' '}
          <strong>{vehicleName || 'votre véhicule'}</strong>.
        </Text>
        {messagePreview && (
          <Section style={quoteSection}>
            <Text style={quoteText}>
              « {messagePreview.length > 200
                ? messagePreview.substring(0, 200) + '…'
                : messagePreview} »
            </Text>
          </Section>
        )}
        <Text style={text}>
          Connectez-vous à votre compte {SITE_NAME} pour répondre.
        </Text>
        <Button style={button} href="https://autora.be/messages">
          Voir mes messages
        </Button>
        <Text style={footer}>
          Cet email a été envoyé automatiquement par {SITE_NAME}.{'\n'}
          Vous recevez cet email car vous avez une annonce active sur notre plateforme.
        </Text>
        <Text style={legal}>
          {SITE_NAME} – Marketplace automobile belge
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SellerNotificationEmail,
  subject: (data: Record<string, any>) =>
    `Nouveau message concernant ${data.vehicleName || 'votre véhicule'} – AutoRa`,
  displayName: 'Notification vendeur',
  previewData: {
    vehicleName: 'BMW Série 3 2022',
    messagePreview: 'Bonjour, le véhicule est-il toujours disponible ?',
    senderName: 'Jean Dupont',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(215, 28%, 10%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(215, 14%, 50%)',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const quoteSection = {
  backgroundColor: '#f8f9fa',
  padding: '16px 20px',
  borderRadius: '8px',
  borderLeft: '4px solid hsl(160, 84%, 30%)',
  margin: '0 0 25px',
}
const quoteText = {
  fontSize: '14px',
  color: 'hsl(215, 28%, 10%)',
  fontStyle: 'italic' as const,
  margin: '0',
  lineHeight: '1.5',
}
const button = {
  backgroundColor: 'hsl(160, 84%, 30%)',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '16px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = {
  fontSize: '12px',
  color: '#999999',
  margin: '30px 0 0',
  whiteSpace: 'pre-line' as const,
}
const legal = { fontSize: '11px', color: '#999999', margin: '20px 0 0' }
