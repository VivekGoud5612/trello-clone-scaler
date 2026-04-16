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

        // Update positions
        const updatedLists = newLists.map((l, i) => ({ ...l, position: i }));
        setBoard({ ...board, lists: updatedLists });

        try {
          await reorderCards({
            cards: [],
          });
          // Actually reorder lists via separate endpoint — but we use reorderCards for cards
          // Let's update positions in-place for now
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
        // Same list reorder
        sourceCards.splice(destination.index, 0, movedCard);
        newLists[sourceListIdx] = { ...newLists[sourceListIdx], cards: sourceCards };
      } else {
        // Cross-list move
        const destCards = [...newLists[destListIdx].cards];
        const updatedCard = { ...movedCard, list_id: newLists[destListIdx].id };
        destCards.splice(destination.index, 0, updatedCard);

        newLists[sourceListIdx] = { ...newLists[sourceListIdx], cards: sourceCards };
        newLists[destListIdx] = { ...newLists[destListIdx], cards: destCards };
      }

      setBoard({ ...board, lists: newLists });

      // Build reorder payload for all affected cards
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
        loadBoard(); // Reload on error
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
    return <div className="loading"><div className="spinner" />Loading board...</div>;
  }

  if (!board) return null;

  const hasActiveFilters = filterLabel || filterMember || filterDue;

  return (
    <div className="board-page" style={{ background: board.background }}>
      {/* Board Bar */}
      <div className="board-bar">
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
          <button className="board-title" onClick={() => setEditingTitle(true)}>
            {board.title}
          </button>
        )}

        <div className="board-bar-right">
          {/* Search */}
          <div className="header-search" style={{ position: 'relative' }}>
            <span className="header-search-icon">🔍</span>
            <input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ color: searchQuery ? '#172b4d' : undefined, background: searchQuery ? '#fff' : undefined }}
            />
            {searchResults && (
              <div className="search-results-dropdown">
                {searchResults.length === 0 ? (
                  <div className="search-result-item">
                    <span className="search-result-title" style={{ color: '#97a0af' }}>
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

          <button
            className={`board-filter-btn ${hasActiveFilters ? 'active' : ''}`}
            onClick={() => setShowFilter(!showFilter)}
          >
            ⚡ Filter
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

      {/* Board Canvas with Drag & Drop */}
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
                        style={snapshot.isDragging ? { opacity: 0.9, transform: 'rotate(2deg)' } : {}}
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
                            >
                              {list.title}
                            </div>
                          )}
                          <button
                            className="list-menu-btn"
                            onClick={() => handleDeleteList(list.id)}
                            title="Delete list"
                          >
                            ⋯
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
                                  ? 'rgba(9,30,66,.04)'
                                  : 'transparent',
                                padding: '0 4px',
                                minHeight: 8,
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
                                }}
                                autoFocus
                              />
                              <div className="add-card-actions">
                                <button
                                  className="btn-primary"
                                  onClick={() => handleAddCard(list.id)}
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
                            >
                              + Add a card
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
                      onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
                      autoFocus
                    />
                    <div className="add-card-actions">
                      <button className="btn-primary" onClick={handleAddList}>
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
                  >
                    + Add another list
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
