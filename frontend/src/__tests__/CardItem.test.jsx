import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CardItem from '../components/BoardView/CardItem';

describe('CardItem', () => {
  const baseCard = {
    id: 1,
    title: 'Test Card',
    description: '',
    labels: [],
    members: [],
    due_date: null,
    cover_color: null,
    checklist_total: 0,
    checklist_completed: 0,
  };

  it('renders card title', () => {
    render(
      <CardItem
        card={baseCard}
        isDragging={false}
        labelsExpanded={false}
        onToggleLabels={vi.fn()}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('renders card labels', () => {
    const card = {
      ...baseCard,
      labels: [
        { id: 1, name: 'Urgent', color: '#EB5A46' },
        { id: 2, name: 'Feature', color: '#61BD4F' },
      ],
    };
    render(
      <CardItem card={card} isDragging={false} labelsExpanded={false}
        onToggleLabels={vi.fn()} onClick={vi.fn()} onDelete={vi.fn()} />
    );
    const labels = screen.getAllByTitle(/Urgent|Feature/);
    expect(labels).toHaveLength(2);
  });

  it('renders cover if present', () => {
    const card = { ...baseCard, cover_color: '#61BD4F' };
    const { container } = render(
      <CardItem card={card} isDragging={false} labelsExpanded={false}
        onToggleLabels={vi.fn()} onClick={vi.fn()} onDelete={vi.fn()} />
    );
    const cover = container.querySelector('.card-cover');
    expect(cover).toBeInTheDocument();
    expect(cover.style.background).toBe('rgb(97, 189, 79)');
  });

  it('renders due date badge', () => {
    const card = { ...baseCard, due_date: '2026-12-31T00:00:00' };
    render(
      <CardItem card={card} isDragging={false} labelsExpanded={false}
        onToggleLabels={vi.fn()} onClick={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText(/Dec 31/)).toBeInTheDocument();
  });

  it('renders checklist progress', () => {
    const card = { ...baseCard, checklist_total: 4, checklist_completed: 2 };
    render(
      <CardItem card={card} isDragging={false} labelsExpanded={false}
        onToggleLabels={vi.fn()} onClick={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText(/☑ 2\/4/)).toBeInTheDocument();
  });

  it('renders member avatars', () => {
    const card = {
      ...baseCard,
      members: [
        { id: 1, name: 'Alex Johnson', avatar_color: '#0079BF' },
      ],
    };
    render(
      <CardItem card={card} isDragging={false} labelsExpanded={false}
        onToggleLabels={vi.fn()} onClick={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText('AJ')).toBeInTheDocument();
  });

  it('applies dragging class when dragging', () => {
    const { container } = render(
      <CardItem card={baseCard} isDragging={true} labelsExpanded={false}
        onToggleLabels={vi.fn()} onClick={vi.fn()} onDelete={vi.fn()} />
    );
    expect(container.querySelector('.dragging')).toBeInTheDocument();
  });

  it('renders description badge when description exists', () => {
    const card = { ...baseCard, description: 'Some description' };
    render(
      <CardItem card={card} isDragging={false} labelsExpanded={false}
        onToggleLabels={vi.fn()} onClick={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByTitle('This card has a description')).toBeInTheDocument();
  });
});
