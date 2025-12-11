import { describe, it, expect } from 'vitest';
import * as api from './api';

describe('airport api exports', () => {
  it('exports fetchAirports, createAirport and deleteAirport', () => {
    expect(typeof api.fetchAirports).toBe('function');
    expect(typeof api.createAirport).toBe('function');
    expect(typeof api.deleteAirport).toBe('function');
  });
});

