/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'AutoRA'
const ADMIN_URL = 'https://autora.be/admin'

interface AlertItem {
  source?: string
  severity?: string
  message?: string
  created_at?: string
}

interface OpsAlertDigestProps {
  total?: number
  critical?: number
  alerts?: AlertItem[]
}

const OpsAlertDigestEmail = ({ total = 0, critical = 0, alerts = [] }: OpsAlertDigestProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>{`${total} incident(s) technique(s) sur ${SITE_NAME}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Incidents techniques détectés</Heading>
        <Text style={text}>
          {total} incident(s) enregistré(s) depuis le dernier récapitulatif
          {critical > 0 ? ` — dont ${critical} critique(s).` : '.'}
        </Text>

        <Section style={card}>
          {alerts.map((a, i) => (
            <Text key={i} style={rowText}>
              <span style={rowLabel}>[{a.severity || 'error'}] {a.source || '—'} : </span>
              <span style={rowValue}>{a.message || '—'}</span>
              <br />
              <span style={rowDate}>{a.created_at || ''}</span>
            </Text>
          ))}
        </Section>

        <Button style={button} href={ADMIN_URL}>
          Ouvrir le tableau de bord admin
        </Button>

        <Hr style={hr} />
        <Text style={footer}>{SITE_NAME} — Alerte technique automatique</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OpsAlertDigestEmail,
  subject: (data: Record<string, any>) =>
    `[${SITE_NAME}] ${data?.total ?? 0} incident(s) technique(s)`,
  to: 'autoracontact@gmail.com',
  displayName: 'Récapitulatif incidents (admin)',
  previewData: {
    total: 2,
    critical: 1,
    alerts: [
      { source: 'stripe-webhook', severity: 'critical', message: 'handler_exception: user not resolved', created_at: '2026-09-02 13:00' },
      { source: 'process-email-queue', severity: 'error', message: 'Email send failed (429)', created_at: '2026-09-02 13:20' },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 28%, 10%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 35%)', lineHeight: '1.5', margin: '0 0 16px' }
const card = {
  backgroundColor: 'hsl(0, 84%, 97%)',
  border: '1px solid hsl(0, 84%, 88%)',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '0 0 24px',
}
const rowText = { fontSize: '13px', margin: '8px 0', lineHeight: '1.5' }
const rowLabel = { color: 'hsl(0, 72%, 38%)', fontWeight: 600 as const }
const rowValue = { color: 'hsl(215, 28%, 10%)' }
const rowDate = { color: 'hsl(215, 14%, 45%)', fontSize: '11px' }
const button = {
  backgroundColor: 'hsl(160, 84%, 30%)', color: '#ffffff', fontSize: '14px',
  borderRadius: '16px', padding: '12px 24px', textDecoration: 'none', display: 'inline-block',
}
const hr = { borderColor: '#e5e7eb', margin: '30px 0' }
const footer = { fontSize: '11px', color: '#999999', margin: '0' }
