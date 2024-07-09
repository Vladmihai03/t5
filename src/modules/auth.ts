import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';

dotenv.config();

export const comparePasswords = (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const hashPassword = (password: string): Promise<string> => {
  return bcrypt.hash(password, 5);
};

interface User {
  email: string;
}

export const createJWT = (user: User): string => {
  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET as string);
  return token;
};

interface AuthenticatedRequest extends Request {
  user?: { email: string };
}

export const protect = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization;

  if (!bearer) {
    res.status(401).json({ message: 'not authorized' });
    return;
  }
  
  const [, token] = bearer.split(" ");
  if (!token) {
    res.status(401).json({ message: 'not authorized' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { email: string };
    req.user = payload;
    
    next();
  } catch (e) {
    console.error(e);
    res.status(401).json({ message: 'not authorized' });
  }
};

export const isAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization;
  if(!bearer){
    res.status(401).json({ message: 'not authorized' });
    return;
  }
  const [,token] = bearer.split(" ");
  if(!token){
    res.status(401).json({ message: 'not authorized' });
    return;
  }
  try{
    const result = jwt.verify(token, process.env.JWT_SECRET as string) as {email: string};
    req.user = result;
    if(req.user.email != 'popicavlas@gmail.com'){
      res.status(401).json({ message: 'not authorized' });
      return;
    }
    next();
  }catch(e){
    res.status(401).json({ message: 'not authorized' });
    return;
  }
}

export {AuthenticatedRequest}