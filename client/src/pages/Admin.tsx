import React, { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { 
  Lock, 
  ShieldAlert, 
  Users, 
  HelpCircle, 
  Trophy, 
  Gamepad2, 
  LayoutDashboard, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Crosshair,
  GripVertical,
  Tags,
  ImageIcon,
  CalendarDays,
  Save,
  Upload,
  Link2,
  Eye,
  HeartHandshake,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import SpotErrorGame from "@/components/SpotErrorGame";

const toSaoPauloInput = (value: Date | string | number) => new Date(value).toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T").slice(0, 16);
const fromSaoPauloInput = (value: string) => new Date(`${value}:00-03:00`).toISOString();
const readImageAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Não foi possível ler o arquivo.")); reader.readAsDataURL(file); });

type EditorHotspot = {
  id: number;
  title: string;
  description: string;
  hint?: string | null;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tolerance: number;
  shape: "retangulo" | "circulo" | "poligono";
  points?: string | null;
  active: boolean;
};

type EditorPoint = { x: number; y: number };

const parseEditorPoints = (value?: string | null): EditorPoint[] => {
  if (!value) return [];
  try {
    const points = JSON.parse(value) as EditorPoint[];
    return Array.isArray(points) ? points.filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y)) : [];
  } catch {
    return [];
  }
};

export default function Admin() {
  const [adminKey, setAdminKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard");

  // Admin search states
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerTypeFilter, setPlayerTypeFilter] = useState<"todos" | "cummins" | "terceiro" | "visitante">("todos");
  const [resultSearch, setResultSearch] = useState("");
  const [muralStatusFilter, setMuralStatusFilter] = useState<"todos" | "pendente" | "aprovada" | "rejeitada" | "arquivada">("todos");
  const [muralSearch, setMuralSearch] = useState("");
  const [editingMuralId, setEditingMuralId] = useState<number | null>(null);
  const [editingMuralText, setEditingMuralText] = useState("");

  // Ache o Erro editor state
  const [hotspotTitle, setHotspotTitle] = useState("");
  const [hotspotDescription, setHotspotDescription] = useState("");
  const [hotspotHint, setHotspotHint] = useState("");
  const [hotspotCategory, setHotspotCategory] = useState("Organização");
  const [hotspotX, setHotspotX] = useState(50);
  const [hotspotY, setHotspotY] = useState(50);
  const [hotspotWidth, setHotspotWidth] = useState(18);
  const [hotspotHeight, setHotspotHeight] = useState(18);
  const [hotspotTolerance, setHotspotTolerance] = useState(4);
  const [hotspotShape, setHotspotShape] = useState<"retangulo" | "circulo" | "poligono">("retangulo");
  const [hotspotPoints, setHotspotPoints] = useState("");
  const [editingHotspotId, setEditingHotspotId] = useState<number | null>(null);
  const [spotScenarioKey, setSpotScenarioKey] = useState("cdbs-v4-montagem-2026");
  const [editorHotspots, setEditorHotspots] = useState<EditorHotspot[]>([]);
  const [selectedEditorHotspotId, setSelectedEditorHotspotId] = useState<number | null>(null);
  const [editorZoom, setEditorZoom] = useState(1);
  const [previewDifficulty, setPreviewDifficulty] = useState<"facil" | "medio" | "dificil" | "muito_dificil">("medio");
  const [editorPreviewOpen, setEditorPreviewOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInteraction = useRef<{ mode: "move" | "resize" | "point"; id: number; handle?: string; pointIndex?: number; startX: number; startY: number; origin: EditorHotspot } | null>(null);
  const [accessDraft, setAccessDraft] = useState<Record<string, { start: string; end: string }>>({});
  const [imageScenarioKey, setImageScenarioKey] = useState("");
  const [imageLabel, setImageLabel] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [safeImageUrl, setSafeImageUrl] = useState("");
  const [imageUploadBusy, setImageUploadBusy] = useState<"safe" | "errors" | null>(null);
  const [imageSourceUrl, setImageSourceUrl] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [imageDifficulty, setImageDifficulty] = useState<"facil" | "medio" | "dificil" | "muito_dificil">("facil");
  const [imageTimeSeconds, setImageTimeSeconds] = useState(180);
  const [imageHintCount, setImageHintCount] = useState(2);
  const [imageHintCost, setImageHintCost] = useState(5);
  const [imageWrongPenalty, setImageWrongPenalty] = useState(0);
  const [imagePhaseMode, setImagePhaseMode] = useState<"livres" | "sequenciais">("livres");
  const [imageActive, setImageActive] = useState(true);
  const [editingScenarioKey, setEditingScenarioKey] = useState<string | null>(null);

  // Edit / Add Question Modal states
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [qGameType, setQGameType] = useState<"quiz_seguranca" | "quiz_ergonomia">("quiz_seguranca");
  const [qText, setQText] = useState("");
  const [qOptA, setQOptA] = useState("");
  const [qOptB, setQOptB] = useState("");
  const [qOptC, setQOptC] = useState("");
  const [qOptD, setQOptD] = useState("");
  const [qCorrect, setQCorrect] = useState<"A" | "B" | "C" | "D">("A");
  const [qExplanation, setQExplanation] = useState("");
  const [qTheme, setQTheme] = useState("Segurança Industrial");
  const [qDifficulty, setQDifficulty] = useState<"facil" | "medio" | "dificil">("facil");
  const [draggedOption, setDraggedOption] = useState<"A" | "B" | "C" | "D" | null>(null);

  // Edit participant modal state
  const [editPlayerOpen, setEditPlayerOpen] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editPlayerName, setEditPlayerName] = useState("");
  const [editPlayerChapa, setEditPlayerChapa] = useState("");
  const [editPlayerWwid, setEditPlayerWwid] = useState("");
  const [editPlayerScore, setEditPlayerScore] = useState<number>(0);

  // Queries
  const utils = trpc.useUtils();
  const verifyKeyMutation = trpc.admin.verifyKey.useMutation();

  const dashboardQuery = trpc.admin.dashboardStats.useQuery(
    { adminKey },
    { enabled: isAuthenticated, retry: false }
  );

  const participantsQuery = trpc.admin.listParticipants.useQuery(
    { adminKey, search: playerSearch, participantType: playerTypeFilter === "todos" ? undefined : playerTypeFilter },
    { enabled: isAuthenticated, retry: false }
  );

  const questionsQuery = trpc.admin.listQuestions.useQuery(
    { adminKey },
    { enabled: isAuthenticated, retry: false }
  );

  const resultsQuery = trpc.admin.listResults.useQuery(
    { adminKey, search: resultSearch },
    { enabled: isAuthenticated, retry: false }
  );

  const gameSettingsQuery = trpc.games.getSettings.useQuery();
  const scenarioCatalogQuery = trpc.games.getScenarioCatalog.useQuery();
  const hotspotsQuery = trpc.admin.listSpotErrorHotspots.useQuery(
    { adminKey, scenarioKey: spotScenarioKey },
    { enabled: isAuthenticated, retry: false }
  );
  const scenarioImagesQuery = trpc.admin.listScenarioImages.useQuery(
    { adminKey },
    { enabled: isAuthenticated, retry: false }
  );
  const muralMessagesQuery = trpc.admin.listMuralMessages.useQuery(
    { adminKey, status: muralStatusFilter === "todos" ? undefined : muralStatusFilter, search: muralSearch },
    { enabled: isAuthenticated, retry: false }
  );

  useEffect(() => {
    setEditorHotspots((hotspotsQuery.data || []).slice(0, 15).map((hotspot) => ({
      id: hotspot.id,
      title: hotspot.title,
      description: hotspot.description,
      hint: hotspot.hint,
      category: hotspot.category,
      x: hotspot.x,
      y: hotspot.y,
      width: hotspot.width || 14,
      height: hotspot.height || 13,
      tolerance: hotspot.tolerance || 3,
      shape: (hotspot.shape as EditorHotspot["shape"]) || "retangulo",
      points: hotspot.points,
      active: hotspot.active,
    })));
  }, [hotspotsQuery.data]);

  // Mutations
  const updatePlayerMutation = trpc.admin.updateParticipant.useMutation({
    onSuccess: () => {
      toast.success("Participante atualizado com sucesso!");
      setEditPlayerOpen(false);
      utils.admin.listParticipants.invalidate();
      utils.admin.dashboardStats.invalidate();
      utils.ranking.list.invalidate();
    },
  });

  const deletePlayerMutation = trpc.admin.deleteParticipant.useMutation({
    onSuccess: () => {
      toast.success("Participante e seus resultados excluídos!");
      utils.admin.listParticipants.invalidate();
      utils.admin.dashboardStats.invalidate();
      utils.ranking.list.invalidate();
    },
  });

  const moderateMuralMutation = trpc.admin.moderateMuralMessage.useMutation({
    onSuccess: () => {
      toast.success("Ação de moderação aplicada com sucesso!");
      utils.admin.listMuralMessages.invalidate();
      utils.mural.listApproved.invalidate();
      utils.mural.getFeatured.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao moderar a mensagem.");
    },
  });

  const editMuralTextMutation = trpc.admin.editMuralMessageText.useMutation({
    onSuccess: () => {
      toast.success("Texto da mensagem atualizado com sucesso!");
      setEditingMuralId(null);
      utils.admin.listMuralMessages.invalidate();
      utils.mural.listApproved.invalidate();
      utils.mural.getFeatured.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao editar mensagem.");
    },
  });

  const deleteMuralMutation = trpc.admin.deleteMuralMessage.useMutation({
    onSuccess: () => {
      toast.success("Mensagem do mural excluída definitivamente.");
      utils.admin.listMuralMessages.invalidate();
      utils.mural.listApproved.invalidate();
      utils.mural.getFeatured.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao excluir mensagem.");
    },
  });

  const createQuestionMutation = trpc.admin.createQuestion.useMutation({
    onSuccess: () => {
      toast.success("Pergunta criada com sucesso!");
      setQuestionModalOpen(false);
      utils.admin.listQuestions.invalidate();
    },
  });

  const updateQuestionMutation = trpc.admin.updateQuestion.useMutation({
    onSuccess: () => {
      toast.success("Pergunta atualizada com sucesso!");
      setQuestionModalOpen(false);
      utils.admin.listQuestions.invalidate();
    },
  });

  const deleteQuestionMutation = trpc.admin.deleteQuestion.useMutation({
    onSuccess: () => {
      toast.success("Pergunta excluída!");
      utils.admin.listQuestions.invalidate();
    },
  });

  const deleteResultMutation = trpc.admin.deleteResult.useMutation({
    onSuccess: () => {
      toast.success("Resultado excluído e ranking recalculado!");
      utils.admin.listResults.invalidate();
      utils.admin.listParticipants.invalidate();
      utils.admin.dashboardStats.invalidate();
      utils.ranking.list.invalidate();
    },
  });

  const toggleGameMutation = trpc.admin.toggleGameStatus.useMutation({
    onSuccess: () => {
      toast.success("Status do jogo atualizado!");
      utils.games.getSettings.invalidate();
    },
  });

  const createHotspotMutation = trpc.admin.createSpotErrorHotspot.useMutation({
    onSuccess: () => {
      toast.success("Botão de erro adicionado à cena!");
      setHotspotTitle(""); setHotspotDescription("");
      hotspotsQuery.refetch();
    },
  });

  const deleteHotspotMutation = trpc.admin.deleteSpotErrorHotspot.useMutation({
    onSuccess: () => { toast.success("Botão de erro removido."); hotspotsQuery.refetch(); },
  });

  const toggleHotspotMutation = trpc.admin.updateSpotErrorHotspot.useMutation({
    onSuccess: () => { toast.success("Botão atualizado."); hotspotsQuery.refetch(); },
  });
  const updateHotspotMutation = trpc.admin.updateSpotErrorHotspot.useMutation({
    onSuccess: () => { toast.success("Área de interação atualizada."); setEditingHotspotId(null); hotspotsQuery.refetch(); },
    onError: (error) => toast.error(error.message),
  });

  const updateGameAccessMutation = trpc.admin.updateGameAccess.useMutation({
    onSuccess: () => { toast.success("Janela de acesso atualizada."); utils.games.getSettings.invalidate(); },
    onError: (error) => toast.error(error.message),
  });

  const resetScenarioForm = () => {
    setEditingScenarioKey(null);
    setImageScenarioKey("");
    setImageLabel("");
    setImageUrl("");
    setSafeImageUrl("");
    setImageSourceUrl("");
    setImageDescription("");
    setImageDifficulty("facil");
    setImageTimeSeconds(180);
    setImageHintCount(2);
    setImageHintCost(5);
    setImageWrongPenalty(0);
    setImagePhaseMode("livres");
    setImageActive(true);
    setImageUploadBusy(null);
  };

  const normalizeScenarioKey = (value: string) => value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  const editScenario = (scenario: any) => {
    setEditingScenarioKey(scenario.scenarioKey);
    setImageScenarioKey(scenario.scenarioKey);
    setImageLabel(scenario.label || "");
    setImageUrl(scenario.imageUrl || "");
    setSafeImageUrl(scenario.safeImageUrl || "");
    setImageSourceUrl(scenario.sourceUrl || "");
    setImageDescription(scenario.description || "");
    setImageDifficulty(scenario.difficulty || "facil");
    setImageTimeSeconds(scenario.timeSeconds || 180);
    setImageHintCount(scenario.hintCount || 0);
    setImageHintCost(scenario.hintCost || 0);
    setImageWrongPenalty(scenario.wrongClickPenalty || 0);
    setImagePhaseMode(scenario.phaseMode || "livres");
    setImageActive(Boolean(scenario.active));
    setSpotScenarioKey(scenario.scenarioKey);
    setActiveTab("imagens");
  };

  const handleScenarioSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const scenarioKey = editingScenarioKey || normalizeScenarioKey(imageScenarioKey);
    if (!scenarioKey || scenarioKey.length < 3) {
      toast.error("Informe uma chave com pelo menos 3 caracteres: letras minúsculas, números e hífens.");
      return;
    }
    if (!imageLabel.trim() || !imageUrl.trim() || !safeImageUrl.trim()) {
      toast.error("Informe o nome e envie as duas fotos: cena com erros e cena segura.");
      return;
    }
    const payload = {
      adminKey,
      scenarioKey,
      label: imageLabel.trim(),
      imageUrl: imageUrl.trim(),
      safeImageUrl: safeImageUrl.trim(),
      sourceUrl: imageSourceUrl.trim() || undefined,
      description: imageDescription.trim() || undefined,
      difficulty: imageDifficulty,
      timeSeconds: imageTimeSeconds,
      hintCount: imageHintCount,
      hintCost: imageHintCost,
      wrongClickPenalty: imageWrongPenalty,
      phaseMode: imagePhaseMode,
      active: imageActive,
    };
    if (editingScenarioKey) {
      updateScenarioImageMutation.mutate(payload);
    } else {
      createScenarioImageMutation.mutate(payload);
    }
  };

  const createScenarioImageMutation = trpc.admin.createScenarioImage.useMutation({
    onSuccess: () => {
      toast.success("Cenário cadastrado no catálogo CDBS!");
      setSpotScenarioKey(imageScenarioKey);
      resetScenarioForm();
      scenarioImagesQuery.refetch();
      scenarioCatalogQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const updateScenarioImageMutation = trpc.admin.updateScenarioImage.useMutation({
    onSuccess: () => {
      toast.success("Cenário atualizado com sucesso!");
      setSpotScenarioKey(imageScenarioKey);
      resetScenarioForm();
      scenarioImagesQuery.refetch();
      scenarioCatalogQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const uploadScenarioAssetMutation = trpc.admin.uploadScenarioAsset.useMutation({
    onSuccess: (data, variables) => { if (variables.kind === "safe") setSafeImageUrl(data.url); else setImageUrl(data.url); setImageUploadBusy(null); toast.success(`Imagem ${variables.kind === "safe" ? "segura" : "com erros"} enviada.`); },
    onError: (error) => { setImageUploadBusy(null); toast.error(error.message); },
  });
  const deleteScenarioImageMutation = trpc.admin.deleteScenarioImage.useMutation({
    onSuccess: () => { toast.success("Imagem removida do catálogo."); scenarioImagesQuery.refetch(); },
    onError: (error) => toast.error(error.message),
  });
  const deleteScenarioMutation = trpc.admin.deleteScenario.useMutation({
    onSuccess: (_data, variables) => {
      toast.success("Fase, imagens e áreas clicáveis removidas.");
      scenarioImagesQuery.refetch();
      scenarioCatalogQuery.refetch();
      hotspotsQuery.refetch();
      if (spotScenarioKey === variables.scenarioKey) {
        setEditorHotspots([]);
        setSelectedEditorHotspotId(null);
      }
      if (editingScenarioKey === variables.scenarioKey) resetScenarioForm();
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (!gameSettingsQuery.data) return;
    setAccessDraft((current) => {
      const next = { ...current };
      for (const game of gameSettingsQuery.data) {
        if (!next[game.gameKey]) {
            next[game.gameKey] = {
              start: game.accessStartAt ? toSaoPauloInput(game.accessStartAt) : "",
              end: game.accessEndAt ? toSaoPauloInput(game.accessEndAt) : "",
          };
        }
      }
      return next;
    });
  }, [gameSettingsQuery.data]);

  const handleHotspotImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHotspotX(Math.round(((event.clientX - rect.left) / rect.width) * 100));
    setHotspotY(Math.round(((event.clientY - rect.top) / rect.height) * 100));
  };

  const selectEditorHotspot = (hotspot: EditorHotspot) => {
    setSelectedEditorHotspotId(hotspot.id);
    setEditingHotspotId(hotspot.id);
    setHotspotTitle(hotspot.title);
    setHotspotDescription(hotspot.description);
    setHotspotHint(hotspot.hint || "");
    setHotspotCategory(hotspot.category);
    setHotspotX(hotspot.x);
    setHotspotY(hotspot.y);
    setHotspotWidth(hotspot.width);
    setHotspotHeight(hotspot.height);
    setHotspotTolerance(hotspot.tolerance);
    setHotspotShape(hotspot.shape);
    setHotspotPoints(hotspot.points || "");
  };

  const beginEditorInteraction = (event: React.PointerEvent, hotspot: EditorHotspot, mode: "move" | "resize" | "point", handle?: string, pointIndex?: number) => {
    event.stopPropagation();
    event.preventDefault();
    selectEditorHotspot(hotspot);
    editorInteraction.current = { mode, id: hotspot.id, handle, pointIndex, startX: event.clientX, startY: event.clientY, origin: { ...hotspot } };
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  };

  const updateEditorInteraction = (event: React.PointerEvent) => {
    const interaction = editorInteraction.current;
    const canvas = editorRef.current;
    if (!interaction || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dx = ((event.clientX - interaction.startX) / rect.width / editorZoom) * 100;
    const dy = ((event.clientY - interaction.startY) / rect.height / editorZoom) * 100;
    const origin = interaction.origin;
    setEditorHotspots((current) => current.map((hotspot) => {
      if (hotspot.id !== interaction.id) return hotspot;
      if (interaction.mode === "point") {
        const points = parseEditorPoints(origin.points);
        const index = interaction.pointIndex ?? -1;
        if (!points[index]) return hotspot;
        points[index] = { x: Math.max(0, Math.min(100, points[index].x + dx)), y: Math.max(0, Math.min(100, points[index].y + dy)) };
        setHotspotPoints(JSON.stringify(points));
        return { ...hotspot, points: JSON.stringify(points) };
      }
      if (interaction.mode === "move") {
        return { ...hotspot, x: Math.max(origin.width / 2, Math.min(100 - origin.width / 2, origin.x + dx)), y: Math.max(origin.height / 2, Math.min(100 - origin.height / 2, origin.y + dy)) };
      }
      const handle = interaction.handle || "se";
      const left = origin.x - origin.width / 2;
      const right = origin.x + origin.width / 2;
      const top = origin.y - origin.height / 2;
      const bottom = origin.y + origin.height / 2;
      const nextLeft = handle.includes("w") ? Math.min(right - 0.1, Math.max(0, left + dx)) : left;
      const nextRight = handle.includes("e") ? Math.max(left + 0.1, Math.min(100, right + dx)) : right;
      const nextTop = handle.includes("n") ? Math.min(bottom - 0.1, Math.max(0, top + dy)) : top;
      const nextBottom = handle.includes("s") ? Math.max(top + 0.1, Math.min(100, bottom + dy)) : bottom;
      return { ...hotspot, x: (nextLeft + nextRight) / 2, y: (nextTop + nextBottom) / 2, width: nextRight - nextLeft, height: nextBottom - nextTop };
    }));
  };

  const endEditorInteraction = () => { editorInteraction.current = null; };

  const saveVisualHotspots = async () => {
    try {
      await Promise.all(editorHotspots.map((hotspot) => {
        const data = { adminKey, scenarioKey: spotScenarioKey, title: hotspot.title, description: hotspot.description, hint: hotspot.hint || undefined, category: hotspot.category, x: Number(hotspot.x.toFixed(3)), y: Number(hotspot.y.toFixed(3)), width: Number(hotspot.width.toFixed(3)), height: Number(hotspot.height.toFixed(3)), tolerance: Math.min(2, Number(hotspot.tolerance.toFixed(3))), shape: hotspot.shape, points: hotspot.points || undefined };
        return hotspot.id < 0 ? createHotspotMutation.mutateAsync(data) : updateHotspotMutation.mutateAsync({ ...data, id: hotspot.id, active: hotspot.active });
      }));
      toast.success("Posições e tamanhos salvos na fase!");
      await hotspotsQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a fase.");
    }
  };

  const addVisualHotspot = () => {
    const id = -Date.now();
    const draft: EditorHotspot = { id, title: "Novo erro", description: "Descreva o risco e a ação segura.", hint: "Observe atentamente esta região da cena.", category: "Segurança", x: 50, y: 50, width: 16, height: 16, tolerance: 4, shape: "retangulo", active: true };
    setEditorHotspots((current) => [...current, draft]);
    setSelectedEditorHotspotId(id);
    setEditingHotspotId(id);
    selectEditorHotspot(draft);
    toast.info("Quadrado criado. Arraste-o até o risco, redimensione e salve.");
  };

  const removeVisualHotspot = (hotspot: EditorHotspot) => {
    if (!confirm(`Remover a área clicável "${hotspot.title || "sem nome"}" desta fase?`)) return;
    setEditorHotspots((current) => current.filter((item) => item.id !== hotspot.id));
    if (selectedEditorHotspotId === hotspot.id) {
      setSelectedEditorHotspotId(null);
      setEditingHotspotId(null);
    }
    if (hotspot.id >= 0) deleteHotspotMutation.mutate({ adminKey, id: hotspot.id });
    else toast.success("Área clicável removida do rascunho.");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = inputKey.trim();
    if (!cleanKey) {
      toast.error("Informe a credencial administrativa para continuar.");
      return;
    }
    verifyKeyMutation.mutate(
      { adminKey: cleanKey },
      {
        onSuccess: (data) => {
          if (data.isValid) {
            setAdminKey(cleanKey);
            setIsAuthenticated(true);
            toast.success("Acesso administrativo autorizado!");
          } else {
            toast.error("Chave de segurança administrativa inválida!");
          }
        },
      }
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("cummins_admin_token");
    setAdminKey("");
    setIsAuthenticated(false);
    toast.info("Sessão administrativa encerrada.");
  };

  const openNewQuestionModal = () => {
    setEditingQuestionId(null);
    setQGameType("quiz_seguranca");
    setQText("");
    setQOptA("");
    setQOptB("");
    setQOptC("");
    setQOptD("");
    setQCorrect("A");
    setQExplanation("");
    setQTheme("Segurança Industrial");
    setQDifficulty("facil");
    setQuestionModalOpen(true);
  };

  const openEditQuestionModal = (q: any) => {
    setEditingQuestionId(q.id);
    setQGameType(q.gameType);
    setQText(q.question);
    setQOptA(q.optionA);
    setQOptB(q.optionB);
    setQOptC(q.optionC);
    setQOptD(q.optionD);
    setQCorrect(q.correctOption);
    setQExplanation(q.explanation || "");
    setQTheme(q.theme);
    setQDifficulty(q.difficulty);
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || !qOptA.trim() || !qOptB.trim()) {
      toast.error("Preencha todos os campos obrigatórios da pergunta.");
      return;
    }

    if (editingQuestionId) {
      updateQuestionMutation.mutate({
        adminKey,
        id: editingQuestionId,
        question: qText,
        optionA: qOptA,
        optionB: qOptB,
        optionC: qOptC,
        optionD: qOptD,
        correctOption: qCorrect,
        explanation: qExplanation,
        theme: qTheme,
        difficulty: qDifficulty,
      });
    } else {
      createQuestionMutation.mutate({
        adminKey,
        gameType: qGameType,
        question: qText,
        optionA: qOptA,
        optionB: qOptB,
        optionC: qOptC,
        optionD: qOptD,
        correctOption: qCorrect,
        explanation: qExplanation,
        theme: qTheme,
        difficulty: qDifficulty,
      });
    }
  };

  const swapQuestionOptions = (from: "A" | "B" | "C" | "D", to: "A" | "B" | "C" | "D") => {
    if (from === to) return;
    const values = { A: qOptA, B: qOptB, C: qOptC, D: qOptD };
    const next = { ...values, [from]: values[to], [to]: values[from] };
    setQOptA(next.A); setQOptB(next.B); setQOptC(next.C); setQOptD(next.D);
    if (qCorrect === from) setQCorrect(to);
    else if (qCorrect === to) setQCorrect(from);
    setDraggedOption(null);
  };

  // If not authenticated, show protected login gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d0f13] text-slate-100 flex flex-col selection:bg-[#da291c] selection:text-white">
        <Navbar />

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-8 rounded-2xl bg-[#141822] border-2 border-white/10 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 mb-2">
                <Lock className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#da291c] uppercase">
                ACESSO RESTRITO • CUMMINS EHS
              </span>
              <h1 className="text-2xl font-black font-industrial uppercase text-white">
                PAINEL ADMINISTRATIVO
              </h1>
              <p className="text-xs text-slate-400">
                Esta área é restrita a gestores autorizados da SIPAT. Usuários comuns não possuem permissão de acesso.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div className="space-y-1.5">
                <Label htmlFor="admin-access-key" className="text-xs text-slate-300 font-semibold">
                  Chave Mestra de Acesso
                </Label>
                <Input
                  id="admin-access-key"
                  name="admin-access-key"
                  type="password"
                  placeholder="Informe a chave de segurança..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  autoComplete="new-password"
                  aria-describedby="admin-access-help"
                  className="bg-black/50 border-white/15 text-white placeholder:text-slate-600 focus:border-amber-400"
                />
              </div>

              <div id="admin-access-help" className="p-3 rounded bg-white/5 border border-white/10 text-[11px] text-slate-400">
                A credencial é validada exclusivamente no servidor e não é exibida, armazenada ou incluída em mensagens públicas.
              </div>

              <Button
                type="submit"
                disabled={verifyKeyMutation.isPending}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase tracking-wider text-xs py-6"
              >
                {verifyKeyMutation.isPending ? "Autenticando..." : "Desbloquear Painel"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const dStats = dashboardQuery.data;

  return (
    <div className="min-h-screen bg-[#0d0f13] text-slate-100 flex flex-col selection:bg-[#da291c] selection:text-white">
      <Navbar />

      {/* Admin Top Header */}
      <section className="border-b border-white/10 bg-[#141822] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                MODO GESTOR ATIVO • CUMMINS EHS OSASCO
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-industrial uppercase text-white mt-1">
              PAINEL DE CONTROLE SIPAT
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-300 hover:bg-red-950/40 text-xs font-bold uppercase"
            >
              Bloquear & Sair
            </Button>
          </div>
        </div>
      </section>

      {/* Admin Content Tabs */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#181d28] border border-white/10 p-1 rounded-xl flex flex-wrap h-auto">
            <TabsTrigger value="dashboard" className="text-xs font-bold uppercase flex items-center gap-1.5 data-[state=active]:bg-[#da291c] data-[state=active]:text-white">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="jogadores" className="text-xs font-bold uppercase flex items-center gap-1.5 data-[state=active]:bg-[#da291c] data-[state=active]:text-white">
              <Users className="w-3.5 h-3.5" /> Gerenciar Jogadores
            </TabsTrigger>
            <TabsTrigger value="perguntas" className="text-xs font-bold uppercase flex items-center gap-1.5 data-[state=active]:bg-[#da291c] data-[state=active]:text-white">
              <HelpCircle className="w-3.5 h-3.5" /> Gerenciar Perguntas
            </TabsTrigger>
            <TabsTrigger value="ranking" className="text-xs font-bold uppercase flex items-center gap-1.5 data-[state=active]:bg-[#da291c] data-[state=active]:text-white">
              <Trophy className="w-3.5 h-3.5" /> Gerenciar Ranking
            </TabsTrigger>
            <TabsTrigger value="jogos" className="text-xs font-bold uppercase flex items-center gap-1.5 data-[state=active]:bg-[#da291c] data-[state=active]:text-white">
              <Gamepad2 className="w-3.5 h-3.5" /> Gerenciar Jogos
            </TabsTrigger>
            <TabsTrigger value="categorias" className="text-xs font-bold uppercase flex items-center gap-1.5 data-[state=active]:bg-[#da291c] data-[state=active]:text-white">
              <Tags className="w-3.5 h-3.5" /> Categorias
            </TabsTrigger>
            <TabsTrigger value="imagens" className="text-xs font-bold uppercase flex items-center gap-1.5 data-[state=active]:bg-[#da291c] data-[state=active]:text-white">
              <ImageIcon className="w-3.5 h-3.5" /> Imagens
            </TabsTrigger>
            <TabsTrigger value="ache-o-erro" className="text-xs font-bold uppercase flex items-center gap-1.5 data-[state=active]:bg-[#da291c] data-[state=active]:text-white">
              <Crosshair className="w-3.5 h-3.5" /> Botões Ache o Erro
            </TabsTrigger>
            <TabsTrigger value="acesso" className="text-xs font-bold uppercase flex items-center gap-1.5 data-[state=active]:bg-[#da291c] data-[state=active]:text-white">
              <CalendarDays className="w-3.5 h-3.5" /> Acesso do Evento
            </TabsTrigger>
            <TabsTrigger value="mural" className="text-xs font-bold uppercase flex items-center gap-1.5 data-[state=active]:bg-[#da291c] data-[state=active]:text-white">
              <HeartHandshake className="w-3.5 h-3.5" /> Moderação Mural
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DASHBOARD METRICS (PROMPT SECTION 23) */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-[#141822] border border-white/10">
                <div className="text-xs font-mono text-slate-400 uppercase">Total de Participantes</div>
                <div className="text-3xl font-black font-industrial text-white mt-1">
                  {dStats?.totalParticipants || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Colaboradores registrados</div>
              </div>

              <div className="p-5 rounded-xl bg-[#141822] border border-white/10">
                <div className="text-xs font-mono text-slate-400 uppercase">Total de Partidas</div>
                <div className="text-3xl font-black font-industrial text-amber-400 mt-1">
                  {dStats?.totalMatches || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Jogos concluídos</div>
              </div>

              <div className="p-5 rounded-xl bg-[#141822] border border-white/10">
                <div className="text-xs font-mono text-slate-400 uppercase">Quizzes Realizados</div>
                <div className="text-3xl font-black font-industrial text-emerald-400 mt-1">
                  {dStats?.totalQuizzes || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Segurança + Ergonomia</div>
              </div>

              <div className="p-5 rounded-xl bg-[#141822] border border-white/10">
                <div className="text-xs font-mono text-slate-400 uppercase">Jogos Interativos</div>
                <div className="text-3xl font-black font-industrial text-cyan-400 mt-1">
                  {dStats?.totalInteractiveGames || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Ache o Erro + 5S</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-xl bg-[#141822] border border-white/10 md:col-span-2 space-y-3">
                <h3 className="font-industrial font-bold uppercase text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Jogador Líder Atual
                </h3>
                {dStats?.leader ? (
                  <div className="p-4 rounded-xl bg-black/40 border border-amber-500/40 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-white">{dStats.leader.name}</div>
                      <div className="text-xs font-mono text-slate-400">WWID: {dStats.leader.wwid}</div>
                    </div>
                    <div className="text-2xl font-black font-industrial text-amber-400">
                      {dStats.leader.score} pts
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs">Nenhum líder registrado ainda.</div>
                )}
              </div>

              <div className="p-6 rounded-xl bg-[#141822] border border-white/10 space-y-2">
                <div className="text-xs font-mono text-slate-400 uppercase">Desafios 100% Concluídos</div>
                <div className="text-3xl font-black font-industrial text-emerald-400">
                  {dStats?.totalCompletedAll || 0}
                </div>
                <div className="text-xs text-slate-400">
                  Colaboradores que finalizaram todos os 4 desafios SIPAT.
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: GERENCIAR JOGADORES */}
          <TabsContent value="jogadores" className="space-y-4">
            <div className="p-4 rounded-xl bg-[#141822] border border-white/10 flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Pesquisar por nome, chapa ou WWID..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="bg-black/50 border-white/15 text-white"
              />
              <select value={playerTypeFilter} onChange={(e) => setPlayerTypeFilter(e.target.value as "todos" | "cummins" | "terceiro" | "visitante")} className="h-10 rounded-md border border-white/15 bg-black/50 px-3 text-xs font-bold uppercase text-white sm:w-56">
                <option value="todos">Todos os perfis</option>
                <option value="cummins">Funcionários Cummins</option>
                <option value="terceiro">Terceiros</option>
                <option value="visitante">Visitantes</option>
              </select>
            </div>

            <div className="rounded-xl bg-[#141822] border border-white/10 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/40 text-slate-400 font-mono uppercase text-[11px] border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">Perfil</th>
                    <th className="py-3 px-4">Chapa</th>
                    <th className="py-3 px-4">WWID</th>
                    <th className="py-3 px-4">Pontuação Total</th>
                    <th className="py-3 px-4 text-center">Desafios Concluídos</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(participantsQuery.data || []).map((p) => (
                    <tr key={p.id} className="hover:bg-white/5">
                      <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                      <td className="py-3 px-4"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase ${p.participantType === "visitante" ? "border-cyan-400/40 bg-cyan-950/40 text-cyan-300" : p.participantType === "cummins" ? "border-red-400/40 bg-red-950/40 text-red-300" : "border-amber-400/40 bg-amber-950/40 text-amber-300"}`}>{p.participantType === "cummins" ? "Funcionário Cummins" : p.participantType === "visitante" ? "Visitante" : "Terceiro"}</span></td>
                      <td className="py-3 px-4 font-mono text-amber-400">{p.chapa}</td>
                      <td className="py-3 px-4 font-mono text-amber-400">{p.wwid}</td>
                      <td className="py-3 px-4 font-black font-industrial text-[#da291c] text-sm">
                        {p.totalScore} pts
                      </td>
                      <td className="py-3 px-4 text-center">{p.completedGamesCount}/4</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingPlayerId(p.id);
                            setEditPlayerName(p.name);
                            setEditPlayerChapa(p.chapa);
                            setEditPlayerWwid(p.wwid);
                            setEditPlayerScore(p.totalScore);
                            setEditPlayerOpen(true);
                          }}
                          className="h-7 text-xs border-white/20"
                        >
                          <Edit3 className="w-3 h-3 mr-1" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir o participante ${p.name}?`)) {
                              deletePlayerMutation.mutate({ adminKey, id: p.id });
                            }
                          }}
                          className="h-7 text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Excluir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB 3: GERENCIAR PERGUNTAS */}
          <TabsContent value="perguntas" className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-slate-400">
                Banco de Perguntas Ativas: {(questionsQuery.data || []).length} cadastradas
              </span>
              <Button
                onClick={openNewQuestionModal}
                className="bg-[#da291c] hover:bg-[#b01e12] text-white text-xs font-bold uppercase flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Adicionar Pergunta
              </Button>
            </div>

            <div className="space-y-3">
              {(questionsQuery.data || []).map((q) => (
                <div key={q.id} className="p-4 rounded-xl bg-[#141822] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-amber-400 uppercase">
                        {q.gameType === "quiz_seguranca" ? "Segurança" : "Ergonomia"}
                      </span>
                      <span className="text-xs font-mono text-slate-400">Tema: {q.theme}</span>
                      <span className="text-xs font-mono text-slate-500">Dificuldade: {q.difficulty.toUpperCase()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditQuestionModal(q)}
                        className="h-7 text-xs border-white/20"
                      >
                        <Edit3 className="w-3 h-3 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Excluir esta pergunta permanentemente?")) {
                            deleteQuestionMutation.mutate({ adminKey, id: q.id });
                          }
                        }}
                        className="h-7 text-xs"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Excluir
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-white">{q.question}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
                    <div className={`p-2 rounded ${q.correctOption === "A" ? "bg-emerald-950/60 border border-emerald-500 text-emerald-200" : "bg-black/30 text-slate-400"}`}>
                      <strong>A:</strong> {q.optionA}
                    </div>
                    <div className={`p-2 rounded ${q.correctOption === "B" ? "bg-emerald-950/60 border border-emerald-500 text-emerald-200" : "bg-black/30 text-slate-400"}`}>
                      <strong>B:</strong> {q.optionB}
                    </div>
                    <div className={`p-2 rounded ${q.correctOption === "C" ? "bg-emerald-950/60 border border-emerald-500 text-emerald-200" : "bg-black/30 text-slate-400"}`}>
                      <strong>C:</strong> {q.optionC}
                    </div>
                    <div className={`p-2 rounded ${q.correctOption === "D" ? "bg-emerald-950/60 border border-emerald-500 text-emerald-200" : "bg-black/30 text-slate-400"}`}>
                      <strong>D:</strong> {q.optionD}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categorias" className="space-y-5">
            <div className="p-5 rounded-xl bg-[#141822] border border-white/10">
              <div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="font-industrial text-xl font-bold uppercase text-white">Categorias de Perguntas</h2><p className="text-xs text-slate-400 mt-1">Taxonomia sugerida para manter o banco conectado à realidade industrial CDBS.</p></div><Tags className="w-6 h-6 text-amber-400" /></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{["EPI", "Máquinas e Equipamentos", "Montagem", "Oficina e Manutenção", "Logística", "Ergonomia", "5S / Organização", "Movimentação de Materiais", "Segurança Comportamental", "Áreas Administrativas", "Circulação e Sinalização", "Prevenção de Acidentes"].map((category) => <div key={category} className="rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-xs font-bold uppercase text-slate-200"><span className="mr-2 text-[#da291c]">●</span>{category}</div>)}</div>
            </div>
          </TabsContent>

          <TabsContent value="imagens" className="space-y-5">
            <div className="rounded-xl border border-cyan-400/25 bg-cyan-950/20 p-4 text-sm text-cyan-100">
              <div className="flex items-start gap-3">
                <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                <div>
                  <strong className="block font-industrial uppercase tracking-wide">Cenários reais do Ache o Erro</strong>
                  <p className="mt-1 text-xs leading-5 text-cyan-100/75">
                    Cadastre o par da mesma situação: uma foto com os riscos visíveis e outra com a condição segura. Depois, abra “Editar áreas” para desenhar as regiões clicáveis sobre a foto com erros.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#141822] p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-industrial text-xl font-bold uppercase text-white">{editingScenarioKey ? "Editar cenário" : "Novo cenário"}</h2>
                  <p className="mt-1 text-xs text-slate-400">A chave identifica a fase e não pode ser alterada depois que o cenário é criado.</p>
                </div>
                {editingScenarioKey ? <Button type="button" variant="outline" onClick={resetScenarioForm} className="w-fit border-white/20 text-xs text-slate-200"><Plus className="mr-1.5 h-3.5 w-3.5" /> Novo cenário</Button> : null}
              </div>

              <form onSubmit={handleScenarioSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-xs text-slate-300">Chave interna *</Label>
                    <Input
                      value={imageScenarioKey}
                      disabled={Boolean(editingScenarioKey)}
                      onChange={(event) => setImageScenarioKey(normalizeScenarioKey(event.target.value))}
                      placeholder="ex.: cdbs-usinagem-2026"
                      className="mt-1 bg-black/40 border-white/15 font-mono text-white disabled:opacity-60"
                    />
                    <span className="mt-1 block text-[10px] text-slate-500">Use minúsculas, números e hífens.</span>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-300">Nome público do cenário *</Label>
                    <Input value={imageLabel} onChange={(event) => setImageLabel(event.target.value)} placeholder="ex.: Posto de montagem — içamento" className="mt-1 bg-black/40 border-white/15 text-white" />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-red-400/25 bg-red-950/10 p-4">
                    <div className="mb-3 flex items-center gap-2"><Upload className="h-4 w-4 text-red-300" /><div><Label className="text-xs font-black uppercase text-red-200">Foto com erros *</Label><p className="text-[10px] text-red-100/60">É sobre esta imagem que as áreas clicáveis serão desenhadas.</p></div></div>
                    <Input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="URL HTTPS ou envie um arquivo abaixo" className="mb-3 bg-black/40 border-white/15 text-white" />
                    <input type="file" accept="image/png,image/jpeg,image/webp" disabled={!imageScenarioKey || imageUploadBusy !== null} onChange={async (event) => { const file = event.target.files?.[0]; if (!file || !imageScenarioKey) return; if (file.size > 10 * 1024 * 1024) { toast.error("A imagem deve ter no máximo 10 MB."); return; } try { setImageUploadBusy("errors"); const dataUrl = await readImageAsDataUrl(file); uploadScenarioAssetMutation.mutate({ adminKey, scenarioKey: normalizeScenarioKey(imageScenarioKey), kind: "errors", dataUrl }); } catch (error) { setImageUploadBusy(null); toast.error(error instanceof Error ? error.message : "Falha no upload."); } }} className="w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-red-500/20 file:px-3 file:py-2 file:text-xs file:font-bold file:text-red-100" />
                    {imageUploadBusy === "errors" ? <span className="mt-2 block text-[10px] text-amber-300">Enviando foto com erros...</span> : null}
                    {imageUrl ? <img src={imageUrl} alt="Prévia da cena com erros" className="mt-3 aspect-video w-full rounded-lg border border-white/10 bg-black object-contain" /> : <div className="mt-3 flex aspect-video items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/30 text-[10px] text-slate-500">Prévia da foto com erros</div>}
                  </div>

                  <div className="rounded-xl border border-emerald-400/25 bg-emerald-950/10 p-4">
                    <div className="mb-3 flex items-center gap-2"><Upload className="h-4 w-4 text-emerald-300" /><div><Label className="text-xs font-black uppercase text-emerald-200">Foto segura *</Label><p className="text-[10px] text-emerald-100/60">Par correspondente, sem os riscos da situação.</p></div></div>
                    <Input value={safeImageUrl} onChange={(event) => setSafeImageUrl(event.target.value)} placeholder="URL HTTPS ou envie um arquivo abaixo" className="mb-3 bg-black/40 border-white/15 text-white" />
                    <input type="file" accept="image/png,image/jpeg,image/webp" disabled={!imageScenarioKey || imageUploadBusy !== null} onChange={async (event) => { const file = event.target.files?.[0]; if (!file || !imageScenarioKey) return; if (file.size > 10 * 1024 * 1024) { toast.error("A imagem deve ter no máximo 10 MB."); return; } try { setImageUploadBusy("safe"); const dataUrl = await readImageAsDataUrl(file); uploadScenarioAssetMutation.mutate({ adminKey, scenarioKey: normalizeScenarioKey(imageScenarioKey), kind: "safe", dataUrl }); } catch (error) { setImageUploadBusy(null); toast.error(error instanceof Error ? error.message : "Falha no upload."); } }} className="w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500/20 file:px-3 file:py-2 file:text-xs file:font-bold file:text-emerald-100" />
                    {imageUploadBusy === "safe" ? <span className="mt-2 block text-[10px] text-amber-300">Enviando foto segura...</span> : null}
                    {safeImageUrl ? <img src={safeImageUrl} alt="Prévia da cena segura" className="mt-3 aspect-video w-full rounded-lg border border-white/10 bg-black object-contain" /> : <div className="mt-3 flex aspect-video items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/30 text-[10px] text-slate-500">Prévia da foto segura</div>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div><Label className="text-xs text-slate-300">Fonte / autorização da imagem</Label><Input value={imageSourceUrl} onChange={(event) => setImageSourceUrl(event.target.value)} placeholder="https://... (opcional)" className="mt-1 bg-black/40 border-white/15 text-white" /></div>
                  <div><Label className="text-xs text-slate-300">Descrição educativa</Label><textarea value={imageDescription} onChange={(event) => setImageDescription(event.target.value)} placeholder="Contexto do risco, área da planta e orientação de segurança" className="mt-1 min-h-10 w-full rounded-md border border-white/15 bg-black/40 p-2 text-sm text-white placeholder:text-slate-600" /></div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Dificuldade<select value={imageDifficulty} onChange={(event) => setImageDifficulty(event.target.value as typeof imageDifficulty)} className="mt-1 h-10 w-full rounded-md border border-white/15 bg-black/40 px-2 text-sm font-bold text-white"><option value="facil">Fácil</option><option value="medio">Médio</option><option value="dificil">Difícil</option><option value="muito_dificil">Muito difícil</option></select></label>
                  <label className="text-[10px] font-black uppercase text-slate-400">Tempo (s)<Input type="number" min={30} max={900} value={imageTimeSeconds} onChange={(event) => setImageTimeSeconds(Number(event.target.value))} className="mt-1 bg-black/40 border-white/15 text-white" /></label>
                  <label className="text-[10px] font-black uppercase text-slate-400">Dicas<Input type="number" min={0} max={10} value={imageHintCount} onChange={(event) => setImageHintCount(Number(event.target.value))} className="mt-1 bg-black/40 border-white/15 text-white" /></label>
                  <label className="text-[10px] font-black uppercase text-slate-400">Custo dica<Input type="number" min={0} max={100} value={imageHintCost} onChange={(event) => setImageHintCost(Number(event.target.value))} className="mt-1 bg-black/40 border-white/15 text-white" /></label>
                  <label className="text-[10px] font-black uppercase text-slate-400">Penalidade (s)<Input type="number" min={0} max={30} value={imageWrongPenalty} onChange={(event) => setImageWrongPenalty(Number(event.target.value))} className="mt-1 bg-black/40 border-white/15 text-white" /></label>
                </div>
                <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="text-[10px] font-black uppercase text-slate-400">Modo de desbloqueio<select value={imagePhaseMode} onChange={(event) => setImagePhaseMode(event.target.value as typeof imagePhaseMode)} className="mt-1 h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm font-bold text-white"><option value="livres">Todas livres</option><option value="sequenciais">Sequenciais</option></select></label>
                    <label className="flex items-center gap-2 pb-2 text-xs font-bold text-slate-200"><input type="checkbox" checked={imageActive} onChange={(event) => setImageActive(event.target.checked)} className="h-4 w-4 accent-emerald-500" /> Publicar no jogo</label>
                  </div>
                  <Button type="submit" disabled={createScenarioImageMutation.isPending || updateScenarioImageMutation.isPending || imageUploadBusy !== null || !imageScenarioKey || !imageLabel || !imageUrl || !safeImageUrl} className="bg-[#da291c] font-bold uppercase"><Save className="mr-2 h-4 w-4" />{createScenarioImageMutation.isPending || updateScenarioImageMutation.isPending ? "Salvando..." : editingScenarioKey ? "Salvar alterações" : "Cadastrar cenário"}</Button>
                </div>
              </form>
            </div>

            <div className="flex items-center justify-between gap-3"><div><h2 className="font-industrial text-xl font-bold uppercase text-white">Cenários cadastrados</h2><p className="mt-1 text-xs text-slate-400">{(scenarioImagesQuery.data || []).length} fase(s) disponíveis para gerenciamento.</p></div><Button type="button" variant="outline" onClick={() => scenarioImagesQuery.refetch()} className="border-white/20 text-xs text-slate-200">Atualizar lista</Button></div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {(scenarioImagesQuery.data || []).map((scenario) => <article key={scenario.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <div className="grid grid-cols-2 gap-px bg-white/10"><div className="relative aspect-video bg-black"><img src={scenario.imageUrl} alt={`${scenario.label} — com erros`} className="h-full w-full object-cover" /><span className="absolute left-2 top-2 rounded bg-red-600/90 px-2 py-1 text-[9px] font-black uppercase text-white">Com erros</span></div><div className="relative aspect-video bg-black"><img src={scenario.safeImageUrl || scenario.imageUrl} alt={`${scenario.label} — segura`} className="h-full w-full object-cover" /><span className="absolute left-2 top-2 rounded bg-emerald-600/90 px-2 py-1 text-[9px] font-black uppercase text-white">Segura</span></div></div>
                <div className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold uppercase text-white">{scenario.label}</h3><div className="mt-1 font-mono text-[10px] text-cyan-300">{scenario.scenarioKey}</div></div><span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase ${scenario.active ? "border-emerald-400/30 bg-emerald-950/40 text-emerald-300" : "border-slate-500/30 bg-slate-900/40 text-slate-400"}`}>{scenario.active ? "Publicado" : "Rascunho"}</span></div><p className="text-xs leading-5 text-slate-400">{scenario.description || "Sem descrição cadastrada."}</p><div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase text-slate-500"><span>{scenario.difficulty}</span><span>•</span><span>{scenario.timeSeconds}s</span><span>•</span><span>{scenario.hintCount} dicas</span></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" className="h-8 border-white/20 text-[10px]" onClick={() => editScenario(scenario)}><Edit3 className="mr-1 h-3 w-3" /> Editar cenário</Button><Button size="sm" variant="outline" className="h-8 border-cyan-400/30 text-[10px] text-cyan-200" onClick={() => { setSpotScenarioKey(scenario.scenarioKey); setActiveTab("ache-o-erro"); }}><Crosshair className="mr-1 h-3 w-3" /> Editar áreas</Button><Button size="sm" variant="destructive" className="h-8 text-[10px]" disabled={deleteScenarioMutation.isPending} onClick={() => { if (confirm(`Apagar a fase "${scenario.label}"? Isso removerá as duas imagens e todas as áreas clicáveis desta fase. Resultados históricos serão preservados.`)) deleteScenarioMutation.mutate({ adminKey, scenarioKey: scenario.scenarioKey }); }}><Trash2 className="mr-1 h-3 w-3" /> Excluir</Button></div></div>
              </article>)}
            </div>
            {!scenarioImagesQuery.data?.length ? <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-slate-500">Nenhum cenário cadastrado. Comece enviando as duas fotos acima.</div> : null}
          </TabsContent>

          {/* TAB: EDITOR ACHE O ERRO */}
          <TabsContent value="ache-o-erro" className="space-y-5">
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-100">
              <strong className="mb-1 block font-industrial uppercase">Editor visual dos erros</strong>
              Arraste as áreas diretamente sobre o risco. Use os pontos nos cantos para redimensionar, os botões de zoom para ajustar detalhes e salve quando terminar. A mesma hitbox normalizada será usada pelo jogo, sem desenhá-la para o participante.
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#141822] p-4 sm:flex-row sm:items-center">
              <Label className="whitespace-nowrap text-xs text-slate-300">Editar fase</Label>
              <select value={spotScenarioKey} onChange={(event) => { setSpotScenarioKey(event.target.value); setSelectedEditorHotspotId(null); setEditingHotspotId(null); }} className="flex-1 rounded border border-white/15 bg-black/50 p-2 text-xs text-white">
                {(scenarioCatalogQuery.data || []).map((scenario) => <option key={scenario.key} value={scenario.key}>{scenario.label}</option>)}
              </select>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditorZoom((value) => Math.max(1, value - 0.25))} className="border-white/20 text-white">−</Button>
                <span className="min-w-16 self-center text-center font-mono text-xs text-amber-300">{Math.round(editorZoom * 100)}%</span>
                <Button type="button" variant="outline" onClick={() => setEditorZoom((value) => Math.min(4, value + 0.25))} className="border-white/20 text-white">+</Button>
                <select value={previewDifficulty} onChange={(event) => setPreviewDifficulty(event.target.value as typeof previewDifficulty)} className="h-9 rounded-md border border-cyan-400/40 bg-black/40 px-2 text-xs font-bold text-cyan-200"><option value="facil">Teste • 5 erros</option><option value="medio">Teste • 7 erros</option><option value="dificil">Teste • 10 erros</option><option value="muito_dificil">Teste • 15 erros</option></select>
                <Button type="button" variant="outline" onClick={async () => { await saveVisualHotspots(); setEditorPreviewOpen(true); }} className="border-cyan-400/40 text-cyan-200">Testar jogo</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_.65fr]">
              <div className="space-y-3">
                <div ref={editorRef} onPointerMove={updateEditorInteraction} onPointerUp={endEditorInteraction} onPointerCancel={endEditorInteraction} onClick={handleHotspotImageClick} className="relative aspect-video overflow-hidden rounded-xl border-2 border-amber-500/40 bg-black shadow-2xl">
                  <div className="absolute inset-0 origin-center transition-transform duration-150" style={{ transform: `scale(${editorZoom})` }}>
                    {scenarioCatalogQuery.data?.find((scenario) => scenario.key === spotScenarioKey)?.image ? <img src={scenarioCatalogQuery.data.find((scenario) => scenario.key === spotScenarioKey)!.image} alt="Imagem da fase CDBS" className="absolute inset-0 h-full w-full object-contain" draggable={false} /> : <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-400">Carregando a imagem da fase selecionada…</div>}
                    {editorHotspots.map((hotspot, index) => {
                      const selected = selectedEditorHotspotId === hotspot.id;
                      const color = ["#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#a855f7", "#ec4899"][index % 6];
                      return <div key={hotspot.id} onPointerDown={(event) => beginEditorInteraction(event, hotspot, "move")} onClick={(event) => { event.stopPropagation(); selectEditorHotspot(hotspot); }} className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move select-none border-2 text-xs font-black shadow-xl transition-shadow ${hotspot.shape === "circulo" ? "rounded-full" : "rounded-md"} ${selected ? "ring-4 ring-white/70" : ""} ${hotspot.active ? "opacity-100" : "opacity-35 grayscale"}`} style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, width: `${hotspot.width}%`, height: `${hotspot.height}%`, borderColor: color, backgroundColor: `${color}55`, color: "white" }}>
                        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-black/75 px-1.5 py-0.5">{index + 1}</span>
                        <button type="button" title="Remover área clicável" aria-label={`Remover área ${index + 1}`} onPointerDown={(event) => { event.stopPropagation(); event.preventDefault(); }} onClick={(event) => { event.stopPropagation(); removeVisualHotspot(hotspot); }} className="absolute -right-2 -top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-red-600 text-xs font-black text-white shadow-lg hover:bg-red-500">×</button>
                        {selected && ["nw", "ne", "sw", "se"].map((handle) => <span key={handle} onPointerDown={(event) => beginEditorInteraction(event, hotspot, "resize", handle)} className={`absolute h-3 w-3 rounded-full border-2 border-white bg-amber-400 shadow ${handle.includes("n") ? "top-[-7px]" : "bottom-[-7px]"} ${handle.includes("w") ? "left-[-7px]" : "right-[-7px]"}`} />)}
                      </div>;
                    })}
                    {editorHotspots.filter((hotspot) => hotspot.shape === "poligono").map((hotspot, index) => {
                      const points = parseEditorPoints(hotspot.points);
                      if (points.length < 3) return null;
                      const selected = selectedEditorHotspotId === hotspot.id;
                      const color = ["#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#a855f7", "#ec4899"][index % 6];
                      return <svg key={`polygon-${hotspot.id}`} viewBox="0 0 100 100" preserveAspectRatio="none" className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${hotspot.active ? "opacity-100" : "opacity-35 grayscale"}`}><polygon points={points.map((point) => `${point.x},${point.y}`).join(" ")} fill={`${color}33`} stroke={color} strokeWidth="0.35" strokeDasharray={selected ? "1 0.5" : "1.5 1"} />{selected && points.map((point, pointIndex) => <circle key={`${hotspot.id}-${pointIndex}`} cx={point.x} cy={point.y} r="1.1" fill="#fbbf24" stroke="white" strokeWidth="0.35" className="pointer-events-auto cursor-crosshair" onPointerDown={(event) => beginEditorInteraction(event, hotspot, "point", undefined, pointIndex)} />)}</svg>;
                    })}
                  </div>
                  <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/80 px-2 py-1 text-[10px] font-mono text-amber-200">Arraste áreas • cantos redimensionam • posição responsiva</div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/25 p-3 text-xs text-slate-400"><span>{editorHotspots.length} erros configurados nesta fase</span><span>Zoom: {Math.round(editorZoom * 100)}%</span><Button type="button" onClick={saveVisualHotspots} disabled={updateHotspotMutation.isPending || !editorHotspots.length} className="bg-emerald-600 font-black uppercase text-white">Salvar alterações</Button></div>
              </div>
              <div className="space-y-4 rounded-xl border border-white/10 bg-[#141822] p-5">
                <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-industrial font-bold uppercase text-white"><Crosshair className="h-4 w-4 text-amber-400" /> {selectedEditorHotspotId ? "Opções do erro" : "Selecione um erro"}</h3><Button type="button" onClick={addVisualHotspot} className="bg-amber-500 text-xs font-black uppercase text-slate-950"><Plus className="mr-1 h-3 w-3" /> Adicionar erro</Button></div>
                {selectedEditorHotspotId ? <>
                  <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-100">Erro #{editorHotspots.findIndex((hotspot) => hotspot.id === selectedEditorHotspotId) + 1}. Arraste no quadro ou ajuste os cantos; nenhum número é necessário.</div>
                  <div className="space-y-3"><div><Label className="text-xs text-slate-300">Nome</Label><Input value={hotspotTitle} onChange={(event) => { setHotspotTitle(event.target.value); setEditorHotspots((current) => current.map((hotspot) => hotspot.id === selectedEditorHotspotId ? { ...hotspot, title: event.target.value } : hotspot)); }} className="bg-black/40 text-white" /></div><div><Label className="text-xs text-slate-300">Descrição educativa</Label><textarea value={hotspotDescription} onChange={(event) => { setHotspotDescription(event.target.value); setEditorHotspots((current) => current.map((hotspot) => hotspot.id === selectedEditorHotspotId ? { ...hotspot, description: event.target.value } : hotspot)); }} className="min-h-24 w-full rounded-md border border-white/15 bg-black/40 p-3 text-sm text-white" /></div><div><Label className="text-xs text-slate-300">Dica ao jogador</Label><textarea value={hotspotHint} onChange={(event) => { setHotspotHint(event.target.value); setEditorHotspots((current) => current.map((hotspot) => hotspot.id === selectedEditorHotspotId ? { ...hotspot, hint: event.target.value } : hotspot)); }} placeholder="Ex.: Observe os EPIs do trabalhador." className="min-h-16 w-full rounded-md border border-white/15 bg-black/40 p-3 text-sm text-white" /></div><div><Label className="text-xs text-slate-300">Categoria</Label><Input value={hotspotCategory} onChange={(event) => { setHotspotCategory(event.target.value); setEditorHotspots((current) => current.map((hotspot) => hotspot.id === selectedEditorHotspotId ? { ...hotspot, category: event.target.value } : hotspot)); }} className="bg-black/40 text-white" /></div><div><Label className="text-xs text-slate-300">Forma da área</Label><select value={hotspotShape} onChange={(event) => { const value = event.target.value as EditorHotspot["shape"]; setHotspotShape(value); setEditorHotspots((current) => current.map((hotspot) => hotspot.id === selectedEditorHotspotId ? { ...hotspot, shape: value } : hotspot)); }} className="mt-1 h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-white"><option value="retangulo">Retângulo ajustado</option><option value="circulo">Círculo / elipse proporcional</option><option value="poligono">Polígono de precisão</option></select></div><div><Label className="text-xs text-slate-300">Margem de tolerância proporcional</Label><select value={hotspotTolerance <= 1 ? "pequena" : hotspotTolerance <= 2 ? "media" : "grande"} onChange={(event) => { const value = event.target.value === "pequena" ? 0.5 : event.target.value === "media" ? 1 : 2; setHotspotTolerance(value); setEditorHotspots((current) => current.map((hotspot) => hotspot.id === selectedEditorHotspotId ? { ...hotspot, tolerance: value } : hotspot)); }} className="mt-1 h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-white"><option value="pequena">Mínima • até 0,5%</option><option value="media">Pequena • até 1%</option><option value="grande">Máxima • até 2%</option></select></div><label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={editorHotspots.find((hotspot) => hotspot.id === selectedEditorHotspotId)?.active ?? false} onChange={(event) => setEditorHotspots((current) => current.map((hotspot) => hotspot.id === selectedEditorHotspotId ? { ...hotspot, active: event.target.checked } : hotspot))} /> Área ativa no jogo</label>{hotspotShape === "poligono" ? <div><Label className="text-xs text-slate-300">Pontos normalizados JSON</Label><textarea value={hotspotPoints} onChange={(event) => { setHotspotPoints(event.target.value); setEditorHotspots((current) => current.map((hotspot) => hotspot.id === selectedEditorHotspotId ? { ...hotspot, points: event.target.value } : hotspot)); }} placeholder='[{"x":25,"y":78},{"x":53,"y":73},{"x":70,"y":82}]' className="min-h-20 w-full rounded-md border border-white/15 bg-black/40 p-2 font-mono text-[11px] text-white" /><span className="text-[10px] text-slate-500">Arraste os vértices amarelos na imagem ou ajuste os pontos.</span></div> : null}<div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500"><span>X {hotspotX.toFixed(1)}% • Y {hotspotY.toFixed(1)}%</span><span>{hotspotWidth.toFixed(1)}% × {hotspotHeight.toFixed(1)}%</span></div></div>
                  <Button type="button" variant="destructive" onClick={() => { const selected = editorHotspots.find((hotspot) => hotspot.id === selectedEditorHotspotId); if (selected) removeVisualHotspot(selected); }} className="w-full font-black uppercase">Excluir área clicável</Button>
                </> : <p className="text-sm leading-6 text-slate-400">Clique em um quadrado numerado para editar nome, descrição e tolerância. Use <strong className="text-white">Adicionar erro</strong> para cadastrar um novo risco.</p>}
              </div>
            </div>
            {editorPreviewOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 p-2 sm:p-6"><div className="mx-auto min-h-full max-w-7xl"><div className="sticky top-0 z-10 flex justify-end py-2"><Button type="button" variant="outline" onClick={() => setEditorPreviewOpen(false)} className="border-cyan-400/40 bg-[#10131b] text-cyan-200">Fechar teste</Button></div><SpotErrorGame difficulty={previewDifficulty} initialScenarioKey={spotScenarioKey} previewOnly previewAdminKey={adminKey} onBackToGames={() => setEditorPreviewOpen(false)} /></div></div>}
          </TabsContent>
          <TabsContent value="acesso" className="space-y-5">
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-sm text-cyan-100">
              <strong className="block uppercase font-industrial mb-1">Janela de acesso da SIPAT CDBS</strong>
              Defina quando cada desafio fica disponível. O bloqueio é aplicado no servidor: antes do início ou depois do encerramento, o participante não consegue iniciar uma partida válida.
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {(gameSettingsQuery.data || []).map((game) => {
                const draft = accessDraft[game.gameKey] || { start: "", end: "" };
                const setDraft = (field: "start" | "end", value: string) => setAccessDraft((current) => ({ ...current, [game.gameKey]: { ...draft, [field]: value } }));
                return <div key={game.gameKey} className="p-5 rounded-xl bg-[#141822] border border-white/10 space-y-4">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="font-industrial font-bold uppercase text-white">{game.title}</h3><p className="text-xs text-slate-400 mt-1">{game.description}</p></div><span className={`text-[10px] font-mono font-bold uppercase ${game.isOpen ? "text-emerald-400" : "text-amber-400"}`}>{game.isOpen ? "ABERTO AGORA" : "FORA DA JANELA"}</span></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><Label className="text-xs text-slate-300">Começa em • São Paulo</Label><Input type="datetime-local" value={draft.start} onChange={(event) => setDraft("start", event.target.value)} className="bg-black/40 border-white/15 text-white text-xs [color-scheme:dark]" /></div><div><Label className="text-xs text-slate-300">Termina em • São Paulo</Label><Input type="datetime-local" value={draft.end} onChange={(event) => setDraft("end", event.target.value)} className="bg-black/40 border-white/15 text-white text-xs [color-scheme:dark]" /></div></div>
                  <div className="flex items-center justify-between gap-3"><span className="text-[11px] text-slate-500">Fuso: America/Sao_Paulo. Deixe vazio para manter sem limite.</span><Button onClick={() => updateGameAccessMutation.mutate({ adminKey, gameKey: game.gameKey, active: game.active, accessStartAt: draft.start ? fromSaoPauloInput(draft.start) : null, accessEndAt: draft.end ? fromSaoPauloInput(draft.end) : null })} className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold uppercase"><Save className="w-3.5 h-3.5 mr-1.5" /> Salvar janela</Button></div>
                </div>;
              })}
            </div>
          </TabsContent>

          {/* TAB 4: GERENCIAR RANKING / RESULTADOS */}
          <TabsContent value="ranking" className="space-y-4">
            <div className="p-4 rounded-xl bg-[#141822] border border-white/10 flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Pesquisar partidas por nome, chapa ou WWID..."
                value={resultSearch}
                onChange={(e) => setResultSearch(e.target.value)}
                className="bg-black/50 border-white/15 text-white"
              />
            </div>

            <div className="rounded-xl bg-[#141822] border border-white/10 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/40 text-slate-400 font-mono uppercase text-[11px] border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Colaborador</th>
                    <th className="py-3 px-4">Chapa</th>
                    <th className="py-3 px-4">WWID</th>
                    <th className="py-3 px-4">Jogo</th>
                    <th className="py-3 px-4">Dificuldade</th>
                    <th className="py-3 px-4">Pontuação</th>
                    <th className="py-3 px-4">Acertos/Erros</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(resultsQuery.data || []).map((res) => (
                    <tr key={res.id} className="hover:bg-white/5">
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {new Date(res.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{res.participantName}</td>
                      <td className="py-3 px-4 font-mono text-amber-400">{res.participantChapa}</td>
                      <td className="py-3 px-4 font-mono text-amber-400">{res.participantWwid}</td>
                      <td className="py-3 px-4 uppercase font-semibold text-slate-300">
                        {res.gameType}
                      </td>
                      <td className="py-3 px-4 uppercase font-mono text-[11px]">
                        {res.difficulty}
                      </td>
                      <td className="py-3 px-4 font-black font-industrial text-[#da291c]">
                        {res.score} pts
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {res.correctCount} / {res.wrongCount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Excluir este resultado da partida? O ranking será recalculado.")) {
                              deleteResultMutation.mutate({ adminKey, id: res.id });
                            }
                          }}
                          className="h-7 text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Excluir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB 5: GERENCIAR JOGOS (ATIVAR / DESATIVAR) */}
          <TabsContent value="jogos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(gameSettingsQuery.data || []).map((g) => (
                <div key={g.id} className="p-5 rounded-xl bg-[#141822] border border-white/10 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold font-industrial uppercase text-white">{g.title}</h4>
                    <p className="text-xs text-slate-400 max-w-sm">{g.description}</p>
                    <span className={`text-[10px] font-mono font-bold uppercase ${g.active ? "text-emerald-400" : "text-red-400"}`}>
                      {g.active ? "● Jogo Ativo para Colaboradores" : "● Jogo Desativado Temporariamente"}
                    </span>
                  </div>

                  <Button
                    onClick={() =>
                      toggleGameMutation.mutate({
                        adminKey,
                        gameKey: g.gameKey,
                        active: !g.active,
                      })
                    }
                    variant={g.active ? "outline" : "default"}
                    className={g.active ? "border-red-500/40 text-red-300" : "bg-emerald-600 text-white"}
                  >
                    {g.active ? "Desativar Jogo" : "Ativar Jogo"}
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB: MODERAÇÃO DO MURAL VOLTAR SEGURO PARA CASA */}
          <TabsContent value="mural" className="space-y-5">
            <div className="p-5 rounded-xl bg-[#141822] border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-industrial text-xl font-bold uppercase text-white flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-amber-400" />
                    Moderação do Mural Voltar Seguro para Casa
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Apenas mensagens aprovadas aparecem publicamente no site. Revise o conteúdo, garanta a privacidade e escolha a mensagem em destaque.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => muralMessagesQuery.refetch()}
                  className="border-white/20 text-xs text-slate-200"
                >
                  Atualizar lista
                </Button>
              </div>

              {/* Filtros de moderação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar frase ou autor..."
                    value={muralSearch}
                    onChange={(e) => setMuralSearch(e.target.value)}
                    className="pl-9 bg-black/40 border-white/15 text-white text-xs h-10"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-300 shrink-0">Status:</Label>
                  <select
                    value={muralStatusFilter}
                    onChange={(e) => setMuralStatusFilter(e.target.value as typeof muralStatusFilter)}
                    className="w-full h-10 rounded-md border border-white/15 bg-black/40 px-3 text-xs font-bold text-white"
                  >
                    <option value="todos">Todos os status</option>
                    <option value="pendente">Pendentes (aguardando revisão)</option>
                    <option value="aprovada">Aprovadas (públicas)</option>
                    <option value="rejeitada">Rejeitadas</option>
                    <option value="arquivada">Arquivadas</option>
                  </select>
                </div>

                <div className="flex items-center justify-end text-xs font-mono text-slate-400">
                  Total encontrado: {(muralMessagesQuery.data || []).length} mensagem(ns)
                </div>
              </div>
            </div>

            {/* Lista de mensagens do mural */}
            <div className="space-y-3">
              {(muralMessagesQuery.data || []).map((msg) => (
                <div
                  key={msg.id}
                  className={`p-5 rounded-xl border space-y-3 ${
                    msg.isFeatured
                      ? "bg-[#181d28] border-amber-400/50 ring-1 ring-amber-400/30"
                      : msg.status === "pendente"
                      ? "bg-[#1a1c22] border-amber-500/30"
                      : msg.status === "aprovada"
                      ? "bg-[#141822] border-emerald-500/30"
                      : "bg-[#11141b] border-white/10 opacity-75"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          msg.status === "aprovada"
                            ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                            : msg.status === "pendente"
                            ? "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                            : "bg-red-950/60 text-red-300 border border-red-500/40"
                        }`}
                      >
                        {msg.status}
                      </span>

                      {msg.isFeatured && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/50 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Destaque Oficial
                        </span>
                      )}

                      {msg.flagged && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1" title={msg.flagReasons || ""}>
                          <AlertTriangle className="w-3 h-3" /> Alerta de Moderação: {msg.flagReasons}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span>Enviado em: {new Date(msg.submittedAt).toLocaleString("pt-BR")}</span>
                      {msg.moderatedBy && <span>• Mod: {msg.moderatedBy}</span>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-mono font-bold uppercase text-amber-300 block">
                      Pergunta: {msg.promptText}
                    </span>
                    {editingMuralId === msg.id ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          value={editingMuralText}
                          onChange={(e) => setEditingMuralText(e.target.value)}
                          rows={3}
                          className="w-full rounded-md border border-white/20 bg-black/50 p-2.5 text-sm text-white"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => editMuralTextMutation.mutate({ adminKey, id: msg.id, message: editingMuralText })}
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs text-white uppercase font-bold"
                          >
                            Salvar alteração
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingMuralId(null)}
                            className="h-8 border-white/20 text-xs text-slate-300"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base font-semibold text-white leading-relaxed">
                        “{msg.message}”
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
                    <div>
                      <span>Identificação pública: </span>
                      <strong className="text-slate-200">
                        {msg.isAnonymous ? "Anônimo" : msg.publicName || "Colaborador"}
                      </strong>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {editingMuralId !== msg.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingMuralId(msg.id);
                            setEditingMuralText(msg.message);
                          }}
                          className="h-8 border-white/20 text-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" /> Editar texto
                        </Button>
                      )}

                      {msg.status !== "aprovada" ? (
                        <Button
                          size="sm"
                          onClick={() => moderateMuralMutation.mutate({ adminKey, id: msg.id, action: "aprovar" })}
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Aprovar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moderateMuralMutation.mutate({ adminKey, id: msg.id, action: "rejeitar" })}
                          className="h-8 border-red-500/40 text-red-300 hover:bg-red-950/40 text-xs"
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Rejeitar
                        </Button>
                      )}

                      {msg.status === "aprovada" && (
                        msg.isFeatured ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moderateMuralMutation.mutate({ adminKey, id: msg.id, action: "remover_destaque" })}
                            className="h-8 border-amber-400/40 text-amber-300 text-xs"
                          >
                            Remover destaque
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => moderateMuralMutation.mutate({ adminKey, id: msg.id, action: "destacar" })}
                            className="h-8 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold uppercase"
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1" /> Tornar Destaque
                          </Button>
                        )
                      )}

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Deseja realmente excluir esta mensagem do mural?")) {
                            deleteMuralMutation.mutate({ adminKey, id: msg.id });
                          }
                        }}
                        className="h-8 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {!(muralMessagesQuery.data || []).length && (
                <div className="p-8 rounded-xl border border-dashed border-white/10 bg-black/20 text-center text-sm text-slate-400">
                  Nenhuma mensagem cadastrada para o filtro selecionado.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Edit / Add Question Modal */}
      <Dialog open={questionModalOpen} onOpenChange={setQuestionModalOpen}>
        <DialogContent className="sm:max-w-xl bg-[#161a24] border border-white/15 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-industrial uppercase text-white">
              {editingQuestionId ? "Editar Pergunta SIPAT" : "Nova Pergunta Técnica"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveQuestion} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">Tipo de Quiz</Label>
                <select
                  value={qGameType}
                  onChange={(e) => setQGameType(e.target.value as any)}
                  className="w-full bg-black/50 border border-white/15 text-white text-xs rounded p-2"
                >
                  <option value="quiz_seguranca">Quiz de Segurança</option>
                  <option value="quiz_ergonomia">Quiz Lean Manufacturing</option>
                </select>
              </div>

              <div>
                <Label className="text-xs text-slate-300">Dificuldade</Label>
                <select
                  value={qDifficulty}
                  onChange={(e) => setQDifficulty(e.target.value as any)}
                  className="w-full bg-black/50 border border-white/15 text-white text-xs rounded p-2"
                >
                  <option value="facil">Fácil (100 pts)</option>
                  <option value="medio">Médio (200 pts)</option>
                  <option value="dificil">Difícil (300 pts)</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-300">Tema da Pergunta</Label>
              <Input
                value={qTheme}
                onChange={(e) => setQTheme(e.target.value)}
                placeholder="Ex: EPIs, Bloqueio LOTO, 5S, Kaizen"
                className="bg-black/50 border-white/15 text-white text-xs"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">Enunciado da Pergunta *</Label>
              <textarea
                rows={3}
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Digite a pergunta clara e técnica..."
                className="w-full bg-black/50 border border-white/15 rounded p-2 text-white text-xs"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label className="text-xs text-slate-300">Alternativas (A, B, C, D)</Label><span className="text-[10px] text-amber-400 font-mono">ARRASTE PARA TROCAR DE LETRA</span></div>
              {(["A", "B", "C", "D"] as const).map((letter) => {
                const value = letter === "A" ? qOptA : letter === "B" ? qOptB : letter === "C" ? qOptC : qOptD;
                const setter = letter === "A" ? setQOptA : letter === "B" ? setQOptB : letter === "C" ? setQOptC : setQOptD;
                return <div key={letter} draggable onDragStart={() => setDraggedOption(letter)} onDragOver={(event) => event.preventDefault()} onDrop={() => draggedOption && swapQuestionOptions(draggedOption, letter)} className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${qCorrect === letter ? "border-emerald-500/60 bg-emerald-950/20" : "border-white/10 bg-black/30"} ${draggedOption === letter ? "opacity-50" : ""}`}>
                  <GripVertical className="w-4 h-4 shrink-0 text-slate-500 cursor-grab" /><span className="w-6 h-6 rounded bg-white/10 text-center leading-6 text-xs font-black text-amber-400">{letter}</span><Input placeholder={`Alternativa ${letter}`} value={value} onChange={(e) => setter(e.target.value)} className="bg-transparent border-0 text-white text-xs focus-visible:ring-0" />{qCorrect === letter && <span className="text-[9px] text-emerald-300 font-mono whitespace-nowrap">CORRETA</span>}
                </div>;
              })}
              <p className="text-[10px] text-slate-500">Ao mover uma alternativa, a resposta correta também acompanha a nova letra.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">Alternativa Correta *</Label>
                <select
                  value={qCorrect}
                  onChange={(e) => setQCorrect(e.target.value as any)}
                  className="w-full bg-black/50 border border-white/15 text-white text-xs rounded p-2"
                >
                  <option value="A">Alternativa A</option>
                  <option value="B">Alternativa B</option>
                  <option value="C">Alternativa C</option>
                  <option value="D">Alternativa D</option>
                </select>
              </div>

              <div>
                <Label className="text-xs text-slate-300">Justificativa / Explicação</Label>
                <Input
                  placeholder="Explicação exibida após resposta"
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  className="bg-black/50 border-white/15 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuestionModalOpen(false)}
                className="text-xs border-white/20"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#da291c] hover:bg-[#b01e12] text-white text-xs font-bold uppercase"
              >
                Salvar Pergunta
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Participant Modal */}
      <Dialog open={editPlayerOpen} onOpenChange={setEditPlayerOpen}>
        <DialogContent className="sm:max-w-md bg-[#161a24] border border-white/15 text-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-industrial uppercase text-white">
              Corrigir Dados de Participante
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingPlayerId) {
                updatePlayerMutation.mutate({
                  adminKey,
                  id: editingPlayerId,
                  name: editPlayerName,
                  chapa: editPlayerChapa,
                  wwid: editPlayerWwid,
                  totalScore: Number(editPlayerScore),
                });
              }
            }}
            className="space-y-3 pt-2"
          >
            <div>
              <Label className="text-xs text-slate-300">Nome Completo</Label>
              <Input
                value={editPlayerName}
                onChange={(e) => setEditPlayerName(e.target.value)}
                className="bg-black/50 border-white/15 text-white text-xs"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">Chapa</Label>
              <Input
                value={editPlayerChapa}
                onChange={(e) => setEditPlayerChapa(e.target.value.toUpperCase())}
                className="bg-black/50 border-white/15 text-white font-mono text-xs uppercase"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">WWID Corporativo</Label>
              <Input
                value={editPlayerWwid}
                onChange={(e) => setEditPlayerWwid(e.target.value.toUpperCase())}
                className="bg-black/50 border-white/15 text-white font-mono text-xs uppercase"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">Pontuação Total Ajustada</Label>
              <Input
                type="number"
                value={editPlayerScore}
                onChange={(e) => setEditPlayerScore(Number(e.target.value))}
                className="bg-black/50 border-white/15 text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditPlayerOpen(false)}
                className="text-xs border-white/20"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold uppercase text-xs"
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
