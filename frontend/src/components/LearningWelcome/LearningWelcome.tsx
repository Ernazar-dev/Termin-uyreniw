import {
  ArrowRightOutlined,
  BookOutlined,
  CheckCircleFilled,
  FileDoneOutlined,
  PlayCircleOutlined,
  PauseOutlined,
  CaretRightOutlined,
  RobotOutlined,
  StarFilled,
} from '@ant-design/icons';
import { Button } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import styles from './LearningWelcome.module.scss';

const shortcuts = [
  { icon: <BookOutlined />, title: 'Terminler', text: 'Oqıń', to: ROUTES.student.terms, tone: 'indigo' },
  { icon: <PlayCircleOutlined />, title: 'Oyınlar', text: 'Oynań', to: ROUTES.student.games, tone: 'amber' },
  { icon: <FileDoneOutlined />, title: 'Testler', text: 'Sınań', to: ROUTES.student.tests, tone: 'teal' },
  { icon: <RobotOutlined />, title: 'Aqıllı járdemshi', text: 'Sorań', to: ROUTES.student.ai, tone: 'pink' },
] as const;

/** Rotating flashcards in the hero — a quick taste of what the platform teaches. */
const FLASHCARDS = [
  { term: 'Sinonim', meaning: 'Mánisi jaqın sózler', example: ['Sulıw', 'Gózzal'], hint: 'Sózler basqa, mánisi jaqın.', symbol: '≈' },
  { term: 'Antonim', meaning: 'Qarama-qarsı mánili sózler', example: ['Issı', 'Suwıq'], hint: 'Eki sóz, qarama-qarsı máni.', symbol: '↔' },
  { term: 'Omonim', meaning: 'Jazılıwı birdey, mánisi hár qıylı sózler', example: ['Ay', 'Ay'], hint: 'Aspandaǵı ay hám jıldıń bir ayı.', symbol: '=' },
];

const ROTATE_MS = 5200;

export const LearningWelcome = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const interacting = hovered || focused;

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: number | undefined;
    const update = () => {
      window.clearInterval(timer);
      if (!preference.matches && !paused && !interacting && !document.hidden) {
        timer = window.setInterval(() => setIndex((current) => (current + 1) % FLASHCARDS.length), ROTATE_MS);
      }
    };
    update();
    preference.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      preference.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [paused, interacting]);

  return (
    <div className={styles.welcome}>
      <section className={styles.hero} aria-labelledby="learning-title">
        <div className={styles.blobs} aria-hidden="true">
          <span /><span /><span />
        </div>

        <div className={styles.copy}>
          <span className={styles.eyebrow}><StarFilled /> Qaraqalpaq tili</span>
          <h1 id="learning-title">
            Sózdi túsiniń.<br /><span className={styles.gradientText}>Bilimdi keńeytiń.</span>
          </h1>
          <p>Terminlerdi oqıń, oynań hám ózińizdi sınań.</p>
          <div className={styles.ctas}>
            <Link to={ROUTES.student.terms}>
              <Button type="primary" size="large" className={styles.primaryCta}>
                Baslaw <ArrowRightOutlined />
              </Button>
            </Link>
            <Link to={ROUTES.student.games}>
              <Button size="large" icon={<PlayCircleOutlined />}>Oynaw</Button>
            </Link>
          </div>
        </div>

        <div className={styles.visual} data-paused={paused || interacting}
          onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
          <div className={styles.scene}>
            <div className={styles.halo} aria-hidden="true" />
            <div className={styles.orbit} aria-hidden="true"><i /><i /></div>
            <div className={styles.letters} aria-hidden="true"><span>Á</span><span>Ó</span><span>Ń</span></div>
            <div className={styles.cardBack} aria-hidden="true" />
            <div className={styles.cardMiddle} aria-hidden="true" />
            {FLASHCARDS.map((card, position) => (
              <div key={card.term} className={styles.flashcard} data-active={position === index}
                data-tone={position} aria-hidden={position !== index}>
                <div className={styles.flashHeader}>
                  <span className={styles.flashLabel}><BookOutlined /> Sóz sırları</span>
                  <span className={styles.cardNumber}>0{position + 1}<span> / 03</span></span>
                </div>
                <strong className={styles.flashTerm}>{card.term}</strong>
                <span className={styles.flashMeaning}>{card.meaning}</span>
                <div className={styles.flashExample}>
                  <span>{card.example[0]}</span>
                  <span className={styles.flashArrow}>{card.symbol}</span>
                  <span>{card.example[1]}</span>
                </div>
                <span className={styles.flashHint}>{card.hint}</span>
                <div className={styles.cardFooter}><span /><span /><span /></div>
              </div>
            ))}
            <span className={`${styles.chip} ${styles.chipTop}`} aria-hidden="true"><CheckCircleFilled /> Birge úyrenemiz</span>
            <span className={`${styles.chip} ${styles.chipBottom}`} aria-hidden="true"><StarFilled /> Hár kúni jańa sóz</span>
          </div>
          <div className={styles.visualControls}>
            <div className={styles.dots} role="group" aria-label="Termin mısalları">
              {FLASHCARDS.map((item, dot) => (
                <button key={item.term} type="button" aria-label={item.term} aria-pressed={dot === index}
                  className={dot === index ? styles.dotActive : undefined}
                  onClick={() => { setIndex(dot); setPaused(true); }}><span /></button>
              ))}
            </div>
            <button type="button" className={styles.pauseButton} aria-label={paused ? 'Animaciyanı dawam ettiriw' : 'Animaciyanı toqtatıw'}
              aria-pressed={paused} onClick={() => setPaused(value => !value)}>
              {paused ? <CaretRightOutlined /> : <PauseOutlined />}
            </button>
          </div>
        </div>
      </section>

      <nav className={styles.shortcuts} aria-label="Úyreniw bólimleri">
        {shortcuts.map((item, order) => (
          <Link
            key={item.to}
            to={item.to}
            className={`${styles.shortcut} ${styles[item.tone]}`}
            style={{ animationDelay: `${200 + order * 90}ms` }}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.shortcutText}>
              <strong>{item.title}</strong>
              <small>{item.text}</small>
            </span>
            <ArrowRightOutlined className={styles.arrow} />
          </Link>
        ))}
      </nav>
    </div>
  );
};
