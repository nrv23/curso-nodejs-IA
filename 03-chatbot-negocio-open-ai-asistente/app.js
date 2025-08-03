import express from "express";
import { config } from "dotenv";
import cors from "cors";
import http from "http";
import OpenAI from "openai";
import { type } from "os";

config();

if (!process.env.OPENAI_API_KEY || !process.env.ASSISTANID) {
  throw new Error("Faltan variables de entorno OPENAI_API_KEY o ASSISTANID");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const userThread = {};

const promptContext = `
Eres una asistente para un supermercado...
`;

// Tu endpoint principal
app.post("/api/chat", async (req, res) => {
  try {
    const { message, userId } = req.body;
    if (!message || !userId) return res.status(400).json({ error: "message y userId requeridos" });

    if (!userThread[userId]) {
      const thread = await openai.beta.threads.create();
      userThread[userId] = thread.id;
    }
    const threadId = userThread[userId];

    // Agregar mensaje usuario
    await openai.beta.threads.messages.create(threadId, { role: "user", content: message });

    // Crear run
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.ASSISTANID,
    });

    let runStatus = run;
    let attempts = 0;
    const maxAttempts = 30;

    while (runStatus.status !== "completed" && attempts < maxAttempts) {
      console.log({
        threadId: typeof threadId,
        runId: run.id,
        status: runStatus.status,
        attempts,
      });
      await new Promise((r) => setTimeout(r, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(run.id, {thread_id: threadId});
      attempts++;
    }

    if (runStatus.status !== "completed") throw new Error("Timeout esperando respuesta del asistente");

    // Obtener mensajes y respuesta final
    const messages = await openai.beta.threads.messages.list(threadId);
    const assistantMessages = messages.data.filter((m) => m.role === "assistant");
    const lastAssistantMsg = assistantMessages
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    const assistantReply = lastAssistantMsg?.content?.[0]?.text?.value;

    if (!assistantReply) throw new Error("No se obtuvo respuesta del asistente");

    return res.json({ message: assistantReply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error procesando solicitud" });
  }
});

app.use("/chat", express.static("public"));

http.createServer(app).listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
