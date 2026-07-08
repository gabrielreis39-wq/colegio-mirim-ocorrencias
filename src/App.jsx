import { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertTriangle, CheckCircle2, Clock, Plus, X,
  BookOpen, FileText, Calendar, MessageSquare,
  Filter, Search, User, Trash2, Pencil, RefreshCw, Wifi, WifiOff
} from "lucide-react";
import { supabase } from "./supabaseClient";

const TURMAS = ["5º A", "5º B", "6º A", "6º B", "7º A", "8º A", "9º A"];
const PROFESSORES = ["Juci", "Laryssa", "Tainá", "Adriana", "Victor", "Gabriel", "Erlon", "Fabiana", "Iana", "Caio", "Rafaela", "Monique", "Felipe"];

const STATUS = {
  novo: { label: "Novo Registro", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle, dot: "bg-red-500" },
  acompanhamento: { label: "Em Acompanhamento", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock, dot: "bg-amber-500" },
  finalizado: { label: "Caso Finalizado", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2, dot: "bg-emerald-500" },
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

// ── Mapeamento banco <-> app ─────────────────────────────────────────────────
// O banco usa snake_case (sugestao_intervencao), o app usa camelCase (sugestaoIntervencao)
function rowToOcorrencia(row) {
  return {
    id: row.id,
    estudante: row.estudante,
    turma: row.turma,
    professor: row.professor,
    data: row.data,
    descricao: row.descricao,
    sugestaoIntervencao: row.sugestao_intervencao || "",
    status: row.status,
    historico: row.historico || [],
  };
}

function ocorrenciaToRow(oc) {
  return {
    id: oc.id,
    estudante: oc.estudante,
    turma: oc.turma,
    professor: oc.professor,
    data: oc.data,
    descricao: oc.descricao,
    sugestao_intervencao: oc.sugestaoIntervencao || "",
    status: oc.status,
    historico: oc.historico || [],
  };
}

// ── Componentes ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.color}`}>
      <Icon size={12} />
      {s.label}
    </span>
  );
}

function ConfirmDialog({ estudante, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.65)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <Trash2 size={22} className="text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 text-center mb-1">Excluir ocorrência?</h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          A ocorrência de <span className="font-semibold text-slate-700">{estudante}</span> será removida permanentemente.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">Sim, excluir</button>
        </div>
      </div>
    </div>
  );
}

function Modal({ ocorrencia, onClose, onUpdate, onDelete, onEdit }) {
  const [novaAcao, setNovaAcao] = useState("");
  const [autor, setAutor] = useState("");
  const [novoStatus, setNovoStatus] = useState(ocorrencia.status);
  const [confirmando, setConfirmando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function handleAddAcao() {
    if (!novaAcao.trim() || !autor.trim()) return;
    setSalvando(true);
    const acao = { data: today(), autor, acao: novaAcao.trim() };
    await onUpdate(ocorrencia.id, {
      historico: [...ocorrencia.historico, acao],
      status: novoStatus,
    });
    setNovaAcao("");
    setAutor("");
    setSalvando(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.55)" }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="flex items-start justify-between p-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ocorrência #{String(ocorrencia.id).slice(-6)}</span>
                <StatusBadge status={ocorrencia.status} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{ocorrencia.estudante}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{ocorrencia.turma} · Registrado por {ocorrencia.professor} em {formatDate(ocorrencia.data)}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { onClose(); onEdit(ocorrencia); }} title="Editar" className="p-2 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"><Pencil size={18} /></button>
              <button onClick={() => setConfirmando(true)} title="Excluir" className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText size={12} /> Descrição</h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3">{ocorrencia.descricao}</p>
            </div>
            {ocorrencia.sugestaoIntervencao && (
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MessageSquare size={12} /> Sugestão de Intervenção</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-amber-50 rounded-lg p-3 border border-amber-100">{ocorrencia.sugestaoIntervencao}</p>
              </div>
            )}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Clock size={12} /> Linha do Tempo</h3>
              {ocorrencia.historico.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Nenhuma ação registrada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {ocorrencia.historico.map((h, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        {i < ocorrencia.historico.length - 1 && <div className="w-0.5 bg-slate-200 flex-1 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-xs text-slate-400 mb-0.5">{formatDate(h.data)} · <span className="font-medium text-indigo-600">{h.autor}</span></p>
                        <p className="text-sm text-slate-700">{h.acao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Registrar Nova Ação</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Seu nome (ex: Gabriel - Coordenação)"
                    value={autor}
                    onChange={e => setAutor(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={novoStatus}
                    onChange={e => setNovoStatus(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="novo">Novo Registro</option>
                    <option value="acompanhamento">Em Acompanhamento</option>
                    <option value="finalizado">Caso Finalizado</option>
                  </select>
                </div>
                <textarea
                  placeholder="Descreva a ação realizada..."
                  value={novaAcao}
                  onChange={e => setNovaAcao(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <button
                  onClick={handleAddAcao}
                  disabled={!novaAcao.trim() || !autor.trim() || salvando}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {salvando && <RefreshCw size={14} className="animate-spin" />}
                  {salvando ? "Salvando..." : "Salvar Ação e Atualizar Status"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {confirmando && (
        <ConfirmDialog
          estudante={ocorrencia.estudante}
          onConfirm={() => { onDelete(ocorrencia.id); onClose(); }}
          onCancel={() => setConfirmando(false)}
        />
      )}
    </>
  );
}

function OcorrenciaForm({ inicial, onSave, onCancel }) {
  const editando = !!inicial;
  const [form, setForm] = useState(
    inicial
      ? { estudante: inicial.estudante, turma: inicial.turma, professor: inicial.professor, data: inicial.data, descricao: inicial.descricao, sugestaoIntervencao: inicial.sugestaoIntervencao || "" }
      : { estudante: "", turma: "", professor: "", data: today(), descricao: "", sugestaoIntervencao: "" }
  );
  const [salvando, setSalvando] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.estudante || !form.turma || !form.professor || !form.descricao) return;
    setSalvando(true);
    if (editando) {
      await onSave({ ...inicial, ...form });
    } else {
      await onSave({ ...form, id: Date.now(), status: "novo", historico: [] });
    }
    setSalvando(false);
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{editando ? "Editar Ocorrência" : "Nova Ocorrência"}</h2>
            <p className="text-sm text-slate-400">{editando ? "Altere os dados e salve" : "Preencha os dados da ocorrência"}</p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Nome do Estudante *</label>
              <input className={inputClass} placeholder="Nome completo" value={form.estudante} onChange={e => set("estudante", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Turma *</label>
              <select className={inputClass} value={form.turma} onChange={e => set("turma", e.target.value)}>
                <option value="">Selecione</option>
                {TURMAS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Professor(a) *</label>
              <select className={inputClass} value={form.professor} onChange={e => set("professor", e.target.value)}>
                <option value="">Selecione</option>
                {PROFESSORES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Data</label>
              <input type="date" className={inputClass} value={form.data} onChange={e => set("data", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Descrição da Ocorrência *</label>
              <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Descreva o que aconteceu com detalhes..." value={form.descricao} onChange={e => set("descricao", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Sugestão de Intervenção</label>
              <textarea className={`${inputClass} resize-none`} rows={2} placeholder="O que você sugere como próximo passo?" value={form.sugestaoIntervencao} onChange={e => set("sugestaoIntervencao", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={!form.estudante || !form.turma || !form.professor || !form.descricao || salvando}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            {salvando && <RefreshCw size={14} className="animate-spin" />}
            {salvando ? "Salvando..." : (editando ? "Salvar Alterações" : "Registrar Ocorrência")}
          </button>
        </div>
      </div>
    </div>
  );
}

function OcorrenciaCard({ ocorrencia, onClick, onEdit, onDelete }) {
  const [confirmando, setConfirmando] = useState(false);
  return (
    <>
      <div onClick={onClick} className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group relative">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{ocorrencia.estudante}</p>
            <p className="text-xs text-slate-400 mt-0.5">{ocorrencia.turma}</p>
          </div>
          <StatusBadge status={ocorrencia.status} />
        </div>
        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{ocorrencia.descricao}</p>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1"><User size={11} />{ocorrencia.professor}</span>
          <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(ocorrencia.data)}</span>
          <span className="flex items-center gap-1"><Clock size={11} />{ocorrencia.historico.length} ação(ões)</span>
        </div>
        <div
          className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-sm px-1 py-0.5"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => onEdit(ocorrencia)} title="Editar" className="p-1.5 rounded hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"><Pencil size={13} /></button>
          <button onClick={() => setConfirmando(true)} title="Excluir" className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
        </div>
      </div>
      {confirmando && (
        <ConfirmDialog
          estudante={ocorrencia.estudante}
          onConfirm={() => onDelete(ocorrencia.id)}
          onCancel={() => setConfirmando(false)}
        />
      )}
    </>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [online, setOnline] = useState(true);
  const [ultimaSync, setUltimaSync] = useState(null);
  const [modalAberto, setModalAberto] = useState(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroTurma, setFiltroTurma] = useState("todas");
  const [busca, setBusca] = useState("");
  const channelRef = useRef(null);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setOnline(false);
    } else {
      setOcorrencias((data || []).map(rowToOcorrencia));
      setOnline(true);
      setUltimaSync(new Date());
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();

    // Realtime: qualquer professor que insira/edite/exclua atualiza todo mundo na hora
    const channel = supabase
      .channel("ocorrencias-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ocorrencias" }, () => {
        carregar();
      })
      .subscribe();

    channelRef.current = channel;

    // Fallback: também atualiza a cada 30s, caso o realtime falhe
    const interval = setInterval(carregar, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [carregar]);

  async function handleSave(nova) {
    const row = ocorrenciaToRow(nova);
    let error;
    if (editando) {
      ({ error } = await supabase.from("ocorrencias").update(row).eq("id", nova.id));
    } else {
      ({ error } = await supabase.from("ocorrencias").insert(row));
    }
    if (error) {
      console.error(error);
      setOnline(false);
    } else {
      setOnline(true);
      await carregar();
    }
    setFormAberto(false);
    setEditando(null);
  }

  async function handleUpdate(id, changes) {
    const ocorrenciaAtual = ocorrencias.find(o => o.id === id);
    const atualizada = { ...ocorrenciaAtual, ...changes };
    const row = ocorrenciaToRow(atualizada);
    const { error } = await supabase.from("ocorrencias").update(row).eq("id", id);
    if (error) {
      console.error(error);
      setOnline(false);
    } else {
      setOnline(true);
      if (modalAberto) setModalAberto(atualizada);
      await carregar();
    }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from("ocorrencias").delete().eq("id", id);
    if (error) {
      console.error(error);
      setOnline(false);
    } else {
      setOnline(true);
      setModalAberto(null);
      await carregar();
    }
  }

  function handleEdit(oc) {
    setEditando(oc);
    setModalAberto(null);
  }

  const filtradas = ocorrencias.filter(o => {
    if (filtroStatus !== "todos" && o.status !== filtroStatus) return false;
    if (filtroTurma !== "todas" && o.turma !== filtroTurma) return false;
    if (busca && !o.estudante.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const counts = {
    novo: ocorrencias.filter(o => o.status === "novo").length,
    acompanhamento: ocorrencias.filter(o => o.status === "acompanhamento").length,
    finalizado: ocorrencias.filter(o => o.status === "finalizado").length,
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Carregando ocorrências...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">Colégio Mirim</h1>
              <p className="text-xs text-slate-400">Registro de Ocorrências · Anos Finais</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              {online ? <Wifi size={13} className="text-emerald-500" /> : <WifiOff size={13} className="text-red-400" />}
              <span className="hidden sm:inline">
                {online
                  ? ultimaSync ? `Sincronizado às ${ultimaSync.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Sincronizado"
                  : "Sem conexão com o banco"}
              </span>
              <button onClick={carregar} title="Atualizar" className="ml-1 p-1 rounded hover:bg-slate-100 transition-colors">
                <RefreshCw size={12} className="text-slate-400" />
              </button>
            </div>
            <button
              onClick={() => setFormAberto(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
            >
              <Plus size={16} />
              Nova Ocorrência
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { key: "novo", label: "Novos Registros", icon: AlertTriangle, bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
            { key: "acompanhamento", label: "Em Acompanhamento", icon: Clock, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
            { key: "finalizado", label: "Casos Finalizados", icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
          ].map(({ key, label, icon: Icon, bg, text, border }) => (
            <button
              key={key}
              onClick={() => setFiltroStatus(filtroStatus === key ? "todos" : key)}
              className={`${bg} border ${border} rounded-xl p-4 text-left transition-all ${filtroStatus === key ? "ring-2 ring-indigo-400" : "hover:shadow-sm"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={text} />
                <span className={`text-xs font-medium ${text}`}>{label}</span>
              </div>
              <p className={`text-3xl font-bold ${text}`}>{counts[key]}</p>
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar estudante..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select value={filtroTurma} onChange={e => setFiltroTurma(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="todas">Todas as turmas</option>
              {TURMAS.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="todos">Todos os status</option>
              <option value="novo">Novo Registro</option>
              <option value="acompanhamento">Em Acompanhamento</option>
              <option value="finalizado">Caso Finalizado</option>
            </select>
          </div>
          <span className="text-xs text-slate-400 ml-auto">{filtradas.length} ocorrência(s)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(["novo", "acompanhamento", "finalizado"]).map(status => {
            const s = STATUS[status];
            const cards = filtradas.filter(o => o.status === status);
            return (
              <div key={status} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                  <h2 className="font-semibold text-slate-700 text-sm">{s.label}</h2>
                  <span className="ml-auto text-xs bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">{cards.length}</span>
                </div>
                {cards.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-300 text-sm">Nenhuma ocorrência</div>
                ) : (
                  cards.map(oc => (
                    <OcorrenciaCard
                      key={oc.id}
                      ocorrencia={oc}
                      onClick={() => setModalAberto(oc)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      </main>

      {(formAberto || editando) && (
        <OcorrenciaForm
          inicial={editando || null}
          onSave={handleSave}
          onCancel={() => { setFormAberto(false); setEditando(null); }}
        />
      )}
      {modalAberto && (
        <Modal
          ocorrencia={ocorrencias.find(o => o.id === modalAberto.id) || modalAberto}
          onClose={() => setModalAberto(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}
