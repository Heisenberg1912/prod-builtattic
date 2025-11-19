import mongoose from 'mongoose';

import WorkspaceChatThread from '../models/WorkspaceChatThread.js';
import { determineOwnerScope } from '../utils/ownerScope.js';

const STATUS_VALUES = new Set(['open', 'resolved']);
const SENDER_TYPES = new Set(['workspace', 'client', 'ops']);

const httpError = (status, message, details) =>
  Object.assign(new Error(message), { statusCode: status, details });

const resolveScopeOrThrow = async (user, requestedType) => {
  const scope = await determineOwnerScope(user, requestedType);
  if (scope.ownerId) return scope;
  if (scope.error === 'unauthorized') throw httpError(401, 'Unauthorized');
  if (scope.error === 'associate_missing') {
    throw httpError(404, 'Associate profile missing');
  }
  throw httpError(403, 'Join a firm to use chat');
};

const sanitizeStatus = (value, fallback = 'open') => {
  const normalized = String(value || '').toLowerCase();
  return STATUS_VALUES.has(normalized) ? normalized : fallback;
};

const sanitizeSenderType = (value, fallback = 'workspace') => {
  const normalized = String(value || '').toLowerCase();
  return SENDER_TYPES.has(normalized) ? normalized : fallback;
};

const normalizeList = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : null))
    .filter(Boolean);
};

const mapMessage = (message) => ({
  id: message._id?.toString(),
  senderType: message.senderType || 'workspace',
  senderName: message.senderName || '',
  senderRole: message.senderRole || '',
  body: message.body,
  attachments: Array.isArray(message.attachments) ? message.attachments : [],
  createdAt: message.createdAt,
});

const mapThread = (doc) => ({
  id: doc._id.toString(),
  subject: doc.subject,
  status: doc.status || 'open',
  participants: doc.participants || [],
  clientName: doc.clientName || '',
  clientEmail: doc.clientEmail || '',
  lastMessageAt: doc.lastMessageAt,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  messages: Array.isArray(doc.messages) ? doc.messages.map(mapMessage) : [],
});

const buildMessagePayload = (input, user) => {
  const body = String(input?.body || input?.message || '').trim();
  if (!body) return null;
  const senderName =
    String(input?.senderName || user?.fullName || user?.name || user?.email || 'Workspace').trim();
  const senderRole = String(input?.senderRole || user?.role || '').trim();
  const attachments = Array.isArray(input?.attachments)
    ? input.attachments
        .map((entry) => (typeof entry === 'string' ? entry.trim() : null))
        .filter(Boolean)
    : [];
  return {
    senderType: sanitizeSenderType(input?.senderType, 'workspace'),
    senderName,
    senderRole,
    body,
    attachments,
    createdAt: new Date(),
  };
};

export const listWorkspaceChats = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.query.ownerType);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 30);
    const threads = await WorkspaceChatThread.find({
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      ok: true,
      ownerType: scope.ownerType,
      ownerId: scope.ownerId.toString(),
      chats: threads.map(mapThread),
    });
  } catch (error) {
    next(error);
  }
};

export const createWorkspaceChat = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.body.ownerType);
    const subject = String(req.body?.subject || '').trim();
    if (!subject) throw httpError(400, 'Subject is required');
    const messagePayload = buildMessagePayload(req.body?.message || req.body, req.user);

    const payload = {
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
      subject,
      status: sanitizeStatus(req.body?.status),
      participants: normalizeList(req.body?.participants),
      clientName: req.body?.clientName ? String(req.body.clientName).trim() : undefined,
      clientEmail: req.body?.clientEmail ? String(req.body.clientEmail).trim() : undefined,
      createdBy: req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : undefined,
    };

    if (messagePayload) {
      payload.messages = [messagePayload];
      payload.lastMessageAt = messagePayload.createdAt;
    }

    const thread = await WorkspaceChatThread.create(payload);
    res.status(201).json({ ok: true, chat: mapThread(thread) });
  } catch (error) {
    next(error);
  }
};

export const postWorkspaceChatMessage = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.body.ownerType);
    const chatId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(chatId)) throw httpError(400, 'Invalid chat id');
    const messagePayload = buildMessagePayload(req.body, req.user);
    if (!messagePayload) throw httpError(400, 'Message body is required');

    const thread = await WorkspaceChatThread.findOneAndUpdate(
      {
        _id: chatId,
        ownerType: scope.ownerType,
        ownerId: scope.ownerId,
      },
      {
        $push: { messages: messagePayload },
        $set: {
          lastMessageAt: messagePayload.createdAt,
          status: sanitizeStatus(req.body?.status, 'open'),
        },
      },
      { new: true },
    );

    if (!thread) throw httpError(404, 'Chat not found');
    res.json({ ok: true, chat: mapThread(thread) });
  } catch (error) {
    next(error);
  }
};

export const updateWorkspaceChat = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.body.ownerType);
    const chatId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(chatId)) throw httpError(400, 'Invalid chat id');
    const thread = await WorkspaceChatThread.findOne({
      _id: chatId,
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    });
    if (!thread) throw httpError(404, 'Chat not found');

    if (req.body?.subject !== undefined) {
      const subject = String(req.body.subject || '').trim();
      if (!subject) throw httpError(400, 'Subject cannot be empty');
      thread.subject = subject;
    }
    if (req.body?.status !== undefined) {
      thread.status = sanitizeStatus(req.body.status, thread.status);
    }
    if (req.body?.participants !== undefined) {
      thread.participants = normalizeList(req.body.participants);
    }
    if (req.body?.clientName !== undefined) {
      thread.clientName = String(req.body.clientName || '').trim();
    }
    if (req.body?.clientEmail !== undefined) {
      thread.clientEmail = String(req.body.clientEmail || '').trim();
    }

    await thread.save();
    res.json({ ok: true, chat: mapThread(thread) });
  } catch (error) {
    next(error);
  }
};

export default {
  listWorkspaceChats,
  createWorkspaceChat,
  postWorkspaceChatMessage,
  updateWorkspaceChat,
};
