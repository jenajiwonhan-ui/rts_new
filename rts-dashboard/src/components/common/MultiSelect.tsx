import React from 'react';
import { MultiSelectHook } from '../../hooks/useMultiSelect';

interface MultiSelectProps {
  hook: MultiSelectHook;
  width?: number;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ hook, width = 120 }) => {
  const visibleAllSelected = hook.searchText
    ? hook.filteredItems.every(i => hook.selected.has(i))
    : hook.isAllSelected;

  return (
    <div className="ms" ref={hook.ref} style={{ minWidth: width }}>
      <div className="ms-btn" onClick={hook.toggle}>
        <span>{hook.label}</span>
        <span className="arr">▼</span>
      </div>
      {hook.isOpen && (
        <div className="ms-dd open">
          <div className="ms-search-wrap">
            <input
              className="ms-s"
              placeholder="Search..."
              value={hook.searchText}
              onChange={e => hook.setSearchText(e.target.value)}
              autoFocus
            />
          </div>
          <div className="ms-list">
            <div className="ms-i" onClick={hook.toggleAll}>
              <input
                type="checkbox"
                checked={visibleAllSelected}
                readOnly
              />
              <span>
                {hook.searchText
                  ? `Select Searched (${hook.filteredItems.length})`
                  : 'Select All'}
              </span>
            </div>
            {hook.filteredItems.map(item => (
              <div
                key={item}
                className="ms-i"
                onClick={() => hook.toggleItem(item)}
              >
                <input
                  type="checkbox"
                  checked={hook.selected.has(item)}
                  readOnly
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
