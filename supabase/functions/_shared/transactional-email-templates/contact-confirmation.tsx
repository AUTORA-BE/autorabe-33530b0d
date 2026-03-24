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
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'AutoRa'

interface ContactConfirmationProps {
  name?: string
  subject?: string
}

const ContactConfirmationEmail = ({ name, subject }: ContactConfirmationProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Merci de nous avoir contacté – {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Merci, ${name} !` : 'Merci de nous avoir contacté !'}
        </Heading>
        <Text style={text}>
          Nous avons bien reçu votre message
          {subject ? ` concernant « ${subject} »` : ''}.
        </Text>
        <Text style={text}>
          Notre équipe traitera votre demande dans les plus brefs délais.
          Nous nous efforçons de répondre sous 24 heures ouvrées.
        </Text>
        <Button style={button} href="https://autora.be/faq">
          Consulter la FAQ
        </Button>
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

export const template = {
  component: ContactConfirmationEmail,
  subject: 'Nous avons bien reçu votre message – AutoRa',
  displayName: 'Confirmation de contact',
  previewData: { name: 'Jean Dupont', subject: 'Question sur un véhicule' },
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
const button = {
  backgroundColor: 'hsl(160, 84%, 30%)',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '16px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = {
  fontSize: '13px',
  color: 'hsl(215, 14%, 50%)',
  margin: '30px 0 0',
  whiteSpace: 'pre-line' as const,
}
const legal = { fontSize: '11px', color: '#999999', margin: '20px 0 0' }
