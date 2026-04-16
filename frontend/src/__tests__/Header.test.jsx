import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/Header/Header';

describe('Header', () => {
  const renderHeader = () => {
    return render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
  };

  it('renders the app name', () => {
    renderHeader();
    expect(screen.getByText('TaskFlow')).toBeInTheDocument();
  });

  it('renders the default user avatar', () => {
    renderHeader();
    expect(screen.getByText('AJ')).toBeInTheDocument();
  });

  it('renders a header element', () => {
    const { container } = renderHeader();
    expect(container.querySelector('.header')).toBeInTheDocument();
  });
});

describe('API service', () => {
  it('exports all required functions', async () => {
    const api = await import('../api/api');

    expect(api.getBoards).toBeDefined();
    expect(api.createBoard).toBeDefined();
    expect(api.getBoard).toBeDefined();
    expect(api.updateBoard).toBeDefined();
    expect(api.deleteBoard).toBeDefined();
    expect(api.createList).toBeDefined();
    expect(api.updateList).toBeDefined();
    expect(api.deleteList).toBeDefined();
    expect(api.createCard).toBeDefined();
    expect(api.updateCard).toBeDefined();
    expect(api.deleteCard).toBeDefined();
    expect(api.reorderCards).toBeDefined();
    expect(api.getLabels).toBeDefined();
    expect(api.addLabelToCard).toBeDefined();
    expect(api.removeLabelFromCard).toBeDefined();
    expect(api.createChecklist).toBeDefined();
    expect(api.createChecklistItem).toBeDefined();
    expect(api.updateChecklistItem).toBeDefined();
    expect(api.createComment).toBeDefined();
    expect(api.searchCards).toBeDefined();
    expect(api.getUsers).toBeDefined();
  });
});
