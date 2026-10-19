# ============================================================================
#  ArqHub - recupera as imagens do site antigo (arqhub.world) para o GitHub
#  Como usar: veja as instrucoes que vieram junto. Nao altera nada no site.
# ============================================================================
param([string]$Site = "https://arqhub.world", [string]$Destino = "", [switch]$Auto)
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
$Site = $Site.TrimEnd("/")

if ($Destino) { $Saida = (Resolve-Path $Destino).Path } else {
  $Desk = [Environment]::GetFolderPath("Desktop")
  if (-not $Desk) { $Desk = $HOME }
  $Saida = Join-Path $Desk "ArqHub-imagens"
}
$PastaAssets = [IO.Path]::Combine($Saida, "src", "assets")
$PastaMedia  = [IO.Path]::Combine($Saida, "public", "media")
New-Item -ItemType Directory -Force -Path $PastaAssets, $PastaMedia | Out-Null

# Imagens que o codigo do ArqHub usa e que faltam no GitHub
$Necessarias = @(
  'artigo-aut-1.jpg',
  'artigo-aut-2.jpg',
  'artigo-aut-3.jpg',
  'artigo-caixa-1.jpg',
  'artigo-caixa-2.jpg',
  'artigo-caixa-3.jpg',
  'artigo-caixa-4.jpg',
  'artigo-caixa-5.jpg',
  'artigo-consultiva-1.jpg',
  'artigo-consultiva-2.jpg',
  'artigo-consultiva-3.jpg',
  'artigo-cub-1.jpg',
  'artigo-cub-2.jpg',
  'artigo-cub-3.jpg',
  'artigo-exec-1.jpg',
  'artigo-exec-2.jpg',
  'artigo-exec-3.jpg',
  'artigo-experiencia-1.jpg',
  'artigo-experiencia-2.jpg',
  'artigo-experiencia-3.jpg',
  'artigo-followup-1.jpg',
  'artigo-followup-2.jpg',
  'artigo-followup-3.jpg',
  'artigo-followup-4.jpg',
  'artigo-ia-fin-1.jpg',
  'artigo-ia-fin-2.jpg',
  'artigo-ia-fin-3.jpg',
  'artigo-ia-fin-4.jpg',
  'artigo-ia-fin-5.jpg',
  'artigo-iac-1.jpg',
  'artigo-iac-2.jpg',
  'artigo-iac-3.jpg',
  'artigo-marketing-1.jpg',
  'artigo-marketing-2.jpg',
  'artigo-marketing-3.jpg',
  'artigo-marketing-4.jpg',
  'artigo-operacional-1.jpg',
  'artigo-operacional-2.jpg',
  'artigo-operacional-3.jpg',
  'artigo-operacional-4.jpg',
  'artigo-precificacao-1.jpg',
  'artigo-precificacao-2.jpg',
  'artigo-precificacao-3.jpg',
  'artigo-precificacao-4.jpg',
  'artigo-produtividade-1.jpg',
  'artigo-produtividade-2.jpg',
  'artigo-produtividade-3.jpg',
  'artigo-rv-1.jpg',
  'artigo-rv-2.jpg',
  'artigo-rv-3.jpg',
  'artigo-solucoes-1.jpg',
  'artigo-solucoes-2.jpg',
  'artigo-solucoes-3.jpg',
  'artigo-solucoes-4.jpg',
  'artigo-sus-1.jpg',
  'artigo-sus-2.jpg',
  'artigo-sus-3.jpg',
  'artigo-tcpo-1.jpg',
  'artigo-tcpo-2.jpg',
  'artigo-tcpo-3.jpg',
  'artigo-trafego-1.jpg',
  'artigo-trafego-2.jpg',
  'artigo-trafego-3.jpg',
  'artigo-trafego-4.jpg',
  'bento-alertas.webp',
  'bento-dashboard.webp',
  'bento-diario.webp',
  'bento-relatorios.webp',
  'cadastro-bg.jpg',
  'conteudo-empreenda.jpg',
  'conteudo-potencializador.jpg',
  'conteudo-seu-negocio.jpg',
  'diario-foto-1.jpg',
  'diario-foto-2.jpg',
  'diario-foto-3.jpg',
  'etapa-1-briefing.jpg',
  'etapa-2-preliminar.jpg',
  'etapa-3-anteprojeto.jpg',
  'etapa-4-legal.jpg',
  'etapa-5-executivo.jpg',
  'etapa-6-obra.jpg',
  'ia-1.jpg',
  'ia-2.jpg',
  'ia-3.jpg',
  'ia-4.jpg',
  'login-admin.jpg',
  'login-cliente.jpg',
  'login-escritorio.jpg',
  'portal-cliente-interior.jpg'
)

# Imagens principais hospedadas no servidor da Lovable
$Media = @(
  @{ Url = '{BASE}/__l5e/assets-v1/782ae44e-9570-4ea8-9baa-2db5cdf66dfe/arqhub-logo-mark.png'; Dest = 'public/media/arqhub-logo-mark.png' },
  @{ Url = '{BASE}/__l5e/assets-v1/952d761b-399e-4e7a-97c1-7402257b4501/arqhub-logo-resumo.png'; Dest = 'public/media/arqhub-logo-resumo.png' },
  @{ Url = '{BASE}/__l5e/assets-v1/1eb3687a-ac30-4bb0-925a-6a8de3a210bd/logo-a.png'; Dest = 'public/media/logo-a.png' },
  @{ Url = '{BASE}/__l5e/assets-v1/6e914460-0189-4530-9c13-4e62a1dbf393/cliente-banner.jpg'; Dest = 'public/media/cliente-banner.jpg' },
  @{ Url = '{BASE}/__l5e/assets-v1/1e7831c9-95c5-48cd-8b99-fbc4848daf5f/dashboard-banner-blueprints.jpg'; Dest = 'public/media/dashboard-banner-blueprints.jpg' },
  @{ Url = '{BASE}/__l5e/assets-v1/a6865339-b488-4d68-87e0-fbe10e2aca18/dashboard-banner-v2.jpg'; Dest = 'public/media/dashboard-banner-v2.jpg' },
  @{ Url = '{BASE}/__l5e/assets-v1/a56f573f-104d-4231-a017-1408ab089d04/dashboard-banner-v3.jpg'; Dest = 'public/media/dashboard-banner-v3.jpg' },
  @{ Url = '{BASE}/__l5e/assets-v1/3612b082-fae1-47e1-9028-d0863ab21b38/dashboard-banner.jpg'; Dest = 'public/media/dashboard-banner.jpg' },
  @{ Url = '{BASE}/__l5e/assets-v1/2c027fc8-cecb-4d06-bfc3-311e757de730/financeiro-banner.jpg'; Dest = 'public/media/financeiro-banner.jpg' },
  @{ Url = '{BASE}/__l5e/assets-v1/7356ec30-46ae-4ec7-a114-029294528be3/hero-apt-v3.jpg'; Dest = 'public/media/hero-apt-v3.jpg' },
  @{ Url = '{BASE}/__l5e/assets-v1/9634e37d-626b-4537-b598-0ee2d3b7fdbf/hero-apt.jpg'; Dest = 'public/media/hero-apt.jpg' },
  @{ Url = '{BASE}/__l5e/assets-v1/e582c5fb-baed-495a-b099-e9ff46a84820/hero-carnava.png'; Dest = 'public/media/hero-carnava.png' },
  @{ Url = '{BASE}/__l5e/assets-v1/f9078cf3-8f47-46c2-aa2f-3a9e8017d37a/liw-avatar-circle.png'; Dest = 'public/media/liw-avatar-circle.png' },
  @{ Url = '{BASE}/__l5e/assets-v1/b5c17291-30fb-4d00-9231-9021aac99cf8/liw-avatar-new.png'; Dest = 'public/media/liw-avatar-new.png' },
  @{ Url = '{BASE}/__l5e/assets-v1/0928efa5-894e-4c21-9fad-d796f09a06c2/liw-avatar.png'; Dest = 'public/media/liw-avatar.png' },
  @{ Url = '{BASE}/__l5e/assets-v1/68e6dce9-5397-4f89-bf2c-6e0ad02bc254/piggy-bank-no-bg.png'; Dest = 'public/media/piggy-bank-no-bg.png' },
  @{ Url = '{BASE}/__l5e/assets-v1/d5c6775c-27cd-40e4-87ca-f64f4216f5d1/piggy-bank.png'; Dest = 'public/media/piggy-bank.png' },
  @{ Url = '{BASE}/__l5e/assets-v1/d32c69ee-82e1-46d0-b5c3-0df3427f9c28/project-placeholder.jpg'; Dest = 'public/media/project-placeholder.jpg' },
  @{ Url = 'https://storage.googleapis.com/gpt-engineer-file-uploads/J9w6x95LXdRifvbebfKdIkuyIOE3/social-images/social-1781011628416-Gemini_Generated_Image_nutrc9nutrc9nutr.webp'; Dest = 'public/og-image.webp' }
)

function Baixar-Texto([string]$url) {
  try { return (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 60).Content } catch { return $null }
}
function Baixar-Arquivo([string]$url, [string]$dest) {
  try {
    Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 120 -OutFile $dest
    return ((Get-Item $dest).Length -gt 0)
  } catch { if (Test-Path $dest) { Remove-Item $dest -Force }; return $false }
}

Write-Host ""
Write-Host "ArqHub - recuperando imagens de $Site" -ForegroundColor Cyan
Write-Host "Salvando em: $Saida"
Write-Host ""

# ---- 1. Percorre o site e todos os arquivos JavaScript/CSS para achar as imagens
$Paginas = @("/", "/planos", "/recursos", "/modulos", "/blog", "/sobre", "/portal-cliente", "/entrar",
             "/conteudos/empreenda", "/conteudos/potencializador", "/conteudos/seu-negocio", "/cadastro")
$Fila = New-Object System.Collections.Generic.Queue[string]
$Vistos = New-Object System.Collections.Generic.HashSet[string]
$Imagens = New-Object System.Collections.Generic.HashSet[string]
$reArq  = '(?:^|[\s"''`(,=/])(?:\.?/)?(?:assets/)?([A-Za-z0-9_.\-]+\.(?:js|css))(?=["''`)\s?#,])'
$reImg  = '([A-Za-z0-9_.\-]+\.(?:jpe?g|png|webp|gif|svg|avif))(?=["''`)\s?#,])'

Write-Host "1/3  Lendo as paginas do site..." -ForegroundColor Yellow
foreach ($p in $Paginas) {
  $html = Baixar-Texto ($Site + $p)
  if (-not $html) { continue }
  foreach ($m in [regex]::Matches($html, '(?:src|href)="(/assets/[^"]+\.(?:js|css))"')) {
    $u = $m.Groups[1].Value
    if ($Vistos.Add($u)) { $Fila.Enqueue($u) }
  }
  foreach ($m in [regex]::Matches($html, '/assets/' + $reImg)) { [void]$Imagens.Add($m.Groups[1].Value) }
}
if ($Vistos.Count -eq 0) {
  Write-Host "Nao consegui abrir $Site. Verifique a internet e se o site antigo ainda esta no ar." -ForegroundColor Red
  if (-not $Auto) { Read-Host "Aperte Enter para fechar" }; exit 1
}

Write-Host "2/3  Procurando imagens nos arquivos do site (pode levar 1-2 minutos)..." -ForegroundColor Yellow
$lidos = 0
while ($Fila.Count -gt 0) {
  $u = $Fila.Dequeue()
  $txt = Baixar-Texto ($Site + $u)
  $lidos++
  if (-not $txt) { continue }
  foreach ($m in [regex]::Matches($txt, $reArq)) {
    $nome = $m.Groups[1].Value
    $cam = "/assets/" + $nome
    if ($Vistos.Add($cam)) { $Fila.Enqueue($cam) }
  }
  foreach ($m in [regex]::Matches($txt, $reImg)) { [void]$Imagens.Add($m.Groups[1].Value) }
}
Write-Host "     $lidos arquivos lidos, $($Imagens.Count) imagens referenciadas."

# ---- 2. Associa cada imagem encontrada ao nome original que o codigo espera
Write-Host "3/3  Baixando as imagens..." -ForegroundColor Yellow
$ok = 0; $Faltando = @()
foreach ($nec in $Necessarias) {
  $ext  = [IO.Path]::GetExtension($nec)
  $base = [IO.Path]::GetFileNameWithoutExtension($nec)
  $padrao = '^' + [regex]::Escape($base) + '-[A-Za-z0-9_\-]{6,12}' + [regex]::Escape($ext) + '$'
  $achou = $Imagens | Where-Object { $_ -ceq $nec -or $_ -cmatch $padrao } | Select-Object -First 1
  $dest = Join-Path $PastaAssets $nec
  if ($Auto -and (Test-Path $dest)) { $ok++; continue }
  if ($achou -and (Baixar-Arquivo ($Site + "/assets/" + $achou) $dest)) { $ok++ }
  else { $Faltando += $nec }
}

$okMedia = 0
foreach ($item in $Media) {
  $url = $item.Url.Replace("{BASE}", $Site)
  $dest = [IO.Path]::Combine([string[]](@($Saida) + ($item.Dest -split "/")))
  New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
  if (Baixar-Arquivo $url $dest) { $okMedia++ } else { $Faltando += $item.Dest }
}

# ---- 3. Resumo
Write-Host ""
Write-Host "PRONTO!" -ForegroundColor Green
Write-Host "  Fotos das paginas (src\assets):  $ok de $($Necessarias.Count)"
Write-Host "  Imagens principais (public):     $okMedia de $($Media.Count)"
if ($Faltando.Count -gt 0) {
  $lista = if ($Auto) { Join-Path ([IO.Path]::GetTempPath()) "FALTANDO.txt" } else { Join-Path $Saida "FALTANDO.txt" }
  $Faltando | Set-Content -Path $lista -Encoding UTF8
  Write-Host "  Nao encontradas: $($Faltando.Count) (lista em FALTANDO.txt)" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Pasta com as imagens: $Saida" -ForegroundColor Cyan
if (-not $Auto) {
  try { Start-Process explorer.exe $Saida } catch {}
  Read-Host "Aperte Enter para fechar"
}
