/**
 * Optional MMS catalog pack (~62 rows). Merged once into materials storage (idempotent).
 */
import { MATERIAL_CATEGORIES } from './inventoryConstants';
import type { Material } from '../types';

export function buildMaterialsPack62(isoNow: string): Material[] {
  const out: Material[] = [];
  for (let i = 1; i <= 62; i++) {
    const cat = MATERIAL_CATEGORIES[(i - 1) % MATERIAL_CATEGORIES.length]!;
    const n = String(i).padStart(2, '0');
    out.push({
      id: `mat_pack_${n}`,
      name: `Catalog item ${n} — ${cat}`,
      category: cat,
      sizeSpec: 'spec',
      purchaseUnit: 'Pcs',
      issueUnit: 'Pcs',
      purchaseRate: 100 + i * 17,
      saleRateRetail: 130 + i * 22,
      saleRateWholesale: 120 + i * 20,
      hsn: '85414011',
      minStock: 2,
      currentStock: 0,
      createdAt: isoNow,
      updatedAt: isoNow,
    });
  }
  return out;
}

export function mergeMaterialsPack62IfAbsent(existing: Material[], isoNow: string): Material[] {
  if (existing.some((m) => m.id.startsWith('mat_pack_'))) return existing;
  return [...existing, ...buildMaterialsPack62(isoNow)];
}
