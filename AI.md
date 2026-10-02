# IA

As chamadas são feitas no servidor para `https://copilot-mtcporto.vercel.app/v1/chat/completions`, com o modelo `gpt-4o`, sem chave ou cabeçalho Authorization. Não é necessário configurar OPENAI_API_KEY, base_url, model ou variáveis Gemini. Não há dependência de Genkit nem SDK adicional.

O cliente usa timeout de 60 segundos, não segue redirecionamentos e rejeita respostas vazias, truncadas ou de outro modelo. O JSON pode vir puro ou em um bloco Markdown completo e é validado pelo esquema de cada função.

`npm run test:ai` testa o contrato com respostas simuladas. Texto e JSON também foram verificados no endpoint real com dados sintéticos em 02/10/2026; não foram enviados dados de produção. Não há suporte validado a imagens: testes com PNG/JPEG retornaram HTTP 400 e a rota de geração retornou texto.
