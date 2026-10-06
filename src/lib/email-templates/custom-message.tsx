import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND, styles } from './_brand'

// E-mail livre escrito pelo admin (painel Admin → E-mails).
// O texto já chega com as variáveis ({{nome}}, {{dias}}...) substituídas.
interface Props {
  subject?: string
  eyebrow?: string
  heading?: string
  message?: string
  ctaLabel?: string
  ctaUrl?: string
  signature?: string
}

function Paragraphs({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, '').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        return (
          <Text key={i} style={styles.text}>
            {lines.map((line, j) => (
              <React.Fragment key={j}>
                {line}
                {j < lines.length - 1 ? <br /> : null}
              </React.Fragment>
            ))}
          </Text>
        )
      })}
    </>
  )
}

const Email = ({ eyebrow, heading, message, ctaLabel, ctaUrl, signature, subject }: Props) => {
  const preview = (message || heading || subject || '').replace(/\s+/g, ' ').slice(0, 120)
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img src={BRAND.logoUrl} alt={BRAND.name} style={styles.logo} />
          </Section>
          <Section style={styles.body}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            {heading ? <Heading style={styles.h1}>{heading}</Heading> : null}
            <Paragraphs text={message || ''} />
            {ctaLabel && ctaUrl ? (
              <Section style={styles.buttonWrap}>
                <Button href={ctaUrl} style={styles.button}>{ctaLabel}</Button>
              </Section>
            ) : null}
            {signature ? <Paragraphs text={signature} /> : null}
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
  subject: (data: Record<string, any>) => data?.subject || 'Mensagem da equipe ArqHub',
  displayName: 'Mensagem personalizada (admin)',
  previewData: {
    subject: 'Pedimos desculpas',
    eyebrow: 'Equipe ArqHub',
    heading: 'Ana, pedimos desculpas',
    message: 'Olá, Ana.\n\nTivemos uma instabilidade.\n\nLiberamos 30 dias grátis para você.',
    ctaLabel: 'Acessar o ArqHub',
    ctaUrl: 'https://arqhub.world/entrar/escritorio',
    signature: 'Um abraço,\nEquipe ArqHub',
  },
} satisfies TemplateEntry
