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
  };

  if (loading) {
    return (
      <div className="card-detail-overlay" onClick={onClose}>
        <div className="card-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading"><div className="spinner" />Loading...</div>
        </div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="card-detail-overlay" onClick={onClose}>
      <div className="card-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="card-detail-close" onClick={onClose}>✕</button>

        {/* Cover */}
        {card.cover_color && (
          <div className="card-detail-cover" style={{ background: card.cover_color }} />
        )}

        {/* Header */}
        <div className="card-detail-header">
          <span className="card-detail-header-icon">📋</span>
          {editingTitle ? (
            <textarea
              className="card-detail-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleTitleSave())}
              autoFocus
              rows={1}
            />
          ) : (
            <h2
              className="card-detail-title"
              onClick={() => setEditingTitle(true)}
              style={{ cursor: 'pointer' }}
            >
              {card.title}
            </h2>
          )}
        </div>

        {/* Labels & Members inline */}
        {card.labels?.length > 0 && (
          <div className="detail-labels">
            <span style={{ fontSize: 12, fontWeight: 700, color: '#5e6c84', marginRight: 4, alignSelf: 'center' }}>
              Labels
            </span>
            {card.labels.map((label) => (
              <span
                key={label.id}
                className="detail-label-chip"
                style={{ background: label.color }}
              >
                {label.name || '\u00A0\u00A0'}
              </span>
            ))}
          </div>
        )}

        {card.members?.length > 0 && (
          <div className="detail-members">
            <span style={{ fontSize: 12, fontWeight: 700, color: '#5e6c84', marginRight: 4 }}>
              Members
            </span>
            {card.members.map((m) => (
              <div
                key={m.id}
                className="detail-member-avatar"
                style={{ background: m.avatar_color }}
                title={m.name}
              >
                {m.name?.split(' ').map((n) => n[0]).join('')}
              </div>
            ))}
          </div>
        )}

        {/* Due date */}
        {card.due_date && (
          <div className="detail-labels" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#5e6c84', marginRight: 4, alignSelf: 'center' }}>
              Due date
            </span>
            <span className="due-date-badge" style={{ background: '#f4f5f7' }}>
              🕐 {format(new Date(card.due_date), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        <div className="card-detail-body">
          {/* Main Content */}
          <div className="card-detail-main">
            {/* Description */}
            <div className="detail-section">
              <div className="detail-section-header">
                <span className="detail-section-icon">📝</span>
                <h3>Description</h3>
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
                    />
                    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                      <button className="btn-primary" onClick={handleDescSave}>Save</button>
                      <button className="btn-secondary" onClick={() => {
                        setEditingDesc(false);
                        setDescription(card.description || '');
                      }}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <div
                    className={`description-editor ${!description ? 'empty' : ''}`}
                    onClick={() => setEditingDesc(true)}
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
                    <span className="detail-section-icon">☑️</span>
                    <h3>{checklist.title}</h3>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: 12, padding: '4px 8px' }}
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
                          ✕
                        </button>
                      </div>
                    ))}

                    {addingItemId === checklist.id ? (
                      <div className="checklist-add-item">
                        <input
                          placeholder="Add an item..."
                          value={newItemTitle}
                          onChange={(e) => setNewItemTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddItem(checklist.id);
                            if (e.key === 'Escape') setAddingItemId(null);
                          }}
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          <button className="btn-primary" onClick={() => handleAddItem(checklist.id)}>
                            Add
                          </button>
                          <button className="btn-secondary" onClick={() => setAddingItemId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn-secondary"
                        style={{ marginTop: 4, fontSize: 13 }}
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

            {/* Comments Section */}
            <div className="detail-section">
              <div className="detail-section-header">
                <span className="detail-section-icon">💬</span>
                <h3>Activity</h3>
              </div>
              <div className="detail-section-content">
                <div className="comment-form">
                  <div className="detail-member-avatar" style={{ background: '#0079BF', flexShrink: 0 }}>
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
                    />
                    {newComment && (
                      <button
                        className="btn-primary"
                        style={{ marginTop: 4 }}
                        onClick={handleAddComment}
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
                      style={{ background: comment.user_avatar_color || '#838C91', flexShrink: 0 }}
                    >
                      {comment.user_name?.split(' ').map((n) => n[0]).join('') || '?'}
                    </div>
                    <div className="comment-content">
                      <span className="comment-author">{comment.user_name || 'Unknown'}</span>
                      <span className="comment-time">
                        {comment.created_at ? format(new Date(comment.created_at), 'MMM d, yyyy') : ''}
                      </span>
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
              >
                👤 Members
              </button>
              <button
                className="sidebar-btn"
                onClick={() => setShowLabelPicker(!showLabelPicker)}
              >
                🏷️ Labels
              </button>
              <button
                className="sidebar-btn"
                onClick={() => setShowAddChecklist(!showAddChecklist)}
              >
                ☑️ Checklist
              </button>
              <button
                className="sidebar-btn"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                📅 Due Date
              </button>
              <button
                className="sidebar-btn"
                onClick={() => {
                  const colors = ['#61BD4F', '#F2D600', '#FF9F1A', '#EB5A46', '#C377E0', '#0079BF', null];
                  const currentIdx = colors.indexOf(card.cover_color);
                  handleCoverChange(colors[(currentIdx + 1) % colors.length]);
                }}
              >
                🎨 Cover
              </button>
            </div>

            <div className="sidebar-section">
              <h4>Actions</h4>
              <button className="sidebar-btn" onClick={handleArchive}>
                📦 Archive
              </button>
              <button className="sidebar-btn danger" onClick={handleDelete}>
                🗑️ Delete
              </button>
            </div>

            {/* Label Picker Popover */}
            {showLabelPicker && (
              <div className="popover" style={{ position: 'relative', marginTop: 4 }}>
                <div className="popover-header">
                  <h4>Labels</h4>
                  <button className="popover-close" onClick={() => setShowLabelPicker(false)}>✕</button>
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
                        <div
                          style={{
                            background: label.color,
                            height: 32,
                            flex: 1,
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 12px',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          {label.name || '\u00A0'}
                        </div>
                        {isActive && <span>✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Member Picker */}
            {showMemberPicker && (
              <div className="popover" style={{ position: 'relative', marginTop: 4 }}>
                <div className="popover-header">
                  <h4>Members</h4>
                  <button className="popover-close" onClick={() => setShowMemberPicker(false)}>✕</button>
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
                          style={{ background: user.avatar_color, width: 28, height: 28, fontSize: 11 }}
                        >
                          {user.name?.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span style={{ flex: 1 }}>{user.name}</span>
                        {isActive && <span>✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Date Picker */}
            {showDatePicker && (
              <div className="popover" style={{ position: 'relative', marginTop: 4 }}>
                <div className="popover-header">
                  <h4>Due Date</h4>
                  <button className="popover-close" onClick={() => setShowDatePicker(false)}>✕</button>
                </div>
                <div className="popover-body">
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 8,
                      border: '2px solid #dfe1e6',
                      borderRadius: 4,
                      fontSize: 14,
                      marginBottom: 8,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-primary" onClick={() => handleDueDateSave(dueDate)}>
                      Save
                    </button>
                    <button className="btn-secondary" onClick={handleRemoveDueDate}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Checklist add */}
            {showAddChecklist && (
              <div className="popover" style={{ position: 'relative', marginTop: 4 }}>
                <div className="popover-header">
                  <h4>Add Checklist</h4>
                  <button className="popover-close" onClick={() => setShowAddChecklist(false)}>✕</button>
                </div>
                <div className="popover-body">
                  <input
                    type="text"
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    placeholder="Checklist title..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: 8,
                      border: '2px solid #dfe1e6',
                      borderRadius: 4,
                      fontSize: 14,
                      marginBottom: 8,
                    }}
                  />
                  <button className="btn-primary" onClick={handleAddChecklist}>
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
