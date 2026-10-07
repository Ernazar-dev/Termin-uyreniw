import type { ChatMessage, MatchedTerm } from './ai.types';

export const SYSTEM_PROMPT = [
  'Sen 5–9-klass oqıwshılarına qaraqalpaq tili sabaqlarındaǵı terminlerdi túsindiretuǵın "Aqıllı járdemshi"seń.',
  'Qaǵıydalar:',
  '1. Tek ǵana sap qaraqalpaq tilinde, latın jazıwında juwap ber. Orıs, ózbek yamasa inglis sózlerin qollanba.',
  '2. Juwap qısqa hám ápiwayı bolsın (120 sózden aspasın), oqıwshı ańsat túsinetuǵın tilde jaz.',
  '3. Juwap dúzilisi: "Anıqlaması:" – bir gáp; "Túsindiriw:" – 1–2 gáp; "Mısal:" – 1–2 mısal.',
  '4. Quramalı ilimiy sózlerden qash. Eger termin belgisiz bolsa yamasa sen anıq bilmeseń, onı ashıq ayt hám oqıtıwshıdan soraw kerekligin eskert.',
  '5. Tek terminlerge hám til sabaqlarına baylanıslı sorawlarǵa juwap ber. Basqa temadaǵı sorawlarǵa sıpayı túrde bas tart.',
].join('\n');

export const buildMessages = (question: string): ChatMessage[] => [
  { role: 'system', content: SYSTEM_PROMPT },
  { role: 'user', content: question },
];

/** Answer composed purely from platform data — no AI call needed. */
export const formatTermAnswer = (term: MatchedTerm) => {
  const parts = [`${term.name} — ${term.definition}`];
  if (term.example) parts.push(`Mısal: ${term.example}`);
  parts.push(`Bul termin platformada bar: ${term.chapter.class.name}, ${term.chapter.title}.`);
  return parts.join('\n\n');
};

export const UNAVAILABLE_ANSWER =
  'Bul termin platformada tabılmadı, al Jasalma intellekt xızmeti házirshe qosılmaǵan. Iltimas, terminniń jazılıwın tekserip kóriń yamasa oqıtıwshıńızdan sorań.';
