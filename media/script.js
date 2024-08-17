const vscode = acquireVsCodeApi(); // This gives us access to VS Code's API


document.getElementById('themeButton').addEventListener('click', () => {
    const isDarkMode = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const newTheme = isDarkMode ? 'light' : 'dark';

    document.documentElement.setAttribute('data-bs-theme', newTheme);
    
    // Send a message to the extension with the new theme
    vscode.postMessage({
        command: 'toggleTheme',
        theme: newTheme
    });
});

document.getElementById('suggestToggle').addEventListener('change', (event) => {
    const isChecked = event.target.checked;
    
    // Send a message to the extension with the toggle state
    vscode.postMessage({
        command: 'inlineSuggestToggle',
        checked: isChecked
    });
});

// Event listener for model selector dropdown
document.getElementById('apiSelect').addEventListener('change', (event) => {
    const selectedModel = event.target.value;

    // Send the selected model to the extension
    vscode.postMessage({
        command: 'apiSelected',
        model: selectedModel
    });
});

document.getElementById('cancelSettings').addEventListener('click', () => {
    const settingsPanel = document.getElementById('settingsPanel');
    settingsPanel.classList.remove('show');
});

document.getElementById('submitSettings').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    const modelName = document.getElementById('modelName').value;

    vscode.postMessage({
        command: 'submitSettings',
        apiKey: apiKey,
        modelName: modelName
    });
    
    // Close the panel after submission
    const settingsPanel = document.getElementById('settingsPanel');
    settingsPanel.classList.remove('show');
});

document.getElementById('contextCheck').addEventListener('change', (event) => {
    const isChecked = event.target.checked;
    
    // Send a message to the extension with the checkbox state
    vscode.postMessage({
        command: 'toggleContextCheck',
        checked: isChecked
    });
});

document.getElementById('additionalMessageInput').addEventListener('input', (event) => {
    vscode.postMessage({
        command: 'updateAdditionalMessage',
        message: event.target.value
    });
});

document.getElementById('getButton').addEventListener('click', () => {
    // Send a message to the extension to handle the 'Get' action
    vscode.postMessage({
        command: 'getData'
    });
});

document.getElementById('setButton').addEventListener('click', () => {
    // Send a message to the extension to handle the 'Set' action
    vscode.postMessage({
        command: 'setData'
    });
});

document.getElementById('rejectButton').addEventListener('click', () => {
    // Send a message to the extension to handle the 'Reject' action
    vscode.postMessage({
        command: 'rejectData'
    });
});


window.addEventListener('DOMContentLoaded', (event) => {
    const themeButton = document.getElementById('themeButton');
    const currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';

    // Set initial emoji based on theme
    themeButton.textContent = currentTheme === 'light' ? '🌞' : '🌜';

    // Add event listener for theme toggle
    themeButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');

        // Update emoji based on the new theme
        const newTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
        themeButton.textContent = newTheme === 'light' ? '🌞' : '🌜';
    });
});

// Listen for messages from the extension to update the display
window.addEventListener('message', event => {
    const message = event.data; // The JSON data sent by the extension

    switch (message.command) {
        case 'updateDisplay':
            const element = document.getElementById(message.element);
            if (element) {
                element.textContent = message.content;
            }
            break;
    }
});


document.addEventListener('DOMContentLoaded', function() {
    const settingsButton = document.getElementById('settingsButton');
    const settingsPanel = document.getElementById('settingsPanel');
    const cancelSettingsBtn = document.getElementById('cancelSettings');
    const submitSettingsBtn = document.getElementById('submitSettings');
    const modelSelect = document.getElementById('modelSelect');
    const suggestToggle = document.getElementById('suggestToggle');
    const apiKeyInput = document.getElementById('apiKey');
    const modelNameInput = document.getElementById('modelName');

    // Function to load configuration
    function loadConfig(config) {
        suggestToggle.checked = config.inlineSuggestion === 1;
        apiSelect.value = config.defaultApi;

        const apiNames = ['groq', 'openai', 'gemini'];
        const selectedApi = apiNames[Number(config.defaultApi)];
        modelNameInput.value = config.api[selectedApi].model;
        apiKeyInput.value = config.api[selectedApi].key || '';
    }

    // Request configuration from the extension
    vscode.postMessage({ command: 'getConfig' });

    // Listen for configuration from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        if (message.command === 'setConfig') {
            loadConfig(message.config);
        }
    });

    settingsButton.addEventListener('click', function() {
        settingsPanel.classList.toggle('show');
    });

    cancelSettingsBtn.addEventListener('click', function() {
        settingsPanel.classList.remove('show');
    });

    submitSettingsBtn.addEventListener('click', function() {
        const apiKey = apiKeyInput.value;
        const modelName = modelNameInput.value;
        
        const updatedConfig = {
            
            key: apiKey || undefined,
            model: modelName
        };

        // Send updated config to the extension
        vscode.postMessage({
            command: 'updateConfig',
            config: updatedConfig
        });
        
        settingsPanel.classList.remove('show');

    });
});

document.addEventListener('DOMContentLoaded', (event) => {
    const apiSelect = document.getElementById('apiSelect');
    const defaultApi = apiSelect.getAttribute('data-default-api');
    if (defaultApi) {
        apiSelect.value = defaultApi;
    }
});

document.addEventListener('DOMContentLoaded', (event) => {
    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const textToCopy = document.getElementById('outputText').textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Provide visual feedback that the text was copied
                vscode.postMessage({
                    command: 'showInfo',
                    text: 'Text copied to clipboard!'
                });
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                vscode.postMessage({
                    command: 'showError',
                    text: 'Failed to copy text'
                });
            });
        });
    }
});