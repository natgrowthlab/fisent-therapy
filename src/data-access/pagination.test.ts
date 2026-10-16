import { describe, expect, it } from 'vitest';
import { buildQueryParams, fallbackPagination, normalizeLimit, normalizePage } from './pagination';

describe('pagination helpers', () => {
  it('normalizes untrusted page and limit values', () => {
    expect(normalizePage('0')).toBe(1);
    expect(normalizePage('3.9')).toBe(3);
    expect(normalizeLimit('-5')).toBe(20);
    expect(normalizeLimit('50.8')).toBe(50);
  });

  it('does not serialize empty filters', () => {
    const query = buildQueryParams({ search: ' Ana ', filters: { active: true, blank: '', ignored: null } });
    expect(query.toString()).toBe('page=1&limit=20&search=Ana&active=true');
  });

  it('builds consistent fallback pagination', () => {
    const pagination = fallbackPagination([1, 2, 3], 2, 2);
    expect(pagination).toMatchObject({ total: 3, totalPages: 2, hasNextPage: false, hasPreviousPage: true });
  });
});
