import { DomainUndoAction } from '../types';

type Listener = () => void;

class DomainUndoManager {
  private undoStack: DomainUndoAction[] = [];
  private redoStack: DomainUndoAction[] = [];
  private listeners: Set<Listener> = new Set();
  private maxHistory: number = 30;

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public push(action: Omit<DomainUndoAction, 'id' | 'timestamp'> & { id?: string; timestamp?: number }) {
    const fullAction: DomainUndoAction = {
      id: action.id || `undo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: action.timestamp || Date.now(),
      description: action.description,
      undo: action.undo,
      redo: action.redo,
    };

    this.undoStack.push(fullAction);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    // Clear redo on new user action
    this.redoStack = [];
    this.notify();
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getUndoDescription(): string | null {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1].description;
  }

  public getRedoDescription(): string | null {
    if (this.redoStack.length === 0) return null;
    return this.redoStack[this.redoStack.length - 1].description;
  }

  public undo(): boolean {
    const action = this.undoStack.pop();
    if (!action) return false;

    try {
      if (action.undo) action.undo();
      this.redoStack.push(action);
      this.notify();
      return true;
    } catch (err) {
      console.error('Failed to undo action:', action.description, err);
      this.notify();
      return false;
    }
  }

  public redo(): boolean {
    const action = this.redoStack.pop();
    if (!action) return false;

    try {
      if (action.redo) action.redo();
      this.undoStack.push(action);
      this.notify();
      return true;
    } catch (err) {
      console.error('Failed to redo action:', action.description, err);
      this.notify();
      return false;
    }
  }

  public clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }
}

export const undoManager = new DomainUndoManager();
