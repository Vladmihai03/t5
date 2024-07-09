import { Request, Response } from 'express';
import { createJWT, hashPassword, comparePasswords, AuthenticatedRequest } from '../modules/auth';
import { connectToDatabase } from '../database/connect';

export const createNewUser = async (req: Request, res: Response) => {
  const { username, email, password, description } = req.body;

  try {
    const hashedPassword = await hashPassword(password);
    const connection = await connectToDatabase();
    
    await connection.execute(
      'INSERT INTO user (username, email, password, description) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, description]
    );

    const token = createJWT({ email });
    res.status(201).json({ token });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const connection = await connectToDatabase();
    const [rows] = await connection.execute('SELECT * FROM user WHERE email = ?', [email]);
    const user = (rows as any)[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createJWT({ email: user.email });
    res.json({ token });
  } catch (error) {
    console.error("Error signing in:", error);
    res.status(500).json({ message: 'Error signing in' });
  }
};

export const deleteUser = async (req: Request, res: Response)=>{
  const {email} = req.body;
  try{
    const connection = connectToDatabase();
    if(email == 'popicavlas@gmail.com'){
      res.status(401).json({message: 'Can not delete the admin'});
    }
    (await connection).execute('DELETE  FROM user WHERE EMAIL = ?', [email]);
    res.status(200).json({message: 'DELETED'});
  }catch(e){
    res.status(401).json({message: 'Invalid email to delete'})
  }
}

export const listAllUsers = async(req: Request, res: Response) => {
  const connection = await connectToDatabase();
  const [rows] = await connection.execute('SELECT username, email, description FROM user');
  if(!rows){
    return res.status(401).json({ message: 'No users to display' });
  }
  res.json((rows as any));
}

export const verifyUser = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
  }

  try {
    const connection = await connectToDatabase();
    const [rows] = await connection.execute('SELECT username, email, description FROM user WHERE email = ?', [req.user.email]);
    const user = (rows as any)[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};

export const updateDescription = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
  }

  const { description } = req.body;

  if (!description || typeof description !== 'string') {
    return res.status(400).json({ message: 'Invalid description' });
  }

  try {
    const connection = await connectToDatabase();
    await connection.execute(
      'UPDATE user SET description = ? WHERE email = ?',
      [description, req.user.email]
    );

    const [rows] = await connection.execute(
      'SELECT username, email, description FROM user WHERE email = ?',
      [req.user.email]
    );
    const user = (rows as any)[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error("Error updating description:", error);
    res.status(500).json({ message: 'Error updating description' });
  }
};
