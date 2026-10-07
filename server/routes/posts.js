import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../auth.js';

const router = express.Router();

// ==========================================
// 1. GET /api/posts/teacher/:teacherId
// Fetch teacher feed with subscription access gating
// ==========================================
router.get('/teacher/:teacherId', authenticateToken, async (req, res) => {
  try {
    const rawParam = req.params.teacherId.replace(/^@/, '').trim().toLowerCase();
    const currentUserId = req.user ? req.user.id : null;
    const currentUserRole = req.user ? req.user.role : null;

    // Resolve teacher ID (can be numeric ID or vanity handle)
    let teacherUser = null;
    if (!isNaN(Number(rawParam))) {
      teacherUser = await db.prepare("SELECT id, name, avatar_url FROM users WHERE id = ? AND role = 'teacher'").get(Number(rawParam));
    }
    if (!teacherUser) {
      const tp = await db.prepare(`
        SELECT u.id, u.name, u.avatar_url 
        FROM teacher_profiles tp 
        JOIN users u ON tp.user_id = u.id 
        WHERE LOWER(tp.handle) = LOWER(?)
      `).get(rawParam);
      if (tp) teacherUser = tp;
    }

    if (!teacherUser) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const teacherId = teacherUser.id;

    // Check if current user is an active subscriber, or the teacher themselves, or admin
    let isSubscribed = false;
    if (currentUserId) {
      if (currentUserId === teacherId || currentUserRole === 'admin') {
        isSubscribed = true;
      } else {
        const sub = await db.prepare(`
          SELECT id, renewal_at FROM subscriptions 
          WHERE student_id = ? AND teacher_id = ? AND status = 'active'
        `).get(currentUserId, teacherId);

        if (sub) {
          if (!sub.renewal_at || new Date(sub.renewal_at) > new Date()) {
            isSubscribed = true;
          }
        }
      }
    }

    const rawPosts = await db.prepare(`
      SELECT 
        tp.id, tp.teacher_id, tp.title, tp.content, tp.media_url, 
        tp.attachments, tp.visibility, tp.likes_count, tp.created_at,
        u.name as teacher_name, u.avatar_url as teacher_avatar
      FROM teacher_posts tp
      JOIN users u ON tp.teacher_id = u.id
      WHERE tp.teacher_id = ?
      ORDER BY tp.created_at DESC, tp.id DESC
    `).all(teacherId);

    // Format posts: gate subscriber-only content if not subscribed
    const formattedPosts = rawPosts.map(post => {
      let parsedAttachments = [];
      try {
        parsedAttachments = JSON.parse(post.attachments || '[]');
      } catch {
        parsedAttachments = [];
      }

      const isPostLocked = post.visibility === 'subscribers' && !isSubscribed;

      if (isPostLocked) {
        // Strip media and truncate content for locked subscriber posts
        const previewExcerpt = post.content ? post.content.slice(0, 140) + '...' : '';
        return {
          id: post.id,
          teacher_id: post.teacher_id,
          teacher_name: post.teacher_name,
          teacher_avatar: post.teacher_avatar,
          title: post.title,
          content: null,
          preview_excerpt: previewExcerpt,
          media_url: null,
          attachments: [],
          attachments_count: parsedAttachments.length,
          visibility: 'subscribers',
          locked: true,
          likes_count: post.likes_count || 0,
          created_at: post.created_at
        };
      }

      return {
        id: post.id,
        teacher_id: post.teacher_id,
        teacher_name: post.teacher_name,
        teacher_avatar: post.teacher_avatar,
        title: post.title,
        content: post.content,
        media_url: post.media_url,
        attachments: parsedAttachments,
        attachments_count: parsedAttachments.length,
        visibility: post.visibility,
        locked: false,
        likes_count: post.likes_count || 0,
        created_at: post.created_at
      };
    });

    res.json({
      teacher_id: teacherId,
      teacher_name: teacherUser.name,
      isSubscribed,
      posts: formattedPosts
    });
  } catch (error) {
    console.error('Fetch teacher feed posts error:', error);
    res.status(500).json({ error: 'Failed to fetch feed posts' });
  }
});

// ==========================================
// 2. POST /api/posts
// Teacher creates new post
// ==========================================
router.post('/', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { title, content, media_url = null, attachments = [], visibility = 'public' } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Post title is required / عنوان المنشور مطلوب' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content is required / محتوى المنشور مطلوب' });
    }

    const cleanVisibility = visibility === 'subscribers' ? 'subscribers' : 'public';
    const jsonAttachments = typeof attachments === 'string' ? attachments : JSON.stringify(attachments || []);

    const result = await db.prepare(`
      INSERT INTO teacher_posts (teacher_id, title, content, media_url, attachments, visibility, likes_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(teacherId, title.trim(), content.trim(), media_url ? media_url.trim() : null, jsonAttachments, cleanVisibility, new Date().toISOString());

    const createdPost = await db.prepare(`
      SELECT tp.*, u.name as teacher_name, u.avatar_url as teacher_avatar
      FROM teacher_posts tp
      JOIN users u ON tp.teacher_id = u.id
      WHERE tp.id = ?
    `).get(result.lastInsertRowid);

    let parsedAttachments = [];
    try {
      parsedAttachments = JSON.parse(createdPost.attachments || '[]');
    } catch {
      parsedAttachments = [];
    }

    res.status(201).json({
      success: true,
      message: 'Post published successfully!',
      post: {
        ...createdPost,
        attachments: parsedAttachments,
        locked: false
      }
    });
  } catch (error) {
    console.error('Create teacher post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// ==========================================
// 3. PUT /api/posts/:postId
// Teacher edits post
// ==========================================
router.put('/:postId', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const postId = Number(req.params.postId);
    const { title, content, media_url = null, attachments = [], visibility = 'public' } = req.body;

    const existing = await db.prepare('SELECT * FROM teacher_posts WHERE id = ?').get(postId);
    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (existing.teacher_id !== teacherId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }

    const cleanVisibility = visibility === 'subscribers' ? 'subscribers' : 'public';
    const jsonAttachments = typeof attachments === 'string' ? attachments : JSON.stringify(attachments || []);

    await db.prepare(`
      UPDATE teacher_posts
      SET title = ?, content = ?, media_url = ?, attachments = ?, visibility = ?
      WHERE id = ?
    `).run(title.trim(), content.trim(), media_url ? media_url.trim() : null, jsonAttachments, cleanVisibility, postId);

    const updated = await db.prepare('SELECT * FROM teacher_posts WHERE id = ?').get(postId);
    let parsedAttachments = [];
    try {
      parsedAttachments = JSON.parse(updated.attachments || '[]');
    } catch {
      parsedAttachments = [];
    }

    res.json({
      success: true,
      message: 'Post updated successfully!',
      post: { ...updated, attachments: parsedAttachments, locked: false }
    });
  } catch (error) {
    console.error('Edit teacher post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// ==========================================
// 4. DELETE /api/posts/:postId
// Teacher deletes post
// ==========================================
router.delete('/:postId', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const postId = Number(req.params.postId);

    const existing = await db.prepare('SELECT * FROM teacher_posts WHERE id = ?').get(postId);
    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (existing.teacher_id !== teacherId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await db.prepare('DELETE FROM teacher_posts WHERE id = ?').run(postId);
    res.json({ success: true, message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Delete teacher post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
