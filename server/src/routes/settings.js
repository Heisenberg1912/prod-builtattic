import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = Router();

router.use(authenticateJWT);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
