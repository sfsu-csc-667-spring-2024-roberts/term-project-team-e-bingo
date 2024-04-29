import express, { Request, Response, NextFunction } from 'express';
import { loginRequest } from '../middleware/auth';
import { createTable, insertUser, getUsers } from '../database/index';
const bcrypt = require("bcrypt");
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index');
});

router.get('/lobby', (req, res) => {
  res.render('lobby');
});

router.get('/register', (req, res) => {
  res.render('register');
});


router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  //Add a check function to check if username or email has
  //already been used.
  //PROCESS DATA:
  const salt = await bcrypt.genSalt();
  const hash = await bcrypt.hash(password, salt);
  
  // - Store all of them to DB
  await insertUser(username, email, hash);
  res.render('login');
});

router.get('/login', (req:Request, res:Response) => {
  res.render('login');
});
router.post('/login', (req:Request, res:Response) => { 
  loginRequest(req, res);
});


export default router;
