import React, { useState } from 'react';
import { generateProjectRecoveryPlan } from '../services/gemini';
import { Sparkles, ArrowRight, FileCode, Layers, RefreshCw, AlertCircle } from 'lucide-react';

export const RecoveryTool: React.FC = () => {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryPlan, setRecoveryPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRecover = async () => {
    if (!description.trim()) return;

    setIsLoading(true);
    setError(null);
    setRecoveryPlan(null);

    try {
      const result = await generateProjectRecoveryPlan(description);
      setRecoveryPlan(result);
    } catch (err) {
      setError('Falha ao conectar com a IA. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-white">Reconstrutor de Projetos Perdidos</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Descreva o sistema que você criou ontem com o máximo de detalhes possível. A IA (Gemini 2.5 Flash) irá gerar uma estrutura completa de arquivos e lógica para você começar de novo rapidamente.
        </p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-2 border border-slate-700 shadow-xl">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Ontem eu fiz uma landing page para uma padaria com um carrossel de fotos de bolos, um formulário de contato no rodapé e usava cores marrom e creme..."
          className="w-full h-40 bg-slate-900/50 text-slate-200 p-6 rounded-xl border border-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none placeholder:text-slate-600 leading-relaxed"
        />
        <div className="px-2 pb-2 pt-2 flex justify-end">
          <button
            onClick={handleRecover}
            disabled={isLoading || !description.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-indigo-500/20"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Analisando Memória...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Gerar Plano de Reconstrução
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {recoveryPlan && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-3 text-emerald-400">
            <div className="h-px flex-1 bg-slate-800"></div>
            <span className="uppercase tracking-widest text-xs font-bold">Plano Gerado</span>
            <div className="h-px flex-1 bg-slate-800"></div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-400" />
                <span className="text-slate-200 font-medium">Guia de Implementação</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">MARKDOWN</span>
            </div>
            <div className="p-8 overflow-x-auto">
              <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                {recoveryPlan}
              </pre>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg border border-slate-700 transition-colors">
              <Layers className="w-4 h-4" />
              Copiar Estrutura
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-emerald-500/20">
              Começar Novo Projeto <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};