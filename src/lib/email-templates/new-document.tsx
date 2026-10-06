import * as React from 'react'
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Button, Hr,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND, styles } from './_brand'

interface Props {
  clientName?: string
  projectName?: string
  documentName?: string
  documentsCount?: number
  officeName?: string
  panelUrl?: string
}

const Email = ({
  clientName,
  projectName,
  documentName,
  documentsCount,
  officeName,
  panelUrl,
}: Props) => {
  const url = panelUrl || `${BRAND.siteUrl}/app/cliente/documentos`
  const multi = (documentsCount ?? 1) > 1
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>
        {multi
          ? `${documentsCount} novos documentos no seu projeto`
          : `Novo documento: ${documentName ?? 'arquivo'}`}
      </Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img src={BRAND.logoUrl} alt={BRAND.name} style={styles.logo} />
          </Section>
          <Section style={styles.body}>
            <Text style={styles.eyebrow}>Novo documento</Text>
            <Heading style={styles.h1}>
              {multi
                ? `${documentsCount} novos arquivos disponíveis`
                : 'Você recebeu um novo arquivo'}
            </Heading>
            <Text style={styles.text}>
              {clientName ? `Olá, ${clientName}. ` : 'Olá. '}
              {officeName ? `${officeName} ` : 'O escritório '}
              acabou de enviar{' '}
              {multi
                ? `${documentsCount} novos documentos`
                : <>o arquivo <strong>{documentName ?? '—'}</strong></>}
              {projectName ? <> para o projeto <strong>{projectName}</strong></> : null}.
            </Text>
            <Section style={styles.buttonWrap}>
              <Button href={url} style={styles.button}>
                Ver no painel
              </Button>
            </Section>
            <Text style={{ ...styles.text, marginBottom: 0 }}>
              Você também pode acessar diretamente em{' '}
              <Link href={url} style={styles.link}>{url}</Link>.
            </Text>
          </Section>
          <Hr style={styles.hr} />
          <Section style={styles.footer}>
            <Text style={{ margin: 0 }}>
              <Link href={BRAND.siteUrl} style={styles.footerStrong}>{BRAND.name}</Link> · acompanhamento de projeto
            </Text>
            <Text style={{ margin: '6px 0 0' }}>
              Não quer mais receber estes avisos? Ajuste em Preferências de notificação no painel.
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
    (data?.documentsCount ?? 1) > 1
      ? `${data.documentsCount} novos documentos no seu projeto`
      : `Novo documento: ${data?.documentName ?? 'arquivo'}`,
  displayName: 'Novo documento no painel',
  previewData: {
    clientName: 'Lucia',
    projectName: 'AP 101',
    documentName: 'Planta-baixa-v2.pdf',
    documentsCount: 1,
    officeName: 'Bota Aí',
    panelUrl: 'https://arqhub.world/app/cliente/documentos',
  },
} satisfies TemplateEntry
