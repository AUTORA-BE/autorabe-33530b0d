/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'AutoRA'
const SITE_URL = 'https://autora.be'

interface ReportReviewedProps {
  vehicleName?: string
  outcome?: 'actioned' | 'rejected'
  adminNote?: string
}

const outcomeConfig = {
  actioned: {
    text: 'Le contenu a été examiné et des mesures ont été prises conformément à nos conditions d\'utilisation.',
    preview: 'Votre signalement a été traité',
  },
  rejected: {
    text: 'Le contenu a été examiné et ne constitue pas une violation de nos conditions d\'utilisation.',
    preview: 'Votre signalement a été examiné',
  },
}

const ReportReviewedEmail = ({
  vehicleName = 'annonce signalée',
  outcome = 'actioned',
  adminNote,
}: ReportReviewedProps) => {
  const config = outcomeConfig[outcome] ?? outcomeConfig.actioned

  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>{config.preview} – {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Traitement de votre signalement</Heading>

          <Text style={text}>Bonjour,</Text>
          <Text style={text}>
            Nous avons bien traité votre signalement concernant <strong>{vehicleName}</strong>.
          </Text>
          <Text style={text}>{config.text}</Text>

          {adminNote && (
            <Section style={noteBox}>
              <Text style={noteLabel}>Note de l'équipe {SITE_NAME}</Text>
              <Text style={noteValue}>{adminNote}</Text>
            </Section>
          )}

          <Text style={smallText}>
            Merci de contribuer à la qualité de la plateforme {SITE_NAME}. Votre signalement a été
            traité dans les 48 heures ouvrables conformément à l'article 16 du Digital Services Act (DSA).
          </Text>

          <Button style={button} href={SITE_URL}>
            Retour à {SITE_NAME}
          </Button>

          <Hr style={hr} />
          <Text style={legal}>
            Si vous souhaitez contester cette décision, contactez-nous à autoracontact@gmail.com.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ReportReviewedEmail,
  subject: (data: Record<string, any>) =>
    data?.outcome === 'rejected'
      ? '📋 Votre signalement a été examiné — AutoRA'
      : '✅ Votre signalement a été traité — AutoRA',
  displayName: 'Réponse à un signalement',
  previewData: {
    vehicleName: 'BMW Série 3 (2020)',
    outcome: 'actioned',
    adminNote: 'Annonce retirée après vérification.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 28%, 10%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 35%)', lineHeight: '1.5', margin: '0 0 14px' }
const smallText = { fontSize: '13px', color: 'hsl(215, 14%, 50%)', lineHeight: '1.5', margin: '24px 0' }
const noteBox = {
  backgroundColor: 'hsl(215, 28%, 96%)',
  borderRadius: '8px',
  borderLeft: '4px solid hsl(215, 14%, 65%)',
  padding: '12px 16px',
  margin: '16px 0',
}
const noteLabel = { fontSize: '13px', color: 'hsl(215, 14%, 50%)', margin: '0' }
const noteValue = { fontSize: '14px', color: 'hsl(215, 28%, 20%)', margin: '4px 0 0' }
const button = {
  backgroundColor: 'hsl(160, 84%, 30%)', color: '#ffffff', fontSize: '14px',
  borderRadius: '16px', padding: '12px 24px', textDecoration: 'none',
  display: 'block' as const, textAlign: 'center' as const,
}
const hr = { borderColor: '#e5e7eb', margin: '25px 0' }
const legal = { fontSize: '11px', color: '#999999', margin: '0' }
