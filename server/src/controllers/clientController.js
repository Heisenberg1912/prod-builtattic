import Client from '../models/Client.js';
import { createCrudControllers } from './genericFactory.js';

const base = createCrudControllers(Client, 'Client');
export const listClients = base.list;
export const createClient = base.create;
export const updateClient = base.update;
export const deleteClient = base.remove;
