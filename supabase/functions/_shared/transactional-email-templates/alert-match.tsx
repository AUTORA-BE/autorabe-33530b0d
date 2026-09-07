/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'AutoRA.be'

interface AlertMatchProps {
  alertName?: string
  brand?: string
  model?: string
  /** Prix déjà formaté en fr-BE par l'appelant. */
  priceFormatted?: string
  /** Prix brut, utilisé pour le sujet. */
  price?: number
  mileageFormatted?: string
  year?: number
  fuelType?: string
  carPassVerified?: boolean
  location?: string
  imageUrl?: string
  vehicleUrl?: string
  score?: number
}

const AlertMatchEmail = ({
  alertName,
  brand,
  model,
  priceFormatted,
  mileageFormatted,
  year,
  fuelType,
  carPassVerified,
  location,
  imageUrl,
  vehicleUrl,
  score,
}: AlertMatchProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>
      Nouvelle annonce pour « {alertName || 'votre alerte'} » : {brand} {model}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={headerTitle}>🚗 {SITE_NAME}</Heading>
          <Text style={headerSubtitle}>
            Nouvelle annonce pour « {alertName || 'votre alerte'} »
          </Text>
        </Section>

        <Section style={card}>
          <Section style={scoreBox}>
            <Text style={scoreValue}>{score ?? 0}%</Text>
            <Text style={scoreLabel}>Correspondance avec vos critères</Text>
          </Section>

          {imageUrl ? (
            <Img src={imageUrl} alt={`${brand ?? ''} ${model ?? ''}`} style={image} />
          ) : null}

          <Heading as="h2" style={vehicleTitle}>
            {brand} {model}
          </Heading>
          <Text style={priceText}>{priceFormatted}</Text>
          <Text style={specsText}>
            📅 {year} • 🛣️ {mileageFormatted} km • ⛽ {fuelType}
            {carPassVerified ? ' • ✅ Car-Pass' : ''}
            {location ? ` • 📍 ${location}` : ''}
          </Text>

          <Section style={{ textAlign: 'center' as const }}>
            <a href={vehicleUrl} style={cta}>
              Voir l'annonce →
            </a>
          </Section>

          <Text style={tip}>
            💡 Les bonnes affaires partent vite ! Contactez le vendeur rapidement.
          </Text>
        </Section>

        <Text style={footer}>
          Vous recevez cet email car vous avez créé une alerte sur {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AlertMatchEmail,
  subject: (data: Record<string, any>) =>
    `🚗 Nouveau : ${data.brand ?? ''} ${data.model ?? ''} à ${new Intl.NumberFormat('fr-BE').format(
      Number(data.price ?? 0),
    )}€`,
  displayName: 'Alerte — nouveau véhicule correspondant',
  previewData: {
    alertName: 'BMW Série 3 sous 25 000 €',
    brand: 'BMW',
    model: 'Série 3',
    price: 24500,
    priceFormatted: '24.500 €',
    mileageFormatted: '78.000',
    year: 2020,
    fuelType: 'Diesel',
    carPassVerified: true,
    location: 'Liège',
    imageUrl: '',
    vehicleUrl: 'https://autora.be/car/example',
    score: 92,
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}
const container = { maxWidth: '600px', margin: '0 auto', padding: '20px' }
const header = {
  backgroundColor: '#0d9488',
  padding: '24px',
  borderRadius: '16px 16px 0 0',
  textAlign: 'center' as const,
}
const headerTitle = { color: '#ffffff', margin: '0', fontSize: '24px' }
const headerSubtitle = { color: '#d3f2ed', margin: '8px 0 0', fontSize: '14px' }
const card = {
  backgroundColor: '#ffffff',
  padding: '24px',
  borderRadius: '0 0 16px 16px',
  border: '1px solid #e4e4e7',
  borderTop: 'none',
}
const scoreBox = {
  backgroundColor: '#f0fdfa',
  border: '1px solid #99f6e4',
  borderRadius: '12px',
  padding: '16px',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}
const scoreValue = {
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: '#0d9488',
  margin: '0',
}
const scoreLabel = { margin: '4px 0 0', color: '#0f766e', fontSize: '14px' }
const image = {
  width: '100%',
  borderRadius: '12px',
  margin: '0 0 16px',
  maxHeight: '300px',
  objectFit: 'cover' as const,
}
const vehicleTitle = { margin: '0 0 4px', fontSize: '20px', color: '#18181b' }
const priceText = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#0d9488',
  margin: '0 0 12px',
}
const specsText = { color: '#71717a', fontSize: '14px', margin: '0 0 20px' }
const cta = {
  display: 'block',
  backgroundColor: '#0d9488',
  color: '#ffffff',
  textDecoration: 'none',
  padding: '14px 24px',
  borderRadius: '12px',
  textAlign: 'center' as const,
  fontWeight: 600,
  fontSize: '16px',
}
const tip = {
  color: '#a1a1aa',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '20px 0 0',
}
const footer = {
  color: '#a1a1aa',
  fontSize: '11px',
  textAlign: 'center' as const,
  margin: '16px 0 0',
}
