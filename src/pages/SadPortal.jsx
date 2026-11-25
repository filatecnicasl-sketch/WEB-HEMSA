import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BellRing, Bot, CalendarCheck2, CalendarDays, Check,
  CheckCircle2, ChevronRight, CircleAlert, ClipboardList, Clock3, FileText,
  Headphones, HeartHandshake, LoaderCircle, LockKeyhole, LogOut, MessageCircle,
  Phone, Send, ShieldCheck, Sparkles, UserRound, X,
} from 'lucide-react';
import { simulateSadAgent } from '../services/sadAgent';

const quickActions = [
  { label: '¿Cuándo es mi próxima visita?', icon: CalendarDays },
  { label: 'Avisar de una ausencia', icon: CalendarCheck2 },
  { label: 'Solicitar un cambio de visita', icon: ClipboardList },
  { label: 'Quiero hablar con coordinación', icon: Phone },
];

const initialMessage = {
  id: 1,
  sender: 'agent',
  text: 'Hola, María. Soy tu asistente personal del Servicio de Ayuda a Domicilio. Puedo ayudarte con tus visitas y realizar gestiones contigo. Todo lo que requiera un cambio en el servicio tendrá que ser confirmado por coordinación.',
};

const actionResults = {
  absence: { title: 'Aviso de ausencia', response: 'He registrado tu aviso de ausencia y lo he enviado a coordinación. Puedes seguir su estado en «Mis gestiones». La visita queda pendiente de revisión, no cancelada automáticamente.' },
  reschedule: { title: 'Solicitud de cambio de visita', response: 'He registrado tu solicitud de cambio. Coordinación revisará la planificación y te contactará para confirmar una alternativa. Tu horario actual se mantiene.' },
  call: { title: 'Solicitud de llamada', response: 'He enviado tu solicitud de llamada con un resumen de la conversación. Ya puedes consultarla en «Mis gestiones».' },
  'priority-call': { title: 'Aviso prioritario a coordinación', response: 'He registrado el aviso prioritario para coordinación. Recuerda: si existe una emergencia o peligro inmediato, debes llamar al 112; este aviso no sustituye a los servicios de emergencia.' },
  handoff: { title: 'Consulta derivada a coordinación', response: 'He derivado tu consulta con un resumen de la conversación. Coordinación te dará una respuesta personalizada.' },
};

function AccessGateway({ onEnter }) {
  return (
    <section className="sad-access">
      <div className="container sad-access-grid">
        <div className="sad-access-copy">
          <Link to="/ayuda-a-domicilio" className="back-link"><ArrowLeft size={16} />Volver a Ayuda a Domicilio</Link>
          <span className="eyebrow">Servicio Municipal de Ayuda a Domicilio</span>
          <h1>Tu servicio, tu información, tu asistente personal</h1>
          <p>Un espacio individual para consultar tus visitas, hacer gestiones y hablar con coordinación cuando lo necesites.</p>
          <div className="sad-access-features">
            <div><span><CalendarDays /></span><div><strong>Tus visitas</strong><p>Consulta tu planificación y solicita cambios.</p></div></div>
            <div><span><Sparkles /></span><div><strong>Tu agente personal</strong><p>Realiza gestiones contigo, no solo respuestas generales.</p></div></div>
            <div><span><Headphones /></span><div><strong>Atención humana</strong><p>Deriva tu consulta con un resumen para coordinación.</p></div></div>
          </div>
        </div>

        <div className="sad-login-card">
          <div className="sad-login-icon"><LockKeyhole size={29} /></div>
          <span className="pill">Demostración funcional</span>
          <h2>Acceso al área privada</h2>
          <p>Entra como una usuaria de ejemplo y prueba el agente personal con datos completamente ficticios.</p>
          <button type="button" className="button sad-enter-button" onClick={onEnter}>Entrar en la demostración<ArrowRight size={18} /></button>
          <div className="sad-demo-user"><span>M</span><div><strong>María</strong><small>Usuaria ficticia del servicio</small></div><ShieldCheck size={19} /></div>
          <div className="sad-access-notice"><CircleAlert size={17} /><p>No introduzcas datos personales reales. Esta demo no guarda las conversaciones ni envía información a ningún servidor.</p></div>
          <p className="sad-real-access">En la versión real, la identidad se verificaría individualmente antes de mostrar cualquier información.</p>
        </div>
      </div>
    </section>
  );
}

function RequestList({ requests }) {
  return (
    <div className="sad-requests-panel">
      <div className="sad-panel-heading"><div><span className="eyebrow">Seguimiento individual</span><h2>Mis gestiones</h2><p>Consulta lo que has solicitado y el estado de cada tramitación.</p></div><span className="sad-request-total">{requests.length}</span></div>
      {requests.length ? (
        <div className="sad-request-list">
          {requests.map((request) => (
            <article className="sad-request-item" key={request.id}>
              <span className={`sad-request-icon ${request.status === 'Resuelta' ? 'resolved' : ''}`}><FileText size={20} /></span>
              <div><span className="sad-request-ref">{request.id}</span><h3>{request.title}</h3><p>{request.date}</p></div>
              <span className={`sad-request-status ${request.status === 'Resuelta' ? 'resolved' : ''}`}>{request.status === 'Resuelta' ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}{request.status}</span>
              <div className="sad-request-summary"><strong>Resumen para coordinación</strong><p>{request.summary}</p></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state"><ClipboardList size={38} /><h2>Todavía no hay gestiones</h2><p>Las solicitudes que realices con el agente aparecerán aquí.</p></div>
      )}
      <div className="sad-request-explainer"><ShieldCheck size={19} /><p>Solo la persona usuaria y el personal autorizado podrían consultar este historial en la versión real. En esta demo todo desaparece al recargar la página.</p></div>
    </div>
  );
}

export default function SadPortal() {
  const [entered, setEntered] = useState(false);
  const [activeTab, setActiveTab] = useState('assistant');
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [visitNotice, setVisitNotice] = useState(false);
  const [requests, setRequests] = useState([]);
  const messageId = useRef(2);
  const requestId = useRef(1);
  const timer = useRef(null);
  const messagesContainer = useRef(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [entered]);
  useEffect(() => {
    if (activeTab === 'assistant' && messagesContainer.current) {
      const container = messagesContainer.current;
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, typing, activeTab]);

  const appendMessage = (message) => {
    setMessages((current) => [...current, { id: messageId.current++, ...message }]);
  };

  const sendMessage = (text) => {
    const cleanText = text.trim();
    if (!cleanText || typing) return;
    appendMessage({ sender: 'user', text: cleanText });
    setInput('');
    setTyping(true);
    timer.current = window.setTimeout(() => {
      const result = simulateSadAgent(cleanText);
      appendMessage({ sender: 'agent', text: result.response, action: result.action ? { ...result.action, status: 'pending' } : null });
      setTyping(false);
    }, 650);
  };

  const cancelAction = (id) => {
    setMessages((current) => current.map((message) => message.id === id ? { ...message, action: { ...message.action, status: 'cancelled' } } : message));
    appendMessage({ sender: 'agent', text: 'No he registrado ninguna gestión. Podemos seguir hablando cuando lo necesites.' });
  };

  const confirmAction = (id, action) => {
    const result = actionResults[action.type];
    const reference = `SAD-DEMO-${String(requestId.current++).padStart(3, '0')}`;
    const originalMessage = messages.find((message) => message.sender === 'user');
    setRequests((current) => [{
      id: reference,
      title: result.title,
      date: 'Registrada ahora · Demostración',
      status: 'Pendiente de coordinación',
      summary: action.description,
    }, ...current]);
    setMessages((current) => current.map((message) => message.id === id ? { ...message, action: { ...message.action, status: 'done' } } : message));
    if (action.type === 'absence') setVisitNotice(true);
    appendMessage({ sender: 'agent', text: result.response, reference });
  };

  if (!entered) return <AccessGateway onEnter={() => setEntered(true)} />;

  return (
    <section className="sad-portal">
      <div className="container sad-portal-heading">
        <div><span className="sad-private-badge"><LockKeyhole size={14} />Área privada · demostración</span><h1>Hola, María</h1><p>Este es tu espacio personal del Servicio de Ayuda a Domicilio.</p></div>
        <button type="button" className="button button-quiet" onClick={() => { setEntered(false); setActiveTab('assistant'); }}><LogOut size={17} />Salir de la demo</button>
      </div>

      <div className="container sad-demo-warning"><CircleAlert size={17} /><span>Datos ficticios. No introduzcas información personal real. Las gestiones no se envían ni se almacenan.</span></div>

      <div className="container sad-workspace">
        <aside className="sad-sidebar">
          <div className="sad-profile"><span>M</span><div><strong>María</strong><small>Usuaria de demostración</small></div></div>
          <nav aria-label="Área personal SAD">
            <button type="button" className={activeTab === 'assistant' ? 'active' : ''} onClick={() => setActiveTab('assistant')}><MessageCircle size={18} />Mi asistente<ChevronRight size={16} /></button>
            <button type="button" className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}><ClipboardList size={18} />Mis gestiones{requests.length > 0 && <span className="sad-nav-count">{requests.length}</span>}<ChevronRight size={16} /></button>
          </nav>
          <div className="sad-next-visit">
            <span className="sad-card-label"><CalendarDays size={15} />Próxima visita</span>
            <strong>Mañana</strong><p>10:00–11:00 h</p>
            {visitNotice ? <span className="sad-visit-notice"><BellRing size={14} />Aviso de ausencia enviado</span> : <span className="sad-visit-status"><CheckCircle2 size={14} />Visita prevista</span>}
            <button type="button" onClick={() => { setActiveTab('assistant'); sendMessage('¿Cuándo es mi próxima visita?'); }}>Consultar al agente<ArrowRight size={15} /></button>
          </div>
          <div className="sad-human-help"><Headphones size={22} /><strong>¿Prefieres una persona?</strong><p>El agente puede enviar tu consulta a coordinación.</p><button type="button" onClick={() => { setActiveTab('assistant'); sendMessage('Quiero hablar con coordinación'); }}>Solicitar llamada</button></div>
        </aside>

        <main className="sad-main-panel">
          {activeTab === 'assistant' ? (
            <div className="sad-agent-panel">
              <header className="sad-agent-header">
                <div className="sad-agent-avatar"><Sparkles size={23} /></div>
                <div><h2>Asistente personal SAD</h2><p><span />Agente preparado para consultar y gestionar</p></div>
                <span className="sad-agent-privacy"><ShieldCheck size={16} />Individual</span>
              </header>

              <div className="sad-messages" ref={messagesContainer} aria-live="polite" aria-label="Conversación con el asistente">
                <div className="sad-conversation-label"><LockKeyhole size={12} />Conversación de demostración</div>
                {messages.map((message) => (
                  <div className={`sad-message-row ${message.sender}`} key={message.id}>
                    {message.sender === 'agent' && <span className="sad-message-avatar"><Bot size={17} /></span>}
                    <div className="sad-message-content">
                      <div className="sad-message-bubble">{message.text}</div>
                      {message.reference && <span className="sad-message-reference"><CheckCircle2 size={14} />Gestión {message.reference}</span>}
                      {message.action && (
                        <div className={`sad-action-card ${message.action.status}`}>
                          <div className="sad-action-title"><ClipboardList size={18} /><strong>{message.action.title}</strong></div>
                          <p>{message.action.description}</p>
                          {message.action.status === 'pending' ? (
                            <div className="sad-action-buttons"><button type="button" className="button" onClick={() => confirmAction(message.id, message.action)}><Check size={16} />{message.action.confirmLabel}</button><button type="button" className="button button-quiet" onClick={() => cancelAction(message.id)}><X size={16} />Cancelar</button></div>
                          ) : <span className="sad-action-result">{message.action.status === 'done' ? <><CheckCircle2 size={15} />Gestión registrada</> : <><X size={15} />Acción cancelada</>}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {typing && <div className="sad-message-row agent"><span className="sad-message-avatar"><Bot size={17} /></span><div className="sad-typing"><LoaderCircle size={17} className="spin" />Consultando el contexto de la demostración…</div></div>}
              </div>

              <div className="sad-quick-actions" aria-label="Acciones frecuentes">
                {quickActions.map(({ label, icon: Icon }) => <button type="button" key={label} onClick={() => sendMessage(label)} disabled={typing}><Icon size={15} />{label}</button>)}
              </div>
              <form className="sad-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(input); }}>
                <label className="sr-only" htmlFor="sad-message">Escribe tu consulta</label>
                <input id="sad-message" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Escribe lo que necesitas con tus propias palabras…" autoComplete="off" />
                <button type="submit" aria-label="Enviar mensaje" disabled={!input.trim() || typing}><Send size={19} /></button>
              </form>
              <div className="sad-agent-footer"><ShieldCheck size={13} />El agente puede equivocarse. Las decisiones del servicio requieren confirmación humana. <strong>Emergencias: <a href="tel:112">112</a>.</strong></div>
            </div>
          ) : <RequestList requests={requests} />}
        </main>
      </div>

      <div className="container sad-portal-bottom"><HeartHandshake size={20} /><p><strong>Un agente al servicio de las personas.</strong> Las consultas habituales se resuelven de forma inmediata y coordinación interviene cuando hace falta criterio humano.</p></div>
    </section>
  );
}
