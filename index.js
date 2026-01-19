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
      Você é um juiz especialista em análise de imagens e sua função é extremamente crítica.
      Você recebeu três descrições de uma mesma imagem, fornecidas por três avaliadores diferentes.

      Avaliador 1 disse: "${response1}"
      Avaliador 2 disse: "${response2}"
      Avaliador 3 disse: "${response3}"

      Com base nessas três descrições, sua tarefa é:
      1.  **Analisar a convergência:** Determine se as descrições são semelhantes ou consistentes o suficiente para chegar a um consenso claro sobre o que realmente está na imagem.
      2.  **Decisão:**
          *   Se houver um consenso claro e as respostas forem similares, forneça uma descrição final, única, concisa e precisa da imagem, destacando os pontos mais convincentes ou comuns.
          *   Se as descrições forem muito divergentes, conflitantes ou insuficientes para formar um consenso confiável, declare claramente que "NÃO FOI POSSÍVEL CHEGAR A UM CONSENSO" e explique brevemente o motivo da divergência.

      Decisão final do Juiz (apenas a decisão ou a declaração de não consenso):
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
        const promptAV1 = "Descreva esta imagem em uma única frase.";
        const promptAV2 = "Descreva esta imagem em uma única frase.";
        const promptAV3 = "Descreva esta imagem em uma única frase.";

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
