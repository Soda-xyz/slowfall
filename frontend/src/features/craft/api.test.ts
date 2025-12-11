import { describe, it, expect } from 'vitest';
import * as api from './api';

describe('craft api exports', () => {
  it('exports fetchCrafts and createCraft', () => {
    expect(typeof api.fetchCrafts).toBe('function');
    expect(typeof api.createCraft).toBe('function');
  });
});

