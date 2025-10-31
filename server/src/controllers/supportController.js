import crypto from 'crypto';
import SupportThread from '../models/supportThread.js';
import { sendSupportEmailNotification } from '../services/email/emailService.js';
import {
  addSupportClient,
  broadcastSupportThread,
  removeSupportClient,
} from '../utils/supportEvents.js';

const SUPPORT_EMAILS = (process.env.SUPPORT_INBOX || 'tushar@builtattic.com,arnav@builtattic.com')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const applyNoCache = (res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('ETag', `${Date.now()}`);
};

const sanitizeBody = (value = '') => value.toString().trim();

const buildThreadResponse = (thread) => ({
  threadId: thread.threadId,
  contactEmail: thread.contactEmail,
  contactName: thread.contactName,
  messages: thread.messages
    .slice()
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .map((entry) => ({
      sender: entry.sender,
      channel: entry.channel,
      body: entry.body,
      at: entry.at,
      meta: entry.meta ?? undefined,
    })),
  updatedAt: thread.updatedAt,
});

export const postChatMessage = async (req, res, next) => {
  try {
    const { threadId, message, contactEmail, contactName } = req.body || {};
    const trimmedMessage = sanitizeBody(message);
    if (!trimmedMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let thread = null;
    if (threadId) {
      thread = await SupportThread.findOne({ threadId });
    }

    if (!thread) {
      thread = new SupportThread({
        threadId: crypto.randomUUID(),
        contactEmail: sanitizeBody(contactEmail),
        contactName: sanitizeBody(contactName),
        messages: [],
      });
    } else if (!thread.contactEmail && contactEmail) {
      thread.contactEmail = sanitizeBody(contactEmail);
    }

    thread.messages.push({
      sender: 'user',
      channel: 'chat',
      body: trimmedMessage,
      at: new Date(),
    });
    thread.updatedAt = new Date();

    await thread.save();

    await sendSupportEmailNotification({
      supportEmail: SUPPORT_EMAILS,
      threadId: thread.threadId,
      contactEmail: thread.contactEmail,
      contactName: thread.contactName,
      message: trimmedMessage,
    });

    const payload = buildThreadResponse(thread);
    broadcastSupportThread(thread.threadId, payload);

    applyNoCache(res);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
};

export const getThread = async (req, res, next) => {
  try {
    const { threadId } = req.params;
    if (!threadId) {
      return res.status(400).json({ error: 'threadId is required' });
    }
    const thread = await SupportThread.findOne({ threadId });
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    applyNoCache(res);
    return res.json(buildThreadResponse(thread));
  } catch (error) {
    return next(error);
  }
};

const extractThreadIdFromSubject = (subject = '') => {
  const match = subject.match(/\[Support\s+#([a-f0-9-]{8,})\]/i);
  return match ? match[1] : null;
};

export const ingestEmailReply = async (req, res, next) => {
  try {
    const { subject, text, html, from } = req.body || {};
    const body = sanitizeBody(text || html);
    if (!subject || !body) {
      return res.status(400).json({ error: 'subject and body are required' });
    }
    const threadId = extractThreadIdFromSubject(subject);
    if (!threadId) {
      return res.status(400).json({ error: 'No support thread identifier found in subject' });
    }

    const thread = await SupportThread.findOne({ threadId });
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    thread.messages.push({
      sender: 'support',
      channel: 'email',
      body,
      meta: from ? new Map([['from', from]]) : undefined,
      at: new Date(),
    });
    thread.updatedAt = new Date();
    await thread.save();

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
};

export const streamThread = async (req, res, next) => {
  try {
    const { threadId } = req.params;
    if (!threadId) {
      return res.status(400).json({ error: 'threadId is required' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders?.();
    res.write('\n');

    addSupportClient(threadId, res);

    try {
      const existing = await SupportThread.findOne({ threadId });
      const payload = existing
        ? buildThreadResponse(existing)
        : { threadId, messages: [], contactEmail: null };
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (err) {
      res.write(`data: ${JSON.stringify({ threadId, error: 'thread_load_failed' })}\n\n`);
    }

    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (err) {
        clearInterval(heartbeat);
        removeSupportClient(threadId, res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      removeSupportClient(threadId, res);
    });
  } catch (error) {
    return next(error);
  }
};

