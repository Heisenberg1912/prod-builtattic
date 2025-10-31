import Firm from '../models/Firm.js';
import { createCrudControllers } from './genericFactory.js';

const base = createCrudControllers(Firm, 'Firm');
export const listFirms = base.list;
export const createFirm = base.create;
export const updateFirm = base.update;
export const deleteFirm = base.remove;
