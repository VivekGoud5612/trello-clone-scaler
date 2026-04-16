import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Boards ──────────────────────────────────────────
export const getBoards = () => api.get('/boards');
export const createBoard = (data) => api.post('/boards', data);
export const getBoard = (id) => api.get(`/boards/${id}`);
export const updateBoard = (id, data) => api.put(`/boards/${id}`, data);
export const deleteBoard = (id) => api.delete(`/boards/${id}`);

// ── Lists ───────────────────────────────────────────
export const getLists = (boardId) => api.get(`/boards/${boardId}/lists`);
export const createList = (boardId, data) => api.post(`/boards/${boardId}/lists`, data);
export const updateList = (id, data) => api.put(`/lists/${id}`, data);
export const deleteList = (id) => api.delete(`/lists/${id}`);
export const reorderLists = (data) => api.put('/lists/reorder', data);

// ── Cards ───────────────────────────────────────────
export const getCards = (listId) => api.get(`/lists/${listId}/cards`);
export const createCard = (listId, data) => api.post(`/lists/${listId}/cards`, data);
export const getCard = (id) => api.get(`/cards/${id}`);
export const updateCard = (id, data) => api.put(`/cards/${id}`, data);
export const deleteCard = (id) => api.delete(`/cards/${id}`);
export const reorderCards = (data) => api.put('/cards/reorder', data);
export const moveCard = (data) => api.put('/cards/move', data);

// ── Labels ──────────────────────────────────────────
export const getLabels = (boardId) => api.get(`/boards/${boardId}/labels`);
export const createLabel = (boardId, data) => api.post(`/boards/${boardId}/labels`, data);
export const updateLabel = (id, data) => api.put(`/labels/${id}`, data);
export const deleteLabel = (id) => api.delete(`/labels/${id}`);
export const addLabelToCard = (cardId, labelId) => api.post(`/cards/${cardId}/labels/${labelId}`);
export const removeLabelFromCard = (cardId, labelId) => api.delete(`/cards/${cardId}/labels/${labelId}`);

// ── Checklists ──────────────────────────────────────
export const getChecklists = (cardId) => api.get(`/cards/${cardId}/checklists`);
export const createChecklist = (cardId, data) => api.post(`/cards/${cardId}/checklists`, data);
export const updateChecklist = (id, data) => api.put(`/checklists/${id}`, data);
export const deleteChecklist = (id) => api.delete(`/checklists/${id}`);
export const createChecklistItem = (checklistId, data) => api.post(`/checklists/${checklistId}/items`, data);
export const updateChecklistItem = (id, data) => api.put(`/checklist-items/${id}`, data);
export const deleteChecklistItem = (id) => api.delete(`/checklist-items/${id}`);

// ── Comments ────────────────────────────────────────
export const getComments = (cardId) => api.get(`/cards/${cardId}/comments`);
export const createComment = (cardId, data) => api.post(`/cards/${cardId}/comments`, data);
export const updateComment = (id, data) => api.put(`/comments/${id}`, data);
export const deleteComment = (id) => api.delete(`/comments/${id}`);

// ── Users ───────────────────────────────────────────
export const getUsers = () => api.get('/users');

// ── Members ─────────────────────────────────────────
export const addMemberToCard = (cardId, userId) => api.post(`/cards/${cardId}/members/${userId}`);
export const removeMemberFromCard = (cardId, userId) => api.delete(`/cards/${cardId}/members/${userId}`);

// ── Search ──────────────────────────────────────────
export const searchCards = (params) => api.get('/search', { params });

export default api;
