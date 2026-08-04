// routes/adminNotifications.js
// Provides REST + SSE (Server-Sent Events) endpoint for real-time admin notifications
const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const { emitter, getNotifications, markRead, markAllRead } = require('../services/notificationService');

const router = express.Router();

// ── SSE: real-time stream (admin panel subscribes to this) ────────────────────
// GET /api/admin/notifications/stream
router.get('/stream', protect, adminOnly, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send existing unread count immediately
  const unread = getNotifications({ unreadOnly: true }).length;
  res.write(`data: ${JSON.stringify({ type: 'init', unreadCount: unread })}\n\n`);

  const onNotif = (n) => {
    res.write(`data: ${JSON.stringify(n)}\n\n`);
  };
  emitter.on('notification', onNotif);

  // Heartbeat every 25s to keep connection alive
  const hb = setInterval(() => res.write(': heartbeat\n\n'), 25000);

  req.on('close', () => {
    emitter.off('notification', onNotif);
    clearInterval(hb);
  });
});

// GET /api/admin/notifications  — paginated list
router.get('/', protect, adminOnly, (req, res) => {
  const unreadOnly = req.query.unread === 'true';
  res.json(getNotifications({ unreadOnly }));
});

// PUT /api/admin/notifications/read  — mark specific ids as read
router.put('/read', protect, adminOnly, (req, res) => {
  const { ids } = req.body; // array of ids
  if (!Array.isArray(ids)) return res.status(400).json({ message: 'ids must be an array' });
  markRead(ids);
  res.json({ ok: true });
});

// PUT /api/admin/notifications/read-all
router.put('/read-all', protect, adminOnly, (req, res) => {
  markAllRead();
  res.json({ ok: true });
});

module.exports = router;





