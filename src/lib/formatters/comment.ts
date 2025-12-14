/**
 * Comment Formatters
 *
 * Comment related formatters
 */

import type { OutlineComment } from '../types/api.js';

/** Format comments list */
export function formatComments(comments: OutlineComment[]) {
  return comments.map((c) => ({
    id: c.id,
    data: c.data,
    createdAt: c.createdAt,
    createdBy: c.createdBy?.name,
    parentCommentId: c.parentCommentId,
  }));
}
