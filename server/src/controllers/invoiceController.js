import Invoice from '../models/Invoice.js';
import { createCrudControllers } from './genericFactory.js';

const base = createCrudControllers(Invoice, 'Invoice');
export const listInvoices = base.list;
export const createInvoice = base.create;
export const updateInvoice = base.update;
