import { format, parseISO } from 'date-fns';
import ptBr from 'date-fns/locale/pt-BR';
import Mail from '../../lib/Mail';

class CancellationMail {
  get key() {
    return 'CancellationMail';
  }

  async handle({ data }) {
    const { appointments } = data;

    console.log('A fila executou');

    await Mail.sendMail({
      to: `${appointments.provider.name} <${appointments.provider.email}>`,
      subject: 'Agendamento cancelado',
      template: 'cancellation',
      context: {
        provider: appointments.provider.name,
        user: appointments.user.name,
        date: format(
          parseISO(appointments.date),
          "'dia' dd 'de' MMMM', às' H:mm'h'",
          {
            locale: ptBr,
          }
        ),
      },
    });
  }
}

export default new CancellationMail();
