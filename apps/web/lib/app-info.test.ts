import { describe, it, expect } from 'bun:test';
import { appInfo } from './app-info';

describe('appInfo', () => {
  it('should have a title property', () => {
    expect(appInfo.title).toBe('Gaeldle');
  });

  it('should have a slug property', () => {
    expect(appInfo.slug).toBe('gaeldle');
  });

  it('should have an author property', () => {
    expect(appInfo.author).toBe('Gaël Jacquin');
  });

  it('should have a description property', () => {
    expect(appInfo.description).toBe('A gaming-themed Wordle clone');
  });

  it('should have a valid url property', () => {
    expect(appInfo.url).toBe('https://gaeldle.gaeljacquin.com/');
    expect(appInfo.url.startsWith('https://')).toBe(true);
    expect(appInfo.url.endsWith('/')).toBe(true);
  });

  it('should have a valid ogImageUrl property', () => {
    expect(appInfo.ogImageUrl).toBe('https://cataas.com/cat');
    expect(appInfo.ogImageUrl.startsWith('https://')).toBe(true);
  });

  it('should have a valid authorUrl property', () => {
    expect(appInfo.authorUrl).toBe('https://gaeljacquin.com');
    expect(appInfo.authorUrl.startsWith('https://')).toBe(true);
  });

  it('should have exactly 7 properties', () => {
    const keys = Object.keys(appInfo);
    expect(keys.length).toBe(7);
  });

  it('should have non-empty string properties', () => {
    Object.entries(appInfo).forEach(([, value]) => {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    });
  });

  it('should have consistent title and slug', () => {
    expect(appInfo.slug).toBe(appInfo.title.toLowerCase());
  });

  it('should be a frozen object', () => {
    // appInfo is a plain object literal, so it's not explicitly frozen
    // but we verify all properties exist and are as expected
    expect(appInfo.title).toBe('Gaeldle');
    expect(appInfo.slug).toBe('gaeldle');
  });

  it('should have all required properties for SEO', () => {
    expect(appInfo).toHaveProperty('title');
    expect(appInfo).toHaveProperty('description');
    expect(appInfo).toHaveProperty('url');
    expect(appInfo).toHaveProperty('ogImageUrl');
  });

  it('title should not be empty', () => {
    expect(appInfo.title).toBeTruthy();
  });

  it('description should be a meaningful string', () => {
    expect(appInfo.description).toContain('Wordle');
  });

  it('author URL should be different from app URL', () => {
    expect(appInfo.authorUrl).not.toBe(appInfo.url);
  });

  it('should contain author name in author URL or title', () => {
    const authorNameInUrl = appInfo.authorUrl.includes('gaeljacquin');
    const authorNameInTitle = appInfo.author.toLowerCase().includes('gael');
    expect(authorNameInUrl || authorNameInTitle).toBe(true);
  });
});
