import { useState, useCallback, useRef, useEffect } from 'react';

export interface MultiSelectHook {
  items: string[];
  selected: Set<string>;
  isOpen: boolean;
  searchText: string;
  toggle: () => void;
  close: () => void;
  setSearchText: (text: string) => void;
  toggleItem: (item: string) => void;
  toggleAll: () => void;
  isAllSelected: boolean;
  filteredItems: string[];
  getSelected: () => Set<string> | null; // null = all selected (no filter)
  label: string;
  setItems: (items: string[]) => void;
  setSelected: (selected: Set<string>) => void;
  ref: React.RefObject<HTMLDivElement | null>;
}

export function useMultiSelect(
  initialItems: string[] = [],
  allLabel = 'All',
  onChange?: () => void
): MultiSelectHook {
  const [items, setItemsState] = useState<string[]>(initialItems);
  const [selected, setSelectedState] = useState<Set<string>>(new Set(initialItems));
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const setItems = useCallback((newItems: string[]) => {
    setItemsState(newItems);
    setSelectedState(new Set(newItems));
  }, []);

  const setSelected = useCallback((s: Set<string>) => {
    setSelectedState(s);
  }, []);

  const filteredItems = searchText
    ? items.filter(i => i.toLowerCase().includes(searchText.toLowerCase()))
    : items;

  const isAllSelected = selected.size === items.length;

  const toggle = useCallback(() => setIsOpen(p => !p), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setSearchText('');
  }, []);

  const toggleItem = useCallback((item: string) => {
    setSelectedState(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
    onChange?.();
  }, [onChange]);

  const toggleAll = useCallback(() => {
    if (searchText) {
      const visible = items.filter(i => i.toLowerCase().includes(searchText.toLowerCase()));
      const allVisibleSelected = visible.every(i => selected.has(i));
      if (allVisibleSelected) {
        setSelectedState(prev => {
          const next = new Set(prev);
          visible.forEach(i => next.delete(i));
          return next;
        });
      } else {
        setSelectedState(prev => {
          const next = new Set(prev);
          visible.forEach(i => next.add(i));
          return next;
        });
      }
    } else {
      if (isAllSelected) {
        setSelectedState(new Set());
      } else {
        setSelectedState(new Set(items));
      }
    }
    onChange?.();
  }, [items, selected, isAllSelected, searchText, onChange]);

  const getSelected = useCallback((): Set<string> | null => {
    if (selected.size === items.length) return null;
    return selected;
  }, [selected, items]);

  const label = (() => {
    if (selected.size === items.length) return allLabel;
    if (selected.size === 0) return 'None';
    const arr = Array.from(selected);
    if (arr.length <= 2) return arr.join(', ');
    return `${arr[0]} + ${arr.length - 1} more`;
  })();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, close]);

  return {
    items, selected, isOpen, searchText, toggle, close,
    setSearchText, toggleItem, toggleAll, isAllSelected,
    filteredItems, getSelected, label, setItems, setSelected, ref,
  };
}
