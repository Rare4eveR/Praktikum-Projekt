document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chat-form');
    const chatMessages = document.getElementById('chat-messages');
    const promptInput = document.getElementById('prompt-input');
    const modelSelect = document.getElementById('model-select');
    
    // Modelle laden
    fetchModels();
    
    // Formular absenden
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        sendMessage();
    });
    
    // Enter-Taste zum Senden (Shift+Enter für neue Zeile)
    promptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    async function fetchModels() {
        try {
            const response = await fetch('/api/models');
            if (response.ok) {
                const data = await response.json();
                populateModelSelect(data.models);
            } else {
                console.error('Fehler beim Laden der Modelle');
            }
        } catch (error) {
            console.error('Fehler beim Laden der Modelle:', error);
        }
    }
    
    function populateModelSelect(models) {
        // Aktuelle Optionen löschen
        modelSelect.innerHTML = '';
        
        // Neue Optionen hinzufügen
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        });
    }
    
    async function sendMessage() {
        const userInput = promptInput.value.trim();
        if (!userInput) return;
        
        // Benutzernachricht anzeigen
        appendMessage('user', userInput);
        
        // Eingabefeld leeren
        promptInput.value = '';
        
        // Nachricht senden
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [
                        { role: 'user', content: userInput }
                    ],
                    model: modelSelect.value
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                // KI-Antwort anzeigen
                appendMessage('ai', data.message.content);
            } else {
                const errorData = await response.json();
                appendSystemMessage(`Fehler: ${errorData.detail || 'Unbekannter Fehler'}`);
            }
        } catch (error) {
            appendSystemMessage(`Fehler bei der Kommunikation mit dem Server: ${error.message}`);
        }
    }
    
    function appendMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', role);
        
        if (role === 'ai') {
            // Markdown für KI-Antworten rendern
            messageDiv.innerHTML = marked.parse(content);
        } else {
            messageDiv.textContent = content;
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function appendSystemMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'system');
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
