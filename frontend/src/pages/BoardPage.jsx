import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  getBoard, updateBoard, createList, updateList, deleteList,
  createCard, updateCard, deleteCard, getLabels, getUsers,
  reorderCards, searchCards,
} from '../api/api';
import CardItem from '../components/BoardView/CardItem';
import CardDetailModal from '../components/CardDetail/CardDetailModal';

export default function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');
  const [addingListIndex, setAddingListIndex] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [addingCardListId, setAddingCardListId] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editingListId, setEditingListId] = useState(null);
  const [editListTitle, setEditListTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [boardLabels, setBoardLabels] = useState([]);
  const [users, setUsers] = useState([]);
  const [labelsExpanded, setLabelsExpanded] = useState(false);

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [filterLabel, setFilterLabel] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [filterDue, setFilterDue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    loadBoard();
    loadLabels();
    loadUsers();
  }, [boardId]);

  const loadBoard = async () => {
    try {
      const res = await getBoard(boardId);
      setBoard(res.data);
      setBoardTitle(res.data.title);
    } catch (err) {
      console.error('Failed to load board:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadLabels = async () => {
    try {
      const res = await getLabels(boardId);
      setBoardLabels(res.data);
    } catch (err) {
      console.error('Failed to load labels:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleBoardTitleSave = async () => {
    setEditingTitle(false);
    if (boardTitle.trim() && boardTitle !== board.title) {
      await updateBoard(boardId, { title: boardTitle });
      setBoard({ ...board, title: boardTitle });
    }
  };

  const handleAddList = async () => {
    if (!newListTitle.trim()) return;
    try {
      const res = await createList(boardId, { title: newListTitle });
      const newList = { ...res.data, cards: [] };
      setBoard({ ...board, lists: [...board.lists, newList] });
      setNewListTitle('');
    } catch (err) {
      console.error('Failed to create list:', err);
    }
  };

  const handleEditListTitle = async (listId) => {
    if (!editListTitle.trim()) {
      setEditingListId(null);
      return;
    }
    try {
      await updateList(listId, { title: editListTitle });
      setBoard({
        ...board,
        lists: board.lists.map((l) =>
          l.id === listId ? { ...l, title: editListTitle } : l
        ),
      });
    } catch (err) {
      console.error('Failed to update list:', err);
    }
    setEditingListId(null);
  };

  const handleDeleteList = async (listId) => {
    if (!confirm('Delete this list and all its cards?')) return;
    try {
      await deleteList(listId);
      setBoard({
        ...board,
        lists: board.lists.filter((l) => l.id !== listId),
      });
    } catch (err) {
      console.error('Failed to delete list:', err);
    }
  };

  const handleAddCard = async (listId) => {
    if (!newCardTitle.trim()) return;
    try {
      const res = await createCard(listId, { title: newCardTitle });
      setBoard({
        ...board,
        lists: board.lists.map((l) =>
          l.id === listId ? { ...l, cards: [...l.cards, res.data] } : l
        ),
      });
      setNewCardTitle('');
    } catch (err) {
      console.error('Failed to create card:', err);
    }
  };

  const handleDeleteCard = async (cardId, listId) => {
    try {
      await deleteCard(cardId);
      setBoard({
        ...board,
        lists: board.lists.map((l) =>
          l.id === listId
            ? { ...l, cards: l.cards.filter((c) => c.id !== cardId) }
            : l
        ),
      });
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  };

  const handleDragEnd = useCallback(
    async (result) => {
      const { source, destination, type } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      const newLists = [...board.lists];

      if (type === 'LIST') {
        const [moved] = newLists.splice(source.index, 1);
        newLists.splice(destination.index, 0, moved);

        const updatedLists = newLists.map((l, i) => ({ ...l, position: i }));
        setBoard({ ...board, lists: updatedLists });

        try {
          await reorderCards({ cards: [] });
        } catch (err) {
          console.error('Failed to reorder lists:', err);
        }
        return;
      }

      // Card drag
      const sourceListIdx = newLists.findIndex(
        (l) => l.id.toString() === source.droppableId
      );
      const destListIdx = newLists.findIndex(
        (l) => l.id.toString() === destination.droppableId
      );

      const sourceCards = [...newLists[sourceListIdx].cards];
      const [movedCard] = sourceCards.splice(source.index, 1);

      if (sourceListIdx === destListIdx) {
        sourceCards.splice(destination.index, 0, movedCard);
        newLists[sourceListIdx] = { ...newLists[sourceListIdx], cards: sourceCards };
      } else {
        const destCards = [...newLists[destListIdx].cards];
        const updatedCard = { ...movedCard, list_id: newLists[destListIdx].id };
        destCards.splice(destination.index, 0, updatedCard);

        newLists[sourceListIdx] = { ...newLists[sourceListIdx], cards: sourceCards };
        newLists[destListIdx] = { ...newLists[destListIdx], cards: destCards };
      }

      setBoard({ ...board, lists: newLists });

      const cardsToUpdate = [];
      newLists.forEach((list) => {
        list.cards.forEach((card, idx) => {
          cardsToUpdate.push({
            id: card.id,
            list_id: list.id,
            position: idx,
          });
        });
      });

      try {
        await reorderCards({ cards: cardsToUpdate });
      } catch (err) {
        console.error('Failed to reorder cards:', err);
        loadBoard();
      }
    },
    [board]
  );

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const params = { board_id: boardId, q: query };
      if (filterLabel) params.label_id = filterLabel;
      if (filterMember) params.member_id = filterMember;
      if (filterDue) params.due_date = filterDue;
      const res = await searchCards(params);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const clearFilters = () => {
    setFilterLabel('');
    setFilterMember('');
    setFilterDue('');
    setShowFilter(false);
    setSearchResults(null);
    setSearchQuery('');
  };

  const isCardFiltered = (card) => {
    if (!showFilter && !filterLabel && !filterMember && !filterDue) return false;
    if (filterLabel && !card.labels?.some((l) => l.id === parseInt(filterLabel))) return true;
    if (filterMember && !card.members?.some((m) => m.id === parseInt(filterMember))) return true;
    if (filterDue === 'overdue' && (!card.due_date || new Date(card.due_date) >= new Date())) return true;
    if (filterDue === 'today' && (!card.due_date || new Date(card.due_date).toDateString() !== new Date().toDateString())) return true;
    if (filterDue === 'none' && card.due_date) return true;
    return false;
  };

  const onCardUpdated = (updatedCard) => {
    setBoard({
      ...board,
      lists: board.lists.map((l) => ({
        ...l,
        cards: l.cards.map((c) => (c.id === updatedCard.id ? { ...c, ...updatedCard } : c)),
      })),
    });
  };

  if (loading) {
    return (
      <div className="board-page" style={{ background: '#0079BF' }}>
        <div className="loading">
          <div className="spinner" />
          Loading board...
        </div>
      </div>
    );
  }

  if (!board) return null;

  const hasActiveFilters = filterLabel || filterMember || filterDue;

  return (
    <div className="board-page" style={{ background: board.background }}>
      {/* Board Header */}
      <div className="board-header">
        {editingTitle ? (
          <input
            className="board-title-input"
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            onBlur={handleBoardTitleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleBoardTitleSave()}
            autoFocus
          />
        ) : (
          <button 
            className="board-title-btn" 
            onClick={() => setEditingTitle(true)}
            data-testid="board-title"
          >
            {board.title}
          </button>
        )}

        <div className="board-header-divider" />

        {/* Star Button */}
        <button className="board-header-btn" title="Star board">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>

        {/* Board Members */}
        <div className="board-members">
          {users.slice(0, 4).map((user) => (
            <div
              key={user.id}
              className="board-member"
              style={{ background: user.avatar_color || '#579DFF' }}
              title={user.name}
            >
              {user.name?.split(' ').map((n) => n[0]).join('').toUpperCase()}
            </div>
          ))}
        </div>

        <div className="board-header-right">
          {/* Search */}
          <div className="header-search" style={{ position: 'relative' }}>
            <span className="header-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={searchQuery ? { background: '#22272B', color: '#B6C2CF' } : {}}
            />
            {searchResults && (
              <div className="search-results-dropdown">
                {searchResults.length === 0 ? (
                  <div className="search-result-item">
                    <span className="search-result-title" style={{ color: '#738496' }}>
                      No cards found
                    </span>
                  </div>
                ) : (
                  searchResults.map((card) => (
                    <div
                      key={card.id}
                      className="search-result-item"
                      onClick={() => {
                        setSelectedCard(card.id);
                        setSearchResults(null);
                        setSearchQuery('');
                      }}
                    >
                      <div className="search-result-title">{card.title}</div>
                      <div className="search-result-meta">in {card.list_title}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Filter Button */}
          <button
            className={`board-header-btn ${hasActiveFilters ? 'active' : ''}`}
            onClick={() => setShowFilter(!showFilter)}
            data-testid="filter-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filters
          </button>

          {/* Share Button */}
          <button className="board-header-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share
          </button>

          {/* Menu Button */}
          <button className="board-header-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilter && (
        <div className="filter-bar">
          <select value={filterLabel} onChange={(e) => setFilterLabel(e.target.value)}>
            <option value="">All Labels</option>
            {boardLabels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name || l.color}
              </option>
            ))}
          </select>

          <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)}>
            <option value="">All Members</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <select value={filterDue} onChange={(e) => setFilterDue(e.target.value)}>
            <option value="">Any Due Date</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="week">Due This Week</option>
            <option value="none">No Due Date</option>
          </select>

          {hasActiveFilters && (
            <button className="filter-clear" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Board Canvas */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="LIST" direction="horizontal">
          {(provided) => (
            <div
              className="board-canvas"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {board.lists.map((list, listIndex) => (
                <Draggable
                  key={list.id}
                  draggableId={`list-${list.id}`}
                  index={listIndex}
                >
                  {(provided, snapshot) => (
                    <div
                      className="list-wrapper"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <div
                        className="list-container"
                        style={snapshot.isDragging ? { opacity: 0.9, transform: 'rotate(3deg)' } : {}}
                      >
                        {/* List Header */}
                        <div className="list-header" {...provided.dragHandleProps}>
                          {editingListId === list.id ? (
                            <input
                              className="list-title-input"
                              value={editListTitle}
                              onChange={(e) => setEditListTitle(e.target.value)}
                              onBlur={() => handleEditListTitle(list.id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleEditListTitle(list.id)}
                              autoFocus
                            />
                          ) : (
                            <div
                              className="list-title"
                              onClick={() => {
                                setEditingListId(list.id);
                                setEditListTitle(list.title);
                              }}
                              data-testid={`list-title-${list.id}`}
                            >
                              {list.title}
                            </div>
                          )}
                          <button
                            className="list-menu-btn"
                            onClick={() => handleDeleteList(list.id)}
                            title="List actions"
                            data-testid={`list-menu-${list.id}`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="19" cy="12" r="1" />
                              <circle cx="5" cy="12" r="1" />
                            </svg>
                          </button>
                        </div>

                        {/* Cards */}
                        <Droppable droppableId={list.id.toString()} type="CARD">
                          {(cardProvided, cardSnapshot) => (
                            <div
                              className="list-cards"
                              ref={cardProvided.innerRef}
                              {...cardProvided.droppableProps}
                              style={{
                                background: cardSnapshot.isDraggingOver
                                  ? 'rgba(255,255,255,0.04)'
                                  : 'transparent',
                              }}
                            >
                              {list.cards
                                .filter((card) => !isCardFiltered(card))
                                .map((card, cardIndex) => (
                                  <Draggable
                                    key={card.id}
                                    draggableId={`card-${card.id}`}
                                    index={cardIndex}
                                  >
                                    {(cardProv, cardSnap) => (
                                      <div
                                        ref={cardProv.innerRef}
                                        {...cardProv.draggableProps}
                                        {...cardProv.dragHandleProps}
                                      >
                                        <CardItem
                                          card={card}
                                          isDragging={cardSnap.isDragging}
                                          labelsExpanded={labelsExpanded}
                                          onToggleLabels={() => setLabelsExpanded(!labelsExpanded)}
                                          onClick={() => setSelectedCard(card.id)}
                                          onDelete={() => handleDeleteCard(card.id, list.id)}
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              {cardProvided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        {/* Add Card */}
                        <div className="list-footer">
                          {addingCardListId === list.id ? (
                            <div className="add-card-form">
                              <textarea
                                placeholder="Enter a title for this card..."
                                value={newCardTitle}
                                onChange={(e) => setNewCardTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddCard(list.id);
                                  }
                                  if (e.key === 'Escape') {
                                    setAddingCardListId(null);
                                    setNewCardTitle('');
                                  }
                                }}
                                autoFocus
                                data-testid={`add-card-textarea-${list.id}`}
                              />
                              <div className="add-card-actions">
                                <button
                                  className="btn-primary"
                                  onClick={() => handleAddCard(list.id)}
                                  data-testid={`add-card-btn-${list.id}`}
                                >
                                  Add card
                                </button>
                                <button
                                  className="add-card-close"
                                  onClick={() => {
                                    setAddingCardListId(null);
                                    setNewCardTitle('');
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="add-card-btn"
                              onClick={() => setAddingCardListId(list.id)}
                              data-testid={`add-card-trigger-${list.id}`}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              Add a card
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {/* Add List */}
              <div className="add-list-wrapper">
                {addingListIndex ? (
                  <div className="add-list-form">
                    <input
                      placeholder="Enter list title..."
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddList();
                        if (e.key === 'Escape') {
                          setAddingListIndex(false);
                          setNewListTitle('');
                        }
                      }}
                      autoFocus
                      data-testid="add-list-input"
                    />
                    <div className="add-card-actions">
                      <button 
                        className="btn-primary" 
                        onClick={handleAddList}
                        data-testid="add-list-btn"
                      >
                        Add list
                      </button>
                      <button
                        className="add-card-close"
                        onClick={() => {
                          setAddingListIndex(false);
                          setNewListTitle('');
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="add-list-btn"
                    onClick={() => setAddingListIndex(true)}
                    data-testid="add-list-trigger"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {board.lists.length === 0 ? 'Add a list' : 'Add another list'}
                  </button>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          cardId={selectedCard}
          boardId={boardId}
          boardLabels={boardLabels}
          users={users}
          onClose={() => setSelectedCard(null)}
          onCardUpdated={onCardUpdated}
          onCardDeleted={(cardId) => {
            setBoard({
              ...board,
              lists: board.lists.map((l) => ({
                ...l,
                cards: l.cards.filter((c) => c.id !== cardId),
              })),
            });
            setSelectedCard(null);
          }}
          onLabelsChanged={loadLabels}
        />
      )}
    </div>
  );
}
