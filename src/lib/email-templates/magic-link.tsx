import * as React from 'react'

import {
  Body,
  Button,
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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de acesso para {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Link href={BRAND.siteUrl}>
            <Img src={BRAND.logoUrl} alt={siteName} style={styles.logo} />
          </Link>
        </Section>
        <Section style={styles.body}>
          <Text style={styles.eyebrow}>Acesso rápido</Text>
          <Heading style={styles.h1}>Seu link de acesso</Heading>
          <Text style={styles.text}>
            Clique no botão abaixo para entrar em {siteName}. Por segurança, este
            link expira em poucos minutos.
          </Text>
          <Section style={styles.buttonWrap}>
            <Button style={styles.button} href={confirmationUrl}>
              Entrar agora
            </Button>
          </Section>
          <Text style={{ ...styles.text, fontSize: '13px', color: BRAND.textSoft }}>
            Se o botão não funcionar, copie e cole este link no navegador:
            <br />
            <Link href={confirmationUrl} style={styles.link}>
              {confirmationUrl}
            </Link>
          </Text>
        </Section>
        <Hr style={styles.hr} />
        <Section style={styles.footer}>
          <Text style={{ margin: 0 }}>
            Se você não solicitou este acesso, pode ignorar este e-mail.
          </Text>
          <Text style={{ margin: '12px 0 0' }}>
            <Link href={BRAND.siteUrl} style={styles.footerStrong}>
              Equipe {siteName}
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
