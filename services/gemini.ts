import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProjectRecoveryPlan = async (userDescription: string): Promise<string> => {
  try {
    const prompt = `
      Você é um Engenheiro de Software Senior Especialista em React.
      O usuário perdeu um código que criou ontem e está descrevendo o que lembra dele.
      Sua tarefa é gerar um PLANO TÉCNICO DE RECONSTRUÇÃO em Português (Brasil).
      
      Descrição do usuário: "${userDescription}"

      Gere uma resposta estruturada contendo:
      1. Resumo Técnico: Quais bibliotecas provavelmente foram usadas (ex: Tailwind, Lucide, etc).
      2. Estrutura de Arquivos Sugerida: Uma lista de componentes necessários.
      3. Pseudo-código ou Código Boilerplate: O esqueleto do componente principal (App.tsx).
      4. Dicas: Como melhorar essa ideia agora que ele vai refazê-la.

      Mantenha o tom empático, profissional e encorajador. Use formatação Markdown para o código.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar o plano. Tente novamente com mais detalhes.";
  } catch (error) {
    console.error("Erro ao chamar Gemini API:", error);
    throw error;
  }
};