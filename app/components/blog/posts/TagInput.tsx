'use client';

import { useState, useEffect, useRef } from 'react';

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
}

const TAG_MAX_LENGTH = 30;
const TAG_LIMIT = 10;

export default function TagInput({ value, onChange }: TagInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Extract tags from value string
  const tags = value
    .split(/\s+/)
    .map((t) => t.trim().replace(/^#+/, '').toLowerCase())
    .filter((t) => t.length > 0);

  // Determine if tag limit reached
  const isLimitReached = tags.length >= TAG_LIMIT && input.trim().length > 0;


  // Validate tag format (letters only)
  const isValidTag = (tag: string) => /^[a-z]{1,30}$/i.test(tag); // no #, no numbers or symbols

  // Add a single tag with validation
  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#+/, '').toLowerCase();

    if (
      !tag ||
      tags.includes(tag) ||
      tags.length >= TAG_LIMIT ||
      !isValidTag(tag) ||
      tag.length > TAG_MAX_LENGTH
    ) {
      return;
    }

    const updated = [...tags, tag].map((t) => `#${t}`).join(' ');
    onChange(updated);
    setInput('');
    setSuggestions([]);
  };

  // Handle multiple tags (from paste or suggestion click)
  const addMultipleTags = (rawString: string) => {
    const rawTags = rawString.split(/[\s,]+/);
    let added = 0;

    const validNewTags = rawTags
      .map((raw) => raw.trim().replace(/^#+/, '').toLowerCase())
      .filter((tag) =>
        tag &&
        isValidTag(tag) &&
        tag.length <= TAG_MAX_LENGTH &&
        !tags.includes(tag)
      );

    const spaceLeft = TAG_LIMIT - tags.length;
    const finalTags = [...tags, ...validNewTags.slice(0, spaceLeft)];

    if (finalTags.length > tags.length) {
      const updated = finalTags.map((t) => `#${t}`).join(' ');
      onChange(updated);
    }

    setInput('');
    setSuggestions([]);
  };

  const removeTag = (tagToRemove: string) => {
    const updated = tags
      .filter((t) => t !== tagToRemove)
      .map((t) => `#${t}`)
      .join(' ');
    onChange(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ' ', ',', 'Tab'].includes(e.key)) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      const updated = tags.slice(0, -1).map((t) => `#${t}`).join(' ');
      onChange(updated);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    addMultipleTags(text);
  };

  useEffect(() => {
    const q = input.toLowerCase().replace(/^#+/, '').trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      fetch(`/api/tags/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSuggestions(data.filter((s) => isValidTag(s)));
          }
        })
        .catch(() => {});
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [input]);

  return (
    <div className={`tag-input-wrapper ${isLimitReached ? 'limit-exceeded' : ''}`}>
      <div className="tag-chip-list">
        {tags.map((tag) => (
          <span key={tag} className="tag-chip">
            #{tag}
            <button type="button" className="remove-tag" onClick={() => removeTag(tag)}>
              ×
            </button>
          </span>
        ))}

       <input
  ref={inputRef}
  type="text"
  className="tag-input-field"
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={handleKeyDown}
  onPaste={handlePaste}
  placeholder={
    tags.length >= TAG_LIMIT
      ? '🚫 Limit 10 tags – only letters allowed'
      : '#example (letters only, max 30 chars)'
  }
  disabled={isLimitReached}
  maxLength={TAG_MAX_LENGTH + 1}
/>

      </div>

      {suggestions.length > 0 && (
        <ul className="tag-suggestions">
          {suggestions.map((s) => (
            <li key={s} onClick={() => addTag(s)} className="suggestion-item">
              #{s}
            </li>
          ))}
        </ul>
      )}

      {isLimitReached && (
        <small className="tag-limit-msg">Maximum 10 hashtags allowed</small>
      )}
    </div>
  );
}
