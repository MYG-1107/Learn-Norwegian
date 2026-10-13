(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const KEY = 'learnNorwegianHistory';
  const MAX_HISTORY = 8;
  let englishToNorwegian = true;
  let currentOutput = '';
  let recognition = null;
  let listening = false;
  let voices = [];
  let history = readHistory();
  const weatherLocations = [
    { id: 'oslo', name: 'Oslo', latitude: 59.9139, longitude: 10.7522 },
    { id: 'bergen', name: 'Bergen', latitude: 60.3913, longitude: 5.3221 }
  ];
  const phrases = [
    { en: 'Good morning', nb: 'God morgen' }, { en: 'Hello', nb: 'Hei' },
    { en: 'How are you?', nb: 'Hvordan har du det?' }, { en: 'Thank you', nb: 'Takk' },
    { en: 'Please', nb: 'Vær så snill' }, { en: 'My name is …', nb: 'Jeg heter …' },
    { en: 'I do not understand', nb: 'Jeg forstår ikke' }, { en: 'Where is the station?', nb: 'Hvor er stasjonen?' }
  ];

  function readHistory() {
    try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value.slice(0, MAX_HISTORY) : []; }
    catch { return []; }
  }
  function setStatus(message, type = 'ready') {
    if ($('status-text')) $('status-text').textContent = message;
    if ($('status-dot')) $('status-dot').className = `status-dot is-${type}`;
  }
  function cfg() {
    return englishToNorwegian
      ? { from: 'en', to: 'nb', input: 'English', output: 'Norwegian Bokmål', speechIn: 'en-GB', speechOut: ['nb-NO', 'nb', 'no-NO', 'no'] }
      : { from: 'nb', to: 'en', input: 'Norwegian Bokmål', output: 'English', speechIn: 'nb-NO', speechOut: ['en-GB', 'en-US', 'en'] };
  }
  function updateDirection() {
    const c = cfg();
    if ($('direction-pill')) $('direction-pill').textContent = `${c.input} → ${c.output}`;
    if ($('input-language-label')) $('input-language-label').textContent = c.input;
    if ($('output-language-label')) $('output-language-label').textContent = c.output;
    if ($('input-hint')) $('input-hint').textContent = `Voice recognition requests ${c.speechIn}; availability depends on your browser.`;
    if ($('manual-input')) $('manual-input').placeholder = c.input === 'English' ? 'Type an English sentence' : 'Type a Norwegian Bokmål sentence';
    if ($('swap-button')) $('swap-button').textContent = `Switch to ${c.output} → ${c.input}`;
  }
  async function translateText(text) {
    const c = cfg();
    const params = new URLSearchParams({ client: 'gtx', sl: c.from, tl: c.to, dt: 't', q: text });
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`, { headers: { Accept: 'application/json' }, mode: 'cors' });
    if (!response.ok) throw new Error(`Translation request failed (${response.status}).`);
    const data = await response.json();
    const result = Array.isArray(data?.[0]) ? data[0].filter(Array.isArray).map((row) => row[0]).filter(Boolean).join(' ') : '';
    if (!result) throw new Error('No translation returned.');
    return result;
  }
  function addHistory(input, output) {
    history.unshift({ input, output, time: new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date()) });
    history = history.slice(0, MAX_HISTORY);
    try { localStorage.setItem(KEY, JSON.stringify(history)); } catch { setStatus('Translation worked, but browser storage is unavailable.'); }
    renderHistory();
  }
  function renderHistory() {
    const root = $('history-list'); if (!root) return;
    root.replaceChildren();
    if (!history.length) { const p = document.createElement('p'); p.className = 'muted empty-note'; p.textContent = 'Your recent translations will appear here.'; root.appendChild(p); return; }
    history.forEach((item) => {
      const row = document.createElement('article'); row.className = 'history-item';
      const left = document.createElement('div'); const right = document.createElement('div'); const stamp = document.createElement('span');
      const leftLabel = document.createElement('span'); leftLabel.className = 'eyebrow'; leftLabel.textContent = 'Input';
      const inText = document.createElement('p'); inText.textContent = item.input;
      const rightLabel = document.createElement('span'); rightLabel.className = 'eyebrow'; rightLabel.textContent = 'Translation';
      const outText = document.createElement('p'); outText.textContent = item.output;
      stamp.className = 'history-time'; stamp.textContent = item.time || '';
      left.append(leftLabel, inText); right.append(rightLabel, outText); row.append(left, right, stamp); root.appendChild(row);
    });
  }
  async function processTranslation(raw, autoSpeak = false) {
    const text = String(raw || '').trim(); if (!text) { setStatus('Enter a sentence first.', 'error'); return; }
    setStatus('Translating…', 'busy');
    if ($('translate-button')) $('translate-button').disabled = true;
    try {
      const result = await translateText(text);
      currentOutput = result;
      if ($('input-text')) $('input-text').textContent = text;
      if ($('input-box')) $('input-box').hidden = false;
      if ($('output-text')) $('output-text').textContent = result;
      if ($('output-box')) $('output-box').hidden = false;
      if ($('empty-state')) $('empty-state').hidden = true;
      addHistory(text, result); setStatus('Translation ready. Listen and repeat.');
      if (autoSpeak) window.setTimeout(speakOutput, 200);
    } catch (error) {
      console.error(error); setStatus('Translation failed. Check your connection or try a shorter sentence.', 'error');
    } finally { if ($('translate-button')) $('translate-button').disabled = false; }
  }
  function supportedRecognition() { return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window; }
  function listen() {
    if (listening) return;
    if (!supportedRecognition()) { setStatus('Voice input is not supported here. Please type your sentence instead.', 'error'); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!recognition) recognition = new SpeechRecognition();
    recognition.continuous = false; recognition.interimResults = false; recognition.maxAlternatives = 1; recognition.lang = cfg().speechIn;
    recognition.onresult = (event) => { const transcript = event?.results?.[0]?.[0]?.transcript?.trim(); if (transcript) processTranslation(transcript, true); };
    recognition.onerror = (event) => { const messages = { 'not-allowed': 'Microphone permission was denied.', 'service-not-allowed': 'Speech recognition service is unavailable.', 'no-speech': 'No speech was detected. Try again.', 'audio-capture': 'No microphone was found.' }; setStatus(messages[event.error] || 'Voice input failed. You can type instead.', 'error'); };
    recognition.onend = () => { listening = false; if ($('speak-button')) { $('speak-button').disabled = false; $('speak-button').textContent = 'Start speaking'; } if ($('status-text')?.textContent === 'Listening…') setStatus('Ready to practise.'); };
    try { window.speechSynthesis?.cancel(); listening = true; if ($('speak-button')) { $('speak-button').disabled = true; $('speak-button').textContent = 'Listening…'; } setStatus('Listening…', 'busy'); recognition.start(); }
    catch (error) { listening = false; if ($('speak-button')) { $('speak-button').disabled = false; $('speak-button').textContent = 'Start speaking'; } setStatus('Could not start the microphone. Check your browser permissions.', 'error'); console.error(error); }
  }
  function loadVoices() { voices = window.speechSynthesis?.getVoices?.() || []; }
  function speakText(text, preferred = ['nb-NO', 'nb', 'no-NO', 'no']) {
    if (!text || !('speechSynthesis' in window)) { setStatus('Speech playback is not available in this browser.', 'error'); return; }
    window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = preferred[0];
    const voice = voices.find((v) => preferred.includes(v.lang)) || voices.find((v) => preferred.some((lang) => v.lang.toLowerCase().startsWith(lang.toLowerCase().split('-')[0])));
    if (voice) utterance.voice = voice; window.speechSynthesis.speak(utterance);
  }
  function speakOutput() { speakText(currentOutput, cfg().speechOut); }
  async function copyOutput() {
    if (!currentOutput) return;
    try { await navigator.clipboard.writeText(currentOutput); setStatus('Translation copied.'); }
    catch { const temp = document.createElement('textarea'); temp.value = currentOutput; temp.setAttribute('readonly', ''); temp.style.position = 'fixed'; temp.style.opacity = '0'; document.body.appendChild(temp); temp.select(); const ok = document.execCommand('copy'); temp.remove(); setStatus(ok ? 'Translation copied.' : 'Copy failed; select the text manually.', ok ? 'ready' : 'error'); }
  }
  const weatherCodes = { 0:['Clear sky','☀️'],1:['Mainly clear','🌤️'],2:['Partly cloudy','⛅'],3:['Overcast','☁️'],45:['Fog','🌫️'],48:['Rime fog','🌫️'],51:['Light drizzle','🌦️'],53:['Drizzle','🌦️'],55:['Heavy drizzle','🌧️'],56:['Freezing drizzle','🌧️'],57:['Heavy freezing drizzle','🌧️'],61:['Light rain','🌦️'],63:['Rain','🌧️'],65:['Heavy rain','🌧️'],66:['Freezing rain','🌧️'],67:['Heavy freezing rain','🌧️'],71:['Light snow','🌨️'],73:['Snow','🌨️'],75:['Heavy snow','❄️'],77:['Snow grains','❄️'],80:['Light showers','🌦️'],81:['Showers','🌧️'],82:['Heavy showers','🌧️'],85:['Snow showers','🌨️'],86:['Heavy snow showers','❄️'],95:['Thunderstorm','⛈️'],96:['Thunderstorm with hail','⛈️'],99:['Heavy thunderstorm with hail','⛈️'] };
  async function fetchWeather(location) {
    const params = new URLSearchParams({ latitude: location.latitude, longitude: location.longitude, current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m', temperature_unit: 'celsius', wind_speed_unit: 'kmh', timezone: 'auto' });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`); if (!response.ok) throw new Error(`Weather request failed (${response.status})`); return response.json();
  }
  function renderWeather(location, data) {
    const root = $(`${location.id}-weather`); if (!root || !data?.current) return; const c = data.current; const [desc, icon] = weatherCodes[c.weather_code] || ['Weather data available','🌤️'];
    root.querySelector('[data-weather-icon]')?.replaceChildren(document.createTextNode(icon));
    const temp = root.querySelector('[data-weather-temp]'); if (temp) temp.textContent = `${Math.round(c.temperature_2m)}°C`;
    const description = root.querySelector('[data-weather-description]'); if (description) description.textContent = desc;
    const meta = root.querySelector('[data-weather-meta]'); if (meta) meta.textContent = `Feels like ${Math.round(c.apparent_temperature)}°C · Wind ${Math.round(c.wind_speed_10m)} km/h`;
    const updated = root.querySelector('[data-weather-updated]'); if (updated) updated.textContent = `Updated ${String(c.time).replace('T', ' ')} (${data.timezone})`; 
  }
  async function updateWeather() {
    if (!$('oslo-weather') && !$('bergen-weather')) return;
    const error = $('weather-error'); if (error) error.hidden = true;
    try { await Promise.all(weatherLocations.map(async (place) => renderWeather(place, await fetchWeather(place)))); }
    catch (e) { console.warn('Weather is unavailable', e); if (error) { error.hidden = false; error.textContent = 'Live weather is unavailable right now. Learning content is still available.'; } }
  }
  function updateClocks() {
    const now = new Date(); if ($('norway-time')) $('norway-time').textContent = `Norway time: ${new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Europe/Oslo'}).format(now)}`;
    if ($('local-time')) $('local-time').textContent = `Your local time: ${new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(now)}`;
    if ($('current-year')) $('current-year').textContent = String(now.getFullYear());
  }
  function renderQuickPhrases() {
    // Static phrasebook content remains available without JavaScript; speech buttons are progressive enhancement.
    document.querySelectorAll('[data-speak]').forEach((button) => button.addEventListener('click', () => speakText(button.getAttribute('data-speak'), ['nb-NO','nb','no-NO','no'])));
  }
  function bindEvents() {
    $('swap-button')?.addEventListener('click', () => { englishToNorwegian = !englishToNorwegian; currentOutput = ''; if ($('input-box')) $('input-box').hidden = true; if ($('output-box')) $('output-box').hidden = true; if ($('empty-state')) $('empty-state').hidden = false; updateDirection(); setStatus('Ready to practise.'); });
    $('speak-button')?.addEventListener('click', listen); $('pronounce-button')?.addEventListener('click', speakOutput); $('copy-button')?.addEventListener('click', copyOutput);
    $('manual-form')?.addEventListener('submit', (event) => { event.preventDefault(); processTranslation($('manual-input')?.value || ''); });
    $('clear-history')?.addEventListener('click', () => { if (!history.length || !window.confirm('Clear recent translations saved on this device?')) return; history = []; try { localStorage.removeItem(KEY); } catch {} renderHistory(); setStatus('Recent practice cleared.'); });
    window.speechSynthesis?.addEventListener?.('voiceschanged', loadVoices);
  }
  document.addEventListener('DOMContentLoaded', () => { updateDirection(); renderHistory(); bindEvents(); renderQuickPhrases(); loadVoices(); updateClocks(); updateWeather(); window.setInterval(updateClocks, 1000); window.setInterval(updateWeather, 10 * 60 * 1000); });
})();
