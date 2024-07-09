import { Router } from 'express';
import { createNewUser, deleteUser, listAllUsers, signin, updateDescription, verifyUser } from '../handlers/user';
import { isAdmin, protect } from '../modules/auth';

const router = Router();

router.post('/user', createNewUser);
router.post('/signin', signin);
router.get('/profile', protect, verifyUser)
router.put('/description', protect, updateDescription);
router.get('/users',isAdmin, listAllUsers);
router.delete('/delete-user', isAdmin, deleteUser);

export default router;
