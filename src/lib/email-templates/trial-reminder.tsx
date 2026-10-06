import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND, styles } from './_brand'

interface Props {
  name?: string
  daysLeft?: number
  expiresAt?: string
  plansUrl?: string
  loginUrl?: string
}

const Email = ({ name, daysLeft, expiresAt, plansUrl, loginUrl }: Props) => {
  const plans = plansUrl || `${BRAND.siteUrl}/planos`
  const login = loginUrl || `${BRAND.siteUrl}/entrar/escritorio`
  const urgent = (daysLeft ?? 7) <= 1
  const headline = urgent
    ? 'Seu teste grátis termina em breve'
    : `Faltam ${daysLeft ?? 7} dias no seu teste grátis`
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{headline} — assine e mantenha seu acesso ArqHub</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img src={BRAND.logoUrl} alt={BRAND.name} style={styles.logo} />
          </Section>
          <Section style={styles.body}>
            <Text style={styles.eyebrow}>Teste grátis</Text>
            <Heading style={styles.h1}>
              {name ? `${name}, ${headline.toLowerCase()}` : headline}
            </Heading>
            <Text style={styles.text}>
              {urgent
                ? 'Seu período de avaliação está no último dia.'
                : 'Você ainda pode aproveitar todos os recursos do ArqHub durante o teste.'}
              {expiresAt ? <> A validade termina em <strong>{expiresAt}</strong>.</> : null}
              {' '}Assine agora para manter clientes, projetos, agenda e financeiro sem interrupções.
            </Text>
            <Section style={styles.buttonWrap}>
              <Button href={plans} style={styles.button}>Ver planos e assinar</Button>
            </Section>
            <Text style={{ ...styles.text, fontSize: '13px', color: BRAND.textSoft }}>
              Já assinou?{' '}
              <Link href={login} style={styles.link}>Entrar no painel</Link>.
            </Text>
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
  subject: (data: Record<string, any>) =>
    (data?.daysLeft ?? 7) <= 1
      ? 'Seu teste ArqHub termina amanhã'
      : `Faltam ${data?.daysLeft ?? 7} dias no seu teste ArqHub`,
  displayName: 'Lembrete de teste grátis',
  previewData: {
    name: 'Ana',
    daysLeft: 7,
    expiresAt: '27/07/2026',
  },
} satisfies TemplateEntry
