(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = 'learnNorwegianLearningProgressV1';
  const WORDS = [
    { id:'hei', nb:'Hei', en:'Hello', category:'Greetings', type:'Greeting', example:'Hei! Hvordan har du det?' },
    { id:'god-morgen', nb:'God morgen', en:'Good morning', category:'Greetings', type:'Greeting', example:'God morgen, alle sammen.' },
    { id:'ha-det', nb:'Ha det', en:'Goodbye', category:'Greetings', type:'Phrase', example:'Ha det! Vi sees i morgen.' },
    { id:'takk', nb:'Takk', en:'Thank you', category:'Polite phrases', type:'Polite phrase', example:'Takk for hjelpen.' },
    { id:'vaer-sa-snill', nb:'Vær så snill', en:'Please', category:'Polite phrases', type:'Polite phrase', example:'En kaffe, vær så snill.' },
    { id:'unnskyld', nb:'Unnskyld', en:'Excuse me / sorry', category:'Polite phrases', type:'Polite phrase', example:'Unnskyld, hvor er stasjonen?' },
    { id:'ja', nb:'Ja', en:'Yes', category:'Everyday', type:'Word', example:'Ja, det går bra.' },
    { id:'nei', nb:'Nei', en:'No', category:'Everyday', type:'Word', example:'Nei, takk.' },
    { id:'vann', nb:'Vann', en:'Water', category:'Food and drink', type:'Noun', example:'Kan jeg få et glass vann?' },
    { id:'kaffe', nb:'Kaffe', en:'Coffee', category:'Food and drink', type:'Noun', example:'Jeg vil gjerne ha kaffe.' },
    { id:'te', nb:'Te', en:'Tea', category:'Food and drink', type:'Noun', example:'Vil du ha te eller kaffe?' },
    { id:'brod', nb:'Brød', en:'Bread', category:'Food and drink', type:'Noun', example:'Jeg kjøper brød.' },
    { id:'eple', nb:'Eple', en:'Apple', category:'Food and drink', type:'Noun', example:'Jeg spiser et eple.' },
    { id:'tog', nb:'Tog', en:'Train', category:'Travel', type:'Noun', example:'Når går toget?' },
    { id:'stasjon', nb:'Stasjon', en:'Station', category:'Travel', type:'Noun', example:'Hvor er stasjonen?' },
    { id:'billett', nb:'Billett', en:'Ticket', category:'Travel', type:'Noun', example:'Jeg trenger en billett.' },
    { id:'venstre', nb:'Venstre', en:'Left', category:'Travel', type:'Direction', example:'Ta til venstre.' },
    { id:'hoyre', nb:'Høyre', en:'Right', category:'Travel', type:'Direction', example:'Ta til høyre.' },
    { id:'i-dag', nb:'I dag', en:'Today', category:'Time', type:'Time expression', example:'Jeg jobber i dag.' },
    { id:'i-morgen', nb:'I morgen', en:'Tomorrow', category:'Time', type:'Time expression', example:'Vi sees i morgen.' },
    { id:'na', nb:'Nå', en:'Now', category:'Time', type:'Time expression', example:'Jeg må gå nå.' },
    { id:'arbeid', nb:'Arbeid', en:'Work', category:'Work and study', type:'Noun', example:'Jeg er på arbeid.' },
    { id:'laerer', nb:'Lærer', en:'Teacher', category:'Work and study', type:'Noun', example:'Læreren snakker norsk.' },
    { id:'student', nb:'Student', en:'Student', category:'Work and study', type:'Noun', example:'Jeg er student.' },
    { id:'hjem', nb:'Hjem', en:'Home', category:'Places', type:'Noun / adverb', example:'Jeg går hjem.' },
    { id:'butikk', nb:'Butikk', en:'Shop / store', category:'Places', type:'Noun', example:'Butikken er åpen.' },
    { id:'familie', nb:'Familie', en:'Family', category:'People', type:'Noun', example:'Familien min bor i Norge.' },
    { id:'venn', nb:'Venn', en:'Friend', category:'People', type:'Noun', example:'Han er en god venn.' },
    { id:'snakke', nb:'Å snakke', en:'To speak / talk', category:'Verbs', type:'Verb', example:'Jeg vil snakke norsk.' },
    { id:'forsta', nb:'Å forstå', en:'To understand', category:'Verbs', type:'Verb', example:'Jeg forstår litt norsk.' },
    { id:'laere', nb:'Å lære', en:'To learn', category:'Verbs', type:'Verb', example:'Jeg lærer norsk.' },
    { id:'vaere', nb:'Å være', en:'To be', category:'Verbs', type:'Verb', example:'Jeg er her.' }
  ];
  const freshProgress = () => ({ known: [], review: [], quizAttempts: 0, bestScore: null, lastStudyDay: '', streak: 0 });
  let progress = loadProgress();
  let visibleWords = WORDS.slice();
  let cardIndex = 0;
  let answerVisible = false;
  let quiz = null;
  function loadProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!raw || typeof raw !== 'object') return freshProgress();
      return { ...freshProgress(), ...raw, known: Array.isArray(raw.known) ? raw.known : [], review: Array.isArray(raw.review) ? raw.review : [] };
    } catch { return freshProgress(); }
  }
  function saveProgress() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { showNotice('Your browser blocked local storage, so progress will not persist after this page closes.'); } }
  function showNotice(message) { const note = $('learning-notice'); if (note) { note.hidden = false; note.textContent = message; } }
  function dayKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
  function shiftDay(day, offset) { const date = new Date(`${day}T12:00:00`); date.setDate(date.getDate()+offset); return dayKey(date); }
  function recordStudy() {
    const today = dayKey();
    if (progress.lastStudyDay !== today) { progress.streak = progress.lastStudyDay === shiftDay(today, -1) ? (Number(progress.streak)||0)+1 : 1; progress.lastStudyDay = today; }
    saveProgress(); renderStats();
  }
  function renderStats() {
    $('stat-mastered').textContent = String(progress.known.length);
    $('stat-practice').textContent = String(progress.review.filter(id => !progress.known.includes(id)).length);
    $('stat-streak').textContent = String(progress.streak || 0);
    $('stat-best').textContent = progress.bestScore === null ? '—' : `${progress.bestScore}/5`;
  }
  function populateCategories() {
    const select = $('category-filter'); if (!select) return;
    [...new Set(WORDS.map(word => word.category))].sort().forEach(category => { const option = document.createElement('option'); option.value = category; option.textContent = category; select.appendChild(option); });
  }
  function currentWord() { return visibleWords[Math.max(0, Math.min(cardIndex, visibleWords.length-1))] || WORDS[0]; }
  function renderCard() {
    if (!visibleWords.length) { visibleWords = WORDS.slice(); cardIndex = 0; }
    const word = currentWord(); answerVisible = false;
    $('card-category').textContent = word.category; $('card-type').textContent = word.type; $('card-word').textContent = word.nb;
    $('card-meaning').textContent = word.en; $('card-example').textContent = word.example; $('card-answer').hidden = true;
    $('reveal-card').textContent = 'Show answer'; $('card-position').textContent = `Card ${cardIndex+1} of ${visibleWords.length}`;
    $('mark-known').textContent = progress.known.includes(word.id) ? 'Known ✓' : 'I know this';
    $('mark-review').textContent = progress.review.includes(word.id) && !progress.known.includes(word.id) ? 'In review list ✓' : 'Practise again';
    $('speak-card').disabled = !('speechSynthesis' in window);
  }
  function moveCard(offset) { cardIndex = (cardIndex + offset + visibleWords.length) % visibleWords.length; renderCard(); }
  function revealCard() { answerVisible = !answerVisible; $('card-answer').hidden = !answerVisible; $('reveal-card').textContent = answerVisible ? 'Hide answer' : 'Show answer'; }
  function filterCards(category) { visibleWords = category === 'all' ? WORDS.slice() : WORDS.filter(word => word.category === category); cardIndex = 0; renderCard(); }
  function speak(word) {
    if (!('speechSynthesis' in window)) { showNotice('Speech playback is not available in this browser.'); return; }
    window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(word); utterance.lang = 'nb-NO'; window.speechSynthesis.speak(utterance);
  }
  function markKnown(isKnown) {
    const word = currentWord();
    if (isKnown) { if (!progress.known.includes(word.id)) progress.known.push(word.id); progress.review = progress.review.filter(id => id !== word.id); }
    else { progress.known = progress.known.filter(id => id !== word.id); progress.review = [...new Set([...progress.review, word.id])]; }
    recordStudy(); moveCard(1);
  }
  function shuffled(items) { const copy = items.slice(); for (let i=copy.length-1;i>0;i--) { const j = Math.floor(Math.random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]]; } return copy; }
  function startQuiz() {
    const questions = shuffled(WORDS).slice(0,5).map(word => ({ word, options: shuffled([word, ...shuffled(WORDS.filter(item => item.id !== word.id)).slice(0,3)]), answer: null }));
    quiz = { questions, index: 0, score: 0 }; $('quiz-start').hidden = true; $('quiz-result').hidden = true; $('quiz-panel').hidden = false; renderQuestion();
  }
  function renderQuestion() {
    const q = quiz.questions[quiz.index]; $('quiz-count').textContent = `Question ${quiz.index+1} of ${quiz.questions.length}`; $('quiz-question').textContent = `What does “${q.word.nb}” mean?`;
    $('quiz-options').replaceChildren(); $('quiz-feedback').textContent = ''; $('quiz-feedback').className = 'quiz-feedback'; $('quiz-next').hidden = true;
    q.options.forEach(option => { const button = document.createElement('button'); button.type = 'button'; button.className = 'quiz-option'; button.textContent = option.en; button.addEventListener('click', () => answerQuestion(button, option, q)); $('quiz-options').appendChild(button); });
  }
  function answerQuestion(button, option, question) {
    if (question.answer !== null) return;
    question.answer = option.id; const correct = option.id === question.word.id; if (correct) quiz.score++;
    $('quiz-options').querySelectorAll('button').forEach(node => { node.disabled = true; if (node.textContent === question.word.en) node.classList.add('correct'); });
    if (!correct) button.classList.add('incorrect'); $('quiz-feedback').textContent = correct ? 'Correct — well done!' : `Not quite. “${question.word.nb}” means “${question.word.en}”.`; $('quiz-feedback').classList.add(correct ? 'success' : 'error');
    $('quiz-next').textContent = quiz.index === quiz.questions.length-1 ? 'See my score' : 'Next question'; $('quiz-next').hidden = false; recordStudy();
  }
  function nextQuestion() {
    if (quiz.index < quiz.questions.length-1) { quiz.index++; renderQuestion(); return; }
    progress.quizAttempts = (Number(progress.quizAttempts)||0)+1; progress.bestScore = progress.bestScore === null ? quiz.score : Math.max(progress.bestScore, quiz.score); saveProgress(); renderStats();
    $('quiz-panel').hidden = true; $('quiz-result').hidden = false; $('quiz-score').textContent = `You scored ${quiz.score} out of 5`;
    $('quiz-message').textContent = quiz.score === 5 ? 'Excellent recall. Try another category or return tomorrow.' : quiz.score >= 3 ? 'Good practice. Review the words you missed and try again later.' : 'Use the flashcards first, then take the quiz again. Remember, mistakes are part of learning.';
    $('quiz-start').hidden = true;
  }
  function setupDailyWord() {
    const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = Math.floor((today - new Date(now.getFullYear(), 0, 1)) / 86400000);
    const word = WORDS[day % WORDS.length]; $('daily-word').textContent = word.nb; $('daily-meaning').textContent = word.en; $('speak-daily').addEventListener('click', () => speak(word.nb));
  }
  function reset() {
    if (!window.confirm('Reset all vocabulary and quiz progress saved on this device? This cannot be undone.')) return;
    progress = freshProgress(); saveProgress(); renderStats(); renderCard(); showNotice('Progress reset for this browser.');
  }
  document.addEventListener('DOMContentLoaded', () => {
    populateCategories(); renderStats(); renderCard(); setupDailyWord();
    $('category-filter').addEventListener('change', event => filterCards(event.target.value));
    $('reveal-card').addEventListener('click', revealCard); $('previous-card').addEventListener('click', () => moveCard(-1)); $('next-card').addEventListener('click', () => moveCard(1)); $('shuffle-cards').addEventListener('click', () => { visibleWords = shuffled(visibleWords); cardIndex = 0; renderCard(); });
    $('mark-known').addEventListener('click', () => markKnown(true)); $('mark-review').addEventListener('click', () => markKnown(false)); $('speak-card').addEventListener('click', () => speak(currentWord().nb));
    $('start-quiz').addEventListener('click', startQuiz); $('retry-quiz').addEventListener('click', startQuiz); $('quiz-next').addEventListener('click', nextQuestion); $('reset-progress').addEventListener('click', reset);
    if ($('current-year')) $('current-year').textContent = String(new Date().getFullYear());
  });
})();
