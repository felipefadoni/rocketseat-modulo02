import { Router } from 'express';
import User from './app/models/User';

const routes = new Router();

routes.get('/', async (req, res) => {
  try {
    const user = await User.create({
      name: 'Felipe Fadoni',
      email: 'felipe@webfadoni.com',
      password_hash: '123123123',
    });
    return res.json(user);
  } catch (e) {
    return res.json({ error: `O dado ${e} já estão cadastrado`, code: e });
  }
});

export default routes;
