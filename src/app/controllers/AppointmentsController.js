import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import ptBr from 'date-fns/locale/pt-BR';
import Appointments from '../models/Appointments';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';

import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';

class AppointmentsController {
  async index(req, res) {
    const { page = 1, limit } = req.query;

    const appointments = await Appointments.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      limit,
      offset: (page - 1) * limit,
      attributes: ['id', 'date'],
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name', 'email', 'provider'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });
    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validação falhou!' });
    }

    const { provider_id, date } = req.body;

    /**
     * Check se o provider_id é um provedor de servico
     */
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'Você não pode agendar com este prestador de serviço' });
    }

    const hourStart = startOfHour(parseISO(date));

    /**
     * Verificando a data agendada com data atual
     */
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Data informada mão é permitida!' });
    }

    /**
     * Verifica se a data já está reservada
     */
    const checkAvailability = await Appointments.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Data do agendamento já está reservada.' });
    }

    const appointments = await Appointments.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });

    /**
     * Notificar prestador de serviço
     */

    const user = await User.findOne({
      where: { id: req.userId, provider: false },
    });

    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      {
        locale: ptBr,
      }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
    });

    return res.json(appointments);
  }

  async delete(req, res) {
    const appointments = await Appointments.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (appointments.user_id !== req.userId) {
      return res.status(401).json({
        error: 'Você não possui permissão para deletar o agendamento.',
      });
    }

    const dateWithSub = subHours(appointments.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error:
          'Você não pode mais cancelar um agendamento, o limite é de 2 horas de antecedencia.',
      });
    }

    appointments.canceled_at = new Date();
    await appointments.save();

    await Queue.add(CancellationMail.key, {
      appointments,
    });

    return res.json(appointments);
  }
}

export default new AppointmentsController();
