import type { BillingDirection, Project, SolarProjectKind } from '../types';
import { inferSolarKind } from './solarProjectKind';

/**
 * Allowed primary billing directions per solar kind (product spec §4).
 * Actual invoices still store explicit `billingDirection` when multi-party.
 */
export function allowedBillingDirections(kind: SolarProjectKind): BillingDirection[] {
  switch (kind) {
    case 'SOLO_EPC':
      return ['company_to_customer'];
    case 'PARTNER_EPC':
      return ['company_to_customer', 'company_to_partner', 'partner_to_customer'];
    case 'INC':
      return ['company_to_partner', 'company_to_customer'];
    case 'FIXED_EPC':
      return ['company_to_customer', 'company_to_partner'];
    case 'VENDOR_NETWORK':
      return ['external_to_customer', 'external_to_company_commission', 'company_to_customer'];
    default:
      return ['company_to_customer'];
  }
}

/** Human-readable lines for project detail / finance hints. */
export function billingSummaryLines(project: Project): string[] {
  const k = inferSolarKind(project);
  const vo = project.partnerEpicVendorOwnership;
  const fv = project.fixedEpicVendor;

  switch (k) {
    case 'SOLO_EPC':
      return ['Company invoices customer (EPC). Full documentation set.'];
    case 'PARTNER_EPC':
      if (vo === 'VENDOR_OWNED_BY_US') {
        return [
          'Company → Customer billing; partner commission tracked separately.',
          'Vendor (DISCOM) owned by us.',
        ];
      }
      if (vo === 'VENDOR_OWNED_BY_PARTNER') {
        return ['Company → Partner (B2B) for material + service; partner-facing customer where applicable.'];
      }
      return ['Company → Customer or Company → Partner depending on vendor ownership (set on project).'];
    case 'INC':
      return ['Service invoice: company → vendor/partner; minimal documentation.'];
    case 'FIXED_EPC':
      if (fv === 'OUR_VENDOR') {
        return ['Company → Customer; internal margin vs fixed backend price.'];
      }
      if (fv === 'PARTNER_VENDOR') {
        return ['Company → Partner at fixed backend price; partner may sell higher.'];
      }
      return ['Set fixed backend vs sell price; vendor case drives invoice party.'];
    case 'VENDOR_NETWORK':
      return ['External party → Customer; External → Company commission / per-watt fee.'];
    default:
      return [];
  }
}
