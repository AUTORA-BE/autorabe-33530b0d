/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'AutoRA'
const SITE_URL = 'https://autora.be'

interface DealerApprovedProps {
  name?: string
  garageName?: string
}

const DealerApprovedEmail = ({ name, garageName }: DealerApprovedProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre compte professionnel {SITE_NAME} est validé 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Compte pro validé 🎉</Heading>
        <Text style={text}>
          {name ? `Bonjour ${name},` : 'Bonjour,'}
        </Text>
        <Text style={text}>
          Excellente nouvelle : votre compte professionnel
          {garageName ? ` pour ${garageName}` : ''} a été validé par notre équipe.
          Vous pouvez désormais publier vos annonces avec le badge Pro, accéder à
          votre vitrine garage et bénéficier de tous les outils dédiés aux
          revendeurs sur {SITE_NAME}.
        </Text>
        <Button style={button} href={`${SITE_URL}/dashboard`}>
          Accéder à mon tableau de bord
        </Button>
        <Hr style={hr} />
        <Text style={legalText}>
          Une question ? Écrivez-nous à{' '}
          <Link href="mailto:autoracontact@gmail.com" style={link}>
            autoracontact@gmail.com
          </Link>.
        </Text>
        <Text style={footer}>
          © {new Date().getFullYear()} {SITE_NAME} — Belgique.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DealerApprovedEmail,
  subject: `Votre compte pro ${SITE_NAME} est validé 🎉`,
  displayName: 'Validation revendeur',
  previewData: { name: 'Jean', garageName: 'Garage Dupont SRL' },
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
const hr = { borderColor: '#e5e7eb', margin: '30px 0' }
const legalText = { fontSize: '12px', color: '#999999', lineHeight: '1.5', margin: '0 0 10px' }
const footer = { fontSize: '11px', color: '#999999', margin: '0' }
