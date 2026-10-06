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

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração do seu e-mail no {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Link href={BRAND.siteUrl}>
            <Img src={BRAND.logoUrl} alt={siteName} style={styles.logo} />
          </Link>
        </Section>
        <Section style={styles.body}>
          <Text style={styles.eyebrow}>Alteração de e-mail</Text>
          <Heading style={styles.h1}>Confirme seu novo e-mail</Heading>
          <Text style={styles.text}>
            Recebemos um pedido para alterar o e-mail da sua conta no {siteName}{' '}
            de{' '}
            <Link href={`mailto:${oldEmail}`} style={styles.link}>
              {oldEmail}
            </Link>{' '}
            para{' '}
            <Link href={`mailto:${newEmail}`} style={styles.link}>
              {newEmail}
            </Link>
            .
          </Text>
          <Section style={styles.buttonWrap}>
            <Button style={styles.button} href={confirmationUrl}>
              Confirmar alteração
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
            Se você não solicitou esta alteração, proteja sua conta imediatamente
            trocando sua senha.
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

export default EmailChangeEmail
