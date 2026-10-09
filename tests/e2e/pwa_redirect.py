"""E2E: valida redirecionamento PWA standalone e fluxo /app -> /entrar.

Executar:
  python3 tests/e2e/pwa_redirect.py
Requer dev server em http://localhost:8080 e Playwright pré-instalado.
"""

import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright

BASE = "http://localhost:8080"
SCREENSHOTS = Path("/tmp/browser/arqhub-pwa")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

# Patch a ser injetado ANTES de qualquer script da página rodar,
# simulando que o app foi aberto pela tela inicial (PWA standalone).
STANDALONE_PATCH = """
(() => {
  const orig = window.matchMedia.bind(window);
  window.matchMedia = (q) => {
    if (q.includes('display-mode: standalone')) {
      return { matches: true, media: q, addListener(){}, removeListener(){},
               addEventListener(){}, removeEventListener(){}, dispatchEvent(){return false;}, onchange:null };
    }
    return orig(q);
  };
  try { Object.defineProperty(navigator, 'standalone', { value: true, configurable: true }); } catch {}
})();
"""


async def wait_path(page, predicate, timeout=10_000):
    await page.wait_for_function(
        f"() => ({predicate})",
        timeout=timeout,
    )


async def main():
    failures = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # --- Cenário 1: navegador comum, "/" não redireciona ---
        ctx1 = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page1 = await ctx1.new_page()
        await page1.goto(BASE + "/", wait_until="domcontentloaded")
        await page1.wait_for_timeout(800)
        await page1.screenshot(path=str(SCREENSHOTS / "1_browser_root.png"))
        path1 = await page1.evaluate("location.pathname")
        print("[browser] / ->", path1)
        if path1 != "/":
            failures.append(f"navegador comum não deveria sair de / (foi para {path1})")
        await ctx1.close()

        # --- Cenário 2: modo standalone, "/" deve ir para /app ---
        ctx2 = await browser.new_context(viewport={"width": 412, "height": 915})
        await ctx2.add_init_script(STANDALONE_PATCH)
        page2 = await ctx2.new_page()
        await page2.goto(BASE + "/", wait_until="domcontentloaded")
        try:
            await wait_path(page2, "location.pathname.startsWith('/app') || location.pathname === '/entrar'", 8000)
        except Exception:
            pass
        await page2.wait_for_timeout(1200)
        await page2.screenshot(path=str(SCREENSHOTS / "2_standalone_root.png"))
        path2 = await page2.evaluate("location.pathname")
        print("[standalone] / ->", path2)
        if not (path2.startsWith if False else path2.startswith("/app") or path2 == "/entrar"):
            failures.append(f"standalone / deveria ir para /app ou /entrar (foi para {path2})")
        await ctx2.close()

        # --- Cenário 3: modo standalone em rota pública /planos deve ir para /app ---
        ctx3 = await browser.new_context(viewport={"width": 412, "height": 915})
        await ctx3.add_init_script(STANDALONE_PATCH)
        page3 = await ctx3.new_page()
        await page3.goto(BASE + "/planos", wait_until="domcontentloaded")
        try:
            await wait_path(page3, "location.pathname.startsWith('/app') || location.pathname === '/entrar'", 8000)
        except Exception:
            pass
        await page3.wait_for_timeout(1200)
        await page3.screenshot(path=str(SCREENSHOTS / "3_standalone_planos.png"))
        path3 = await page3.evaluate("location.pathname")
        print("[standalone] /planos ->", path3)
        if not (path3.startswith("/app") or path3 == "/entrar"):
            failures.append(f"standalone /planos deveria ir para /app ou /entrar (foi para {path3})")
        await ctx3.close()

        # --- Cenário 4: /app sem sessão deve cair em /entrar ---
        ctx4 = await browser.new_context(viewport={"width": 412, "height": 915})
        page4 = await ctx4.new_page()
        await page4.goto(BASE + "/app", wait_until="domcontentloaded")
        try:
            await wait_path(page4, "location.pathname === '/entrar'", 10000)
        except Exception:
            pass
        await page4.wait_for_timeout(1500)
        await page4.screenshot(path=str(SCREENSHOTS / "4_app_no_session.png"))
        path4 = await page4.evaluate("location.pathname")
        print("[no-session] /app ->", path4)
        if path4 != "/entrar":
            failures.append(f"/app sem sessão deveria ir para /entrar (foi para {path4})")
        await ctx4.close()

        # --- Cenário 5: /entrar em modo standalone permanece (login do PWA) ---
        ctx5 = await browser.new_context(viewport={"width": 412, "height": 915})
        await ctx5.add_init_script(STANDALONE_PATCH)
        page5 = await ctx5.new_page()
        await page5.goto(BASE + "/entrar", wait_until="domcontentloaded")
        await page5.wait_for_timeout(1500)
        await page5.screenshot(path=str(SCREENSHOTS / "5_standalone_entrar.png"))
        path5 = await page5.evaluate("location.pathname")
        print("[standalone] /entrar ->", path5)
        if path5 != "/entrar":
            failures.append(f"standalone /entrar deveria permanecer em /entrar (foi para {path5})")
        await ctx5.close()

        await browser.close()

    if failures:
        print("\nFALHAS:")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("\nTodos os cenários E2E passaram.")


asyncio.run(main())
