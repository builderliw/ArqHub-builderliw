import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND, styles } from './_brand'

interface Props {
  name?: string
  planLabel?: string
  frequencyLabel?: string
  amountBRL?: string
  expiresAt?: string
  loginUrl?: string
  recoverUrl?: string
  emailExists?: boolean
}

const Email = ({
  name,
  planLabel,
  frequencyLabel,
  amountBRL,
  expiresAt,
  loginUrl,
  recoverUrl,
  emailExists,
}: Props) => {
  const login = loginUrl || `${BRAND.siteUrl}/entrar/escritorio`
  const recover = recoverUrl || `${BRAND.siteUrl}/esqueci-senha`
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Pagamento aprovado — bem-vindo ao ArqHub</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img src={BRAND.logoUrl} alt={BRAND.name} style={styles.logo} />
          </Section>
          <Section style={styles.body}>
            <Text style={styles.eyebrow}>Pagamento aprovado</Text>
            <Heading style={styles.h1}>
              {name ? `Bem-vindo, ${name}!` : 'Bem-vindo ao ArqHub!'}
            </Heading>
            <Text style={styles.text}>
              Recebemos seu pagamento
              {planLabel ? <> do plano <strong>{planLabel}</strong></> : null}
              {frequencyLabel ? <> ({frequencyLabel})</> : null}
              {amountBRL ? <> no valor de <strong>{amountBRL}</strong></> : null}.
              Sua assinatura está ativa
              {expiresAt ? <> até <strong>{expiresAt}</strong></> : null}.
            </Text>

            {emailExists ? (
              <>
                <Text style={styles.text}>
                  Identificamos que já existe uma conta no ArqHub com este e-mail.
                  Basta acessar com sua senha para liberar o plano.
                </Text>
                <Section style={styles.buttonWrap}>
                  <Button href={login} style={styles.button}>Entrar no painel</Button>
                </Section>
                <Text style={{ ...styles.text, fontSize: '13px', color: BRAND.textSoft }}>
                  Esqueceu a senha?{' '}
                  <Link href={recover} style={styles.link}>Recuperar senha</Link>.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.text}>
                  Para acessar seu painel, crie sua senha e finalize o cadastro do escritório.
                </Text>
                <Section style={styles.buttonWrap}>
                  <Button href={`${BRAND.siteUrl}/cadastro?paid=1`} style={styles.button}>
                    Criar minha conta
                  </Button>
                </Section>
                <Text style={{ ...styles.text, fontSize: '13px', color: BRAND.textSoft }}>
                  Já tem uma conta?{' '}
                  <Link href={login} style={styles.link}>Entrar</Link>.
                </Text>
              </>
            )}
          </Section>
          <Hr style={styles.hr} />
          <Section style={styles.footer}>
            <Text style={{ margin: 0 }}>
              <Link href={BRAND.siteUrl} style={styles.footerStrong}>{BRAND.name}</Link>
              {' '}· Software para escritórios de arquitetura
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Pagamento aprovado — acesse seu ArqHub',
  displayName: 'Pagamento aprovado',
  previewData: {
    name: 'Ana',
    planLabel: 'Premium',
    frequencyLabel: 'Mensal',
    amountBRL: 'R$ 249,99',
    expiresAt: '20/08/2026',
    emailExists: true,
  },
} satisfies TemplateEntry
