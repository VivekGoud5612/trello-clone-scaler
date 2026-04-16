import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import * as api from '../api/api';

vi.mock('../api/api');

const renderWithRouter = (component) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    api.getBoards.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithRouter(<HomePage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders boards after loading', async () => {
    api.getBoards.mockResolvedValue({
      data: [
        { id: 1, title: 'Board A', background: '#0079BF' },
        { id: 2, title: 'Board B', background: '#D29034' },
      ],
    });

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Board A')).toBeInTheDocument();
      expect(screen.getByText('Board B')).toBeInTheDocument();
    });
  });

  it('renders empty state with create button', async () => {
    api.getBoards.mockResolvedValue({ data: [] });
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Create new board')).toBeInTheDocument();
    });
  });

  it('opens create board modal', async () => {
    api.getBoards.mockResolvedValue({ data: [] });
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Create new board'));
    });

    expect(screen.getByText('Create Board')).toBeInTheDocument();
    expect(screen.getByTestId('board-title-input')).toBeInTheDocument();
  });

  it('creates a new board', async () => {
    api.getBoards.mockResolvedValue({ data: [] });
    api.createBoard.mockResolvedValue({
      data: { id: 1, title: 'New Board', background: '#0079BF' },
    });

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Create new board'));
    });

    const input = screen.getByTestId('board-title-input');
    fireEvent.change(input, { target: { value: 'New Board' } });
    fireEvent.click(screen.getByTestId('create-board-btn'));

    await waitFor(() => {
      expect(api.createBoard).toHaveBeenCalledWith({
        title: 'New Board',
        background: '#0079BF',
      });
    });
  });

  it('disables create button when title is empty', async () => {
    api.getBoards.mockResolvedValue({ data: [] });
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Create new board'));
    });

    const createBtn = screen.getByTestId('create-board-btn');
    expect(createBtn).toBeDisabled();
  });

  it('deletes a board after confirmation', async () => {
    api.getBoards.mockResolvedValue({
      data: [{ id: 1, title: 'Board A', background: '#0079BF' }],
    });
    api.deleteBoard.mockResolvedValue({});
    window.confirm = vi.fn(() => true);

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Board A')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle('Delete board');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.deleteBoard).toHaveBeenCalledWith(1);
    });
  });
});
