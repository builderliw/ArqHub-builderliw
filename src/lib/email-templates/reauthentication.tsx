import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { BRAND, styles } from './_brand'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Link href={BRAND.siteUrl}>
            <Img src={BRAND.logoUrl} alt={BRAND.name} style={styles.logo} />
          </Link>
        </Section>
        <Section style={styles.body}>
          <Text style={styles.eyebrow}>Verificação</Text>
          <Heading style={styles.h1}>Confirme sua identidade</Heading>
          <Text style={styles.text}>
            Use o código abaixo para confirmar sua identidade:
          </Text>
          <Text style={styles.code}>{token}</Text>
          <Text style={{ ...styles.text, fontSize: '13px', color: BRAND.textSoft }}>
            Este código expira em poucos minutos. Se você não solicitou esta
            verificação, pode ignorar este e-mail.
          </Text>
        </Section>
        <Hr style={styles.hr} />
        <Section style={styles.footer}>
          <Text style={{ margin: 0 }}>
            <Link href={BRAND.siteUrl} style={styles.footerStrong}>
              Equipe {BRAND.name}
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
