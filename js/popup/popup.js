import { loadProfile, saveProfile, resetStats } from '../shared/storage.js';
import { runtime } from '../shared/browser-api.js';
import { AudioFeedback } from '../shared/audio.js';
import { createGame } from '../games/reaction-rush/game.js';
import { randomTargetPosition } from '../games/reaction-rush/ui.js';

const $ = id => document.getElementById(id); let profile, strings, game, audio;
const languageCodes = ['en', 'fa', 'es', 'fr', 'de', 'ar', 'tr', 'sv', 'et', 'ja', 'ko', 'zh', 'it'];
const languageNames = { en: 'English', fa: 'فارسی', ar: 'العربية', es: 'Español', fr: 'Français', de: 'Deutsch', tr: 'Türkçe', sv: 'Svenska', et: 'Eesti', ja: '日本語', ko: '한국어', zh: '中文', it: 'Italiano' };
const resultLabels = {
  en: ['This round', 'Personal best', 'Overall average'], fa: ['این دور', 'رکوردهای شخصی', 'میانگین کل'],
  ar: ['هذه الجولة', 'الأرقام الشخصية', 'المتوسط العام'], es: ['Esta ronda', 'Récords personales', 'Promedio general'],
  fr: ['Cette manche', 'Records personnels', 'Moyenne générale'], de: ['Diese Runde', 'Persönliche Bestwerte', 'Gesamtdurchschnitt'],
  tr: ['Bu tur', 'Kişisel rekorlar', 'Genel ortalama'], sv: ['Den här rundan', 'Personbästa', 'Totalt genomsnitt'],
  et: ['See voor', 'Isiklikud rekordid', 'Üldine keskmine'], ja: ['今回のラウンド', '自己ベスト', '全体平均'],
  ko: ['이번 라운드', '개인 최고 기록', '전체 평균'], zh: ['本轮', '个人最佳', '总平均'],
  it: ['Questo round', 'Record personali', 'Media complessiva']
};
const fmt = ms => ms == null ? '—' : '\u2066' + ms + ' ms\u2069';
async function translate(code) { const short = languageCodes.includes(code?.split('-')[0]) ? code.split('-')[0] : 'en'; strings = await fetch(runtime.getURL(`i18n/${short}.json`)).then(r => r.json()); document.documentElement.lang = short; document.documentElement.dir = ['fa', 'ar'].includes(short) ? 'rtl' : 'ltr'; document.querySelectorAll('[data-i18n]').forEach(e => e.textContent = strings[e.dataset.i18n]); document.querySelectorAll('[data-i18n-aria]').forEach(e => e.setAttribute('aria-label', strings[e.dataset.i18nAria])); document.querySelectorAll('[data-i18n-title]').forEach(e => e.title = strings[e.dataset.i18nTitle] ?? ''); const labels = resultLabels[short] || resultLabels.en; $('roundResultsTitle').textContent = labels[0]; $('personalBestTitle').textContent = labels[1]; $('overallAverageLabel').textContent = labels[2]; $('version').textContent = strings.version.replace('{version}', '1.0.0'); $('languageSelect').value = short; profile.language = short; await saveProfile(profile); }
function renderStats() { const s = profile.stats; $('bestScore').textContent = s.highScore; $('bestReaction').textContent = fmt(s.fastestReaction); $('average').textContent = fmt(s.successfulClicks ? Math.round(s.totalReactionMs / s.successfulClicks) : null); }
function state(s) { $('score').textContent = s.score; $('combo').textContent = `×${s.combo}`; }
function message(key, extra = '') { $('message').textContent = key ? `${strings[key] ?? ''}${extra}` : ''; }
function setupGame() { game = createGame({ onState: s => { state(s); message('getReady'); }, onTime: ms => { $('countdown').textContent = Math.ceil(ms / 1000); }, onTarget: visible => { const t = $('target'); t.hidden = !visible; if (visible) { const p = randomTargetPosition($('gameArea'), t); t.style.left = `${p.left}px`; t.style.top = `${p.top}px`; message(''); } }, onEarly: s => { state(s); audio.beep('early'); message('tooEarly'); }, onHit: (ms, s) => { state(s); $('reaction').textContent = fmt(ms); audio.beep(); message(ms < 350 ? 'great' : 'nice', ` ${fmt(ms)}`); }, onFinish: async result => { $('pauseButton').hidden = true; $('restartButton').hidden = false; $('results').hidden = false; document.body.classList.add('finished'); const roundBest = result.reactions.length ? Math.min(...result.reactions) : null; $('roundScore').textContent = String(result.score); $('roundBestReaction').textContent = fmt(roundBest); $('roundAverage').textContent = fmt(result.average); profile.stats.gamesPlayed++; profile.stats.highScore = Math.max(profile.stats.highScore, result.score); for (const r of result.reactions) { profile.stats.fastestReaction = profile.stats.fastestReaction == null ? r : Math.min(profile.stats.fastestReaction, r); profile.stats.totalReactionMs += r; profile.stats.successfulClicks++; } await saveProfile(profile); renderStats(); message('gameOver'); } }); }
function start() { document.body.classList.remove('finished'); $('results').hidden = true; $('startButton').hidden = true; $('restartButton').hidden = true; $('pauseButton').hidden = false; $('reaction').textContent = '—'; game.start(); }
async function init() {
  profile = await loadProfile(); audio = new AudioFeedback(profile.sound); for (const code of languageCodes) $('languageSelect').add(new Option(languageNames[code], code)); $('soundToggle').checked = profile.sound; await translate(profile.language); renderStats(); setupGame(); $('startButton').onclick = start; $('restartButton').onclick = start; $('target').onclick = e => { e.stopPropagation(); game.hit(); }; $('gameArea').onclick = event => { if (!event.target.closest('#target')) game.miss(); }; document.addEventListener('keydown', event => {
    const isHitKey = event.code === 'Space' || event.key === 'Enter';
    if (!isHitKey || event.repeat || !$('settings').hidden) return;

    const control = event.target.closest?.('button, input, select, textarea, a');
    if (control && control.id !== 'target') return;

    event.preventDefault();
    event.stopPropagation();
    game.hit();
  }); $('pauseButton').onclick = () => { const paused = game.togglePause(); $('pauseButton').textContent = strings[paused ? 'resume' : 'pause']; message(paused ? 'paused' : 'getReady'); }; $('settingsButton').onclick = () => { $('settings').hidden = !$('settings').hidden; }; $('languageSelect').onchange = e => translate(e.target.value); $('soundToggle').onchange = async e => { profile.sound = e.target.checked; audio.setEnabled(profile.sound); await saveProfile(profile); }; $('resetButton').onclick = async () => { profile.stats = await resetStats(); renderStats(); message('statsReset'); };
}
init();
