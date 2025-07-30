import express from "express";
import axios from "axios";
import { OpenAI } from "openai/client.js";
import { config } from "dotenv";
import http from "http";
import cors from "cors";
// cargar datos de entorno

config();
// instacia de express

// configurar open ai
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
const PORT = process.env.PORT || 3000;

// agregar rutas de la API

// servir archivos estáticos
const promptContext = `
      Eres una asistente de soporte para un supermercado.
      Tu tarea es ayudar a los clientes con sus preguntas y problemas relacionados con el supermercado.

      Información del supermercado:
      - Horario de atención: Lunes a Sábado de 8:00 a 20:00, Domingo de 9:00 a 18:00.
      - Ubicación: Calle Falsa 123, Ciudad.
      - Teléfono: 123-456-7890. 
      - Servicios: Venta de alimentos, productos de limpieza, atención al cliente.
      - Promociones actuales: 10% de descuento en frutas y verduras, 20% de descuento en productos de limpieza.
      - Políticas: No se aceptan devoluciones de productos perecederos, se aceptan devoluciones de productos no perecederos dentro de los 30 días.
      - Productos en venta : Leche, Pan, Frutas y verduras, Productos de limpieza, Bebidas, Carnes y pescados, Productos enlatados, Cereales y pastas, Snacks y golosinas, Productos de higiene personal.
      - Marcas de los productos: Leche: Marca A, Marca B; Pan: Marca C, Marca D; Frutas y verduras: Marca E, Marca F; Productos de limpieza: Marca G, Marca H; Bebidas: Marca I, Marca J; Carnes y pescados: Marca K, Marca L; Productos enlatados: Marca M, Marca N; Cereales y pastas: Marca O, Marca P; Snacks y golosinas: Marca Q, Marca R; Productos de higiene personal: Marca S, Marca T. 
  
      - Información adicional: El supermercado ofrece servicio a domicilio, acepta tarjetas de crédito y débito, y tiene una sección de productos orgánicos.
      - Preguntas frecuentes: ¿Cuál es el horario de atención?, ¿Dónde está ubicado el`;

let userThread = {};

app.post("/api/chat", async (req, res) => {
  try {
    const promptRole = "system";

    const promptConstraint = `
      Responde de manera clara y concisa. Solamente la información que se te ha proporcionado.
      Si no tienes suficiente información, indica que no puedes ayudar con esa solicitud.
      No uses emojis ni lenguaje informal.
      No uses lenguaje técnico o jerga que un cliente promedio no entendería.
      No hagas suposiciones sobre la información que no se te ha proporcionado.
      No respondas preguntas que no estén relacionadas con el supermercado.
      No uses lenguaje que pueda ser considerado ofensivo o inapropiado.
      Cualquier otra pregunta que no esté relacionada con el supermercado, indica que no puedes ayudar con esa solicitud.
      Usa los mínimos tokens posibles para responder.
    `;

    const { message, userId } = req.body;

    if (!message)
      return res.status(400).json({ error: "El mensaje es requerido" });

    if (!userThread[userId]) userThread[userId] = [];

    userThread[userId].push({ role: "user", content: message });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [...userThread[userId]],
      max_tokens: 200
    });

    const { content } = response.choices[0].message;

    userThread[userId].push({ role: "assistant", content });

    // Limitar el tamaño de la conversación a las últimas 10 interacciones
    if (!userThread[userId]) {
      const thread = await openai.beta.threads.create();
      userThread[userId] = userThread[userId] = thread.id;
    }

    // crear una conversación con el usuario
    await openai.beta.threads.messages.create(userThread[userId], {
      role: "user",
      content: message
    });

    // ehecutar la respuesta del bot
    await openai.beta.threads.runs.create(userThread[userId], {
      assistant_id: process.env.ASSISTANT_ID,
    });

    return res.json({
      message: content
    });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
});

app.use("/chat", express.static("public"));

http.createServer(app).listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
