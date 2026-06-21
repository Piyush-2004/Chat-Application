import express from 'express';
import { body, validationResult } from 'express-validator';
import messageModel from '../models/message.model.js';
import mysql_db from '../config/db.js';

const router = express.Router();



router.post(
  '/send',
  [
    body('sender_id').isInt().withMessage('Sender ID must be an integer'),
    body('receiver_id').isInt().withMessage('Receiver ID must be an integer'),
    body('text').optional().isString(),
    body('image').optional().isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: 'Invalid message data'
      });
    }

    const { sender_id, receiver_id, text, image } = req.body;

    try {
      const messageId = await messageModel.createMessage({
        sender_id,
        receiver_id,
        text,
        image
      });

      res.status(201).json({
        message: 'Message sent',
        messageId
      });
    } catch (err) {
      console.error('Send error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get message history
router.get('/history/:sender_id/:receiver_id', async (req, res) => {
  const { sender_id, receiver_id } = req.params;

  try {
    const messages = await messageModel.getMessageHistory(
      parseInt(sender_id),
      parseInt(receiver_id)
    );
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a message
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { sender_id } = req.body;

  console.log(`[DELETE] Request to delete message ${id} by user ${sender_id}`);

  try {
    const message = await messageModel.getMessageById(parseInt(id));

    if (!message) {
      console.log(`[DELETE] Message ${id} not found`);
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender_id !== parseInt(sender_id)) {
      console.log(`[DELETE] Unauthorized attempt by user ${sender_id}`);
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await messageModel.deleteMessage(parseInt(id));
    req.io.emit('message-deleted', { messageId: parseInt(id) });

    console.log(`[DELETE] Message ${id} deleted successfully`);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// React to a message
router.post('/:id/reaction',
  [
    body('userId').isInt().withMessage('User ID must be an integer'),
    body('emoji').isString().withMessage('Emoji must be a string')
  ],
  async (req, res) => {
    const { id } = req.params;
    const { userId, emoji } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: 'Invalid reaction data'
      });
    }

    try {
      const message = await messageModel.getMessageById(parseInt(id));
      if (message) {
        let reactions = message.reactions ? [...message.reactions] : [];
        const existingIndex = reactions.findIndex(r => r.userId === userId && r.emoji === emoji);
        
        if (existingIndex > -1) {
          reactions.splice(existingIndex, 1);
          console.log(`Reaction removed from one-on-one message ${id}`);
        } else {
          reactions.push({ userId, emoji });
          console.log(`Reaction added to one-on-one message ${id}`);
        }

        await messageModel.updateMessageReactions(parseInt(id), JSON.stringify(reactions));
        req.io.emit('reaction-added', { messageId: parseInt(id), reactions });
        res.status(200).send('Reaction updated');
      } else {
        // Check group message
        const db = await mysql_db();
        const [groupRows] = await db.execute('SELECT reactions FROM group_messages WHERE id = ?', [parseInt(id)]);
        if (groupRows.length > 0) {
          const groupMsg = groupRows[0];
          let reactions = [];
          if (typeof groupMsg.reactions === 'string') {
            reactions = JSON.parse(groupMsg.reactions);
          } else if (Array.isArray(groupMsg.reactions)) {
            reactions = groupMsg.reactions;
          }

          const existingIndex = reactions.findIndex(r => r.userId === userId && r.emoji === emoji);
          if (existingIndex > -1) {
            reactions.splice(existingIndex, 1);
            console.log(`Reaction removed from group message ${id}`);
          } else {
            reactions.push({ userId, emoji });
            console.log(`Reaction added to group message ${id}`);
          }

          await db.execute('UPDATE group_messages SET reactions = ? WHERE id = ?', [JSON.stringify(reactions), parseInt(id)]);
          await db.end();
          req.io.emit('reaction-added', { messageId: parseInt(id), reactions });
          res.status(200).send('Reaction updated');
        } else {
          await db.end();
          res.status(404).send('Message not found');
        }
      }
    } catch (err) {
      console.error('Error adding reaction:', err);
      res.status(500).send('Server error');
    }
  }
);

// Forward a message
router.post('/forward',
  [
    body('sender_id').isInt().withMessage('Sender ID must be an integer'),
    body('receiver_id').isInt().withMessage('Receiver ID must be an integer'),
    body('messageId').isInt().withMessage('Message ID must be an integer')
  ],
  async (req, res) => {
    const { sender_id, receiver_id, messageId } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: 'Invalid forwarding data'
      });
    }

    try {
      const message = await messageModel.getMessageById(parseInt(messageId));
      if (message) {
        const newMessage = {
          sender_id: parseInt(sender_id),
          receiver_id: parseInt(receiver_id),
          text: message.text || '',
          image: message.image || null
        };


        const newId = await messageModel.createMessage(newMessage);
        const forwardedMessage = {
          id: newId,
          sender_id,
          receiver_id,
          text: message.text || '',
          image: message.image || null,
          created_at: new Date(),
          reactions: []
        };


        req.io.to(receiver_id.toString()).emit('message-forwarded', { receiverId: receiver_id, message: forwardedMessage });

        console.log(`Message forwarded from ${sender_id} to ${receiver_id}`);
        res.status(201).json({ message: 'Message forwarded', messageId: newId });
      } else {
        res.status(404).send('Original message not found');
      }
    } catch (err) {
      console.error('Error forwarding message:', err);
      res.status(500).send('Server error');
    }
  }
);

export default router;


