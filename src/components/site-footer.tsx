import { Link } from "@tanstack/react-router";
import arqhubLogo from "@/assets/arqhub-logo.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="flex items-center gap-2 mb-3">
            <img src={arqhubLogo.url} alt="ArqHub" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold font-display">
              <span className="text-white">Arq</span><span className="text-white/80">Hub</span>
            </span>
          </div>
          <p className="text-sm text-white/70 max-w-xs">
            Gestão premium para escritórios de arquitetura e engenharia.
          </p>
        </div>

        <div className="md:col-span-2">
          <h4 className="text-[11px] font-semibold tracking-[0.18em] text-white/60 mb-4">PRODUTO</h4>
          <ul className="space-y-3 text-sm text-white/85">
            <li><Link to="/recursos" className="hover:text-white">Recursos</Link></li>
            <li><Link to="/modulos" className="hover:text-white">Módulos</Link></li>
            <li><Link to="/planos" className="hover:text-white">Planos</Link></li>
            <li><Link to="/portal-cliente" className="hover:text-white">Portal do Cliente</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="text-[11px] font-semibold tracking-[0.18em] text-white/60 mb-4">EMPRESA</h4>
          <ul className="space-y-3 text-sm text-white/85">
            <li><Link to="/sobre" className="hover:text-white">Sobre</Link></li>
            <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link to="/contato" className="hover:text-white">Contato</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="text-[11px] font-semibold tracking-[0.18em] text-white/60 mb-4">SUPORTE</h4>
          <ul className="space-y-3 text-sm text-white/85">
            <li><Link to="/ajuda" className="hover:text-white">Central de Ajuda</Link></li>
            <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
            <li><Link to="/contato" className="hover:text-white">Contato</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="text-[11px] font-semibold tracking-[0.18em] text-white/60 mb-4">LEGAL</h4>
          <ul className="space-y-3 text-sm text-white/85">
            <li><Link to="/termos" className="hover:text-white">Termos</Link></li>
            <li><Link to="/privacidade" className="hover:text-white">Privacidade</Link></li>
            <li><Link to="/lgpd" className="hover:text-white">LGPD</Link></li>
          </ul>
        </div>

      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto max-w-7xl px-6 py-3 text-xs text-white/60 flex flex-col md:flex-row gap-2 md:justify-between items-center">
          <span>© {new Date().getFullYear()} ArqHub</span>
          <Link to="/entrar/$role" params={{ role: "admin" }} className="text-[10px] text-white/40 hover:text-white/70 transition-colors">
            Acesso restrito
          </Link>
        </div>
      </div>
    </footer>
  );
}
