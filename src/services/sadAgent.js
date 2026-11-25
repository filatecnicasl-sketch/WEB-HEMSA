function normalize(text) {
  return text.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function simulateSadAgent(input) {
  const text = normalize(input);

  if (/emergencia|urgencia|accidente|caida|no respira|dolor fuerte|ambulancia/.test(text)) {
    return {
      intent: 'emergency',
      response: 'Si existe una emergencia o peligro inmediato, llama ahora al 112. Este asistente no puede gestionar emergencias ni valorar situaciones médicas. Si no es una urgencia, puedo preparar un aviso prioritario para coordinación.',
      action: { type: 'priority-call', title: 'Aviso prioritario a coordinación', description: 'Solo para una cuestión del servicio que no sea una emergencia. Coordinación recibirá un resumen de tu mensaje.', confirmLabel: 'Enviar aviso' },
    };
  }

  if (/ausencia|ausente|no estare|no voy a estar|no podre estar|no estoy en casa/.test(text)) {
    return {
      intent: 'absence',
      response: 'Puedo registrar un aviso de ausencia para tu próxima visita: mañana, de 10:00 a 11:00 h. Coordinación recibirá el aviso y te confirmará que lo ha revisado. ¿Quieres registrarlo?',
      action: { type: 'absence', title: 'Aviso de ausencia', description: 'Próxima visita: mañana, de 10:00 a 11:00 h. El aviso quedará pendiente de revisión por coordinación.', confirmLabel: 'Confirmar aviso' },
    };
  }

  if (/cambi|otra hora|otro dia|modificar|reprogramar|posponer/.test(text)) {
    return {
      intent: 'reschedule',
      response: 'Puedo preparar una solicitud de cambio de visita. Coordinación comprobará la disponibilidad y te propondrá una alternativa; el horario actual no se modificará hasta que recibas confirmación.',
      action: { type: 'reschedule', title: 'Solicitud de cambio de visita', description: 'Se registrará tu petición y coordinación te contactará para acordar una nueva fecha u hora.', confirmLabel: 'Enviar solicitud' },
    };
  }

  if (/coordinador|coordinadora|coordinacion|persona|humano|llamad|telefono/.test(text)) {
    return {
      intent: 'human-handoff',
      response: 'Puedo solicitar que coordinación te llame. Prepararé un resumen de esta conversación para que no tengas que volver a explicarlo todo.',
      action: { type: 'call', title: 'Solicitud de llamada', description: 'Coordinación recibirá el resumen y tu solicitud. La llamada no es inmediata; quedará registrada en tus gestiones.', confirmLabel: 'Solicitar llamada' },
    };
  }

  if (/proxima visita|cuando.*visita|que hora|horario|quien viene|auxiliar/.test(text)) {
    return {
      intent: 'schedule',
      response: 'Tu próxima visita está prevista para mañana, de 10:00 a 11:00 h. En este entorno de demostración no muestro el nombre del personal, pero en la versión real el agente consultaría únicamente la planificación autorizada de tu servicio.',
    };
  }

  if (/estado|gestion|solicitud|tramite|expediente/.test(text)) {
    return {
      intent: 'request-status',
      response: 'Puedes consultar tus solicitudes en la pestaña «Mis gestiones». Allí verás qué has enviado, cuándo se registró y si coordinación ya lo ha revisado. Las nuevas gestiones que realicemos también aparecerán en ese historial.',
    };
  }

  if (/gracias|perfecto|de acuerdo|vale/.test(text)) {
    return { intent: 'thanks', response: 'De nada. Estoy aquí para ayudarte con tus visitas y gestiones del servicio. Si necesitas algo más, puedes decírmelo con tus propias palabras.' };
  }

  if (/hola|buenos dias|buenas tardes|buenas noches/.test(text)) {
    return { intent: 'greeting', response: 'Hola, María. ¿Qué necesitas hoy? Puedo consultar tu próxima visita, registrar una ausencia, preparar un cambio o pedir a coordinación que te llame.' };
  }

  return {
    intent: 'unknown',
    response: 'No quiero darte una respuesta incorrecta. Puedo intentar ayudarte con visitas, ausencias, cambios y solicitudes del servicio. Si tu consulta necesita una respuesta personalizada, puedo derivarla a coordinación con un resumen.',
    action: { type: 'handoff', title: 'Derivar consulta a coordinación', description: 'Se enviará tu consulta y un resumen de la conversación para recibir una respuesta personalizada.', confirmLabel: 'Derivar consulta' },
  };
}
