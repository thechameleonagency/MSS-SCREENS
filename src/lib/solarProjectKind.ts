import type { Project, ProjectType, SolarProjectKind } from '../types';

export function legacyProjectTypeToSolarKind(t: ProjectType): SolarProjectKind {
  switch (t) {
    case 'Solo':
      return 'SOLO_EPC';
    case 'Partner (Profit Only)':
    case 'Partner with Contributions':
      return 'PARTNER_EPC';
    case 'Vendorship Fee':
      return 'VENDOR_NETWORK';
    default:
      return 'SOLO_EPC';
  }
}

export function inferSolarKind(p: Project): SolarProjectKind {
  if (p.solarKind) return p.solarKind;
  return legacyProjectTypeToSolarKind(p.type);
}
