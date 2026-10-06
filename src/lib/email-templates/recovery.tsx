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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefina sua senha do {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Link href={BRAND.siteUrl}>
            <Img src={BRAND.logoUrl} alt={siteName} style={styles.logo} />
          </Link>
        </Section>
        <Section style={styles.body}>
          <Text style={styles.eyebrow}>Redefinição de senha</Text>
          <Heading style={styles.h1}>Redefina sua senha</Heading>
          <Text style={styles.text}>
            Recebemos um pedido para redefinir a senha da sua conta no {siteName}.
            Clique no botão abaixo para escolher uma nova senha.
          </Text>
          <Section style={styles.buttonWrap}>
            <Button style={styles.button} href={confirmationUrl}>
              Redefinir senha
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
            Se você não solicitou esta redefinição, pode ignorar este e-mail —
            sua senha permanecerá a mesma.
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

export default RecoveryEmail
