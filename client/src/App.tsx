import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { AccessibilityToolbar } from "./components/AccessibilityToolbar";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ParticipantProvider } from "./contexts/ParticipantContext";
import Home from "./pages/Home";
import Sobre from "./pages/Sobre";
import NossoProjeto from "./pages/NossoProjeto";
import Formare from "./pages/Formare";
import HistoriaCummins from "./pages/HistoriaCummins";
import Galeria from "./pages/Galeria";
import Jogos from "./pages/Jogos";
import Ranking from "./pages/Ranking";
import MeuProgresso from "./pages/MeuProgresso";
const Admin = lazy(() => import("./pages/Admin"));
const Projeto3D = lazy(() => import("./pages/Projeto3D"));
import { SiteFooter } from "./components/SiteFooter";
import { MobileStartBar } from "./components/MobileStartBar";

const pageTitles: Record<string, string> = {
  "/": "Início",
  "/sobre": "Sobre a Cummins",
  "/nosso-projeto": "Nosso projeto",
  "/projeto": "Nosso projeto",
  "/formare": "Formare",
  "/historia-cummins": "História da Cummins",
  "/galeria": "Galeria de fotos",
  "/projeto-3d": "Projeto 3D MS-120",
  "/jogos": "Jogos",
  "/ranking": "Ranking",
  "/meu-progresso": "Meu progresso",
  "/admin": "Painel administrativo",
};

function RouteEffects() {
  const [location] = useLocation();
  const pageTitle = pageTitles[location] ?? "Página não encontrada";

  useEffect(() => {
    document.title = `${pageTitle} | SIPAT Cummins`;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location, pageTitle]);

  return <span className="sr-only" role="status" aria-live="polite">Página carregada: {pageTitle}</span>;
}

function Router() {
  const [location] = useLocation();
  return (
    <div key={location} className="page-transition">
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sobre" component={Sobre} />
      <Route path="/nosso-projeto" component={NossoProjeto} />
      <Route path="/projeto" component={NossoProjeto} />
      <Route path="/formare" component={Formare} />
      <Route path="/historia-cummins" component={HistoriaCummins} />
      <Route path="/galeria" component={Galeria} />
      <Route path="/projeto-3d" component={Projeto3D} />
      <Route path="/jogos" component={Jogos} />
      <Route path="/ranking" component={Ranking} />
      <Route path="/meu-progresso" component={MeuProgresso} />
      <Route path="/admin" component={Admin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </div>
  );
}

function RouteLoading() {
  return <div className="flex min-h-[50vh] items-center justify-center bg-[#0d0f13] px-6 text-center text-sm text-slate-300" role="status" aria-live="polite">Carregando esta experiência…</div>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AccessibilityProvider>
          <ParticipantProvider>
            <TooltipProvider>
              <a href="#conteudo-principal" className="skip-link">Pular para o conteúdo principal</a>
              <RouteEffects />
              <Toaster position="top-right" richColors closeButton />
              <div id="conteudo-principal" tabIndex={-1}>
                <Suspense fallback={<RouteLoading />}><Router /></Suspense>
              </div>
              <SiteFooter />
              <MobileStartBar />
              <AccessibilityToolbar />
            </TooltipProvider>
          </ParticipantProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
