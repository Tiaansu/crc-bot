import { getRootData } from '@sapphire/pieces';
import { join } from 'node:path';

export const mainFolder = getRootData().root;
export const rootFolder = join(mainFolder, '..');
export const srcFolder = join(rootFolder, 'src');

export const API_URL = 'https://api.joshlei.com/v2' as const;

export const gagCategories: string[] = ['Seed', 'Gear', 'Egg', 'Weather', 'Extra'] as const;
