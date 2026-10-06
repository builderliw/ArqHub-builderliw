#!/usr/bin/env bash
# Baixa as imagens que hoje estão hospedadas no CDN da Lovable (/__l5e/...)
# para public/media/. RODE ENQUANTO O SITE AINDA ESTIVER NO AR NA LOVABLE.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/media
BASE="https://arqhub.world"
curl -fL "$BASE/__l5e/assets-v1/782ae44e-9570-4ea8-9baa-2db5cdf66dfe/arqhub-logo-mark.png" -o "public/media/arqhub-logo-mark.png"
curl -fL "$BASE/__l5e/assets-v1/952d761b-399e-4e7a-97c1-7402257b4501/arqhub-logo-resumo.png" -o "public/media/arqhub-logo-resumo.png"
curl -fL "$BASE/__l5e/assets-v1/1eb3687a-ac30-4bb0-925a-6a8de3a210bd/logo-a.png" -o "public/media/logo-a.png"
curl -fL "$BASE/__l5e/assets-v1/6e914460-0189-4530-9c13-4e62a1dbf393/cliente-banner.jpg" -o "public/media/cliente-banner.jpg"
curl -fL "$BASE/__l5e/assets-v1/1e7831c9-95c5-48cd-8b99-fbc4848daf5f/dashboard-banner-blueprints.jpg" -o "public/media/dashboard-banner-blueprints.jpg"
curl -fL "$BASE/__l5e/assets-v1/a6865339-b488-4d68-87e0-fbe10e2aca18/dashboard-banner-v2.jpg" -o "public/media/dashboard-banner-v2.jpg"
curl -fL "$BASE/__l5e/assets-v1/a56f573f-104d-4231-a017-1408ab089d04/dashboard-banner-v3.jpg" -o "public/media/dashboard-banner-v3.jpg"
curl -fL "$BASE/__l5e/assets-v1/3612b082-fae1-47e1-9028-d0863ab21b38/dashboard-banner.jpg" -o "public/media/dashboard-banner.jpg"
curl -fL "$BASE/__l5e/assets-v1/2c027fc8-cecb-4d06-bfc3-311e757de730/financeiro-banner.jpg" -o "public/media/financeiro-banner.jpg"
curl -fL "$BASE/__l5e/assets-v1/7356ec30-46ae-4ec7-a114-029294528be3/hero-apt-v3.jpg" -o "public/media/hero-apt-v3.jpg"
curl -fL "$BASE/__l5e/assets-v1/9634e37d-626b-4537-b598-0ee2d3b7fdbf/hero-apt.jpg" -o "public/media/hero-apt.jpg"
curl -fL "$BASE/__l5e/assets-v1/e582c5fb-baed-495a-b099-e9ff46a84820/hero-carnava.png" -o "public/media/hero-carnava.png"
curl -fL "$BASE/__l5e/assets-v1/f9078cf3-8f47-46c2-aa2f-3a9e8017d37a/liw-avatar-circle.png" -o "public/media/liw-avatar-circle.png"
curl -fL "$BASE/__l5e/assets-v1/b5c17291-30fb-4d00-9231-9021aac99cf8/liw-avatar-new.png" -o "public/media/liw-avatar-new.png"
curl -fL "$BASE/__l5e/assets-v1/0928efa5-894e-4c21-9fad-d796f09a06c2/liw-avatar.png" -o "public/media/liw-avatar.png"
curl -fL "$BASE/__l5e/assets-v1/68e6dce9-5397-4f89-bf2c-6e0ad02bc254/piggy-bank-no-bg.png" -o "public/media/piggy-bank-no-bg.png"
curl -fL "$BASE/__l5e/assets-v1/d5c6775c-27cd-40e4-87ca-f64f4216f5d1/piggy-bank.png" -o "public/media/piggy-bank.png"
curl -fL "$BASE/__l5e/assets-v1/d32c69ee-82e1-46d0-b5c3-0df3427f9c28/project-placeholder.jpg" -o "public/media/project-placeholder.jpg"
curl -fL "https://storage.googleapis.com/gpt-engineer-file-uploads/J9w6x95LXdRifvbebfKdIkuyIOE3/social-images/social-1781011628416-Gemini_Generated_Image_nutrc9nutrc9nutr.webp" -o "public/og-image.webp"
echo "OK — $(ls public/media | wc -l) arquivos em public/media"
