/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'AutoRA'
const SITE_URL = 'https://autora.be'
const ADMIN_URL = `${SITE_URL}/admin/dealers`

interface NewDealerSignupProps {
  fullName?: string
  email?: string
  phone?: string
  garageName?: string
  bceNumber?: string
  postalCode?: string
}

const NewDealerSignupEmail = ({
  fullName, email, phone, garageName, bceNumber, postalCode,
}: NewDealerSignupProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Nouvelle demande pro : {garageName || fullName || 'sans nom'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nouvelle inscription professionnelle</Heading>
        <Text style={text}>
          Un revendeur vient de s'inscrire et attend votre validation.
        </Text>

        <Section style={card}>
          <Row label="Nom complet" value={fullName} />
          <Row label="Email" value={email} />
          <Row label="Téléphone" value={phone} />
          <Row label="Nom du garage" value={garageName} />
          <Row label="Numéro BCE" value={bceNumber || '— (non fourni)'} />
          <Row label="Code postal" value={postalCode} />
        </Section>

        <Button style={button} href={ADMIN_URL}>
          Ouvrir la file de validation
        </Button>

        <Hr style={hr} />
        <Text style={footer}>
          {SITE_NAME} — Notification admin automatique
        </Text>
      </Container>
    </Body>
  </Html>
)

const Row = ({ label, value }: { label: string; value?: string }) => (
  <Text style={rowText}>
    <span style={rowLabel}>{label} : </span>
    <span style={rowValue}>{value || '—'}</span>
  </Text>
)

export const template = {
  component: NewDealerSignupEmail,
  subject: (data: Record<string, any>) =>
    `Nouvelle demande pro : ${data?.garageName || data?.fullName || 'à valider'}`,
  to: 'autoracontact@gmail.com',
  displayName: 'Nouveau revendeur (admin)',
  previewData: {
    fullName: 'Jean Dupont',
    email: 'jean@garage-dupont.be',
    phone: '+32470123456',
    garageName: 'Garage Dupont SRL',
    bceNumber: '0123.456.789',
    postalCode: '1000',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 28%, 10%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 35%)', lineHeight: '1.5', margin: '0 0 16px' }
const card = {
  backgroundColor: 'hsl(160, 84%, 96%)',
  border: '1px solid hsl(160, 84%, 85%)',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '0 0 24px',
}
const rowText = { fontSize: '14px', margin: '4px 0', lineHeight: '1.5' }
const rowLabel = { color: 'hsl(215, 14%, 35%)', fontWeight: 600 as const }
const rowValue = { color: 'hsl(215, 28%, 10%)' }
const button = {
  backgroundColor: 'hsl(160, 84%, 30%)', color: '#ffffff', fontSize: '14px',
  borderRadius: '16px', padding: '12px 24px', textDecoration: 'none', display: 'inline-block',
}
const hr = { borderColor: '#e5e7eb', margin: '30px 0' }
const footer = { fontSize: '11px', color: '#999999', margin: '0' }
