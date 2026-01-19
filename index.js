const xlsx = require('xlsx');
const axios = require('axios');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Baixar imagem de uma URL
async function downloadImage(url) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer'
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao baixar a imagem de ${url}:`, error.message);
    return null;
  }
}

// Converter o buffer da imagem para base64
function imageBufferToBase64(imageBuffer) {
  return Buffer.from(imageBuffer, 'binary').toString('base64');
}

// Função Avaliadores
async function analyzeImage(imageBase64, prompt) {
  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg',
      },
    };
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error(`Erro na análise do avaliador:`, error);
    return `Erro na análise: ${error.message}`;
  }
}

// Função Juiz
async function judgeResponses(response1, response2, response3) {
  try {
    const judgePrompt = `
      Você é um juiz de IA, especialista em consolidar múltiplas análises de imagens para produzir uma verdade fundamental. Sua função é crítica e exige máxima precisão.
      Você recebeu análises de três avaliadores especializados com focos distintos:

      - **Avaliador 1 (Factual):** "${response1}"
      - **Avaliador 2 (Contextual):** "${response2}"
      - **Avaliador 3 (Detalhista):** "${response3}"

      Sua tarefa é seguir este processo de julgamento rigoroso:
      1.  **Análise e Síntese:** Identifique os pontos de consenso (elementos em que todos concordam), os pontos complementares (detalhes que se somam) e quaisquer contradições.
      2.  **Construção do Veredito:** Com base na sua análise, construa uma descrição final única e abrangente. Incorpore o 'o quê' do Factual, o 'como' e 'porquê' do Contextual, e a riqueza do Detalhista.
      3.  **Tomada de Decisão:**
          *   Se as descrições forem consistentes, seu veredito DEVE ser a descrição final consolidada. Ela deve ser a melhor e mais completa descrição possível da imagem.
          *   Apenas se houver uma contradição gritante e irreconciliável entre os avaliadores, declare "NÃO FOI POSSÍVEL CHEGAR A UM CONSENSO" e explique sucintamente o motivo do conflito.

      Seu veredito final (apenas a descrição ou a declaração de não consenso):
    `;
    const result = await model.generateContent(judgePrompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Erro na análise do Juiz:', error);
    return `Erro no julgamento: ${error.message}`;
  }
}

async function main() {
  const filePath = 'data.xlsx';
  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    return;
  }

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  for (const row of data) {
    if (row.url) {
      console.log(`\n\n\n================================================================================`);
      console.log(`🔎 Processando imagem: ${row.url}`);
      console.log(`================================================================================`);

      const imageBuffer = await downloadImage(row.url);
      if (imageBuffer) {
        console.log('\n⏳ Imagem baixada. Iniciando avaliações...');
        const imageBase64 = imageBufferToBase64(imageBuffer);

        // Prompts avaliadores
        const promptAV1 = "Você é um analista de imagens especialista em descrever fatos. Sua tarefa é analisar a imagem e descrever objetivamente os elementos principais. Foque em responder 'o quê', 'quem' e 'onde'. Seja direto e literal. Descreva a imagem em uma única frase concisa.";
        const promptAV2 = "Você é um especialista em interpretação de cenas. Sua tarefa é analisar a imagem para entender a ação, a interação entre os elementos e o contexto geral. Foque em responder 'o que está acontecendo' e 'qual é a atmosfera'. Descreva a imagem em uma única frase concisa.";
        const promptAV3 = "Você é um observador de detalhes minucioso. Sua tarefa é focar nos detalhes específicos da imagem, como cores, texturas, objetos secundários e a composição visual. Descreva os detalhes mais importantes que você observa em uma única frase concisa.";

        // paralelo para mais eficiência
        const [resAV1, resAV2, resAV3] = await Promise.all([
          analyzeImage(imageBase64, promptAV1),
          analyzeImage(imageBase64, promptAV2),
          analyzeImage(imageBase64, promptAV3)
        ]);

        console.log('\n\n---------- 📝 RESPOSTAS DOS AVALIADORES ----------\n');
        console.log(`🧐 [Avaliador 1]: ${resAV1}`);
        console.log(`🧐 [Avaliador 2]: ${resAV2}`);
        console.log(`🧐 [Avaliador 3]: ${resAV3}`);
        console.log('\n----------------------------------------------------\n');

        console.log('⚖️  O Juiz está analisando as respostas...');
        const finalDecision = await judgeResponses(resAV1, resAV2, resAV3);

        console.log('\n\n---------- 🏛️  VEREDITO FINAL DO JUIZ ----------\n');
        console.log(`${finalDecision}`);
        console.log('\n----------------------------------------------------\n');
      }
    }
  }
};

main();
