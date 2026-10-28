import { useEffect, useRef, useState } from 'react'
import {
  AUDIENCES,
  BOARD,
  DIFFERENTIATORS,
  GENERAL_GOAL,
  GOALS,
  REFERENCES,
  SECTORS,
  SPECIFIC_GOALS,
  TEAM,
  TITLE,
} from '../../content/feria.js'
import './feria.css'

const BASE = import.meta.env.BASE_URL

const GLYPHS = {
  pin: 'M12 21s-6.5-5.8-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.2-6.5 11-6.5 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  route: 'M6 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM18 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM6 8v3a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v-1',
  stop: 'M12 3v18M7 3h10v7H7zM9 21h6',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  bus: 'M5 4h14a1 1 0 0 1 1 1v11H4V5a1 1 0 0 1 1-1zM4 11h16M7 16v3M17 16v3M7.5 13.5h.01M16.5 13.5h.01',
  pulse: 'M3 12h4l2.5-6 4 12 2.5-6h5',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4',
  browser: 'M3 5h18v14H3zM3 9h18M6 7h.01M9 7h.01',
  shield: 'M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6zM9 12l2.2 2.2L15.5 10',
  book: 'M3 5c3 0 6 .5 9 2 3-1.5 6-2 9-2v13c-3 0-6 .5-9 2-3-1.5-6-2-9-2zM12 7v13',
  chip: 'M8 8h8v8H8zM10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3',
  city: 'M3 21h18M5 21V9h6v12M11 21V4h8v17M8 12h.01M8 16h.01M14 8h2M14 12h2M14 16h2',
  leaf: 'M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19c2-5 5-8 9-10',
}

function Glyph({ name, size = 24 }) {
  return (
    <svg
      className="glyph"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={GLYPHS[name]} />
    </svg>
  )
}

function BusMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={GLYPHS.bus} />
    </svg>
  )
}

function Stop({ id, title, tone, children }) {
  return (
    <section className={`stop${tone ? ` stop--${tone}` : ''}`} aria-labelledby={id}>
      <span className="stop__dot" aria-hidden="true" />
      <div className="stop__inner">
        <h2 id={id} className="stop__title" data-reveal>
          {title}
        </h2>
        {children}
      </div>
    </section>
  )
}

function AudienceTabs() {
  const [active, setActive] = useState(0)
  const current = AUDIENCES[active]

  const onKeyDown = (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    const next = (active + step + AUDIENCES.length) % AUDIENCES.length
    setActive(next)
    document.getElementById(`aud-tab-${AUDIENCES[next].id}`)?.focus()
  }

  return (
    <div className="aud" data-reveal>
      <div className="aud__tabs" role="tablist" aria-label="Mercado meta" onKeyDown={onKeyDown}>
        {AUDIENCES.map((audience, i) => (
          <button
            key={audience.id}
            id={`aud-tab-${audience.id}`}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls="aud-panel"
            tabIndex={i === active ? 0 : -1}
            className="aud__tab"
            onClick={() => setActive(i)}
          >
            {audience.tab}
          </button>
        ))}
      </div>
      <div key={current.id} id="aud-panel" role="tabpanel" aria-labelledby={`aud-tab-${current.id}`} className="aud__panel">
        <p className="aud__title">{current.title}</p>
        <p>{current.text}</p>
      </div>
    </div>
  )
}

function FeriaPage() {
  const root = useRef(null)

  // The bus advances along the route as you scroll; stops light up once passed.
  useEffect(() => {
    const node = root.current
    if (!node) return undefined
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const dots = [...node.querySelectorAll('.stop__dot')]
    let frame = 0

    const update = () => {
      frame = 0
      const rect = node.getBoundingClientRect()
      const probe = window.innerHeight * 0.55
      const progress = Math.min(Math.max((probe - rect.top) / rect.height, 0), 1)
      node.style.setProperty('--p', progress.toFixed(4))
      dots.forEach((dot) => dot.classList.toggle('is-passed', dot.getBoundingClientRect().top < probe))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    let observer
    if (!reduced && typeof IntersectionObserver !== 'undefined') {
      node.classList.add('feria--armed')
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          })
        },
        { rootMargin: '0px 0px -10% 0px' },
      )
      node.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element))
    }

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      observer?.disconnect()
      node.classList.remove('feria--armed')
    }
  }, [])

  return (
    <div className="feria" ref={root}>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <header className="band">
        <img className="band__fair" src={`${BASE}brand/xv-feria-emprendimiento.png`} alt="XV Feria de Emprendimiento" width="2000" height="432" />
      </header>

      <main id="contenido" tabIndex={-1}>
        <section className="hero" aria-labelledby="titulo">
          <div className="hero__copy">
            <h1 id="titulo">
              Tu bus,
              <br />
              en <em>tiempo real</em>
            </h1>
            <p className="hero__lede">{TITLE}.</p>
            <p className="hero__meta">Propuesta de emprendimiento · Ingeniería de Sistemas · 2026</p>
          </div>
          <img
            className="hero__logo"
            src={`${BASE}brand/upc-track-logo.png`}
            alt="Logo de UpcTrack: un bus de la Universidad Popular del Cesar sobre un mapa con un marcador de ubicación"
            width="1254"
            height="1254"
          />
        </section>

        <div className="route">
          <div className="route__line" aria-hidden="true">
            <span className="route__fill" />
            <span className="route__bus">
              <BusMark />
            </span>
          </div>

          <Stop id="problema" title="La espera sin información">
            <div className="split">
              <div className="prose">
                <p data-reveal>
                  En la Seccional Aguachica el transporte universitario funciona con mecanismos tradicionales: largas
                  esperas, incertidumbre sobre los horarios y dificultad para planificar el desplazamiento. Eso
                  significa pérdida de tiempo y malestar con el servicio (Ccopa y Condori, 2025), además de estrés e
                  inconformidad (Díaz, 2022).
                </p>
                <p data-reveal>
                  UpcTrack responde con un aplicativo web de geolocalización: un sistema que da información clara
                  satisface las necesidades de movilidad (Crespo y Minchala, 2023), y el monitoreo digital de rutas
                  ahorra tiempo y reduce retrasos (Sánchez y Yvimas, 2024).
                </p>
                <p data-reveal>
                  Se sustenta en las necesidades levantadas mediante entrevista durante el proyecto académico y se
                  desarrolló con herramientas accesibles, lo que lo hace viable, escalable y alineado con el bienestar
                  universitario.
                </p>
              </div>
              <div className="board" data-reveal>
                <p className="board__head">El estudiante consulta</p>
                <ul>
                  {BOARD.map(([glyph, label, detail]) => (
                    <li key={label}>
                      <Glyph name={glyph} size={22} />
                      <span className="board__label">{label}</span>
                      <span className="board__detail">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Stop>

          <Stop id="objetivos" title="Objetivos">
            <p className="goal-general" data-reveal>
              <span className="goal-general__tag">Objetivo general. </span>
              {GENERAL_GOAL}
            </p>
            <ol className="goals">
              {SPECIFIC_GOALS.map((goal, i) => (
                <li key={goal} data-reveal style={{ '--d': `${i * 80}ms` }}>
                  <span className="goals__n" aria-hidden="true">
                    {i + 1}
                  </span>
                  <p>{goal}</p>
                </li>
              ))}
            </ol>
          </Stop>

          <Stop id="diferencial" title="Factor diferencial" tone="dark">
            <div className="prose prose--wide">
              <p data-reveal>
                Las aplicaciones de mapas de uso general no conocen los buses ni los paraderos institucionales.
                UpcTrack está diseñado para la Seccional Aguachica y muestra información oficial de la universidad.
              </p>
            </div>
            <dl className="diff">
              {DIFFERENTIATORS.map(([glyph, term, text], i) => (
                <div key={term} className="diff__row" data-reveal style={{ '--d': `${i * 70}ms` }}>
                  <dt>
                    <Glyph name={glyph} size={26} />
                    <span>{term}</span>
                  </dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
            <p className="diff__foot" data-reveal>
              Frente a los sistemas de rastreo que dependen de hardware costoso, UpcTrack se apoya en software web
              accesible y reduce los costos de implementación (Ordoñez, 2019).
            </p>
          </Stop>

          <Stop id="mercado" title="Mercado meta">
            <div className="prose">
              <p data-reveal>
                La comunidad universitaria de la Universidad Popular del Cesar Seccional Aguachica.
              </p>
            </div>
            <AudienceTabs />
            <p className="future" data-reveal>
              A futuro, el modelo puede ofrecerse a otras instituciones educativas o empresas de transporte de
              Aguachica y de la región con la misma falta de información sobre sus rutas.
            </p>
            <div className="sector" data-reveal>
              <h3>Sector económico</h3>
              <ul>
                {SECTORS.map((sector) => (
                  <li key={sector}>{sector}</li>
                ))}
              </ul>
              <p>
                Es un desarrollo de software con geolocalización; mejora un servicio de bienestar universitario y
                facilita la gestión y consulta de rutas.
              </p>
            </div>
          </Stop>

          <Stop id="ods" title="SbN y ODS">
            <div className="prose">
              <p data-reveal>
                <strong>Soluciones basadas en la Naturaleza.</strong> UpcTrack no interviene directamente en
                ecosistemas; su aporte es complementario: favorece una movilidad más sostenible (Asprilla, 2019). Al dar
                información confiable sobre el bus institucional, incentiva su uso y puede reducir el uso de vehículos
                particulares y los tiempos de espera con el motor encendido, con un posible efecto positivo sobre la
                calidad del aire del entorno universitario.
              </p>
            </div>
            <ul className="ods">
              {GOALS.map(([number, name, text, color, onColor, glyph], i) => (
                <li key={number} data-reveal style={{ '--d': `${i * 70}ms` }}>
                  <div className="ods__tile" style={{ background: color, color: onColor }}>
                    <span className="ods__label">ODS</span>
                    <span className="ods__number">{number}</span>
                    <Glyph name={glyph} size={30} />
                  </div>
                  <div>
                    <p className="ods__name">{name}</p>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="note" data-reveal>
              Impacto social, económico y ambiental. Elaboración propia con base en Naciones Unidas (2015).
            </p>
          </Stop>

          <Stop id="equipo" title="Equipo">
            <ul className="team">
              {TEAM.map((name) => (
                <li key={name} data-reveal>
                  <span className="team__avatar" aria-hidden="true">
                    {name
                      .split(' ')
                      .filter((_, i, all) => i === 0 || i === all.length - 2)
                      .map((word) => word[0])
                      .join('')}
                  </span>
                  <span className="team__name">{name}</span>
                </li>
              ))}
            </ul>
            <p className="team__org" data-reveal>
              Universidad Popular del Cesar Seccional Aguachica · Facultad de Ingenierías Tecnológicas · Programa de
              Ingeniería de Sistemas · 2026
            </p>
            <details className="refs" data-reveal>
              <summary>Bibliografía</summary>
              <ul>
                {REFERENCES.map((reference) => (
                  <li key={reference}>{reference}</li>
                ))}
              </ul>
            </details>
          </Stop>
        </div>
      </main>

      <footer className="foot">
        <img src={`${BASE}brand/upc-track-logo.png`} alt="" width="96" height="96" />
        <p>UpcTrack · Tu ruta en tiempo real</p>
      </footer>
    </div>
  )
}

export default FeriaPage
