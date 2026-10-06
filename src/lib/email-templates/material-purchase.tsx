import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND, styles } from './_brand'

interface Props {
  name?: string
  materialTitle?: string
  amountBRL?: string
  downloadUrl?: string
  expiresLabel?: string
  format?: string
}

const Email = ({
  name,
  materialTitle,
  amountBRL,
  downloadUrl,
  expiresLabel,
  format,
}: Props) => {
  const title = materialTitle || 'Seu material ArqHub'
  const url = downloadUrl || `${BRAND.siteUrl}/conteudos/seu-negocio`
  const isSheet = (format || '').toLowerCase().includes('planilha')
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Seu material ArqHub está pronto para download</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img src={BRAND.logoUrl} alt={BRAND.name} style={styles.logo} />
          </Section>
          <Section style={styles.body}>
            <Text style={styles.eyebrow}>Compra confirmada</Text>
            <Heading style={styles.h1}>
              {name ? `Obrigado, ${name}!` : 'Obrigado pela sua compra!'}
            </Heading>
            <Text style={styles.text}>
              Recebemos seu pagamento{amountBRL ? <> de <strong>{amountBRL}</strong></> : null} e
              liberamos o acesso ao material <strong>{title}</strong>.
            </Text>

            <Section style={styles.buttonWrap}>
              <Button href={url} style={styles.button}>Baixar material</Button>
            </Section>

            <Text style={{ ...styles.text, fontWeight: 600, marginBottom: '8px' }}>
              Como usar {isSheet ? 'a planilha' : 'o material'}
            </Text>
            {isSheet ? (
              <Text style={styles.text}>
                1. Baixe o arquivo e abra no Excel, Google Sheets ou LibreOffice.<br />
                2. Preencha apenas as células de entrada (dados da obra, quantidades e valores) —
                os campos calculados se atualizam automaticamente.<br />
                3. Duplique a aba modelo para cada obra ou cliente, mantendo o histórico separado.<br />
                4. Salve uma cópia em nuvem para acompanhar a evolução ao longo do projeto.
              </Text>
            ) : (
              <Text style={styles.text}>
                1. Baixe o arquivo e abra no leitor de PDF de sua preferência.<br />
                2. Use o sumário para navegar direto até a seção que precisa.<br />
                3. Adapte os modelos e checklists à realidade do seu escritório.<br />
                4. Guarde uma cópia em nuvem para consultar durante a obra.
              </Text>
            )}

            <Text style={{ ...styles.text, fontSize: '13px', color: BRAND.textSoft }}>
              O link de download é pessoal{expiresLabel ? ` e expira em ${expiresLabel}` : ''}.
              Se ele expirar, responda este e-mail que reenviamos.{' '}
              <Link href={`${BRAND.siteUrl}/conteudos/seu-negocio`} style={styles.link}>
                Ver todos os materiais
              </Link>.
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
    data?.materialTitle
      ? `Seu material: ${data.materialTitle}`
      : 'Seu material ArqHub está pronto',
  displayName: 'Compra de material avulso',
  previewData: {
    name: 'Ana',
    materialTitle: 'Planilha de Medição de Obras',
    amountBRL: 'R$ 29,90',
    format: 'Planilha',
    expiresLabel: '7 dias',
  },
} satisfies TemplateEntry
