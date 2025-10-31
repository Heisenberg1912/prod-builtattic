import Booking from '../models/Booking.js';
import { createCrudControllers } from './genericFactory.js';

const base = createCrudControllers(Booking, 'Booking');
export const listBookings = base.list;
export const createBooking = base.create;
export const updateBooking = base.update;
export const deleteBooking = base.remove;
