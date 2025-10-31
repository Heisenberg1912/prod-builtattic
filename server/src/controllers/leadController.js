import Lead from '../models/Lead.js';
import { createCrudControllers } from './genericFactory.js';

const base = createCrudControllers(Lead, 'Lead');
export const listLeads = base.list;
export const createLead = base.create;
export const updateLead = base.update;
export const deleteLead = base.remove;
