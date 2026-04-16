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
      {/* Cover */}
      {card.cover_color && (
        <div className="card-cover" style={{ background: card.cover_color }} />
      )}

      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div
          className={`card-labels ${labelsExpanded ? 'card-labels-expanded' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLabels();
          }}
        >
          {card.labels.map((label) => (
            <div
              key={label.id}
              className="card-label"
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
      {(card.due_date || card.checklist_total > 0 || card.description || (card.members && card.members.length > 0)) && (
        <div className="card-badges">
          {card.due_date && (
            <span className={`card-badge ${getDueBadgeClass()}`}>
              🕐 {formatDueDate()}
            </span>
          )}
          {card.description && (
            <span className="card-badge" title="This card has a description">
              📝
            </span>
          )}
          {card.checklist_total > 0 && (
            <span
              className={`card-badge ${
                card.checklist_completed === card.checklist_total ? 'completed' : ''
              }`}
            >
              <span>{`☑ ${card.checklist_completed}/${card.checklist_total}`}</span>
            </span>
          )}

          {/* Members */}
          {card.members && card.members.length > 0 && (
            <div className="card-members">
              {card.members.map((member) => (
                <div
                  key={member.id}
                  className="card-member-avatar"
                  style={{ background: member.avatar_color }}
                  title={member.name}
                >
                  {member.name?.split(' ').map((n) => n[0]).join('')}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick edit button */}
      <button
        className="card-edit-btn"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        title="Edit card"
      >
        ✏️
      </button>
    </div>
  );
}
