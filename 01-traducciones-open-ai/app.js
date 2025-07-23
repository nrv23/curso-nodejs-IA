import express from "express";
import axios from "axios";
import { OpenAI } from "openai/client.js";
import { config } from "dotenv";
import http from "http";


// cargar datos de entorno

config({
    path: ".env.var"
});
// instacia de express

// configurar open ai
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// agregar rutas de la API
app.post("/api/translate", async (req, res) => {
  const { text, targetLang } = req.body;

  if (!text || !targetLang) {
    return res.status(400).json({ error: "Faltan parámetros" });
  }

  try {
    const promptRole = "Eres un traductor experto";
    // reglas de la traducción para evitar uso mas tokens
    const promptConstraints =
      "La respuesta debe ser una traducción precisa y natural del texto original. Cualquier otra respuesta o conversacion está prohibida.";
    const promptUser = `Traduce el siguiente texto  ${text} al : "${targetLang}" solo responde con el texto traducido, no agregues nada más.`;

    const promptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // usar este modelo para pruebas y no gastar mucho credito
      messages: [
        // se utiliza para indicar de forma mas especifica el rol de la IA
        // y las restricciones que se le van a poner
        { role: "system", content: promptRole },
        { role: "system", content: promptConstraints },
        // el role del usuario es el texto que se va a traducir
        { role: "user", content: promptUser }
      ],
        max_tokens: 500, // limitar el número de tokens para evitar costos excesivos
        response_format: { // especificar el formato de la respuesta
          type: "text", 
        }
    });

    const textTranslated = promptResponse.choices[0].message.content;

    res.json({ textTranslated });
  } catch (error) {
    console.error("Error al traducir:", error);
    res.status(500).json({ error: "Error al traducir el texto" });
  }
});

// servir archivos estáticos
app.use("/chat", express.static("public"));

http.createServer(app).listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
