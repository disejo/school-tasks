import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const corsHandler = cors({ origin: true, credentials: true });
admin.initializeApp();

const JWT_SECRET = process.env.JWT_SECRET || 'd721b4903a9b99ac2764e2149168d001d523021cf435549fcff4dfc97ce1775f';

export const login = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Método no permitido');
    }
    const { dni } = req.body;
    if (!dni) {
      return res.status(400).send('DNI requerido');
    }
    try {
      const usersRef = admin.firestore().collection('users');
      const snapshot = await usersRef.where('dni', '==', dni).get();
      if (snapshot.empty) {
        return res.status(401).send('Usuario no encontrado');
      }
      const user = snapshot.docs[0].data();
      const token = jwt.sign({ dni: user.dni, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000,
      });
      return res.status(200).json({ success: true, role: user.role, name: user.name });
    } catch (err) {
      return res.status(500).send('Error interno');
    }
  });
});

export const verifyToken = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send('No autorizado');
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.status(200).json(decoded);
    } catch (err) {
      return res.status(401).send('Token inválido');
    }
  });
});
