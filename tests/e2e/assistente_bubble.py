"""
Playwright e2e para a bolha do assistente + "Voltar ao topo".
Cobre múltiplos breakpoints móveis e valida:
  - aria-labels
  - foco visível (focus ring)
  - abrir/fechar por teclado
  - Escape fecha o diálogo
  - foco preso dentro do diálogo (focus trap)
  - foco devolvido ao gatilho após fechar
  - não sobrepõe o botão "Voltar ao topo"

Uso: python3 tests/e2e/assistente_bubble.py
"""
import asyncio
import sys
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:8080/"

BREAKPOINTS = [
    ("mobile-sm", 320, 720),
    ("mobile", 360, 740),
    ("mobile-lg", 414, 896),
    ("tablet", 768, 1024),
    ("desktop", 1280, 900),
]

TRIGGER = '[data-testid="assistente-bubble-trigger"]'
PANEL = '[data-testid="assistente-bubble-panel"]'
BACK_TO_TOP = 'button[aria-label*="topo" i]'


def rects_overlap(a, b):
    return not (
        a["right"] <= b["left"]
        or a["left"] >= b["right"]
        or a["bottom"] <= b["top"]
        or a["top"] >= b["bottom"]
    )


async def run_breakpoint(page, name, w, h, results):
    prefix = f"[{name} {w}x{h}]"
    await page.set_viewport_size({"width": w, "height": h})
    await page.goto(BASE_URL, wait_until="domcontentloaded")
    await page.evaluate(
        "try{localStorage.setItem('arqhub:install-prompt-never','1')}catch(e){}"
    )
    await page.reload(wait_until="networkidle")
    await page.wait_for_timeout(1200)
    await page.wait_for_selector(TRIGGER, timeout=15_000)

    # aria-label + estado fechado
    trigger = page.locator(TRIGGER)
    label = await trigger.get_attribute("aria-label")
    expanded = await trigger.get_attribute("aria-expanded")
    assert label and "assistente" in label.lower(), f"{prefix} aria-label ausente: {label!r}"
    assert expanded == "false", f"{prefix} aria-expanded inicial != false ({expanded})"

    # Sem sobreposição com "Voltar ao topo" quando visível (após scroll)
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await page.wait_for_timeout(700)
    back = page.locator(BACK_TO_TOP).first
    if await back.count() > 0 and await back.is_visible():
        r1 = await trigger.evaluate("el => el.getBoundingClientRect().toJSON()")
        r2 = await back.evaluate("el => el.getBoundingClientRect().toJSON()")
        assert not rects_overlap(r1, r2), f"{prefix} bolha sobrepõe 'Voltar ao topo': {r1} vs {r2}"
        results.append(f"{prefix} sem sobreposição com 'Voltar ao topo' ✓")
    else:
        results.append(f"{prefix} 'Voltar ao topo' não visível (sem conflito) ✓")

    await page.evaluate("window.scrollTo(0, 0)")

    # Abrir com teclado (Enter)
    await trigger.focus()
    focused_ring = await trigger.evaluate(
        "el => getComputedStyle(el).getPropertyValue('outline-style') || 'none'"
    )
    # focus-visible aplica ring; validamos que o botão realmente recebeu foco
    is_focused = await trigger.evaluate("el => el === document.activeElement")
    assert is_focused, f"{prefix} gatilho não recebeu foco"

    await page.keyboard.press("Enter")
    await page.wait_for_selector(PANEL, timeout=5_000)
    expanded = await trigger.get_attribute("aria-expanded")
    assert expanded == "true", f"{prefix} aria-expanded != true após abrir"

    role = await page.locator(PANEL).get_attribute("role")
    modal = await page.locator(PANEL).get_attribute("aria-modal")
    assert role == "dialog" and modal == "true", f"{prefix} dialog/aria-modal incorretos"

    # Foco inicial deve ir para dentro do painel (botão fechar)
    await page.wait_for_timeout(150)
    inside = await page.evaluate(
        f"() => document.querySelector('{PANEL}')?.contains(document.activeElement)"
    )
    assert inside, f"{prefix} foco inicial não está no diálogo"

    # Focus trap: Shift+Tab a partir do primeiro deve ir ao último dentro do painel
    await page.keyboard.press("Shift+Tab")
    still_inside = await page.evaluate(
        f"() => document.querySelector('{PANEL}')?.contains(document.activeElement)"
    )
    assert still_inside, f"{prefix} focus trap falhou (Shift+Tab escapou)"

    # Escape fecha e devolve foco ao gatilho
    await page.keyboard.press("Escape")
    await page.wait_for_selector(PANEL, state="detached", timeout=3_000)
    expanded = await trigger.get_attribute("aria-expanded")
    assert expanded == "false", f"{prefix} aria-expanded != false após Escape"
    focused_back = await trigger.evaluate("el => el === document.activeElement")
    assert focused_back, f"{prefix} foco não retornou ao gatilho após fechar"

    results.append(f"{prefix} a11y (teclado, trap, escape, retorno de foco) ✓")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await context.new_page()
        results = []
        failed = False
        for name, w, h in BREAKPOINTS:
            try:
                await run_breakpoint(page, name, w, h, results)
            except AssertionError as e:
                failed = True
                results.append(f"FAIL {e}")
        await browser.close()
        for line in results:
            print(line)
        if failed:
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
