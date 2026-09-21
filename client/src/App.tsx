import { useEffect } from "react";
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
import Jogos from "./pages/Jogos";
import Ranking from "./pages/Ranking";
import MeuProgresso from "./pages/MeuProgresso";
import Admin from "./pages/Admin";
import Projeto3D from "./pages/Projeto3D";
import { SiteFooter } from "./components/SiteFooter";

const pageTitles: Record<string, string> = {
  "/": "Início",
  "/sobre": "Sobre a Cummins",
  "/nosso-projeto": "Nosso projeto",
  "/projeto": "Nosso projeto",
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
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sobre" component={Sobre} />
      <Route path="/nosso-projeto" component={NossoProjeto} />
      <Route path="/projeto" component={NossoProjeto} />
      <Route path="/projeto-3d" component={Projeto3D} />
      <Route path="/jogos" component={Jogos} />
      <Route path="/ranking" component={Ranking} />
      <Route path="/meu-progresso" component={MeuProgresso} />
      <Route path="/admin" component={Admin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
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
                <Router />
              </div>
              <SiteFooter />
              <AccessibilityToolbar />
            </TooltipProvider>
          </ParticipantProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
