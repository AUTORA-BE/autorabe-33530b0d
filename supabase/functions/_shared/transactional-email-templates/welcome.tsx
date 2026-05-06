/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "AutoRA"
const SITE_URL = "https://autora.be"

interface WelcomeEmailProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Bienvenue sur {SITE_NAME} — votre espace auto en Belgique</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          Bienvenue sur AutoRA 🚗
        </Heading>
        <Text style={text}>
          {name ? `Bonjour ${name},` : 'Bonjour,'}
        </Text>
        <Text style={text}>
          Votre compte a bien été créé ! Vous pouvez désormais parcourir nos
          annonces, contacter des vendeurs et publier vos propres véhicules.
        </Text>
        <Button style={button} href={SITE_URL}>
          Découvrir les annonces
        </Button>
        <Hr style={hr} />
        <Text style={legalText}>
          En utilisant {SITE_NAME}, vous acceptez nos{' '}
          <Link href={`${SITE_URL}/terms`} style={link}>
            conditions d'utilisation
          </Link>{' '}
          et notre{' '}
          <Link href={`${SITE_URL}/privacy`} style={link}>
            politique de confidentialité
          </Link>
          , conformément au droit belge et au RGPD.
        </Text>
        <Text style={footer}>
          © {new Date().getFullYear()} {SITE_NAME} — Belgique. Tous droits réservés.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: `Bienvenue sur ${SITE_NAME} !`,
  displayName: 'Email de bienvenue',
  previewData: { name: 'Jean' },
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
const link = { color: 'hsl(160, 84%, 30%)', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(160, 84%, 30%)',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '16px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const hr = { borderColor: '#e5e7eb', margin: '30px 0' }
const legalText = {
  fontSize: '11px',
  color: '#999999',
  lineHeight: '1.5',
  margin: '0 0 10px',
}
const footer = { fontSize: '11px', color: '#999999', margin: '0' }
