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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Ative sua conta e comece a usar o ArqHub agora</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Link href={siteUrl || BRAND.siteUrl}>
            <Img src={BRAND.logoUrl} alt={siteName} style={styles.logo} />
          </Link>
        </Section>
        <Section style={styles.body}>
          <Text style={styles.eyebrow}>Ative sua conta</Text>
          <Heading style={styles.h1}>Bem-vindo ao {siteName}</Heading>
          <Text style={styles.text}>
            Estamos felizes em ter você aqui. Sua conta vinculada a{' '}
            <Link href={`mailto:${recipient}`} style={styles.link}>
              {recipient}
            </Link>{' '}
            está quase pronta — ative agora para acessar seu painel e iniciar o
            onboarding.
          </Text>
          <Section style={styles.buttonWrap}>
            <Button style={styles.button} href={confirmationUrl}>
              Ativar conta e acessar painel
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
            Se você não criou esta conta, pode ignorar este e-mail com segurança.
          </Text>
          <Text style={{ margin: '12px 0 0' }}>
            <Link href={siteUrl || BRAND.siteUrl} style={styles.footerStrong}>
              Equipe {siteName}
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
