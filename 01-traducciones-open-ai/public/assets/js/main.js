const button = document.querySelector(".chat__button");

button.addEventListener("click", async e => {
  e.preventDefault();

  const text = document.getElementsByClassName("chat__input");
  const targetLang = document.querySelector("#targetLang").value;

    if (!text[0].value.trim() || !targetLang) return alert("Faltan parámetros");

    const userMessage = document.createElement("div");
    userMessage.classList.add("chat__message", "chat__message--user");
    userMessage.textContent = text[0].value.trim();

    const messagesContainer = document.querySelector(".chat__messages");
    messagesContainer.appendChild(userMessage);
    

    console.log(text, targetLang);

    // enviar la solicitud a la API

    try {

        const response = await fetch("/api/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: text[0].value.trim(),
                targetLang
            })
        });

        if (!response.ok) {
            throw new Error("Error en la solicitud de traducción");
        }

        const data = await response.json();
        const translatedMessage = document.createElement("div");
        translatedMessage.classList.add("chat__message", "chat__message--bot");
        translatedMessage.textContent = data.textTranslated;
        text[0].value = "";
        messagesContainer.appendChild(translatedMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight; // desplazar hacia abajo
        
    } catch (error) {
        alert("Error al traducir el texto");
        console.error("Error al traducir:", error);
    }
    
});
