/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'AutoRA'
const SITE_URL = 'https://autora.be'

interface DealerRejectedProps {
  name?: string
  reason?: string
}

const DealerRejectedEmail = ({ name, reason }: DealerRejectedProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Mise à jour de votre demande professionnelle {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Demande professionnelle non validée</Heading>
        <Text style={text}>
          {name ? `Bonjour ${name},` : 'Bonjour,'}
        </Text>
        <Text style={text}>
          Après examen, nous ne sommes pas en mesure d'activer votre compte
          professionnel sur {SITE_NAME} pour le moment. Votre compte reste actif
          en tant que particulier — vous pouvez continuer à utiliser la
          plateforme normalement.
        </Text>

        {reason ? (
          <Section style={card}>
            <Text style={cardLabel}>Motif communiqué par notre équipe :</Text>
            <Text style={cardValue}>{reason}</Text>
          </Section>
        ) : null}

        <Text style={text}>
          Si vous pensez qu'il s'agit d'une erreur ou souhaitez compléter votre
          dossier (numéro BCE, justificatifs), répondez simplement à cet email
          ou contactez-nous.
        </Text>

        <Button style={button} href="mailto:autoracontact@gmail.com">
          Contacter l'équipe AutoRA
        </Button>

        <Hr style={hr} />
        <Text style={legalText}>
          <Link href={`${SITE_URL}`} style={link}>{SITE_URL}</Link>
        </Text>
        <Text style={footer}>
          © {new Date().getFullYear()} {SITE_NAME} — Belgique.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DealerRejectedEmail,
  subject: `Votre demande pro ${SITE_NAME}`,
  displayName: 'Refus revendeur',
  previewData: { name: 'Jean', reason: 'Numéro BCE manquant ou invalide.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 28%, 10%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 35%)', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: 'hsl(160, 84%, 30%)', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(160, 84%, 30%)', color: '#ffffff', fontSize: '14px',
  borderRadius: '16px', padding: '12px 24px', textDecoration: 'none', display: 'inline-block',
}
const card = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca',
  borderRadius: '12px', padding: '14px 18px', margin: '0 0 24px',
}
const cardLabel = { fontSize: '12px', color: '#991b1b', fontWeight: 600 as const, margin: '0 0 6px' }
const cardValue = { fontSize: '14px', color: 'hsl(215, 28%, 10%)', margin: 0, lineHeight: '1.5' }
const hr = { borderColor: '#e5e7eb', margin: '30px 0' }
const legalText = { fontSize: '12px', color: '#999999', lineHeight: '1.5', margin: '0 0 10px' }
const footer = { fontSize: '11px', color: '#999999', margin: '0' }
