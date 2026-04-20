import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  getCard, updateCard, deleteCard,
  addLabelToCard, removeLabelFromCard,
  addMemberToCard, removeMemberFromCard,
  createChecklist, deleteChecklist,
  createChecklistItem, updateChecklistItem, deleteChecklistItem,
  createComment, deleteComment,
} from '../../api/api';

export default function CardDetailModal({
  cardId, boardId, boardLabels, users,
  onClose, onCardUpdated, onCardDeleted, onLabelsChanged,
}) {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [addingItemId, setAddingItemId] = useState(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  const coverColors = ['#4BCE97', '#F5CD47', '#FEA362', '#F87168', '#9F8FEF', '#579DFF', '#6CC3E0', '#94C748', '#E774BB', '#8590A2'];

  useEffect(() => {
    loadCard();
  }, [cardId]);

  const loadCard = async () => {
    try {
      const res = await getCard(cardId);
      setCard(res.data);
      setTitle(res.data.title);
      setDescription(res.data.description || '');
      setDueDate(res.data.due_date ? res.data.due_date.slice(0, 16) : '');
    } catch (err) {
      console.error('Failed to load card:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleSave = async () => {
    setEditingTitle(false);
    if (title.trim() && title !== card.title) {
      const res = await updateCard(cardId, { title });
      setCard({ ...card, title });
      onCardUpdated?.({ id: cardId, title });
    }
  };

  const handleDescSave = async () => {
    setEditingDesc(false);
    if (description !== card.description) {
      await updateCard(cardId, { description });
      setCard({ ...card, description });
      onCardUpdated?.({ id: cardId, description });
    }
  };

  const handleDueDateSave = async (value) => {
    setDueDate(value);
    setShowDatePicker(false);
    const due = value || null;
    await updateCard(cardId, { due_date: due });
    setCard({ ...card, due_date: due });
    onCardUpdated?.({ id: cardId, due_date: due });
  };

  const handleRemoveDueDate = async () => {
    setDueDate('');
    setShowDatePicker(false);
    await updateCard(cardId, { due_date: '' });
    setCard({ ...card, due_date: null });
    onCardUpdated?.({ id: cardId, due_date: null });
  };

  const toggleLabel = async (labelId) => {
    const hasLabel = card.labels?.some((l) => l.id === labelId);
    try {
      if (hasLabel) {
        await removeLabelFromCard(cardId, labelId);
        const newLabels = card.labels.filter((l) => l.id !== labelId);
        setCard({ ...card, labels: newLabels });
        onCardUpdated?.({ id: cardId, labels: newLabels });
      } else {
        await addLabelToCard(cardId, labelId);
        const label = boardLabels.find((l) => l.id === labelId);
        const newLabels = [...(card.labels || []), label];
        setCard({ ...card, labels: newLabels });
        onCardUpdated?.({ id: cardId, labels: newLabels });
      }
    } catch (err) {
      console.error('Failed to toggle label:', err);
    }
  };

  const toggleMember = async (userId) => {
    const hasMember = card.members?.some((m) => m.id === userId);
    try {
      if (hasMember) {
        await removeMemberFromCard(cardId, userId);
        const newMembers = card.members.filter((m) => m.id !== userId);
        setCard({ ...card, members: newMembers });
        onCardUpdated?.({ id: cardId, members: newMembers });
      } else {
        await addMemberToCard(cardId, userId);
        const user = users.find((u) => u.id === userId);
        const newMembers = [...(card.members || []), { id: user.id, name: user.name, avatar_color: user.avatar_color }];
        setCard({ ...card, members: newMembers });
        onCardUpdated?.({ id: cardId, members: newMembers });
      }
    } catch (err) {
      console.error('Failed to toggle member:', err);
    }
  };

  const handleAddChecklist = async () => {
    if (!newChecklistTitle.trim()) return;
    try {
      const res = await createChecklist(cardId, { title: newChecklistTitle });
      setCard({ ...card, checklists: [...(card.checklists || []), res.data] });
      setNewChecklistTitle('');
      setShowAddChecklist(false);
    } catch (err) {
      console.error('Failed to create checklist:', err);
    }
  };

  const handleDeleteChecklist = async (checklistId) => {
    try {
      await deleteChecklist(checklistId);
      setCard({
        ...card,
        checklists: card.checklists.filter((cl) => cl.id !== checklistId),
      });
    } catch (err) {
      console.error('Failed to delete checklist:', err);
    }
  };

  const handleAddItem = async (checklistId) => {
    if (!newItemTitle.trim()) return;
    try {
      const res = await createChecklistItem(checklistId, { title: newItemTitle });
      setCard({
        ...card,
        checklists: card.checklists.map((cl) =>
          cl.id === checklistId
            ? { ...cl, items: [...(cl.items || []), res.data] }
            : cl
        ),
      });
      setNewItemTitle('');
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  };

  const handleToggleItem = async (itemId, isCompleted) => {
    try {
      await updateChecklistItem(itemId, { is_completed: !isCompleted });
      setCard({
        ...card,
        checklists: card.checklists.map((cl) => ({
          ...cl,
          items: cl.items?.map((item) =>
            item.id === itemId ? { ...item, is_completed: !isCompleted } : item
          ),
        })),
      });
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteChecklistItem(itemId);
      setCard({
        ...card,
        checklists: card.checklists.map((cl) => ({
          ...cl,
          items: cl.items?.filter((item) => item.id !== itemId),
        })),
      });
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await createComment(cardId, { content: newComment, user_id: 1 });
      setCard({
        ...card,
        comments: [res.data, ...(card.comments || [])],
      });
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setCard({
        ...card,
        comments: card.comments?.filter((c) => c.id !== commentId),
      });
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleArchive = async () => {
    await updateCard(cardId, { is_archived: true });
    onCardDeleted?.(cardId);
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete this card?')) return;
    await deleteCard(cardId);
    onCardDeleted?.(cardId);
  };

  const handleCoverChange = async (color) => {
    await updateCard(cardId, { cover_color: color });
    setCard({ ...card, cover_color: color });
    onCardUpdated?.({ id: cardId, cover_color: color });
    setShowCoverPicker(false);
  };

  if (loading) {
    return (
      <div className="card-detail-overlay" onClick={onClose}>
        <div className="card-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading">
            <div className="spinner" />
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!card) return null;

  const listTitle = card.list_title || 'List';

  return (
    <div className="card-detail-overlay" onClick={onClose}>
      <div className="card-detail-modal" onClick={(e) => e.stopPropagation()} data-testid="card-detail-modal">
        <button className="card-detail-close" onClick={onClose} data-testid="card-detail-close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Cover */}
        {card.cover_color && (
          <div className="card-detail-cover" style={{ background: card.cover_color }}>
            <button 
              className="card-detail-cover-btn"
              onClick={() => setShowCoverPicker(!showCoverPicker)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              Cover
            </button>
          </div>
        )}

        {/* Header */}
        <div className="card-detail-header">
          <span className="card-detail-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </span>
          {editingTitle ? (
            <textarea
              className="card-detail-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleTitleSave())}
              autoFocus
              rows={1}
              data-testid="card-title-input"
            />
          ) : (
            <h2
              className="card-detail-title"
              onClick={() => setEditingTitle(true)}
              style={{ cursor: 'pointer' }}
              data-testid="card-title"
            >
              {card.title}
            </h2>
          )}
          <p className="card-detail-subtitle">
            in list <a href="#">{listTitle}</a>
          </p>
        </div>

        {/* Quick Info Row */}
        <div className="detail-info-row">
          {/* Members */}
          {card.members?.length > 0 && (
            <div className="detail-info-item">
              <span className="detail-info-label">Members</span>
              <div className="detail-members-row">
                {card.members.map((m) => (
                  <div
                    key={m.id}
                    className="detail-member-avatar"
                    style={{ background: m.avatar_color || '#579DFF' }}
                    title={m.name}
                  >
                    {m.name?.split(' ').map((n) => n[0]).join('').toUpperCase()}
                  </div>
                ))}
                <button className="detail-add-btn" onClick={() => setShowMemberPicker(!showMemberPicker)}>
                  +
                </button>
              </div>
            </div>
          )}

          {/* Labels */}
          {card.labels?.length > 0 && (
            <div className="detail-info-item">
              <span className="detail-info-label">Labels</span>
              <div className="detail-labels-row">
                {card.labels.map((label) => (
                  <span
                    key={label.id}
                    className="detail-label-chip"
                    style={{ background: label.color }}
                    onClick={() => setShowLabelPicker(!showLabelPicker)}
                  >
                    {label.name || '\u00A0\u00A0\u00A0'}
                  </span>
                ))}
                <button className="detail-add-btn" onClick={() => setShowLabelPicker(!showLabelPicker)}>
                  +
                </button>
              </div>
            </div>
          )}

          {/* Due Date */}
          {card.due_date && (
            <div className="detail-info-item">
              <span className="detail-info-label">Due date</span>
              <div 
                className="detail-due-badge"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <input type="checkbox" />
                {format(new Date(card.due_date), 'MMM d, yyyy \'at\' h:mm a')}
              </div>
            </div>
          )}
        </div>

        <div className="card-detail-body">
          {/* Main Content */}
          <div className="card-detail-main">
            {/* Description */}
            <div className="detail-section">
              <div className="detail-section-header">
                <span className="detail-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="15" y2="18" />
                  </svg>
                </span>
                <h3>Description</h3>
                {!editingDesc && description && (
                  <button className="btn-secondary" onClick={() => setEditingDesc(true)}>
                    Edit
                  </button>
                )}
              </div>
              <div className="detail-section-content">
                {editingDesc ? (
                  <>
                    <textarea
                      className="description-textarea"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a more detailed description..."
                      autoFocus
                      data-testid="description-textarea"
                    />
                    <div className="description-actions">
                      <button className="btn-primary" onClick={handleDescSave} style={{ width: 'auto' }}>
                        Save
                      </button>
                      <button className="btn-secondary" onClick={() => {
                        setEditingDesc(false);
                        setDescription(card.description || '');
                      }}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    className={`description-placeholder ${!description ? 'empty' : ''}`}
                    onClick={() => setEditingDesc(true)}
                    data-testid="description-placeholder"
                  >
                    {description || 'Add a more detailed description...'}
                  </div>
                )}
              </div>
            </div>

            {/* Checklists */}
            {card.checklists?.map((checklist) => {
              const total = checklist.items?.length || 0;
              const completed = checklist.items?.filter((i) => i.is_completed).length || 0;
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div key={checklist.id} className="detail-section">
                  <div className="detail-section-header">
                    <span className="detail-section-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 11 12 14 22 4" />
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                      </svg>
                    </span>
                    <h3>{checklist.title}</h3>
                    <button
                      className="btn-secondary"
                      onClick={() => handleDeleteChecklist(checklist.id)}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="detail-section-content">
                    <div className="checklist-progress">
                      <span className="checklist-progress-text">{percent}%</span>
                      <div className="checklist-progress-bar">
                        <div
                          className={`checklist-progress-fill ${percent === 100 ? 'complete' : ''}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {checklist.items?.map((item) => (
                      <div key={item.id} className="checklist-item">
                        <input
                          type="checkbox"
                          checked={item.is_completed}
                          onChange={() => handleToggleItem(item.id, item.is_completed)}
                        />
                        <span className={`checklist-item-text ${item.is_completed ? 'completed' : ''}`}>
                          {item.title}
                        </span>
                        <button
                          className="checklist-item-delete"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {addingItemId === checklist.id ? (
                      <div style={{ marginTop: '8px' }}>
                        <input
                          className="checklist-add-input"
                          placeholder="Add an item"
                          value={newItemTitle}
                          onChange={(e) => setNewItemTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddItem(checklist.id);
                            if (e.key === 'Escape') setAddingItemId(null);
                          }}
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                          <button className="btn-primary" onClick={() => handleAddItem(checklist.id)} style={{ width: 'auto' }}>
                            Add
                          </button>
                          <button className="btn-secondary" onClick={() => setAddingItemId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn-secondary checklist-add-btn"
                        onClick={() => {
                          setAddingItemId(checklist.id);
                          setNewItemTitle('');
                        }}
                      >
                        Add an item
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Activity / Comments */}
            <div className="detail-section">
              <div className="detail-section-header">
                <span className="detail-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </span>
                <h3>Activity</h3>
              </div>
              <div className="detail-section-content">
                <div className="comment-form">
                  <div className="detail-member-avatar" style={{ background: '#FFAB00', flexShrink: 0 }}>
                    AJ
                  </div>
                  <div style={{ flex: 1 }}>
                    <textarea
                      className="comment-input"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={1}
                      onFocus={(e) => e.target.rows = 3}
                      onBlur={(e) => { if (!newComment) e.target.rows = 1; }}
                      data-testid="comment-input"
                    />
                    {newComment && (
                      <button
                        className="btn-primary"
                        style={{ marginTop: '8px', width: 'auto' }}
                        onClick={handleAddComment}
                        data-testid="save-comment-btn"
                      >
                        Save
                      </button>
                    )}
                  </div>
                </div>

                {card.comments?.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div
                      className="detail-member-avatar"
                      style={{ background: comment.user_avatar_color || '#8590A2', flexShrink: 0 }}
                    >
                      {comment.user_name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?'}
                    </div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-author">{comment.user_name || 'Unknown'}</span>
                        <span className="comment-time">
                          {comment.created_at ? format(new Date(comment.created_at), 'MMM d, yyyy \'at\' h:mm a') : ''}
                        </span>
                      </div>
                      <div className="comment-text">{comment.content}</div>
                      <div className="comment-actions">
                        <button onClick={() => handleDeleteComment(comment.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="card-detail-sidebar">
            <div className="sidebar-section">
              <h4>Add to card</h4>
              <button
                className="sidebar-btn"
                onClick={() => setShowMemberPicker(!showMemberPicker)}
                data-testid="members-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Members
              </button>
              <button
                className="sidebar-btn"
                onClick={() => setShowLabelPicker(!showLabelPicker)}
                data-testid="labels-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                Labels
              </button>
              <button
                className="sidebar-btn"
                onClick={() => setShowAddChecklist(!showAddChecklist)}
                data-testid="checklist-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                Checklist
              </button>
              <button
                className="sidebar-btn"
                onClick={() => setShowDatePicker(!showDatePicker)}
                data-testid="dates-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Dates
              </button>
              <button
                className="sidebar-btn"
                onClick={() => setShowCoverPicker(!showCoverPicker)}
                data-testid="cover-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                </svg>
                Cover
              </button>
            </div>

            <div className="sidebar-section">
              <h4>Actions</h4>
              <button className="sidebar-btn" onClick={handleArchive}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
                Archive
              </button>
              <button className="sidebar-btn danger" onClick={handleDelete} data-testid="delete-card-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Delete
              </button>
            </div>

            {/* Label Picker Popover */}
            {showLabelPicker && (
              <div className="popover" style={{ position: 'relative', marginTop: '4px' }}>
                <div className="popover-header">
                  <h4>Labels</h4>
                  <button className="popover-close" onClick={() => setShowLabelPicker(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="popover-body">
                  {boardLabels.map((label) => {
                    const isActive = card.labels?.some((l) => l.id === label.id);
                    return (
                      <div
                        key={label.id}
                        className="popover-item"
                        onClick={() => toggleLabel(label.id)}
                      >
                        <div className="popover-label-bar" style={{ background: label.color }}>
                          {label.name || ''}
                        </div>
                        {isActive && <span className="popover-check">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Member Picker */}
            {showMemberPicker && (
              <div className="popover" style={{ position: 'relative', marginTop: '4px' }}>
                <div className="popover-header">
                  <h4>Members</h4>
                  <button className="popover-close" onClick={() => setShowMemberPicker(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="popover-body">
                  {users.map((user) => {
                    const isActive = card.members?.some((m) => m.id === user.id);
                    return (
                      <div
                        key={user.id}
                        className="popover-item"
                        onClick={() => toggleMember(user.id)}
                      >
                        <div
                          className="detail-member-avatar"
                          style={{ background: user.avatar_color || '#579DFF', width: '28px', height: '28px', fontSize: '11px' }}
                        >
                          {user.name?.split(' ').map((n) => n[0]).join('').toUpperCase()}
                        </div>
                        <span style={{ flex: 1 }}>{user.name}</span>
                        {isActive && <span className="popover-check">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Date Picker */}
            {showDatePicker && (
              <div className="popover" style={{ position: 'relative', marginTop: '4px' }}>
                <div className="popover-header">
                  <h4>Dates</h4>
                  <button className="popover-close" onClick={() => setShowDatePicker(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="popover-body">
                  <label className="modal-label">Due date</label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="modal-input"
                    style={{ marginBottom: '12px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-primary" onClick={() => handleDueDateSave(dueDate)} style={{ flex: 1 }}>
                      Save
                    </button>
                    <button className="btn-secondary" onClick={handleRemoveDueDate}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Checklist Add */}
            {showAddChecklist && (
              <div className="popover" style={{ position: 'relative', marginTop: '4px' }}>
                <div className="popover-header">
                  <h4>Add checklist</h4>
                  <button className="popover-close" onClick={() => setShowAddChecklist(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="popover-body">
                  <label className="modal-label">Title</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    placeholder="Checklist"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                    autoFocus
                    style={{ marginBottom: '12px' }}
                  />
                  <button className="btn-primary" onClick={handleAddChecklist}>
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Cover Picker */}
            {showCoverPicker && (
              <div className="popover" style={{ position: 'relative', marginTop: '4px' }}>
                <div className="popover-header">
                  <h4>Cover</h4>
                  <button className="popover-close" onClick={() => setShowCoverPicker(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="popover-body">
                  <label className="modal-label">Colors</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {coverColors.map((color) => (
                      <div
                        key={color}
                        onClick={() => handleCoverChange(color)}
                        style={{
                          width: '48px',
                          height: '32px',
                          background: color,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          border: card.cover_color === color ? '2px solid #579DFF' : 'none',
                        }}
                      />
                    ))}
                  </div>
                  {card.cover_color && (
                    <button className="btn-secondary" onClick={() => handleCoverChange(null)} style={{ width: '100%' }}>
                      Remove cover
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
