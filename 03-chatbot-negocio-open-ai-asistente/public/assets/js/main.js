const sendButton = document.getElementById("sendButton");
const userId = Date.now() + Math.floor(Math.random() * 1000); // Generar un ID de usuario único
async function sendMessage(e) {
  try {
    e.preventDefault();
    const inputText = document.getElementById("inputText");

    if (!inputText.value.trim()) {
      alert("Por favor, escribe un mensaje antes de enviar.");
      return;
    }

    const repsonse = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: inputText.value, userId })
    });

    if (!repsonse.ok) {
      alert("Error al enviar el mensaje. Por favor, inténtalo de nuevo.");
      return;
    }

    const data = await repsonse.json();
    console.log("Respuesta del bot:", data.message);
    const chatContainer = document.querySelector(".chat__messages");
    const messageUserElement = document.createElement("div");
    const messageBotElement = document.createElement("div");

    messageUserElement.classList = "chat__message chat__message--user";
    messageBotElement.classList = "chat__message chat__message--bot";

    messageBotElement.textContent = data.message;
    messageUserElement.textContent = inputText.value;

    chatContainer.append(messageUserElement);
    chatContainer.append(messageBotElement);
    inputText.value = ""; // Limpiar el campo de entrada
    chatContainer.scrollTop = chatContainer.scrollHeight; // Desplazar hacia abajo para mostrar
  } catch (error) {
    console.error("Error al enviar el mensaje:", { error });
    alert(
      "Ocurrió un error al enviar el mensaje. Por favor, inténtalo de nuevo más tarde."
    );
  }
}

document.addEventListener("keydown", async e => {
  if (e.key === "Enter") {
    await sendMessage(e);
  }
});

sendButton.addEventListener("click", sendMessage);
