/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'AutoRA'

interface ContactInboxProps {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const ContactInboxEmail = ({ name, email, subject, message }: ContactInboxProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Nouveau message de contact : {subject || 'sans sujet'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nouveau message de contact</Heading>
        <Text style={text}>Via le formulaire {SITE_NAME}</Text>

        <Section style={card}>
          <Row label="Nom" value={name} />
          <Row label="Email" value={email} />
          <Row label="Sujet" value={subject} />
        </Section>

        <Text style={label}>Message</Text>
        <Section style={messageBox}>
          <Text style={messageText}>{message || '—'}</Text>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>{SITE_NAME} — Notification admin automatique</Text>
      </Container>
    </Body>
  </Html>
)

const Row = ({ label: l, value }: { label: string; value?: string }) => (
  <Text style={rowText}>
    <span style={rowLabel}>{l} : </span>
    <span style={rowValue}>{value || '—'}</span>
  </Text>
)

export const template = {
  component: ContactInboxEmail,
  subject: (data: Record<string, any>) => `[Contact AutoRA] ${data?.subject ?? ''}`,
  to: 'autoracontact@gmail.com',
  displayName: 'Message de contact (admin)',
  previewData: {
    name: 'Jean Dupont',
    email: 'jean@example.be',
    subject: 'Question sur une annonce',
    message: 'Bonjour,\nJe souhaite en savoir plus.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 28%, 10%)', margin: '0 0 8px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 35%)', lineHeight: '1.5', margin: '0 0 20px' }
const card = {
  backgroundColor: 'hsl(160, 84%, 96%)',
  border: '1px solid hsl(160, 84%, 85%)',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '0 0 20px',
}
const rowText = { fontSize: '14px', margin: '4px 0', lineHeight: '1.5' }
const rowLabel = { color: 'hsl(215, 14%, 35%)', fontWeight: 600 as const }
const rowValue = { color: 'hsl(215, 28%, 10%)' }
const label = { fontSize: '13px', fontWeight: 600 as const, color: 'hsl(215, 14%, 35%)', margin: '0 0 6px' }
const messageBox = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px 20px',
}
const messageText = {
  fontSize: '14px', color: 'hsl(215, 28%, 10%)', margin: '0',
  lineHeight: '1.6', whiteSpace: 'pre-wrap' as const,
}
const hr = { borderColor: '#e5e7eb', margin: '28px 0' }
const footer = { fontSize: '11px', color: '#999999', margin: '0' }
