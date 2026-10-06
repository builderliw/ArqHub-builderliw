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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidado para o {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Link href={siteUrl || BRAND.siteUrl}>
            <Img src={BRAND.logoUrl} alt={siteName} style={styles.logo} />
          </Link>
        </Section>
        <Section style={styles.body}>
          <Text style={styles.eyebrow}>Convite</Text>
          <Heading style={styles.h1}>Você foi convidado</Heading>
          <Text style={styles.text}>
            Você recebeu um convite para entrar no{' '}
            <Link href={siteUrl || BRAND.siteUrl} style={styles.link}>
              <strong>Equipe {siteName}</strong>
            </Link>
            . Clique no botão abaixo para aceitar e criar sua conta.
          </Text>
          <Section style={styles.buttonWrap}>
            <Button style={styles.button} href={confirmationUrl}>
              Aceitar convite
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
            Se você não esperava este convite, pode ignorar este e-mail com
            segurança.
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

export default InviteEmail
