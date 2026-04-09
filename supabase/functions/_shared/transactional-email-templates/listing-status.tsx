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
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'AutoRa'

interface ListingStatusProps {
  contactName?: string
  brand?: string
  model?: string
  year?: string
  status?: 'approved' | 'rejected'
  reason?: string
}

const statusConfig = {
  approved: {
    emoji: '✅',
    title: 'Votre annonce a été approuvée !',
    preview: 'Bonne nouvelle – votre annonce est maintenant en ligne',
    color: 'hsl(142, 71%, 45%)',
    message: 'Votre annonce est désormais visible par tous les acheteurs sur AutoRa. Vous pouvez la retrouver dans votre espace vendeur.',
    cta: 'Voir mon espace vendeur',
    ctaUrl: 'https://autora.be/seller-dashboard',
  },
  rejected: {
    emoji: '❌',
    title: 'Votre annonce n\'a pas été approuvée',
    preview: 'Votre annonce nécessite des modifications',
    color: 'hsl(0, 84%, 60%)',
    message: 'Après vérification, votre annonce ne respecte pas nos critères de publication. Vous pouvez la modifier et la soumettre à nouveau.',
    cta: 'Modifier mon annonce',
    ctaUrl: 'https://autora.be/seller-dashboard',
  },
}

const ListingStatusEmail = ({ contactName, brand, model, year, status = 'approved', reason }: ListingStatusProps) => {
  const config = statusConfig[status]
  const vehicleName = brand && model ? `${brand} ${model}${year ? ` (${year})` : ''}` : 'votre véhicule'

  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>{config.preview} – {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={emojiStyle}>{config.emoji}</Text>
          <Heading style={h1}>
            {contactName ? `${contactName}, ` : ''}{config.title}
          </Heading>

          <Section style={vehicleBox}>
            <Text style={vehicleLabel}>Annonce concernée</Text>
            <Text style={vehicleValue}>{vehicleName}</Text>
          </Section>

          <Text style={text}>{config.message}</Text>

          {reason && status === 'rejected' && (
            <>
              <Text style={reasonLabel}>Motif :</Text>
              <Text style={reasonText}>{reason}</Text>
            </>
          )}

          <Button style={{ ...button, backgroundColor: config.color }} href={config.ctaUrl}>
            {config.cta}
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            Cordialement,{'\n'}L'équipe {SITE_NAME}
          </Text>
          <Text style={legal}>
            {SITE_NAME} – Marketplace automobile belge
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ListingStatusEmail,
  subject: (data: Record<string, any>) =>
    data?.status === 'rejected'
      ? `Annonce non approuvée – ${data?.brand ?? ''} ${data?.model ?? ''} – AutoRa`
      : `Annonce approuvée – ${data?.brand ?? ''} ${data?.model ?? ''} – AutoRa`,
  displayName: 'Notification statut annonce',
  previewData: {
    contactName: 'Jean Dupont',
    brand: 'BMW',
    model: 'Série 3',
    year: '2020',
    status: 'approved',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const emojiStyle = { fontSize: '36px', margin: '0 0 10px', textAlign: 'center' as const }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(215, 28%, 10%)',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}
const text = {
  fontSize: '14px',
  color: 'hsl(215, 14%, 50%)',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const vehicleBox = {
  backgroundColor: 'hsl(160, 84%, 96%)',
  borderRadius: '12px',
  padding: '14px 18px',
  margin: '0 0 20px',
  borderLeft: '4px solid hsl(160, 84%, 30%)',
}
const vehicleLabel = {
  fontSize: '11px',
  color: 'hsl(215, 14%, 50%)',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}
const vehicleValue = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: 'hsl(215, 28%, 10%)',
  margin: '0',
}
const reasonLabel = {
  fontSize: '13px',
  fontWeight: 'bold' as const,
  color: 'hsl(215, 28%, 10%)',
  margin: '0 0 4px',
}
const reasonText = {
  fontSize: '14px',
  color: 'hsl(0, 84%, 45%)',
  lineHeight: '1.5',
  margin: '0 0 25px',
  padding: '10px 14px',
  backgroundColor: 'hsl(0, 84%, 97%)',
  borderRadius: '8px',
}
const button = {
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '16px',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'block' as const,
  textAlign: 'center' as const,
}
const hr = { borderColor: '#eee', margin: '25px 0' }
const footer = {
  fontSize: '13px',
  color: 'hsl(215, 14%, 50%)',
  margin: '0',
  whiteSpace: 'pre-line' as const,
}
const legal = { fontSize: '11px', color: '#999999', margin: '20px 0 0' }
