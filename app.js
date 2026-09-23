(() => {
  'use strict';

  const CONFIG = {
    historyKey: 'learnNorwegianHistory',
    maxHistory: 8,
    translationEndpoint: 'https://translate.googleapis.com/translate_a/single',
    weatherRefreshMs: 10 * 60 * 1000,
    weatherLocations: [
      { id: 'oslo', name: 'Oslo', latitude: 59.9139, longitude: 10.7522 },
      { id: 'bergen', name: 'Bergen', latitude: 60.3913, longitude: 5.3221 }
    ]
  };

  const quickPhrases = [
    { en: 'Good morning', nb: 'God morgen' },
    { en: 'How are you?', nb: 'Hvordan har du det?' },
    { en: 'Thank you', nb: 'Takk' },
    { en: 'My name is …', nb: 'Jeg heter …' },
    { en: 'I would like coffee', nb: 'Jeg vil gjerne ha kaffe' },
    { en: 'Excuse me', nb: 'Unnskyld' },
    { en: 'Where is the station?', nb: 'Hvor er stasjonen?' },
    { en: 'See you later', nb: 'Vi sees senere' }
  ];

  const state = {
    englishToNorwegian: true,
    currentOutputText: '',
    recognition: null,
    listening: false,
    history: loadHistory(),
    voices: []
  };

  const $ = (id) => document.getElementById(id);

  function loadHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CONFIG.historyKey) || '[]');
      return Array.isArray(parsed) ? parsed.slice(0, CONFIG.maxHistory) : [];
    } catch {
      return [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(CONFIG.historyKey, JSON.stringify(state.history));
    } catch (error) {
      console.warn('Could not save practice history.', error);
    }
  }

  function updateStatus(message, type = 'ready') {
    const text = $('status-text');
    const dot = $('status-dot');
    if (text) text.textContent = message;
    if (dot) dot.className = `status-dot is-${type}`;
  }

  function directionConfig() {
    return state.englishToNorwegian
      ? { from: 'en', to: 'nb', inputName: 'English', outputName: 'Norwegian Bokmål', inputSpeech: 'en-GB', outputSpeech: ['nb-NO', 'nb', 'no-NO', 'no'] }
      : { from: 'nb', to: 'en', inputName: 'Norwegian Bokmål', outputName: 'English', inputSpeech: 'nb-NO', outputSpeech: ['en-GB', 'en-US', 'en'] };
  }

  function updateDirectionUI() {
    const cfg = directionConfig();
    const inputLabel = $('input-language-label');
    const outputLabel = $('output-language-label');
    const inputFlag = $('input-flag');
    const swapButton = $('swap-button');
    const inputHint = $('input-hint');

    if (inputLabel) inputLabel.textContent = cfg.inputName;
    if (outputLabel) outputLabel.textContent = cfg.outputName;
    if (inputFlag) inputFlag.textContent = state.englishToNorwegian ? '🇬🇧' : '🇳🇴';
    if (swapButton) swapButton.textContent = state.englishToNorwegian ? 'Norwegian Bokmål → English' : 'English → Norwegian Bokmål';
    if (inputHint) inputHint.textContent = state.englishToNorwegian
      ? 'English (UK) speech recognition is requested when your browser supports it.'
      : 'Norwegian speech recognition is requested when your browser supports it.';

    const manualInput = $('manual-input');
    if (manualInput) manualInput.placeholder = state.englishToNorwegian ? 'Type an English sentence' : 'Type a Norwegian Bokmål sentence';
  }

  function showTranslation(input, translated) {
    const inputBox = $('input-box');
    const inputText = $('input-text');
    const outputBox = $('output-box');
    const emptyState = $('empty-state');
    const outputText = $('output-text');

    if (inputText) inputText.textContent = input;
    if (inputBox) inputBox.hidden = false;
    if (outputText) outputText.textContent = translated;
    if (outputBox) outputBox.hidden = false;
    if (emptyState) emptyState.hidden = true;
    state.currentOutputText = translated;
  }

  async function translateText(text) {
    const cfg = directionConfig();
    const params = new URLSearchParams({
      client: 'gtx',
      sl: cfg.from,
      tl: cfg.to,
      dt: 't',
      q: text
    });

    const response = await fetch(`${CONFIG.translationEndpoint}?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      mode: 'cors'
    });

    if (!response.ok) throw new Error(`Translation request failed (${response.status}).`);
    const data = await response.json();
    const translated = Array.isArray(data?.[0])
      ? data[0].filter(Array.isArray).map((item) => item[0]).filter(Boolean).join(' ')
      : '';

    if (!translated) throw new Error('No translation was returned.');
    return translated;
  }

  async function processTranslation(input, autoSpeak = false) {
    const text = input.trim();
    if (!text) return;

    updateStatus('Translating…', 'busy');
    const button = $('translate-button');
    if (button) button.disabled = true;

    try {
      const translated = await translateText(text);
      showTranslation(text, translated);
      saveConversation(text, translated);
      updateStatus('Ready', 'ready');
      if (autoSpeak) window.setTimeout(() => speakOutput(), 250);
    } catch (error) {
      console.error(error);
      updateStatus('Translation failed. Try again.', 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  function saveConversation(input, output) {
    state.history.unshift({
      id: Date.now(),
      input,
      output,
      time: new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date())
    });
    state.history = state.history.slice(0, CONFIG.maxHistory);
    saveHistory();
    renderHistory();
  }

  function createHistoryItem(item) {
    const article = document.createElement('article');
    article.className = 'card';

    const time = document.createElement('div');
    time.className = 'eyebrow';
    time.textContent = item.time;

    const input = document.createElement('p');
    input.textContent = item.input;

    const output = document.createElement('p');
    output.style.marginTop = '8px';
    output.style.fontWeight = '600';
    output.style.color = 'var(--accent)';
    output.textContent = item.output;

    article.append(time, input, output);
    return article;
  }

  function renderHistory() {
    const list = $('history-list');
    if (!list) return;
    list.replaceChildren();

    if (state.history.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'card';
      empty.textContent = 'No practice history yet. Your recent translations will appear here on this device.';
      list.appendChild(empty);
      return;
    }

    state.history.forEach((item) => list.appendChild(createHistoryItem(item)));
  }

  function clearHistory() {
    if (!state.history.length) return;
    if (!window.confirm('Clear your saved practice history from this device?')) return;
    state.history = [];
    saveHistory();
    renderHistory();
  }

  function renderQuickPhrases() {
    const list = $('quick-phrases');
    if (!list) return;
    list.replaceChildren();

    quickPhrases.forEach((phrase) => {
      const card = document.createElement('article');
      card.className = 'phrase-card';

      const en = document.createElement('div');
      en.className = 'en';
      en.textContent = phrase.en;

      const nb = document.createElement('div');
      nb.className = 'nb';
      nb.textContent = phrase.nb;

      const hear = document.createElement('button');
      hear.type = 'button';
      hear.className = 'secondary-button';
      hear.textContent = 'Hear phrase';
      hear.addEventListener('click', () => speakText(phrase.nb, ['nb-NO', 'nb', 'no-NO', 'no']));

      card.append(en, nb, hear);
      list.appendChild(card);
    });
  }

  function supportedSpeechRecognition() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  function createRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    return recognition;
  }

  function startListening() {
    if (state.listening) return;
    if (!supportedSpeechRecognition()) {
      updateStatus('Voice input is not available in this browser.', 'error');
      return;
    }

    if (!state.recognition) state.recognition = createRecognition();
    if (!state.recognition) return;

    const cfg = directionConfig();
    state.recognition.lang = cfg.inputSpeech;
    state.listening = true;
    updateStatus('Listening…', 'busy');

    const speakButton = $('speak-button');
    if (speakButton) {
      speakButton.textContent = 'Listening…';
      speakButton.disabled = true;
    }

    state.recognition.onresult = async (event) => {
      const transcript = event?.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) await processTranslation(transcript, true);
    };

    state.recognition.onerror = (event) => {
      const messages = {
        'not-allowed': 'Microphone permission was denied.',
        'service-not-allowed': 'Speech recognition service is unavailable.',
        'no-speech': 'No speech was detected. Please try again.',
        'audio-capture': 'No microphone was found.'
      };
      updateStatus(messages[event.error] || 'Voice input failed. Try again.', 'error');
    };

    state.recognition.onend = () => {
      state.listening = false;
      if (speakButton) {
        speakButton.disabled = false;
        speakButton.textContent = 'Start speaking';
      }
      if ($('status-text')?.textContent === 'Listening…') updateStatus('Ready', 'ready');
    };

    try {
      window.speechSynthesis?.cancel();
      state.recognition.start();
    } catch (error) {
      state.listening = false;
      if (speakButton) {
        speakButton.disabled = false;
        speakButton.textContent = 'Start speaking';
      }
      updateStatus('Could not start the microphone. Try again.', 'error');
      console.error(error);
    }
  }

  function loadVoices() {
    state.voices = window.speechSynthesis?.getVoices?.() || [];
  }

  function chooseVoice(preferredLanguages) {
    return state.voices.find((voice) => preferredLanguages.includes(voice.lang))
      || state.voices.find((voice) => preferredLanguages.some((lang) => voice.lang.toLowerCase().startsWith(lang.toLowerCase().split('-')[0])));
  }

  function speakText(text, preferredLanguages) {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = preferredLanguages[0];
    const voice = chooseVoice(preferredLanguages);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  function speakOutput() {
    const cfg = directionConfig();
    speakText(state.currentOutputText, cfg.outputSpeech);
  }

  async function copyOutput() {
    if (!state.currentOutputText) return;
    try {
      await navigator.clipboard.writeText(state.currentOutputText);
      updateStatus('Copied to clipboard.', 'ready');
    } catch {
      const temp = document.createElement('textarea');
      temp.value = state.currentOutputText;
      temp.setAttribute('readonly', '');
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
      updateStatus('Copied to clipboard.', 'ready');
    }
  }

  function swapDirection() {
    state.englishToNorwegian = !state.englishToNorwegian;
    state.currentOutputText = '';
    $('input-box')?.setAttribute('hidden', '');
    $('output-box')?.setAttribute('hidden', '');
    if ($('empty-state')) $('empty-state').hidden = false;
    updateDirectionUI();
    updateStatus('Ready', 'ready');
  }

  function weatherDescription(code) {
    const map = {
      0: ['Clear sky', '☀️'],
      1: ['Mainly clear', '🌤️'],
      2: ['Partly cloudy', '⛅'],
      3: ['Overcast', '☁️'],
      45: ['Fog', '🌫️'],
      48: ['Rime fog', '🌫️'],
      51: ['Light drizzle', '🌦️'],
      53: ['Drizzle', '🌦️'],
      55: ['Heavy drizzle', '🌧️'],
      56: ['Freezing drizzle', '🌧️'],
      57: ['Heavy freezing drizzle', '🌧️'],
      61: ['Light rain', '🌦️'],
      63: ['Rain', '🌧️'],
      65: ['Heavy rain', '🌧️'],
      66: ['Freezing rain', '🌧️'],
      67: ['Heavy freezing rain', '🌧️'],
      71: ['Light snow', '🌨️'],
      73: ['Snow', '🌨️'],
      75: ['Heavy snow', '❄️'],
      77: ['Snow grains', '❄️'],
      80: ['Light showers', '🌦️'],
      81: ['Showers', '🌧️'],
      82: ['Heavy showers', '🌧️'],
      85: ['Snow showers', '🌨️'],
      86: ['Heavy snow showers', '❄️'],
      95: ['Thunderstorm', '⛈️'],
      96: ['Thunderstorm with hail', '⛈️'],
      99: ['Heavy thunderstorm with hail', '⛈️']
    };
    return map[code] || ['Weather data available', '🌤️'];
  }

  async function fetchWeather(location) {
    const params = new URLSearchParams({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      timezone: 'auto'
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) throw new Error(`Weather request failed (${response.status}).`);
    return response.json();
  }

  function renderWeather(location, data) {
    const container = $(`${location.id}-weather`);
    if (!container) return;
    const current = data.current;
    const [description, icon] = weatherDescription(current.weather_code);

    const iconEl = container.querySelector('[data-weather-icon]');
    const descEl = container.querySelector('[data-weather-description]');
    const tempEl = container.querySelector('[data-weather-temp]');
    const metaEl = container.querySelector('[data-weather-meta]');
    const updatedEl = container.querySelector('[data-weather-updated]');

    if (iconEl) iconEl.textContent = icon;
    if (descEl) descEl.textContent = description;
    if (tempEl) tempEl.textContent = `${Math.round(current.temperature_2m)}°C`;
    if (metaEl) metaEl.textContent = `Feels like ${Math.round(current.apparent_temperature)}°C · Wind ${Math.round(current.wind_speed_10m)} km/h`;
    if (updatedEl) {
      const stamp = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: data.timezone }).format(new Date(current.time));
      updatedEl.textContent = `Updated ${stamp} (${data.timezone})`;
    }
  }

  async function updateWeather() {
    const errorBox = $('weather-error');
    if (errorBox) errorBox.hidden = true;

    try {
      await Promise.all(CONFIG.weatherLocations.map(async (location) => {
        const data = await fetchWeather(location);
        renderWeather(location, data);
      }));
    } catch (error) {
      console.error(error);
      if (errorBox) {
        errorBox.hidden = false;
        errorBox.textContent = 'Live weather could not be loaded right now. Please refresh the page or use the source link below.';
      }
    }
  }

  function updateClocks() {
    const now = new Date();
    const norway = $('norway-time');
    const local = $('local-time');
    const year = $('current-year');
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

    if (norway) norway.textContent = `Norway time: ${new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'Europe/Oslo' }).format(now)}`;
    if (local) local.textContent = `Your local time: ${new Intl.DateTimeFormat(undefined, options).format(now)}`;
    if (year) year.textContent = String(now.getFullYear());
  }

  function bindEvents() {
    $('swap-button')?.addEventListener('click', swapDirection);
    $('speak-button')?.addEventListener('click', startListening);
    $('pronounce-button')?.addEventListener('click', speakOutput);
    $('copy-button')?.addEventListener('click', copyOutput);
    $('clear-history')?.addEventListener('click', clearHistory);

    $('manual-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      processTranslation($('manual-input')?.value || '', false);
    });

    window.speechSynthesis?.addEventListener?.('voiceschanged', loadVoices);
  }

  function init() {
    updateDirectionUI();
    renderHistory();
    renderQuickPhrases();
    bindEvents();
    loadVoices();
    updateClocks();
    updateWeather();
    window.setInterval(updateClocks, 1000);
    window.setInterval(updateWeather, CONFIG.weatherRefreshMs);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
