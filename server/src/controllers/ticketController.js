import Ticket from '../models/Ticket.js';
import { createCrudControllers } from './genericFactory.js';

const base = createCrudControllers(Ticket, 'Ticket');
export const listTickets = base.list;
export const createTicket = base.create;
export const updateTicket = base.update;
