/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'AutoRA'
const DASHBOARD_URL = 'https://autora.be/dashboard'

interface BoostStatusProps {
  contactName?: string
  vehicleName?: string
  boostLabel?: string
  /** 'warning' = expire bientôt ; 'expired' = déjà expiré. */
  variant?: 'warning' | 'expired'
  hoursLeft?: number
}

const BoostStatusEmail = ({
  contactName,
  vehicleName = 'votre véhicule',
  boostLabel = '',
  variant = 'warning',
  hoursLeft = 1,
}: BoostStatusProps) => {
  const isWarning = variant === 'warning'
  const badgeColor = isWarning ? '#e67e22' : '#d97706'

  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>
        {isWarning
          ? `Votre boost ${boostLabel} expire bientôt`
          : `Votre boost ${boostLabel} a expiré`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={{ ...badge, color: badgeColor, backgroundColor: `${badgeColor}15` }}>
            {isWarning ? `⏳ Expire dans ~${hoursLeft}h` : `⏰ Boost ${boostLabel} expiré`}
          </Text>

          <Heading style={h1}>
            {isWarning ? 'Votre boost expire bientôt' : 'Votre boost a expiré'}
          </Heading>

          <Text style={text}>Bonjour {contactName ?? ''},</Text>

          {isWarning ? (
            <>
              <Text style={text}>
                Votre boost <strong>{boostLabel}</strong> pour <strong>{vehicleName}</strong> expire
                dans environ <strong>{hoursLeft} heure{hoursLeft > 1 ? 's' : ''}</strong>.
              </Text>
              <Text style={text}>
                Après expiration, votre annonce ne sera plus mise en avant dans les résultats de recherche.
              </Text>
              <Section style={{ ...tipBox, borderLeft: '4px solid #f97316', backgroundColor: '#fff7ed' }}>
                <Text style={{ ...tipLabel, color: '#9a3412' }}>💡 Conseil</Text>
                <Text style={{ ...tipValue, color: '#7c2d12' }}>
                  Renouvelez votre boost avant l'expiration pour ne pas perdre votre avantage de visibilité !
                </Text>
              </Section>
            </>
          ) : (
            <>
              <Text style={text}>
                Votre boost <strong>{boostLabel}</strong> pour <strong>{vehicleName}</strong> vient
                d'expirer. Votre annonce n'apparaît plus en priorité dans les résultats de recherche.
              </Text>
              <Section style={{ ...tipBox, borderLeft: '4px solid #f59e0b', backgroundColor: '#fffbeb' }}>
                <Text style={{ ...tipLabel, color: '#92400e' }}>📊 Saviez-vous ?</Text>
                <Text style={{ ...tipValue, color: '#78350f' }}>
                  Les annonces boostées reçoivent en moyenne <strong>3x plus de vues</strong> et{' '}
                  <strong>2x plus de messages</strong> que les annonces standard.
                </Text>
              </Section>
              <Text style={text}>
                Renouvelez votre boost dès maintenant pour maintenir la visibilité de votre annonce !
              </Text>
            </>
          )}

          <Button style={{ ...button, backgroundColor: badgeColor }} href={DASHBOARD_URL}>
            {isWarning ? '🚀 Renouveler maintenant' : '🚀 Renouveler mon boost'}
          </Button>

          <Hr style={hr} />
          <Text style={footer}>
            Cet email a été envoyé automatiquement par {SITE_NAME}.{'\n'}
            Vous recevez cet email car vous avez activé un boost sur votre annonce.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BoostStatusEmail,
  subject: (data: Record<string, any>) =>
    data?.variant === 'expired'
      ? `🚀 Votre boost ${data?.boostLabel ?? ''} pour ${data?.brandModel ?? ''} a expiré`
      : `⏳ Votre boost ${data?.boostLabel ?? ''} expire dans ${data?.hoursLeft ?? 1}h — ${data?.brandModel ?? ''}`,
  displayName: 'Boost — expiration',
  previewData: {
    contactName: 'Jean Dupont',
    vehicleName: 'BMW Série 3 (2020)',
    brandModel: 'BMW Série 3',
    boostLabel: '24 heures',
    variant: 'warning',
    hoursLeft: 6,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const badge = {
  display: 'inline-block',
  padding: '8px 20px',
  borderRadius: '20px',
  fontWeight: 600 as const,
  fontSize: '15px',
  margin: '0 0 16px',
}
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 28%, 10%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 14%, 35%)', lineHeight: '1.5', margin: '0 0 14px' }
const tipBox = { borderRadius: '8px', padding: '16px 20px', margin: '20px 0' }
const tipLabel = { fontSize: '14px', fontWeight: 600 as const, margin: '0' }
const tipValue = { fontSize: '14px', margin: '8px 0 0', lineHeight: '1.5' }
const button = {
  color: '#ffffff', fontSize: '15px', fontWeight: 600 as const,
  borderRadius: '16px', padding: '14px 28px', textDecoration: 'none',
  display: 'block' as const, textAlign: 'center' as const, margin: '24px 0 0',
}
const hr = { borderColor: '#e5e7eb', margin: '28px 0' }
const footer = {
  fontSize: '12px', color: '#94a3b8', margin: '0',
  textAlign: 'center' as const, whiteSpace: 'pre-line' as const,
}
