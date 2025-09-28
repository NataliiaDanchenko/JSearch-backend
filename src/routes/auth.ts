import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
  console.log('Request body:', req.body);
  try {
    const { email, password, name, desiredJobTitle, about } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    const user = new User({
      email,
      password,
      name,
      desiredJobTitle,
      about,
    });

    console.log('Saving user:', user); 
    await user.save();
    console.log('User saved:', user);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

    res.status(201).json({
      token,
      user: {
        email: user.email,
        name: user.name,
        desiredJobTitle: user.desiredJobTitle,
        about: user.about,
      },
    });
  } catch (err) {
    console.error('Помилка реєстрації:', err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Невірний email або пароль' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Невірний email або пароль' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

    res.json({
      token,
      user: {
        email: user.email,
        name: user.name,
        desiredJobTitle: user.desiredJobTitle,
        about: user.about,
      },
    });
  } catch (err) {
    console.error('Помилка входа:', err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    res.json({
      email: user.email,
      name: user.name,
      desiredJobTitle: user.desiredJobTitle,
      about: user.about,
    });
  } catch (err) {
    console.error('Помилка профиля:', err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, desiredJobTitle, about } = req.body;
    const user = await User.findByIdAndUpdate(
      (req as any).userId,
      { name, desiredJobTitle, about },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'Користувач не знайдений' });

    res.json({
      email: user.email,
      name: user.name,
      desiredJobTitle: user.desiredJobTitle,
      about: user.about,
    });
  } catch (err) {
    console.error('Помилка оновлення профиля:', err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

export default router;
