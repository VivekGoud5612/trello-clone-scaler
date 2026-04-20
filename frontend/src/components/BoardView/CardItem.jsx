import { format, isPast, isToday, differenceInDays } from 'date-fns';

export default function CardItem({ card, isDragging, labelsExpanded, onToggleLabels, onClick, onDelete }) {
  const getDueBadgeClass = () => {
    if (!card.due_date) return '';
    const due = new Date(card.due_date);
    if (isPast(due) && !isToday(due)) return 'overdue';
    if (isToday(due) || differenceInDays(due, new Date()) <= 1) return 'due-soon';
    return '';
  };

  const formatDueDate = () => {
    if (!card.due_date) return '';
    return format(new Date(card.due_date), 'MMM d');
  };

  return (
    <div
      className={`card-item ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
      data-testid={`card-${card.id}`}
    >
      {/* Cover Color */}
      {card.cover_color && (
        <div className="card-cover" style={{ background: card.cover_color }} />
      )}

      <div className="card-content">
        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div
            className="card-labels"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLabels();
            }}
          >
            {card.labels.map((label) => (
              <div
                key={label.id}
                className={`card-label ${labelsExpanded ? 'expanded' : ''}`}
                style={{ background: label.color }}
                title={label.name}
              >
                {labelsExpanded ? label.name : ''}
              </div>
            ))}
          </div>
        )}

        {/* Title */}
        <div className="card-title">{card.title}</div>

        {/* Badges & Members */}
        {(card.due_date || card.checklist_total > 0 || card.description || card.comment_count > 0 || (card.members && card.members.length > 0)) && (
          <div className="card-badges">
            {/* Due Date Badge */}
            {card.due_date && (
              <span className={`card-badge ${getDueBadgeClass()}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formatDueDate()}
              </span>
            )}

            {/* Description Badge */}
            {card.description && (
              <span className="card-badge has-description" title="This card has a description">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="15" y2="18" />
                </svg>
              </span>
            )}

            {/* Comments Badge */}
            {card.comment_count > 0 && (
              <span className="card-badge" title={`${card.comment_count} comments`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                {card.comment_count}
              </span>
            )}

            {/* Checklist Badge */}
            {card.checklist_total > 0 && (
              <span
                className={`card-badge ${
                  card.checklist_completed === card.checklist_total ? 'complete' : ''
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                {card.checklist_completed}/{card.checklist_total}
              </span>
            )}

            {/* Attachment Badge */}
            {card.attachment_count > 0 && (
              <span className="card-badge" title={`${card.attachment_count} attachments`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
                {card.attachment_count}
              </span>
            )}

            {/* Members */}
            {card.members && card.members.length > 0 && (
              <div className="card-members">
                {card.members.slice(0, 3).map((member) => (
                  <div
                    key={member.id}
                    className="card-member-avatar"
                    style={{ background: member.avatar_color || '#579DFF' }}
                    title={member.name}
                  >
                    {member.name?.split(' ').map((n) => n[0]).join('').toUpperCase()}
                  </div>
                ))}
                {card.members.length > 3 && (
                  <div
                    className="card-member-avatar"
                    style={{ background: '#3D474F', color: '#B6C2CF' }}
                  >
                    +{card.members.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Edit Button */}
      <button
        className="card-edit-btn"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        title="Open card"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>
  );
}
