import { useState, useRef, useEffect, Fragment } from 'react';
import { SERVICES, getService, type ServiceDef } from './data';
import { CalendarPicker, fmtDate, parseTypedDate } from './DatePicker';
import {
  governmentOfDubai,
  dubaitrade,
  figmaIcon,
  dirham,
  appealCustomsDecision,
  payBillsOrFines,
  requestBusinessRegistrationDubaiCustoms,
  requestCertificates,
  requestCustomsOpinion,
  requestGoodsClassification,
  requestTradeAgencyRecording,
  requestTradeMarkRecording,
  submitRAFEDInformation,
  submitTradeIntellectualPropertyComplaint,
  trackServiceStatus,
  fileType,
  heroBg,
} from './icons';

// ─── Types ───────────────────────────────────────────────────────────────────
type Page =
  | { name: 'home' }
  | { name: 'info'; serviceId: string }
  | { name: 'form'; serviceId: string; tab?: FormTab }
  | { name: 'success'; serviceId: string; activePayBillsTab?: string; brData?: BRData & { tab?: FormTab } }
  | { name: 'br-registration'; serviceId: string; data: BRData; change?: BRChange }
  | { name: 'br-login'; serviceId: string; kind: 'amend' | 'contact' }
  | { name: 'br-submitted'; serviceId: string; data: BRData };

type FormTab = 'new' | 'renew' | 'amend' | 'contact' | 'cancel' | 'enquiry';
const FORM_TAB_LABELS: Record<FormTab, string> = {
  new: 'New', renew: 'Renew', amend: 'Amend', contact: 'Update Contact', cancel: 'Cancel', enquiry: 'Enquiry',
};
// Business Registration: Amend and Update Contact need a Dubai Trade login first.
const formTabsFor = (serviceId: string): readonly FormTab[] =>
  serviceId === 'business-registration' ? ['new', 'renew', 'amend', 'contact', 'enquiry']
  : serviceId === 'trade-ip-complaint' ? ['new', 'enquiry']
  : ['new', 'amend', 'cancel', 'enquiry'];

const goFormTab = (navigate: (page: Page) => void, serviceId: string, tab: FormTab) =>
  serviceId === 'business-registration' && (tab === 'amend' || tab === 'contact')
    ? navigate({ name: 'br-login', serviceId, kind: tab })
    : navigate({ name: 'form', serviceId, tab });

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}
function ChevronRight() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>;
}
function ArrowLeft() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m19 12H5m7-7-7 7 7 7"/></svg>;
}
function ChevronDown() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>;
}
function ChevronUp() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>;
}
function LockIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function InfoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d="M9.9974 13.3327V9.99935M9.9974 6.66602H10.0057M18.3307 9.99935C18.3307 14.6017 14.5998 18.3327 9.9974 18.3327C5.39502 18.3327 1.66406 14.6017 1.66406 9.99935C1.66406 5.39698 5.39502 1.66602 9.9974 1.66602C14.5998 1.66602 18.3307 5.39698 18.3307 9.99935Z" stroke="#5E6B7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function InfoTooltip({ tip }: { tip: string }) {
  return (
    <div className="dc-field-hint">
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
        <path d="M9.9974 13.3327V9.99935M9.9974 6.66602H10.0057M18.3307 9.99935C18.3307 14.6017 14.5998 18.3327 9.9974 18.3327C5.39502 18.3327 1.66406 14.6017 1.66406 9.99935C1.66406 5.39698 5.39502 1.66602 9.9974 1.66602C14.5998 1.66602 18.3307 5.39698 18.3307 9.99935Z" stroke="#5E6B7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span>{tip}</span>
    </div>
  );
}
function CheckCircle() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#276749"/>
      <polyline points="9,17 14,22 23,11" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function DirhamIcon() {
  return (
    <svg width="14" height="12" viewBox="0 0 20 17" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 3, position: 'relative', top: '-1px' }}>
      <path d="M1.766 0.0195402C1.774 0.0312644 1.818 0.084023 1.86 0.134828C2.166 0.49046 2.396 1.06885 2.52 1.7977C2.602 2.27644 2.606 2.4269 2.606 4.25195V5.95195H1.77C1.006 5.95195 0.918 5.94805 0.768 5.91874C0.532 5.86988 0.288 5.73897 0.124 5.57092C-0.006 5.43609 -0.002 5.42828 0.006 5.83667C0.016 6.17471 0.02 6.21184 0.07 6.39552C0.15 6.68667 0.26 6.90356 0.426 7.09701C0.652 7.36276 0.882 7.51126 1.21 7.61092C1.28 7.63046 1.428 7.63828 1.952 7.64218L2.606 7.65195V8.49805V9.34609L1.684 9.34023L0.758 9.33437L0.598 9.27184C0.408 9.19759 0.322 9.14287 0.136 8.98069L0 8.86149L0.008 9.23471C0.018 9.58057 0.02 9.61965 0.07 9.79552C0.244 10.4169 0.664 10.8605 1.218 11.0051C1.356 11.0422 1.41 11.0441 1.988 11.052L2.606 11.0598V12.8106C2.606 13.8677 2.6 14.6474 2.59 14.7802C2.58 14.9014 2.548 15.128 2.52 15.2863C2.39 16.0152 2.156 16.5643 1.82 16.9199L1.752 16.9922H5.134C7.156 16.9922 8.668 16.9844 8.89 16.9746C9.28 16.9551 10.15 16.871 10.346 16.83C10.408 16.8183 10.524 16.8007 10.6 16.789C10.762 16.7655 11.03 16.7108 11.416 16.6151C11.96 16.4822 12.456 16.3161 12.942 16.1051C13.094 16.0386 13.53 15.8217 13.646 15.7533C13.708 15.7182 13.782 15.6752 13.81 15.6615C13.888 15.6205 14.018 15.5384 14.208 15.4055C14.302 15.3391 14.396 15.2746 14.416 15.2609C14.5 15.2062 14.79 14.9698 14.922 14.8506C15.424 14.3992 15.844 13.897 16.17 13.3597C16.216 13.2815 16.276 13.1838 16.302 13.1428C16.368 13.0333 16.64 12.4862 16.666 12.4041C16.678 12.367 16.694 12.3279 16.702 12.3201C16.754 12.2537 17.054 11.3314 17.09 11.1301C17.102 11.0656 17.108 11.0559 17.158 11.0461C17.19 11.0402 17.656 11.0402 18.194 11.0441C19.27 11.052 19.27 11.052 19.508 11.1594C19.642 11.22 19.682 11.2474 19.83 11.3783C20.024 11.5483 20.006 11.5756 19.994 11.1497C19.986 10.8995 19.976 10.7452 19.958 10.6826C19.89 10.4423 19.874 10.3915 19.814 10.2703C19.618 9.85218 19.29 9.55322 18.87 9.41057L18.706 9.35195L18.038 9.34414L17.372 9.33437L17.38 9.10575C17.388 8.80483 17.388 8.20885 17.378 7.90207L17.37 7.65586L18.262 7.65195C19.026 7.64805 19.168 7.65195 19.252 7.67345C19.504 7.74184 19.674 7.83563 19.882 8.02126L19.998 8.12678V7.83759C19.998 7.49368 19.98 7.34126 19.908 7.1146C19.766 6.6554 19.486 6.31345 19.086 6.10241C18.826 5.96563 18.81 5.96172 17.916 5.95586C17.392 5.95195 17.118 5.94414 17.104 5.93241C17.092 5.92069 17.082 5.90115 17.082 5.88552C17.082 5.86989 17.052 5.74678 17.012 5.61391C16.544 3.99793 15.67 2.71414 14.392 1.76253C14.218 1.63161 13.792 1.35609 13.62 1.2623C13.554 1.22517 13.482 1.18609 13.464 1.17437C13.38 1.12943 12.898 0.898851 12.778 0.85C12.706 0.818736 12.612 0.779655 12.57 0.764023C11.864 0.465057 10.68 0.181724 9.776 0.0937931C9.628 0.0801149 9.432 0.0586207 9.342 0.0508046C8.934 0.00586207 8.368 0 5.154 0C2.438 0 1.756 0.00586207 1.766 0.0195402ZM8.38 0.865632C9.056 0.904713 9.472 0.955517 9.958 1.0708C11.442 1.41471 12.486 2.14161 13.244 3.35701C13.314 3.47034 13.61 4.06046 13.654 4.17966C13.864 4.73264 13.966 5.06092 14.056 5.49471C14.078 5.60023 14.108 5.74092 14.122 5.80736C14.136 5.87184 14.142 5.93241 14.136 5.93828C14.126 5.94609 12.118 5.95 9.67 5.94805L5.22 5.94414L5.214 3.43322C5.212 2.05368 5.214 0.906667 5.22 0.885172L5.228 0.848046H6.65C7.43 0.848046 8.21 0.855862 8.38 0.865632ZM14.33 7.71057C14.344 7.7946 14.344 9.22103 14.33 9.29138L14.318 9.34414L9.768 9.34023L5.22 9.33437L5.216 8.50586C5.212 8.05057 5.216 7.67149 5.22 7.66368C5.226 7.65391 7.164 7.64805 9.774 7.64805H14.318L14.33 7.71057ZM14.126 11.0656C14.136 11.0949 14.088 11.3353 13.99 11.7261C13.878 12.1657 13.726 12.6093 13.572 12.9376C13.496 13.1056 13.306 13.4691 13.26 13.5375C13.238 13.5687 13.174 13.6684 13.118 13.7563C12.758 14.3074 12.244 14.8095 11.658 15.1808C11.444 15.3137 11.004 15.5403 10.886 15.5755C10.862 15.5814 10.836 15.5931 10.826 15.6009C10.812 15.6126 10.63 15.6791 10.418 15.7533C10.028 15.8882 9.286 16.0347 8.69 16.0953C8.304 16.1324 8.242 16.1344 6.756 16.1344H5.218V13.6V11.0637L9.636 11.0559C12.066 11.052 14.068 11.0461 14.084 11.0422C14.102 11.0402 14.12 11.052 14.126 11.0656Z" />
    </svg>
  );
}
function PrintIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
}
function RefreshIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
}
function FilterIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
}

// ─── Service Icons (SVG line art matching Figma) ──────────────────────────────
const SERVICE_ICONS: Record<string, React.ReactNode> = {
  'business-registration': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <rect x="8" y="14" width="32" height="26" rx="2"/><path d="M16 14V10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/>
      <line x1="24" y1="22" x2="24" y2="34"/><line x1="18" y1="28" x2="30" y2="28"/>
    </svg>
  ),
  'trade-agency-recording': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <rect x="8" y="6" width="24" height="30" rx="2"/><path d="M32 12h6a2 2 0 0 1 2 2v24a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2v-4"/>
      <line x1="14" y1="16" x2="26" y2="16"/><line x1="14" y1="22" x2="26" y2="22"/><line x1="14" y1="28" x2="20" y2="28"/>
    </svg>
  ),
  'trade-mark-recording': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <circle cx="24" cy="20" r="12"/><path d="M18 20h12M21 14v12"/><path d="M12 38l4-6M36 38l-4-6"/>
      <path d="M16 38h16"/>
    </svg>
  ),
  'trade-ip-complaint': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <path d="M24 6L6 16v8c0 9.9 7.7 19.1 18 21.5C34.3 43.1 42 33.9 42 24v-8L24 6z"/>
      <line x1="24" y1="20" x2="24" y2="28"/><circle cx="24" cy="33" r="1" fill="#1360D2"/>
    </svg>
  ),
  'rafed-information': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <circle cx="24" cy="24" r="16"/><line x1="24" y1="20" x2="24" y2="32"/>
      <circle cx="24" cy="16" r="1.2" fill="#1360D2"/>
    </svg>
  ),
  'customs-opinion': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <path d="M40 12H8a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h6l4 6 4-6h18a2 2 0 0 0 2-2V14a2 2 0 0 0-2-2z"/>
      <line x1="14" y1="21" x2="34" y2="21"/><line x1="14" y1="27" x2="26" y2="27"/>
    </svg>
  ),
  'appeal-customs-decision': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <path d="M24 8v32M14 16l10-8 10 8"/><rect x="10" y="36" width="28" height="4" rx="1"/>
      <path d="M16 24h16M16 30h10"/>
    </svg>
  ),
  'goods-classification': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <path d="M24 6l16 9v18L24 42 8 33V15L24 6z"/>
      <path d="M24 6v18M8 15l16 9 16-9"/>
      <line x1="16" y1="10.5" x2="16" y2="28"/><line x1="32" y1="10.5" x2="32" y2="28"/>
    </svg>
  ),
  'pay-bills': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <rect x="6" y="12" width="36" height="24" rx="3"/>
      <line x1="6" y1="20" x2="42" y2="20"/>
      <rect x="12" y="26" width="8" height="4" rx="1"/>
      <line x1="26" y1="28" x2="36" y2="28"/>
    </svg>
  ),
  'request-certificates': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <path d="M10 8h28a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"/>
      <circle cx="24" cy="20" r="6"/><path d="M18 38l6-6 6 6"/>
    </svg>
  ),
  'track-status': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <circle cx="22" cy="22" r="12"/><path d="m32 32 8 8"/>
      <path d="M18 22h8M22 18v8"/>
    </svg>
  ),
  'duty-account': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
      <rect x="12" y="22" width="24" height="18" rx="2"/><path d="M17 22v-6a7 7 0 0 1 14 0v6"/>
      <circle cx="24" cy="31" r="2" fill="#9CA3AF"/>
    </svg>
  ),
  'aeo-program': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <path d="M24 6L4 16v10c0 10.5 8.6 20.3 20 22.5C35.4 46.3 44 36.5 44 26V16L24 6z"/>
      <polyline points="16 24 21 29 32 18"/>
    </svg>
  ),
  'warehouse-license': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <path d="M6 20L24 8l18 12v22H6V20z"/><rect x="18" y="30" width="12" height="12"/>
      <line x1="6" y1="20" x2="42" y2="20"/>
    </svg>
  ),
  'accreditation': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <circle cx="24" cy="18" r="8"/><path d="M12 42v-4a8 8 0 0 1 8-8h8a8 8 0 0 1 8 8v4"/>
      <polyline points="18 24 21 27 28 20"/>
    </svg>
  ),
  'cargo-information': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
      <path d="M6 16h36v24H6z"/><path d="M16 16V8h16v8"/><line x1="6" y1="24" x2="42" y2="24"/>
      <rect x="18" y="28" width="12" height="8" rx="1"/>
    </svg>
  ),
  'voluntary-disclosure': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
      <path d="M8 42V14l16-8 16 8v28"/><rect x="18" y="26" width="12" height="16"/>
      <line x1="24" y1="8" x2="24" y2="42"/>
    </svg>
  ),
  'customs-declaration': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
      <rect x="8" y="6" width="32" height="36" rx="2"/>
      <line x1="16" y1="16" x2="32" y2="16"/><line x1="16" y1="22" x2="32" y2="22"/>
      <line x1="16" y1="28" x2="24" y2="28"/>
    </svg>
  ),
  'cargo-transfer': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
      <rect x="4" y="22" width="28" height="16" rx="2"/><path d="M32 26h6l6 8H32"/>
      <circle cx="12" cy="38" r="4"/><circle cx="36" cy="38" r="4"/>
    </svg>
  ),
  'customs-inspection': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
      <circle cx="20" cy="20" r="12"/><path d="m30 30 10 10"/>
      <line x1="16" y1="20" x2="24" y2="20"/><line x1="20" y1="16" x2="20" y2="24"/>
    </svg>
  ),
  'refund-claim': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
      <path d="M36 24H12M20 16l-8 8 8 8"/>
      <path d="M42 12H24a6 6 0 0 0-6 6v12a6 6 0 0 0 6 6h18V12z"/>
    </svg>
  ),
  'customs-transactions': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
      <rect x="6" y="6" width="36" height="36" rx="2"/>
      <polyline points="14 34 20 26 26 30 34 18"/>
    </svg>
  ),
  'temporary-admission': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
      <circle cx="24" cy="24" r="16"/><polyline points="24 14 24 24 30 30"/>
    </svg>
  ),
  'representative-card': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
      <rect x="6" y="12" width="36" height="24" rx="3"/>
      <circle cx="17" cy="24" r="5"/><line x1="28" y1="20" x2="38" y2="20"/>
      <line x1="28" y1="26" x2="36" y2="26"/>
    </svg>
  ),
  'view-announcements': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <path d="M38 14H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4l4 6 4-6h16a2 2 0 0 0 2-2V16a2 2 0 0 0-2-2z"/>
    </svg>
  ),
  'view-policies': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <path d="M24 6L8 14v10c0 9.4 6.8 18.2 16 20.9C33.2 42.2 40 33.4 40 24V14L24 6z"/>
      <line x1="18" y1="22" x2="30" y2="22"/><line x1="18" y1="28" x2="26" y2="28"/>
    </svg>
  ),
  'view-notices': (
    <svg viewBox="0 0 48 48" fill="none" stroke="#1360D2" strokeWidth="1.8">
      <rect x="8" y="8" width="32" height="32" rx="2"/>
      <line x1="14" y1="18" x2="34" y2="18"/><line x1="14" y1="24" x2="34" y2="24"/>
      <line x1="14" y1="30" x2="24" y2="30"/>
    </svg>
  ),
};
function FacebookIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
}
function XIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
}
function LinkedInIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>;
}
function InstagramIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
}
function InquiryIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ onHome }: { onHome: () => void }) {
  return (
    <nav className="dc-navbar">
      <div className="dc-navbar__inner">
        <div className="dc-navbar__left">
          <img src={governmentOfDubai} alt="Government of Dubai" className="dc-navbar__gov-logo" />
          <ul className="dc-navbar__menu">
            <li><a href="#" className="dc-navbar__link" onClick={onHome}>Home</a></li>
            <li><a href="#" className="dc-navbar__link">Explore</a></li>
            <li><a href="#" className="dc-navbar__link dc-navbar__link--active" onClick={onHome}>Service Center</a></li>
            <li><a href="#" className="dc-navbar__link">Training</a></li>
            <li><a href="#" className="dc-navbar__link">News & Announcement</a></li>
            <li><a href="#" className="dc-navbar__link">Knowledge Hub</a></li>
          </ul>
        </div>
        <div className="dc-navbar__right">
          <button className="dc-navbar__icon-btn"><SearchIcon /></button>
          <a href="#" className="dc-navbar__link">العربية</a>
          <a href="#" className="dc-navbar__link">Login</a>
          <img src={dubaitrade} alt="Dubai Trade" className="dc-navbar__dt-logo" />
        </div>
      </div>
    </nav>
  );
}

// ─── Hero Banner ──────────────────────────────────────────────────────────────
function HeroBanner({ title, subtitle, showButton, onStartService }: {
  title: string; subtitle?: string; showButton?: boolean; onStartService?: () => void;
}) {
  return (
    <div className="dc-hero-wrap">
      <div className="dc-hero" style={{ backgroundImage: `url('${heroBg}'), linear-gradient(#0B1E3E, #0B1E3E)` }}>
        <div className="dc-hero__content">
          <h1 className="dc-hero__title">{title}</h1>
          {subtitle && <p className="dc-hero__subtitle">{subtitle}</p>}
          {showButton && (
            <button className="dc-hero__btn" onClick={onStartService}>Start Service</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="dc-footer">
      <div className="dc-footer__inner">
        <div className="dc-footer__brand">
          <div className="dc-footer__logo">
            <div className="dc-footer__logo-circle" />
            <div>
              <div className="dc-footer__logo-ar">بيك التجارية</div>
              <div className="dc-footer__logo-en">DUBAI TRADE</div>
            </div>
          </div>
          <p className="dc-footer__tagline">Empowering the city's digital future through innovation, smart services, and data-driven transformation.</p>
          <div className="dc-footer__socials">
            <a href="#" className="dc-footer__social"><FacebookIcon /></a>
            <a href="#" className="dc-footer__social"><XIcon /></a>
            <a href="#" className="dc-footer__social"><LinkedInIcon /></a>
            <a href="#" className="dc-footer__social"><InstagramIcon /></a>
          </div>
        </div>
        <div className="dc-footer__col">
          <h4 className="dc-footer__heading">Channels</h4>
          <ul className="dc-footer__list">
            {['DubaiNow', 'Invest in Dubai', 'Visit Dubai', 'Dubai Justice', 'Dubai Transport', 'Dubai Trade', 'Build in Dubai'].map(l => <li key={l}><a href="#">{l}</a></li>)}
          </ul>
        </div>
        <div className="dc-footer__col">
          <h4 className="dc-footer__heading">Quick Links</h4>
          <ul className="dc-footer__list">
            {['Home', 'Services', 'About Us', 'Contact Us', 'Optional Link'].map(l => <li key={l}><a href="#">{l}</a></li>)}
          </ul>
        </div>
        <div className="dc-footer__col">
          <h4 className="dc-footer__heading">Support</h4>
          <ul className="dc-footer__list">
            {['Complaints & Suggestions', 'Happiness Meter', 'FAQs', 'Sitemap', 'Contact Us'].map(l => <li key={l}><a href="#">{l}</a></li>)}
          </ul>
        </div>
        <div className="dc-footer__col">
          <h4 className="dc-footer__heading">Legal</h4>
          <ul className="dc-footer__list">
            {['Terms of Service', 'Privacy Policy', 'Disclaimer'].map(l => <li key={l}><a href="#">{l}</a></li>)}
          </ul>
        </div>
      </div>
      <div className="dc-footer__bottom">
        <span>© 2023 Digitaldubai. All Rights Reserved.</span>
        <span>Best with Chrome, Firefox, or Edge at 1025x1080. Updated on 30 Apr 2025, 14:04.</span>
      </div>
    </footer>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="dc-breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="dc-breadcrumb__item">
          {i > 0 && <ChevronRight />}
          {item.onClick ? (
            <button className="dc-breadcrumb__link" onClick={item.onClick}>{item.label}</button>
          ) : (
            <span className="dc-breadcrumb__current">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────
function ServiceCard({ service, onInfo, onStart }: {
  service: ServiceDef; onInfo: () => void; onStart: () => void;
}) {
  const svgIcon = SERVICE_ICONS[service.id];
  return (
    <div className="dc-service-card">
      {service.locked && <div className="dc-service-card__lock"><LockIcon /></div>}
      <div className="dc-service-card__icon">
        {service.iconFile
          ? <img src={service.iconFile} alt={service.title} width={48} height={48} />
          : svgIcon}
      </div>
      <h3 className="dc-service-card__title">{service.title}</h3>
      <p className="dc-service-card__desc">{service.description}</p>
      <div className="dc-service-card__actions">
        {service.hasInfo && (
          <button className="dc-btn dc-btn--outline dc-btn--sm" onClick={onInfo}>
            Information
          </button>
        )}
        <button
          className="dc-btn dc-btn--blue dc-btn--sm"
          onClick={onStart}
          disabled={service.locked}
        >
          Start Service
        </button>
      </div>
    </div>
  );
}

// ─── Accordion ───────────────────────────────────────────────────────────────
function Accordion({ title, children, defaultOpen = false }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="dc-accordion">
      <button className="dc-accordion__header" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        {open ? <ChevronUp /> : <ChevronDown />}
      </button>
      {open && <div className="dc-accordion__body">{children}</div>}
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ steps }: { steps: { label: string }[] }) {
  return (
    <div className="dc-stepper">
      {steps.map((step, i) => (
        <div key={i} className="dc-stepper__step">
          {i < steps.length - 1 && <div className="dc-stepper__line" />}
          <div className="dc-stepper__circle">
            <div className="dc-stepper__dot" />
          </div>
          <div className="dc-stepper__label">
            <span className="dc-stepper__num">STEP {i + 1}</span>
            <span className="dc-stepper__text">{step.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Captcha Widget ───────────────────────────────────────────────────────────
const CAPTCHA_CODES = ['bpdx', 'k7mq', 'xr3t', 'n9wz', 'hj5c'];
function CaptchaWidget({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [codeIdx, setCodeIdx] = useState(0);
  const code = CAPTCHA_CODES[codeIdx];
  return (
    <div className="dc-captcha-row">
      <div className="dc-captcha-row__img">{code}</div>
      <input
        className="dc-captcha-row__input"
        placeholder="Enter the code shown"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <button className="dc-captcha-row__refresh" type="button" title="Refresh"
        onClick={() => setCodeIdx(i => (i + 1) % CAPTCHA_CODES.length)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
      </button>
    </div>
  );
}

// ─── Email Verify Modal ───────────────────────────────────────────────────────
function EmailVerifyModal({ email, onVerify, onClose }: {
  email: string; onVerify: () => void; onClose: () => void;
}) {
  const [step, setStep] = useState<'captcha' | 'otp'>('captcha');
  const [captchaValue, setCaptchaValue] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleInput = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 3) refs[idx + 1].current?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) refs[idx - 1].current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4).split('');
    setOtp([digits[0] || '', digits[1] || '', digits[2] || '', digits[3] || '']);
    refs[Math.min(digits.length, 3)].current?.focus();
    e.preventDefault();
  };

  return (
    <div className="dc-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dc-modal">
        <button className="dc-modal__close" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div className="dc-modal__logo">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>
        </div>

        {step === 'captcha' ? (
          <>
            <div className="dc-modal__body">
              <p className="dc-modal__title">Verify You're Human</p>
              <p className="dc-modal__desc">Please enter the verification code shown below to continue.</p>
            </div>
            <div style={{ padding: '0 24px 8px' }}>
              <CaptchaWidget value={captchaValue} onChange={setCaptchaValue} />
            </div>
            <div className="dc-modal__actions">
              <button
                className="dc-modal__verify-btn"
                onClick={() => { if (captchaValue.trim()) setStep('otp'); }}
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="dc-modal__body">
              <p className="dc-modal__title">Verify Contact Details</p>
              <p className="dc-modal__desc">
                We'll send a verification code to:<br />
                <strong>{email || 'your email address'}</strong>
              </p>
            </div>
            <div className="dc-otp-boxes" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={refs[idx]}
                  className="dc-otp-box"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInput(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                />
              ))}
            </div>
            <div className="dc-modal__actions">
              <button className="dc-modal__verify-btn" onClick={() => { onVerify(); onClose(); }}>
                Verify
              </button>
            </div>
            <span className="dc-modal__resend">Not in your inbox or spam? Resend Code</span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── File Upload ──────────────────────────────────────────────────────────────
// multiple=false keeps only the latest file (one file per attachment row); onFilesChange reports the picks.
function FileUploadRow({ multiple = true, accept, onFilesChange }: {
  multiple?: boolean; accept?: string; onFilesChange?: (files: { name: string; size: number }[]) => void;
} = {}) {
  const ref = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);
  const [dragging, setDragging] = useState(false);

  const update = (next: { name: string; size: number }[]) => {
    setFiles(next);
    onFilesChange?.(next);
  };

  const addFiles = (newFiles: FileList) => {
    const picked = Array.from(newFiles).map(f => ({ name: f.name, size: f.size }));
    update(multiple ? [...files, ...picked] : picked.slice(-1));
  };

  const removeFile = (idx: number) => {
    update(files.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {files.length > 0 && (
        <div className="dc-file-grid">
          {files.map((file, idx) => (
            <div key={idx} className="dc-file-input-wrap">
              <img src={fileType} width="28" height="28" alt="file" className="dc-file-type-icon" />
              <span className="dc-file-input-text">{file.name}</span>
              <div className="dc-file-input-trail">
                <button className="dc-file-tag__remove" onClick={() => removeFile(idx)} title="Remove file">
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNiAxOUM2IDIwLjEgNi45IDIxIDggMjFIMTZDMTcuMSAyMSAxOCAyMC4xIDE4IDE5VjdINlYxOVpNOCA5SDE2VjE5SDhWOVpNMTUuNSA0TDE0LjUgM0g5LjVMOC41IDRINVY2SDE5VjRIMTUuNVoiIGZpbGw9IiNEQzM1NDUiLz48L3N2Zz4=" width="20" height="20" alt="Remove" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div
        className={`dc-dropzone${dragging ? ' dc-dropzone--active' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
      >
        <div className="dc-dropzone__icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
        </div>
        <span className="dc-dropzone__text">Drag and drop files here</span>
        <span className="dc-dropzone__or">-Or-</span>
        <button className="dc-dropzone__browse" onClick={() => ref.current?.click()}>Browse File</button>
        <input ref={ref} type="file" multiple={multiple} accept={accept} style={{ display: 'none' }} onChange={e => { if (e.target.files?.length) { addFiles(e.target.files); e.target.value = ''; } }} />
      </div>
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────
function FormField({ label, required, children, className }: {
  label: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`dc-field ${className ?? ''}`}>
      <label className="dc-field__label">{label}{required && <span className="dc-field__req">*</span>}</label>
      {children}
    </div>
  );
}

// ─── Success Banner ───────────────────────────────────────────────────────────
const COUNTRY_CODES = [
  { flag: '🇦🇪', name: 'UAE', code: '+971' },
  { flag: '🇺🇸', name: 'USA', code: '+1' },
  { flag: '🇬🇧', name: 'UK', code: '+44' },
  { flag: '🇮🇳', name: 'India', code: '+91' },
  { flag: '🇸🇦', name: 'Saudi Arabia', code: '+966' },
  { flag: '🇶🇦', name: 'Qatar', code: '+974' },
  { flag: '🇰🇼', name: 'Kuwait', code: '+965' },
  { flag: '🇴🇲', name: 'Oman', code: '+968' },
  { flag: '🇧🇭', name: 'Bahrain', code: '+973' },
];

function CountryDropdown({ selected, onChange }: { selected: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = COUNTRY_CODES.find(c => c.code === selected) || COUNTRY_CODES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="dc-country-dropdown" ref={ref}>
      <button type="button" className="dc-country-dropdown__trigger" onClick={() => setOpen(o => !o)}>
        <span>{current.flag} {current.code}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div className="dc-country-dropdown__menu">
          {COUNTRY_CODES.map(c => (
            <div
              key={c.code}
              className={`dc-country-dropdown__option${c.code === selected ? ' dc-country-dropdown__option--active' : ''}`}
              onClick={() => { onChange(c.code); setOpen(false); }}
            >
              {c.flag} {c.name} {c.code}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhoneField({ label, required, value, onChange, tooltip }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; tooltip?: string;
}) {
  const [countryCode, setCountryCode] = useState('+971');
  return (
    <div className="dc-float-wrapper dc-field--half">
      <div className="dc-float-field">
        <div className="dc-phone-float">
          <CountryDropdown selected={countryCode} onChange={setCountryCode} />
          <input className="dc-float-input dc-float-input--phone" placeholder=" " value={value} onChange={e => onChange(e.target.value)} />
        </div>
        <label className="dc-float-label dc-float-label--phone">{label}{required && <span className="dc-req"> *</span>}</label>
      </div>
      {tooltip && <InfoTooltip tip={tooltip} />}
    </div>
  );
}

function SuccessAlert({ refNo, inProcess }: { refNo: string; inProcess?: boolean }) {
  return (
    <div className="dc-success-alert">
      <div className="dc-success-alert__left">
        <CheckCircle />
        <div>
          <div className="dc-success-alert__title">
            {inProcess ? 'Request is under process' : 'Request Submitted Successfully'}
          </div>
          {!inProcess && (
            <div className="dc-success-alert__msg">
              Thank you for contacting us! Request Approval is required, kindly use the <strong>{refNo}</strong> ticket number for future tracking purpose.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ navigate }: { navigate: (page: Page) => void }) {
  const [search, setSearch] = useState('');
  const filtered = SERVICES.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
      {/* Service Center hero banner */}
      <div className="dc-sc-hero-wrap">
        <div className="dc-sc-hero">
          <div className="dc-sc-hero__content">
            <h1 className="dc-sc-hero__title">Service Center</h1>
            <p className="dc-sc-hero__sub">Services that cater to all your needs</p>
          </div>
        </div>
      </div>

      {/* Dubai Customs section */}
      <div className="dc-customs-header">
        <div className="dc-customs-header__inner">
          <Breadcrumb items={[
            { label: 'Home', onClick: () => navigate({ name: 'home' }) },
            { label: 'Service Center', onClick: () => navigate({ name: 'home' }) },
            { label: 'Dubai Customs' },
          ]} />
          <div className="dc-customs-header__title-row">
            <button className="dc-back-btn" onClick={() => navigate({ name: 'home' })}><ArrowLeft /></button>
            <h2 className="dc-customs-header__title">Dubai Customs</h2>
          </div>
        </div>
      </div>

      <div className="dc-catalog">
        <div className="dc-catalog__toolbar">
          <div className="dc-search-filter-wrap">
            <div className="dc-search-bar">
              <SearchIcon />
              <input
                className="dc-search-bar__input"
                placeholder="Search by service name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="dc-search-divider" />
            <button className="dc-filter-btn"><FilterIcon /></button>
          </div>
          <div className="dc-catalog__count">
            Showing 1 to {Math.min(filtered.length, 20)} of {filtered.length} results
            <div className="dc-catalog__pagination">
              <button className="dc-catalog__nav-btn"><ArrowLeft /></button>
              <div className="dc-catalog__nav-divider" />
              <button className="dc-catalog__nav-btn" style={{ transform: 'scaleX(-1)' }}><ArrowLeft /></button>
            </div>
          </div>
        </div>

        <div className="dc-grid">
          {filtered.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onInfo={() => navigate({ name: 'info', serviceId: service.id })}
              onStart={() => navigate({ name: 'form', serviceId: service.id })}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Service Detail Icons — base64 data URLs (Figma Make compatible) ──────────
const SD_ICONS = {
  channel:      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwRTFCM0QiIHN0cm9rZS13aWR0aD0iMS42Ij48cmVjdCB4PSIyIiB5PSIzIiB3aWR0aD0iMjAiIGhlaWdodD0iMTQiIHJ4PSIyIi8+PHBhdGggZD0iTTggMjFoOE0xMiAxN3Y0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=',
  clock:        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwRTFCM0QiIHN0cm9rZS13aWR0aD0iMS42Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI5Ii8+PHBhdGggZD0iTTEyIDd2NWwzIDMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==',
  relationship: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwRTFCM0QiIHN0cm9rZS13aWR0aD0iMS42Ij48cGF0aCBkPSJNNyAxNmwtNC00IDQtNE0xNyA4bDQgNC00IDRNMTQgNGwtNCAxNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+',
  category:     'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwRTFCM0QiIHN0cm9rZS13aWR0aD0iMS42Ij48Y2lyY2xlIGN4PSI5IiBjeT0iNyIgcj0iMyIvPjxwYXRoIGQ9Ik0zIDIxdi0yYTQgNCAwIDAgMSA0LTRoNGE0IDQgMCAwIDEgNCA0djIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xNiAzLjEzYTQgNCAwIDAgMSAwIDcuNzVNMjEgMjF2LTJhNCA0IDAgMCAwLTMtMy44NSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
  gear:         'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwRTFCM0QiIHN0cm9rZS13aWR0aD0iMS42Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIzIi8+PHBhdGggZD0iTTE5LjQgMTVhMS42NSAxLjY1IDAgMCAwIC4zMyAxLjgybC4wNi4wNmEyIDIgMCAwIDEtMi44MyAyLjgzbC0uMDYtLjA2YTEuNjUgMS42NSAwIDAgMC0xLjgyLS4zMyAxLjY1IDEuNjUgMCAwIDAtMSAxLjUxVjIxYTIgMiAwIDAgMS00IDB2LS4wOUExLjY1IDEuNjUgMCAwIDAgOSAxOS40YTEuNjUgMS42NSAwIDAgMC0xLjgyLjMzbC0uMDYuMDZhMiAyIDAgMCAxLTIuODMtMi44M2wuMDYtLjA2QTEuNjUgMS42NSAwIDAgMCA0LjY4IDE1YTEuNjUgMS42NSAwIDAgMC0xLjUxLTFIM2EyIDIgMCAwIDEgMC00aC4wOUExLjY1IDEuNjUgMCAwIDAgNC42IDlhMS42NSAxLjY1IDAgMCAwLS4zMy0xLjgybC0uMDYtLjA2YTIgMiAwIDAgMSAyLjgzLTIuODNsLjA2LjA2QTEuNjUgMS42NSAwIDAgMCA5IDQuNjhhMS42NSAxLjY1IDAgMCAwIDEtMS41MVYzYTIgMiAwIDAgMSA0IDB2LjA5YTEuNjUgMS42NSAwIDAgMCAxIDEuNTEgMS42NSAxLjY1IDAgMCAwIDEuODItLjMzbC4wNi0uMDZhMiAyIDAgMCAxIDIuODMgMi44M2wtLjA2LjA2QTEuNjUgMS42NSAwIDAgMCAxOS40IDlhMS42NSAxLjY1IDAgMCAwIDEuNTEgMUgyMWEyIDIgMCAwIDEgMCA0aC0uMDlhMS42NSAxLjY1IDAgMCAwLTEuNTEgMXoiLz48L3N2Zz4=',
  hierarchy:    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwRTFCM0QiIHN0cm9rZS13aWR0aD0iMS42Ij48cGF0aCBkPSJNMTIgMkwyIDE5aDIwTDEyIDJ6IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTEyIDEwdjRNMTAgMTRoNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
  interconnect: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwRTFCM0QiIHN0cm9rZS13aWR0aD0iMS42Ij48cGF0aCBkPSJNNSAxMmgxNE0xNSA4bDQgNC00IDRNOSAxNmwtNC00IDQtNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+',
  schedule:     'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwRTFCM0QiIHN0cm9rZS13aWR0aD0iMS42Ij48cmVjdCB4PSIzIiB5PSI0IiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIi8+PHBhdGggZD0iTTE2IDJ2NE04IDJ2NE0zIDEwaDE4IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjE2IiByPSIyIi8+PC9zdmc+',
  bundle:       'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwRTFCM0QiIHN0cm9rZS13aWR0aD0iMS42Ij48cmVjdCB4PSIyIiB5PSI3IiB3aWR0aD0iMjAiIGhlaWdodD0iMTQiIHJ4PSIyIi8+PHBhdGggZD0iTTE2IDdWNWEyIDIgMCAwIDAtMi0yaC00YTIgMiAwIDAgMC0yIDJ2Mk0xMiAxMnY0TTEwIDE0aDQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
  urgency:      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwRTFCM0QiIHN0cm9rZS13aWR0aD0iMS42Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI5Ii8+PHBhdGggZD0iTTEyIDd2NSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxNiIgcj0iMC41IiBmaWxsPSIjMEUxQjNEIi8+PC9zdmc+',
  limitation:   'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwRTFCM0QiIHN0cm9rZS13aWR0aD0iMS42Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI5Ii8+PHBhdGggZD0iTTggMTJoOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
};

function ServiceDetailItem({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="dc-sd-item">
      <div className="dc-sd-item__header">
        <img src={icon} width={22} height={22} alt="" className="dc-sd-item__icon" />
        <span className="dc-sd-item__label">{label}</span>
      </div>
      <div className="dc-sd-item__value">{children}</div>
    </div>
  );
}

// ─── INFO PAGE ────────────────────────────────────────────────────────────────
type InfoTab = 'information' | 'tutorials' | 'faqs' | 'updates' | 'downloads';

const INFO_TABS: { id: InfoTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'information',
    label: 'Information',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>,
  },
  {
    id: 'tutorials',
    label: 'Tutorials',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="14" height="14" rx="2"/><path d="M22 4l-6 4 6 4V4z"/></svg>,
  },
  {
    id: 'faqs',
    label: "Common FAQ's",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    id: 'updates',
    label: 'Updates',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  },
  {
    id: 'downloads',
    label: 'Downloads',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  },
];

function InfoPage({ service, navigate }: { service: ServiceDef; navigate: (page: Page) => void }) {
  const [activeTab, setActiveTab] = useState<InfoTab>('information');

  return (
    <>
      <HeroBanner title={service.title} subtitle={service.subtitle} showButton onStartService={() => navigate({ name: 'form', serviceId: service.id })} />
      <div className="dc-container">
        <Breadcrumb items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          { label: 'Service Center', onClick: () => navigate({ name: 'home' }) },
          { label: 'Dubai Customs', onClick: () => navigate({ name: 'home' }) },
          { label: service.title },
        ]} />
        <div className="dc-info-header">
          <button className="dc-back-btn" onClick={() => navigate({ name: 'home' })}><ArrowLeft /></button>
          <h2 className="dc-info-header__title">{service.title}</h2>
        </div>

        {/* Tabs */}
        <div className="dc-info-tabs">
          {INFO_TABS.map(tab => (
            <button
              key={tab.id}
              className={`dc-info-tab${activeTab === tab.id ? ' dc-info-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Information tab ── */}
        {activeTab === 'information' && (
          <div className="dc-info-main">
            <section className="dc-info-section">
              <h3 className="dc-info-section__title">Description</h3>
              <p className="dc-info-section__text">{service.description}</p>
            </section>

            <section className="dc-info-section">
              <h3 className="dc-info-section__title">Service Delivery Procedure</h3>
              <div className="dc-info-procedure">
                <Stepper steps={service.steps.length ? service.steps : [
                  { label: 'Submit the application through all available channels' },
                  { label: 'Pay service fees' },
                  { label: 'Receive the certificate.' },
                ]} />
              </div>
            </section>

            {/* Service Details accordion — 5-column grid matching Figma */}
            <Accordion title="Service Details" defaultOpen>
              <div className="dc-sd-grid">
                <ServiceDetailItem icon={SD_ICONS.channel} label="Service Delivery Channel">
                  <ul className="dc-sd-list">
                    {service.deliveryChannels.map(c => <li key={c}>{c}</li>)}
                  </ul>
                </ServiceDetailItem>
                <ServiceDetailItem icon={SD_ICONS.clock} label="Service Completion Time">
                  <ul className="dc-sd-list"><li>{service.completionTime}</li></ul>
                </ServiceDetailItem>
                <ServiceDetailItem icon={SD_ICONS.relationship} label="Relationship Type">
                  <ul className="dc-sd-list">
                    {service.relationshipType.map(r => <li key={r}>{r}</li>)}
                  </ul>
                </ServiceDetailItem>
                <ServiceDetailItem icon={SD_ICONS.category} label="Target Category">
                  <ul className="dc-sd-list"><li>{service.targetCategory}</li></ul>
                </ServiceDetailItem>
                <ServiceDetailItem icon={SD_ICONS.gear} label="Service Type">
                  <ul className="dc-sd-list"><li>{service.serviceType}</li></ul>
                </ServiceDetailItem>
                <ServiceDetailItem icon={SD_ICONS.hierarchy} label="Service Hierarchy">
                  <ul className="dc-sd-list"><li>{service.serviceHierarchy}</li></ul>
                </ServiceDetailItem>
                <ServiceDetailItem icon={SD_ICONS.interconnect} label="Service Interconnection">
                  <ul className="dc-sd-list"><li>N/A</li></ul>
                </ServiceDetailItem>
                <ServiceDetailItem icon={SD_ICONS.schedule} label="Service Delivery Time">
                  <ul className="dc-sd-list">
                    <li>Available around the clock (Online and Mobile Web)</li>
                    <li>Refer to <a href="#" style={{ color: '#1360D2' }}>customer happiness centers</a> working hours (Center)</li>
                  </ul>
                </ServiceDetailItem>
                <ServiceDetailItem icon={SD_ICONS.bundle} label="Bundle">
                  <ul className="dc-sd-list"><li>N/A</li></ul>
                </ServiceDetailItem>
                <ServiceDetailItem icon={SD_ICONS.urgency} label="Service Urgency:">
                  <ul className="dc-sd-list"><li>N/A</li></ul>
                </ServiceDetailItem>
                <ServiceDetailItem icon={SD_ICONS.limitation} label="Service Limitation:">
                  <ul className="dc-sd-list"><li>N/A</li></ul>
                </ServiceDetailItem>
              </div>
            </Accordion>

            <Accordion title="Service Fee" defaultOpen>
              <div className="dc-fee-content">
                <div className="dc-fee-badge">New</div>
                <div className="dc-fee-amount">{service.fee}</div>
                <div className="dc-fee-note">{service.feeNote}</div>
              </div>
            </Accordion>

            <Accordion title="Required Documents">
              <div className="dc-docs-content">
                {service.requirements.split('\n').map((r, i) => (
                  <p key={i} style={{ margin: '4px 0' }}>{r}</p>
                ))}
              </div>
            </Accordion>

            <Accordion title="Terms & Conditions">
              <p style={{ color: '#555', lineHeight: 1.6 }}>
                By submitting this request, you agree to the terms and conditions of Dubai Trade. All information provided must be accurate and complete. False declarations may result in legal action.
              </p>
            </Accordion>
          </div>
        )}

        {/* ── Tutorials tab ── */}
        {activeTab === 'tutorials' && (
          <div className="dc-tab-content">
            <h3 className="dc-info-section__title" style={{ marginBottom: 20 }}>Video Tutorial Title</h3>
            <div className="dc-video-thumb">
              <div className="dc-video-thumb__play">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </div>
        )}

        {/* ── Unavailable tabs ── */}
        {(activeTab === 'faqs' || activeTab === 'updates' || activeTab === 'downloads') && (
          <div className="dc-tab-content dc-tab-unavailable">
            <div className="dc-tab-unavailable__icon">
              <InfoIcon />
            </div>
            <p className="dc-tab-unavailable__text">
              Content is not available, please check back another time.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function InfoSidebarItem({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="dc-sidebar-item">
      <div className="dc-sidebar-item__header">
        <span className="dc-sidebar-item__icon">{icon}</span>
        <span className="dc-sidebar-item__label">{label}</span>
      </div>
      <div className="dc-sidebar-item__value">{children}</div>
    </div>
  );
}

// ─── Float Dropdown (custom) ──────────────────────────────────────────────────
function FloatDropdown({ label, required, value, onChange, options, className, disabled }: {
  label?: string; required?: boolean; value: string; onChange: (v: string) => void;
  options: string[]; className?: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div
      ref={ref}
      className={`dc-float-dropdown ${open ? 'dc-float-dropdown--open' : ''} ${value ? 'dc-float-dropdown--has-value' : ''} ${disabled ? 'dc-float-dropdown--disabled' : ''} ${className ?? ''}`}
    >
      {open && !disabled ? (
        <div className="dc-float-dropdown__trigger dc-float-dropdown__trigger--search">
          <input
            ref={inputRef}
            className="dc-float-dropdown__inline-search"
            placeholder={value || 'Please select service type'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <svg className="dc-float-dropdown__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      ) : (
        <button
          type="button"
          className="dc-float-dropdown__trigger"
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled}
        >
          {value || <span className="dc-float-dropdown__placeholder"> </span>}
          <svg className="dc-float-dropdown__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      )}
      {label && <label className="dc-float-dropdown__label">{label}{required && <span className="dc-req"> *</span>}</label>}
      {open && !disabled && (
        <div className="dc-float-dropdown__menu">
          <div className="dc-float-dropdown__options">
            {filtered.length > 0 ? filtered.map(opt => (
              <div
                key={opt}
                className={`dc-float-dropdown__option ${value === opt ? 'dc-float-dropdown__option--selected' : ''}`}
                onClick={() => { onChange(opt); setOpen(false); setSearch(''); }}
              >
                {opt}
              </div>
            )) : (
              <div className="dc-float-dropdown__no-results">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Float Select ─────────────────────────────────────────────────────────────
function FloatSelect({ label, required, value, onChange, children, className }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`dc-float-wrapper ${className ?? ''}`}>
      <div className="dc-float-field dc-float-select-wrap">
        <select className="dc-float-select" value={value} onChange={e => onChange(e.target.value)}>
          {children}
        </select>
        <label className="dc-float-label dc-float-label--select">{label}{required && <span className="dc-req"> *</span>}</label>
        <svg className="dc-float-select__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
  );
}

// ─── Float Date Field ─────────────────────────────────────────────────────────
// value is YYYY-MM-DD; shown as DD-MM-YYYY. Opens the Dubai Trade calendar on focus or icon click.
function DateField({ label, required, value, onChange, hint }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const commit = (text: string) => {
    if (!text.trim()) { onChange(''); setTyped(null); return; }
    const iso = parseTypedDate(text);
    if (iso) { onChange(iso); setTyped(null); } else setTyped(null); // not a date — put the field back
  };

  return (
    <div className="dc-float-wrapper dc-field--half" ref={wrapRef} style={{ position: 'relative' }}>
      <div className="dc-float-field">
        <input ref={inputRef} className="dc-float-input dc-float-input--icon" placeholder={focused ? 'DD-MM-YYYY' : ' '}
          style={open ? { borderColor: '#1360D2' } : undefined}
          value={typed ?? fmtDate(value)}
          onChange={e => setTyped(e.target.value)}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={e => { setFocused(false); commit(e.target.value); }}
          onKeyDown={e => {
            if (e.key === 'Enter') { commit(e.currentTarget.value); setOpen(false); }
            if (e.key === 'Escape') { setTyped(null); setOpen(false); }
          }} />
        <label className="dc-float-label">{label}{required && <span className="dc-req"> *</span>}</label>
        <button type="button" className="dc-float-icon-suffix" aria-label={`Open ${label} calendar`}
          style={{ pointerEvents: 'auto', cursor: 'pointer', padding: 0 }}
          onMouseDown={e => e.preventDefault()}
          onClick={() => { if (open) setOpen(false); else inputRef.current?.focus(); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </button>
      </div>
      {hint && <InfoTooltip tip={hint} />}
      {open && (
        <div style={{
          position: 'absolute', top: 60, left: 0, zIndex: 600,
          background: '#fff', borderRadius: 12, border: '1px solid #e0e8f5',
          padding: 20, minWidth: 340, boxShadow: '0 8px 32px rgba(14,27,61,0.16)',
        }}>
          <CalendarPicker value={value} onPick={v => { onChange(v); setTyped(null); setOpen(false); }} />
          {value && (
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              style={{ marginTop: 8, width: '100%', color: '#1360D2', fontSize: 13 }}>
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── FORM PAGE ────────────────────────────────────────────────────────────────
function ServiceFormPage({ service, navigate, initialTab }: { service: ServiceDef; navigate: (page: Page) => void; initialTab?: FormTab }) {
  const [activeTab, setActiveTab] = useState<FormTab>(initialTab ?? 'new');

  if (service.formType === 'track') {
    return <TrackStatusForm service={service} navigate={navigate} />;
  }
  if (service.formType === 'pay-bills') {
    return <PayBillsForm service={service} navigate={navigate} />;
  }

  return (
    <>
      <HeroBanner title={service.title} subtitle={service.subtitle} />
      <div className="dc-container">
        <Breadcrumb items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          { label: 'Service Center', onClick: () => navigate({ name: 'home' }) },
          { label: 'Dubai Trade', onClick: () => navigate({ name: 'home' }) },
          { label: service.title },
        ]} />
        <div className="dc-info-header">
          <button className="dc-back-btn" onClick={() => navigate({ name: 'home' })}><ArrowLeft /></button>
          <h2 className="dc-info-header__title">{service.title}</h2>
        </div>

        <div className="dc-form-tabs">
          {formTabsFor(service.id).map(tab => (
            <button
              key={tab}
              className={`dc-form-tab ${activeTab === tab ? 'dc-form-tab--active' : ''}`}
              onClick={() => service.id === 'business-registration' && (tab === 'amend' || tab === 'contact') ? goFormTab(navigate, service.id, tab) : setActiveTab(tab)}
            >
              {FORM_TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {activeTab === 'new' && <NewForm service={service} navigate={navigate} />}
        {activeTab === 'renew' && <BRRenewForm service={service} navigate={navigate} />}
        {(activeTab === 'amend' || activeTab === 'cancel') && <AmendCancelForm key={activeTab} service={service} tabName={activeTab} navigate={navigate} />}
        {activeTab === 'enquiry' && (service.id === 'business-registration'
          ? <BREnquiryForm service={service} navigate={navigate} />
          : <EnquiryForm service={service} navigate={navigate} />)}
      </div>
    </>
  );
}

// ─── Certificate Service Types ────────────────────────────────────────────────
const CERT_SERVICE_TYPES = [
  {
    name: 'NOC for Customs Broker License - New',
    description: 'This service provides customers to obtain No Objection Certificate for Customs Broker to Issue New License',
    requirements: '1. Initial approval for the trade name & activity from DED',
    fees: '700.00',
  },
  {
    name: 'NOC for Customs Broker License - New Branch',
    description: 'Obtain a No Objection Certificate to open a new branch for an existing Customs Broker License',
    requirements: 'Existing broker license, Branch address proof, Emirates ID copy, Trade license',
    fees: '300.00',
  },
  {
    name: 'NOC for Customs Broker License - Change of Owner',
    description: 'Obtain a No Objection Certificate to transfer ownership of a Customs Broker License',
    requirements: 'Current license copy, New owner Emirates ID, MOU or transfer agreement, Trade license',
    fees: '400.00',
  },
  {
    name: 'NOC for Customs Broker License - Add New Partner',
    description: 'Obtain a No Objection Certificate to add a new partner to an existing Customs Broker License',
    requirements: 'Existing license copy, New partner Emirates ID, Partnership agreement, Trade license',
    fees: '350.00',
  },
  {
    name: 'Landing Certificate',
    description: 'Official certificate confirming that goods have been landed and received at the destination port',
    requirements: 'Bill of lading, Commercial invoice, Packing list, Declaration number',
    fees: '100.00',
  },
  {
    name: 'Vehicle Clearance Certificate(VCC)',
    description: 'Certificate confirming that a vehicle has been cleared through Dubai Customs with all duties paid',
    requirements: 'Vehicle chassis number, Customs declaration, Invoice, Importer trade license',
    fees: '200.00',
  },
  {
    name: 'Clearance Letter',
    description: 'This service provides customers to obtain:\n- Clearance Certificate - Termination\n- Clearance Certificate - For company records\n- Clearance Certificate - Change ownership\n- Clearance Certificate - Add Partner\n- Clearance Certificate - Business Code Cancellation',
    requirements: '1. Passport copy of the owner or authorized person and visa copy -if available-\n2. Letter from the company that state the customer business code and the authorized person -if any-\n3. If license owner is not available, the following will be required: Power of Attorney, Share Certificate, or Letter from License Authority',
    fees: '100.00',
  },
  {
    name: 'VAT Registration Letter',
    description: 'Official letter confirming VAT registration status issued by Dubai Customs for trade purposes',
    requirements: 'TRN (Tax Registration Number), Trade license, Emirates ID, Application form',
    fees: '100.00',
  },
  {
    name: 'Authorization to Issue Invoice in FZ',
    description: 'Authorization certificate allowing businesses in Free Zones to issue invoices for customs purposes',
    requirements: 'Free Zone license, Emirates ID, Authorized signatory details, Application form',
    fees: '250.00',
  },
  {
    name: 'No Objection from Special Tasks Department',
    description: 'No Objection Certificate issued by the Special Tasks Department for regulated goods or activities',
    requirements: 'Trade license, Emirates ID, Description of goods/activity, Supporting approvals if any',
    fees: '300.00',
  },
];

// ─── NEW TAB FORM ─────────────────────────────────────────────────────────────
function NewForm({ service, navigate }: { service: ServiceDef; navigate: (page: Page) => void }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('+971');
  const [mobile, setMobile] = useState('');
  const [mobileCountry, setMobileCountry] = useState('+971');
  const [desc, setDesc] = useState('');
  const [subject, setSubject] = useState('');
  const [certServiceType, setCertServiceType] = useState('');
  const [businessCode, setBusinessCode] = useState('');
  const [licenseAuthority, setLicenseAuthority] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [purpose, setPurpose] = useState('');
  const [hsCodesCount, setHsCodesCount] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [zeroStockDeclaration, setZeroStockDeclaration] = useState(false);
  const isClearanceLetter = service.id === 'request-certificates' && certServiceType === 'Clearance Letter';
  const isVATLetter = service.id === 'request-certificates' && certServiceType === 'VAT Registration Letter';
  const isGoodsClassification = service.id === 'goods-classification';
  const isRequestCertificates = service.id === 'request-certificates';
  const isIPComplaint = service.id === 'trade-ip-complaint';
  const isAppealCustomsDecision = service.id === 'appeal-customs-decision';
  const isCustomsOpinion = service.id === 'customs-opinion';
  const [ipServiceType, setIpServiceType] = useState('');
  const [iprRefNo, setIprRefNo] = useState('');
  const [urgentRequest, setUrgentRequest] = useState(false);
  const [appealServiceType, setAppealServiceType] = useState('');
  const [opinionServiceType, setOpinionServiceType] = useState('');
  const isBusinessRegistration = service.id === 'business-registration';
  const [brLayout, setBrLayout] = useBRLayout();
  const [brRail, toggleBrRail] = useBRNavRail();
  const [brActive, setBrActive] = useBRActiveSection('business,license,contact', isBusinessRegistration);
  useBRStickyOffsets(isBusinessRegistration, brLayout);
  const [brBusinessName, setBrBusinessName] = useState('');
  const [brBusinessNameAr, setBrBusinessNameAr] = useState('');
  const [brRegCategory, setBrRegCategory] = useState('');
  const [brEmployeeCount, setBrEmployeeCount] = useState('');
  const [brLicenseNumber, setBrLicenseNumber] = useState('');
  const [brLicenseType, setBrLicenseType] = useState('');
  const [brIssuingAuthority, setBrIssuingAuthority] = useState('');
  const [brLicenseIssueDate, setBrLicenseIssueDate] = useState('');
  const [brLicenseValidFrom, setBrLicenseValidFrom] = useState('');
  const [brLicenseValidTo, setBrLicenseValidTo] = useState('');
  const [brPhone, setBrPhone] = useState('');
  const [brFax, setBrFax] = useState('');
  const [brEmail, setBrEmail] = useState('');
  const [brOperationalEmail, setBrOperationalEmail] = useState('');
  const [brWebsite, setBrWebsite] = useState('');
  const [brNocNumber, setBrNocNumber] = useState('');

  const BR_ISSUING_AUTHORITIES = [
    'Community Development Authority (CDA)',
    'Department of Economy & Tourism - Dubai (DET)',
    'Dubai Maritime City Authority - Dubai Maritime City',
    'Islamic Affairs and Charitable Activities Department (IACAD)',
    'Jebel Ali Free Zone Authority - Iraqi Companies',
    'Security Industry Regulatory Agency (SIRA)',
  ];

  const selectedCert = CERT_SERVICE_TYPES.find(t => t.name === certServiceType) ?? null;

  const IP_SERVICE_TYPES: Record<string, { description: string; requirements: string }> = {
    'Trade Mark': {
      description: 'This service enables intellectual property owners to file a complaint against companies that import counterfeit goods for their trademark, copyright or industrial model.',
      requirements: '1. The complaint by the trademark owner or his legal representative (translated in Arabic).\n2. Copy of valid certificates of registration of the trademark.\n3. Attach a technical report that shows imitation of the trademark.\n4. Attach a copy of the acceptance of the counterfeit goods recycling company.\n5. Written undertaking to bear costs of impoundment, inspection, storage or any delay resulting from untrue complaint.\n6. Attach Notification Report if you have.',
    },
    'Trade Agency': {
      description: 'This service enables the commercial Agent to file a complaint against companies that import products bearing the name of their commercial agency.',
      requirements: '1. The complaint shall be submitted during the by the Client or his legal representative (in Arabic)\n2. Attach copy of the Commercial Agency registration certificate issued by the Ministry of Economy.\n3. Attach copy of trade license.\n4. Undertaking letter to bear costs of impoundment, inspection, storage or any delay resulting from untrue complaint\n5. Attach Notification Report if you have.',
    },
  };
  const selectedIPType = ipServiceType ? IP_SERVICE_TYPES[ipServiceType] : null;

  const APPEAL_SERVICE_TYPES: Record<string, { description: string; requirements: string }> = {
    'Suspended Customs Duties': {
      description: 'This service allows customers the opportunity to appeal any decision or proposal issued by Dubai Customs that does not fulfill their needs.\nThis service is the first step to be followed in order to find a way to challenge the decision provided by customs.\nThe customer can submit a request to appeal to resolve any issue in the following areas:\n• Appeal Decisions on Suspended Duties',
      requirements: 'Attach the evidences and proofs',
    },
    'Customs Case': {
      description: 'Department of customs that does not fulfill their needs and raise the demand to the Appeals Committee for consideration or issue a settlement request',
      requirements: '1. Letter addressed to the head of the appeals committee stating the situation in details and includes all required attachments that supports your point of view.\n2. Signed Conciliation Settlement Request.\n3. Receipt payment of 50% of the total fine imposed which should not exceed fifty thousand dirhams.',
    },
    'Customs Tariff': {
      description: 'This service allows customers the opportunity to appeal any decision or proposal issued by Dubai Customs that does not fulfill their needs.\nThis service is the first step to be followed in order to find a way to challenge the decision provided by customs.\nThe customer can submit a request to appeal to resolve any issue in the following areas:\n• Appeal Decisions on Customs Tariff',
      requirements: 'Attach the evidences and proofs',
    },
    'Origin': {
      description: 'This service allows customers the opportunity to appeal any decision or proposal issued by Dubai Customs that does not fulfill their needs.\nThis service is the first step to be followed in order to find a way to challenge the decision provided by customs.\nThe customer can submit a request to appeal to resolve any issue in the following areas:\n• Appeal Decisions on Origin',
      requirements: 'Attach the evidences and proofs',
    },
    'Customs Valuation': {
      description: 'This service allows customers the opportunity to appeal any decision or proposal issued by Dubai Customs that does not fulfill their needs.\nThis service is the first step to be followed in order to find a way to challenge the decision provided by customs.\nThe customer can submit a request to appeal to resolve any issue in the following areas:\n• Appeal Decisions on Customs Valuation',
      requirements: 'Attach the evidences and proofs',
    },
    'Economic Agreements (FTA)': {
      description: 'This service allows customers the opportunity to appeal any decision or proposal issued by Dubai Customs that does not fulfill their needs.\nThis service is the first step to be followed in order to find a way to challenge the decision provided by customs.\nThe customer can submit a request to appeal to resolve any issue in the following areas:\n• Appeal Decisions on Economic Agreements (FTA)',
      requirements: 'Attach the evidences and proofs',
    },
    'Customs Refund Management - Claim and Forfeiture': {
      description: 'This service allows customers the opportunity to appeal any decision or proposal issued by Dubai Customs that does not fulfill their needs.\nThis service is the first step to be followed in order to find a way to challenge the decision provided by customs.\nThe customer can submit a request to appeal to resolve any issue in the following areas:\n• Appeal Decisions on Customs Refund Management - Claim and Forfeiture',
      requirements: 'Attach the evidences and proofs',
    },
    'Prohibited and Restricted Goods': {
      description: 'This service allows customers the opportunity to appeal any decision or proposal issued by Dubai Customs that does not fulfill their needs.\nThis service is the first step to be followed in order to find a way to challenge the decision provided by customs.\nThe customer can submit a request to appeal to resolve any issue in the following areas:\n• Appeal Decisions on Prohibited and Restricted Goods',
      requirements: 'Attach the evidences and proofs',
    },
  };
  const selectedAppealType = appealServiceType ? APPEAL_SERVICE_TYPES[appealServiceType] : null;

  const CUSTOMS_OPINION_SERVICE_TYPES: Record<string, { description: string; requirements: string }> = {
    'Customs Tariff': {
      description: 'Request a customs opinion on the correct tariff classification of goods under the Harmonised System (HS) for Dubai Customs purposes.',
      requirements: 'Trade license, commercial invoice, detailed product description, technical specifications or material composition report.',
    },
    'Origin': {
      description: 'Request a customs opinion to determine the country of origin of goods for preferential or non-preferential trade purposes.',
      requirements: 'Certificate of origin, manufacturing process description, bill of materials, supplier declarations.',
    },
    'Customs Valuation': {
      description: 'Request a customs opinion on the correct customs value of goods in accordance with the WTO Customs Valuation Agreement.',
      requirements: 'Commercial invoice, purchase agreement, transaction value evidence, freight and insurance documents.',
    },
    'Prohibited and Restricted Goods': {
      description: 'Request a customs opinion on whether specific goods are subject to prohibition or restriction under UAE Customs regulations.',
      requirements: 'Product description and specifications, applicable safety/regulatory certificates, intended use declaration.',
    },
    'Customs Notices': {
      description: 'Request a customs opinion related to the interpretation or application of official Dubai Customs notices and circulars.',
      requirements: 'Reference to the relevant customs notice, description of the goods or situation, supporting documents.',
    },
    'Economic Agreements (FTA)': {
      description: 'Request a customs opinion on the application of Free Trade Agreement (FTA) provisions, preferential duties, and rules of origin.',
      requirements: 'Certificate of origin, FTA reference, proof of preferential treatment eligibility, trade license.',
    },
    'Suspended Customs Duties': {
      description: 'Request a customs opinion on the eligibility of goods for suspended customs duties under applicable exemption or suspension schemes.',
      requirements: 'Trade license, goods description, relevant ministerial decision or decree reference, import documents.',
    },
  };
  const selectedOpinionType = opinionServiceType ? CUSTOMS_OPINION_SERVICE_TYPES[opinionServiceType] : null;
  const showRestOfForm =
    (!isRequestCertificates || !!certServiceType) &&
    (!isIPComplaint || !!ipServiceType) &&
    (!isAppealCustomsDecision || !!appealServiceType) &&
    (!isCustomsOpinion || !!opinionServiceType);

  const formCard = (
    <div className="dc-form-card">
      {/* ── Section 1: Service Details (not applicable to Business Registration) ── */}
      {!isBusinessRegistration && (
      <div className="dc-form-section dc-basic-info-section">
        <div className="dc-basic-info-header">
          <h4 className="dc-form-section__heading" style={{margin:0}}>Service Details</h4>
        </div>
        <div className="dc-basic-info-cards">
          {/* Row 1: Service Name + Charges */}
          <div style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'stretch' }}>
            <div className="dc-basic-info-card" style={{ flex: 1 }}>
              <div className="dc-basic-info-card__icon dc-basic-info-card__icon--blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              </div>
              <div className="dc-basic-info-card__body">
                <span className="dc-basic-info-card__label">Service Name</span>
                <span className="dc-basic-info-card__value">{service.serviceName}</span>
              </div>
            </div>
            {service.id !== 'request-certificates' && !isIPComplaint && !isAppealCustomsDecision && !isCustomsOpinion && (
              <div className="dc-basic-info-card" style={{ flex: 1 }}>
                <div className="dc-basic-info-card__icon dc-basic-info-card__icon--green">
                  <img src={dirham} width="18" height="18" alt="AED" style={{ filter: 'brightness(0)' }} />
                </div>
                <div className="dc-basic-info-card__body">
                  <span className="dc-basic-info-card__label">Charges</span>
                  <span className="dc-basic-info-card__value dc-basic-info-card__value--charge">AED {service.charges}</span>
                </div>
              </div>
            )}
          </div>
          {/* Row 2: Service Description + Requirements */}
          <div style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'stretch' }}>
            <div className="dc-basic-info-card" style={{ flex: 1 }}>
              <div className="dc-basic-info-card__icon dc-basic-info-card__icon--indigo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div className="dc-basic-info-card__body">
                <span className="dc-basic-info-card__label">Service Description</span>
                <span className="dc-basic-info-card__value" style={{ whiteSpace: 'pre-line' }}>{service.serviceDescription}</span>
              </div>
            </div>
            {service.id !== 'request-certificates' && !isIPComplaint && !isAppealCustomsDecision && !isCustomsOpinion && (
              <div className="dc-basic-info-card" style={{ flex: 1 }}>
                <div className="dc-basic-info-card__icon dc-basic-info-card__icon--teal">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <div className="dc-basic-info-card__body">
                  <span className="dc-basic-info-card__label">Requirements</span>
                  <span className="dc-basic-info-card__value">{service.requirements}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ── Section 2: Service Type Details (only for services with type selection) ── */}
      {(service.id === 'request-certificates' || isIPComplaint || isAppealCustomsDecision || isCustomsOpinion) && (
        <div className="dc-form-section dc-basic-info-section">
          <div className="dc-basic-info-header">
            <h4 className="dc-form-section__heading" style={{margin:0}}>Service Type Details</h4>
          </div>
          <div className="dc-basic-info-cards">

            {/* Request Certificates */}
            {service.id === 'request-certificates' && <>
              {/* Row 1: Dropdown + Charges */}
              <div style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 'calc(50% - 6px)' }}>
                  <FloatDropdown label="Service Type" required value={certServiceType} onChange={setCertServiceType} options={CERT_SERVICE_TYPES.map(t => t.name)} />
                </div>
                {selectedCert && (
                  <div className="dc-basic-info-card" style={{ flex: 1, height: 56, alignItems: 'center' }}>
                    <div className="dc-basic-info-card__icon dc-basic-info-card__icon--green">
                      <img src={dirham} width="18" height="18" alt="AED" style={{ filter: 'brightness(0)' }} />
                    </div>
                    <div className="dc-basic-info-card__body">
                      <span className="dc-basic-info-card__label">Charges</span>
                      <span className="dc-basic-info-card__value dc-basic-info-card__value--charge">AED {selectedCert.fees}</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Row 2: Description + Requirements (equal height; description expands if no requirements) */}
              {selectedCert && (
                <div style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'stretch' }}>
                  <div className="dc-basic-info-card" style={{ flex: 1 }}>
                    <div className="dc-basic-info-card__icon dc-basic-info-card__icon--indigo">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    </div>
                    <div className="dc-basic-info-card__body">
                      <span className="dc-basic-info-card__label">Service Type Description</span>
                      <span className="dc-basic-info-card__value">{selectedCert.description}</span>
                    </div>
                  </div>
                  {selectedCert.requirements && (
                    <div className="dc-basic-info-card" style={{ flex: 1 }}>
                      <div className="dc-basic-info-card__icon dc-basic-info-card__icon--teal">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      </div>
                      <div className="dc-basic-info-card__body">
                        <span className="dc-basic-info-card__label">Requirements</span>
                        <span className="dc-basic-info-card__value">{selectedCert.requirements}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>}

            {/* IP Complaint */}
            {isIPComplaint && <>
              {/* Row 1: Dropdown + Charges */}
              <div style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 'calc(50% - 6px)' }}>
                  <FloatDropdown label="Service Type" required value={ipServiceType} onChange={setIpServiceType} options={Object.keys(IP_SERVICE_TYPES)} />
                </div>
                {selectedIPType && (
                  <div className="dc-basic-info-card" style={{ flex: 1, height: 56, alignItems: 'center' }}>
                    <div className="dc-basic-info-card__icon dc-basic-info-card__icon--green">
                      <img src={dirham} width="18" height="18" alt="AED" style={{ filter: 'brightness(0)' }} />
                    </div>
                    <div className="dc-basic-info-card__body">
                      <span className="dc-basic-info-card__label">Charges</span>
                      <span className="dc-basic-info-card__value dc-basic-info-card__value--charge">AED 2,000</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Row 2: Description + Requirements (equal height; description expands if no requirements) */}
              {selectedIPType && (
                <div style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'stretch' }}>
                  <div className="dc-basic-info-card" style={{ flex: 1 }}>
                    <div className="dc-basic-info-card__icon dc-basic-info-card__icon--indigo">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    </div>
                    <div className="dc-basic-info-card__body">
                      <span className="dc-basic-info-card__label">Service Type Description</span>
                      <span className="dc-basic-info-card__value">{selectedIPType.description}</span>
                    </div>
                  </div>
                  {selectedIPType.requirements && (
                    <div className="dc-basic-info-card" style={{ flex: 1 }}>
                      <div className="dc-basic-info-card__icon dc-basic-info-card__icon--teal">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      </div>
                      <div className="dc-basic-info-card__body">
                        <span className="dc-basic-info-card__label">Requirements</span>
                        <span className="dc-basic-info-card__value" style={{ whiteSpace: 'pre-line' }}>{selectedIPType.requirements}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>}

            {/* Appeal Customs Decision */}
            {isAppealCustomsDecision && <>
              {/* Row 1: Dropdown */}
              <div style={{ width: '100%', display: 'flex', gap: 12 }}>
                <div style={{ width: 'calc(50% - 6px)' }}>
                  <FloatDropdown label="Service Type" required value={appealServiceType} onChange={setAppealServiceType} options={Object.keys(APPEAL_SERVICE_TYPES)} />
                </div>
              </div>
              {/* Row 2: Description + Requirements (equal height; description expands if no requirements) */}
              {selectedAppealType && (
                <div style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'stretch' }}>
                  <div className="dc-basic-info-card" style={{ flex: 1 }}>
                    <div className="dc-basic-info-card__icon dc-basic-info-card__icon--indigo">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    </div>
                    <div className="dc-basic-info-card__body">
                      <span className="dc-basic-info-card__label">Service Type Description</span>
                      <span className="dc-basic-info-card__value" style={{ whiteSpace: 'pre-line' }}>{selectedAppealType.description}</span>
                    </div>
                  </div>
                  {selectedAppealType.requirements && (
                    <div className="dc-basic-info-card" style={{ flex: 1 }}>
                      <div className="dc-basic-info-card__icon dc-basic-info-card__icon--teal">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      </div>
                      <div className="dc-basic-info-card__body">
                        <span className="dc-basic-info-card__label">Requirements</span>
                        <span className="dc-basic-info-card__value" style={{ whiteSpace: 'pre-line' }}>{selectedAppealType.requirements}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>}

            {/* Customs Opinion */}
            {isCustomsOpinion && <>
              {/* Row 1: Dropdown */}
              <div style={{ width: '100%', display: 'flex', gap: 12 }}>
                <div style={{ width: 'calc(50% - 6px)' }}>
                  <FloatDropdown label="Service Type" required value={opinionServiceType} onChange={setOpinionServiceType} options={Object.keys(CUSTOMS_OPINION_SERVICE_TYPES)} />
                </div>
              </div>
              {/* Row 2: Description + Requirements (equal height; description expands if no requirements) */}
              {selectedOpinionType && (
                <div style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'stretch' }}>
                  <div className="dc-basic-info-card" style={{ flex: 1 }}>
                    <div className="dc-basic-info-card__icon dc-basic-info-card__icon--indigo">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    </div>
                    <div className="dc-basic-info-card__body">
                      <span className="dc-basic-info-card__label">Service Type Description</span>
                      <span className="dc-basic-info-card__value">{selectedOpinionType.description}</span>
                    </div>
                  </div>
                  {selectedOpinionType.requirements && (
                    <div className="dc-basic-info-card" style={{ flex: 1 }}>
                      <div className="dc-basic-info-card__icon dc-basic-info-card__icon--teal">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      </div>
                      <div className="dc-basic-info-card__body">
                        <span className="dc-basic-info-card__label">Requirements</span>
                        <span className="dc-basic-info-card__value">{selectedOpinionType.requirements}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>}

          </div>
        </div>
      )}

      {/* Business Information (Clearance Letter & VAT Registration Letter) */}
      {(isClearanceLetter || isVATLetter) && (
        <div className="dc-form-section">
          <h4 className="dc-form-section__heading">Business Information</h4>
          {isClearanceLetter && (
            <>
              <div className="dc-form-row">
                <div className="dc-float-wrapper dc-field--half">
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={businessCode} onChange={e => setBusinessCode(e.target.value)} />
                    <label className="dc-float-label">Business Code</label>
                  </div>
                </div>
                <div className="dc-float-wrapper dc-field--half">
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} />
                    <label className="dc-float-label">License Number <span className="dc-req">*</span></label>
                  </div>
                </div>
              </div>
              <div className="dc-form-row">
                <div style={{ flex: '0 0 calc(50% - 8px)', maxWidth: 'calc(50% - 8px)' }}>
                  <FloatDropdown
                    label="License Issuing Authority"
                    required
                    value={licenseAuthority}
                    onChange={setLicenseAuthority}
                    options={[
                      'Dubai Economy and Tourism (DET)',
                      'Dubai Silicon Oasis Authority (DSOA)',
                      'Dubai Multi Commodities Centre (DMCC)',
                      'Jebel Ali Free Zone Authority (JAFZA)',
                      'Dubai Airport Free Zone Authority (DAFZA)',
                      'Dubai International Financial Centre (DIFC)',
                      'Dubai South Free Zone',
                      'Hamriyah Free Zone Authority',
                      'Sharjah Economic Development Department',
                      'Abu Dhabi Department of Economic Development',
                    ]}
                  />
                </div>
              </div>
            </>
          )}
          {isVATLetter && (
            <div className="dc-form-row">
              <div className="dc-float-wrapper dc-field--half" style={{ maxWidth: 'calc(50% - 8px)' }}>
                <div className="dc-float-field">
                  <input className="dc-float-input" placeholder=" " value={businessCode} onChange={e => setBusinessCode(e.target.value)} />
                  <label className="dc-float-label">Business Code <span className="dc-req">*</span></label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Business Registration — Business Details / License Details / Business Contact Details */}
      {isBusinessRegistration && showRestOfForm && (
        <>
          <div className="dc-form-section dc-br-section" id="br-business">
            <h4 className="dc-form-section__heading">Business Details</h4>
            <div className="dc-form-row">
              <div className="dc-float-wrapper dc-field--half">
                <div className="dc-float-field">
                  <input className="dc-float-input" placeholder=" " value={brBusinessName} onChange={e => setBrBusinessName(e.target.value)} />
                  <label className="dc-float-label">Business Name <span className="dc-req">*</span></label>
                </div>
              </div>
              <div className="dc-float-wrapper dc-field--half">
                <div className="dc-float-field">
                  <input className="dc-float-input" placeholder=" " dir="rtl" value={brBusinessNameAr} onChange={e => setBrBusinessNameAr(e.target.value)} />
                  <label className="dc-float-label">Business Name (Arabic)</label>
                </div>
              </div>
            </div>
            <div className="dc-form-row">
              <FloatDropdown label="Registration Category" required value={brRegCategory} onChange={setBrRegCategory} className="dc-field--half"
                options={['GCC based Companies']} />
              <FloatDropdown label="No. of Employee" value={brEmployeeCount} onChange={setBrEmployeeCount} className="dc-field--half"
                options={['0 - 5', '6 - 10', '11 - 50', '51 - 100', '101 - 500', '500+']} />
            </div>
          </div>

          <div className="dc-form-section dc-br-section" id="br-license">
            <h4 className="dc-form-section__heading">License Details</h4>
            <div className="dc-form-row">
              <div className="dc-float-wrapper dc-field--half">
                <div className="dc-float-field">
                  <input className="dc-float-input" placeholder=" " value={brLicenseNumber} onChange={e => setBrLicenseNumber(e.target.value)} />
                  <label className="dc-float-label">License Number <span className="dc-req">*</span></label>
                </div>
              </div>
              <FloatDropdown label="License Type" required value={brLicenseType} onChange={setBrLicenseType} className="dc-field--half"
                options={['Commercial', 'Entalaaq', 'Freezone', 'Govt. Decree', 'Govt. Notification', 'Industrial', 'Professional', 'eTrader']} />
            </div>
            <div className="dc-form-row">
              <div className="dc-float-wrapper dc-field--half">
                <FloatDropdown
                  label="Issuing Authority"
                  required
                  value={brIssuingAuthority}
                  onChange={setBrIssuingAuthority}
                  disabled={!brRegCategory || !brLicenseType}
                  options={BR_ISSUING_AUTHORITIES}
                />
                {(!brRegCategory || !brLicenseType) && (
                  <InfoTooltip tip="Select Registration Category & License Type first" />
                )}
              </div>
              <DateField label="License Original Issue Date" required value={brLicenseIssueDate} onChange={setBrLicenseIssueDate} hint="Dates provided should match with the dates in the License" />
            </div>
            <div className="dc-form-row">
              <DateField label="License Valid From" required value={brLicenseValidFrom} onChange={setBrLicenseValidFrom} hint="Dates provided should match with the dates in the License" />
              <DateField label="License Valid To" required value={brLicenseValidTo} onChange={setBrLicenseValidTo} hint="Dates provided should match with the dates in the License" />
            </div>
          </div>

          <div className="dc-form-section dc-br-section" id="br-contact">
            <h4 className="dc-form-section__heading">Business Contact Details</h4>
            <div className="dc-form-row">
              <PhoneField label="Phone" required value={brPhone} onChange={setBrPhone} tooltip="Country-Area-Number i.e. 971-55-1234567" />
              <PhoneField label="Fax" required value={brFax} onChange={setBrFax} tooltip="Country-Area-Number i.e. 971-55-1234567" />
            </div>
            <div className="dc-form-row">
              <div className="dc-float-wrapper dc-field--half">
                <div className="dc-float-field">
                  <input className="dc-float-input" placeholder=" " value={brEmail} onChange={e => setBrEmail(e.target.value)} />
                  <label className="dc-float-label">Email <span className="dc-req">*</span></label>
                </div>
              </div>
              <div className="dc-float-wrapper dc-field--half">
                <div className="dc-float-field">
                  <input className="dc-float-input" placeholder=" " value={brOperationalEmail} onChange={e => setBrOperationalEmail(e.target.value)} />
                  <label className="dc-float-label">Operational Email <span className="dc-req">*</span></label>
                </div>
              </div>
            </div>
            <div className="dc-form-row">
              <div className="dc-float-wrapper dc-field--half">
                <div className="dc-float-field">
                  <input className="dc-float-input" placeholder=" " value={brWebsite} onChange={e => setBrWebsite(e.target.value)} />
                  <label className="dc-float-label">Website</label>
                </div>
                <InfoTooltip tip="Website URL i.e. company.com, www.company.com, http://company.com" />
              </div>
              <div className="dc-float-wrapper dc-field--half">
                <div className="dc-float-field">
                  <input className="dc-float-input" placeholder=" " value={brNocNumber} onChange={e => setBrNocNumber(e.target.value)} />
                  <label className="dc-float-label">NOC Number</label>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Contact Information */}
      {showRestOfForm && !isBusinessRegistration && (
      <div className="dc-form-section">
        <h4 className="dc-form-section__heading">Contact Information</h4>
        <div className="dc-form-row">
          <div className="dc-float-wrapper dc-field--half">
            <div className="dc-float-field">
              <input className="dc-float-input" placeholder=" " value={name} onChange={e => setName(e.target.value)} />
              <label className="dc-float-label">Name <span className="dc-req">*</span></label>
            </div>
          </div>
          <div className="dc-float-wrapper dc-field--half">
            <div className="dc-float-field">
              <input className="dc-float-input" placeholder=" " value={company} onChange={e => setCompany(e.target.value)} />
              <label className="dc-float-label">Company <span className="dc-req">*</span></label>
            </div>
          </div>
        </div>
        <div className="dc-form-row">
          <div className="dc-float-wrapper dc-field--half">
            <div className="dc-float-field">
              <input className="dc-float-input" placeholder=" " value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
              <label className="dc-float-label">Contact Person <span className="dc-req">*</span></label>
            </div>
          </div>
          <div className="dc-float-wrapper dc-field--half">
            <div className="dc-float-field">
              <input className="dc-float-input" placeholder=" " value={email} onChange={e => { setEmail(e.target.value); setEmailVerified(false); }} style={{ paddingRight: '100px' }} />
              <label className="dc-float-label">Email <span className="dc-req">*</span></label>
              {emailVerified ? (
                <span className="dc-verified-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Verified
                </span>
              ) : (
                <button className="dc-float-trail-btn" onClick={() => setShowVerifyModal(true)}>Verify</button>
              )}
            </div>
            <InfoTooltip tip="Contact person email ID" />
          </div>
        </div>
        <div className="dc-form-row">
          <div className="dc-float-wrapper dc-field--half">
            <div className="dc-float-field">
              <div className="dc-phone-float">
                <CountryDropdown selected={phoneCountry} onChange={setPhoneCountry} />
                <input className="dc-float-input dc-float-input--phone" placeholder=" " value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <label className="dc-float-label dc-float-label--phone">Phone</label>
            </div>
            <InfoTooltip tip="Numbers and hyphen only, e.g. 4-4177777" />
          </div>
          <div className="dc-float-wrapper dc-field--half">
            <div className="dc-float-field">
              <div className="dc-phone-float">
                <CountryDropdown selected={mobileCountry} onChange={setMobileCountry} />
                <input className="dc-float-input dc-float-input--phone" placeholder=" " value={mobile} onChange={e => setMobile(e.target.value)} />
              </div>
              <label className="dc-float-label dc-float-label--phone">Mobile</label>
            </div>
            <InfoTooltip tip="Contact person mobile number (numbers and hyphen)" />
          </div>
        </div>
      </div>
      )}

      {/* Request Information */}
      {showRestOfForm && !isBusinessRegistration && (
      <div className="dc-form-section">
        <h4 className="dc-form-section__heading">Request Information</h4>
        <div className="dc-form-row">
          <div className="dc-float-wrapper dc-field--half">
            <div className="dc-float-field">
              <input className="dc-float-input" placeholder=" " value={subject} onChange={e => setSubject(e.target.value)} />
              <label className="dc-float-label">Subject <span className="dc-req">*</span></label>
            </div>
          </div>
        </div>
        <div className="dc-float-field" style={{ width: '100%' }}>
          <textarea className="dc-float-input dc-float-textarea" placeholder=" " value={desc} onChange={e => setDesc(e.target.value)} rows={4} />
          <label className="dc-float-label">Description <span className="dc-req">*</span></label>
        </div>
      </div>
      )}

      {/* IP Complaint (Trade Mark) — Additional Information */}
      {isIPComplaint && ipServiceType === 'Trade Mark' && (
        <div className="dc-form-section dc-additional-info">
          <h4 className="dc-additional-info__heading">Additional Information</h4>
          <div className="dc-form-row" style={{ alignItems: 'flex-start' }}>
            <div className="dc-float-wrapper dc-field--half">
              <div className="dc-float-field">
                <input className="dc-float-input" placeholder=" " value={iprRefNo} onChange={e => setIprRefNo(e.target.value)} />
                <label className="dc-float-label">IPR Reference Number</label>
              </div>
              <InfoTooltip tip="A refundable deposit of AED 5000 will be charged if IPR Reference number is not provided." />
            </div>
            <div className="dc-field--half" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="dc-urgent-label">
                <input type="checkbox" checked={urgentRequest} onChange={e => setUrgentRequest(e.target.checked)} className="dc-urgent-checkbox" />
                <span>Urgent Request</span>
              </label>
              <InfoTooltip tip="An extra fee of AED 500 will be charged for urgent request and a fee of AED 1000 for complaint submitted on holidays." />
            </div>
          </div>
        </div>
      )}

      {/* Goods Classification — Additional Information */}
      {isGoodsClassification && (
        <div className="dc-form-section dc-additional-info">
          <h4 className="dc-additional-info__heading">Additional Information</h4>
          <div className="dc-form-row" style={{ marginTop: 12 }}>
            <div className="dc-field--half" style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: 'calc(50% - 8px)' }}>
              <div className="dc-float-wrapper" style={{ width: '100%' }}>
                <div className="dc-float-field">
                  <input className="dc-float-input" placeholder=" " type="number" min="1" max="5" value={hsCodesCount} onChange={e => setHsCodesCount(e.target.value)} />
                  <label className="dc-float-label">No. of HS Codes <span className="dc-req">*</span></label>
                </div>
              </div>
              <div className="dc-field-hint" style={{ marginTop: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5E6B7A" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
                <span>maximum of 5 HS Code classification can be requested at a time.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clearance Letter — Additional Information */}
      {isClearanceLetter && (
        <div className="dc-form-section dc-additional-info">
          <h4 className="dc-additional-info__heading">Additional Information</h4>
          <div className="dc-form-row" style={{ marginBottom: 12 }}>
            <FloatDropdown label="Contact Person's Role" required value={contactRole} onChange={setContactRole} className="dc-field--half"
              options={['Owner', 'Manager', 'Authorized Representative', 'PRO', 'Legal Representative']} />
            <FloatDropdown label="Purpose" required value={purpose} onChange={setPurpose} className="dc-field--half"
              options={[
                'Clearance Certificate - Termination',
                'Clearance Certificate - For company records',
                'Clearance Certificate - Change ownership',
                'Clearance Certificate - Add Partner',
                'Clearance Certificate - Business Code Cancellation',
              ]} />
          </div>
          <div className="dc-form-row" style={{ marginBottom: 12 }}>
            <FloatDropdown label="Reason" required value={reason} onChange={setReason} className="dc-field--half"
              options={['Bank Requirement', 'Government Requirement', 'Legal Requirement', 'Internal Records', 'Other']} />
            <div className="dc-float-wrapper dc-field--half">
              <div className="dc-float-field">
                <input className="dc-float-input" placeholder=" " value={remarks} onChange={e => setRemarks(e.target.value)} />
                <label className="dc-float-label">Remarks</label>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, margin: '8px 0 16px' }}>
            <input
              type="checkbox"
              id="zero-stock-declaration"
              checked={zeroStockDeclaration}
              onChange={e => setZeroStockDeclaration(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: '#1360D2', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
            />
            <label htmlFor="zero-stock-declaration" style={{ fontSize: 16, color: '#0E1B3D', cursor: 'pointer', userSelect: 'none', lineHeight: 1.5 }}>
              Zero Stock Declaration{' '}
              <span style={{ color: '#697498', fontWeight: 400 }}>
                (The entire stock must be cleared in case of: company termination or cancelling the business code.)
              </span>
            </label>
          </div>
          <div className="dc-additional-info__notes">
            <p className="dc-additional-info__notes-title">NOTES:-</p>
            <ul className="dc-additional-info__list">
              <li>
                <strong>Company Termination/Cancelling the Customs Business Code (only for Free-Zone company)</strong>
                <p>To apply NOC for "company termination/ Cancelling the Customs Business Code", the free zone company must not own/obtain any physical stock bought via the customs declarations. If the company own/obtain any stock, they should sell/move out all the existing stock via proper customs declaration before applying for NOC.</p>
                <p>You should also accept the "zero stock declaration" statement which will appear when you select the purpose as Company Termination/ Cancelling the Customs Business Code.</p>
              </li>
              <li>
                <strong>Adding partner/Changing company ownership/Company Record (only for Free-Zone company)</strong>
                <p>After the request submission the requester should expect to receive a Stock Declaration Template from Dubai Customs to provide details on the available stock. You can download the template from here to be aware of it</p>
                <button className="dc-additional-info__dl-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download Clearance Letter
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Attachments */}
      {showRestOfForm && !isBusinessRegistration && (
      <div className="dc-form-section">
        <h4 className="dc-form-section__heading">Attachments</h4>
        <div className="dc-attachments">
          <div className="dc-field-hint" style={{marginBottom: '12px', marginTop: 0}}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}><path d="M9.9974 13.3327V9.99935M9.9974 6.66602H10.0057M18.3307 9.99935C18.3307 14.6017 14.5998 18.3327 9.9974 18.3327C5.39502 18.3327 1.66406 14.6017 1.66406 9.99935C1.66406 5.39698 5.39502 1.66602 9.9974 1.66602C14.5998 1.66602 18.3307 5.39698 18.3307 9.99935Z" stroke="#5E6B7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Only .rtf .doc .docx .pdf .jpg .jpeg .gif .png .bmp .tiff is allowed, maximum 5MB per file</span>
          </div>
          <FileUploadRow />
        </div>
      </div>
      )}

      {/* CAPTCHA */}
      {showRestOfForm && (
      <div className="dc-form-section">
        {isBusinessRegistration && <h4 className="dc-form-section__heading">Validation Code</h4>}
        <CaptchaWidget value="" onChange={() => {}} />
      </div>
      )}

      {showRestOfForm && (
      <div className={`dc-form-actions${isBusinessRegistration ? ' dc-br-actions' : ''}`}>
        <button className="dc-btn dc-btn--outline" onClick={() => {
          setName(''); setCompany(''); setContactPerson(''); setEmail('');
          setPhone(''); setMobile(''); setDesc(''); setSubject('');
          if (isBusinessRegistration) {
            setBrBusinessName(''); setBrBusinessNameAr(''); setBrRegCategory(''); setBrEmployeeCount('');
            setBrLicenseNumber(''); setBrLicenseType(''); setBrIssuingAuthority('');
            setBrLicenseIssueDate(''); setBrLicenseValidFrom(''); setBrLicenseValidTo('');
            setBrPhone(''); setBrFax(''); setBrEmail(''); setBrOperationalEmail(''); setBrWebsite(''); setBrNocNumber('');
          }
        }}>Reset</button>
        {isBusinessRegistration ? (
          <button className="dc-btn dc-btn--blue" onClick={() => navigate({
            name: 'br-registration', serviceId: service.id,
            data: withBRSamples({
              businessName: brBusinessName, businessNameAr: brBusinessNameAr, regCategory: brRegCategory, employeeCount: brEmployeeCount,
              licenseNumber: brLicenseNumber, licenseType: brLicenseType, issuingAuthority: brIssuingAuthority,
              issueDate: brLicenseIssueDate, validFrom: brLicenseValidFrom, validTo: brLicenseValidTo,
              phone: brPhone, fax: brFax, email: brEmail, operationalEmail: brOperationalEmail, website: brWebsite, nocNumber: brNocNumber,
            }),
          })}>Save and Proceed</button>
        ) : (
          <button className="dc-btn dc-btn--blue" onClick={() => navigate({ name: 'success', serviceId: service.id })}>Submit</button>
        )}
      </div>
      )}
      {showVerifyModal && (
        <EmailVerifyModal
          email={email}
          onVerify={() => setEmailVerified(true)}
          onClose={() => setShowVerifyModal(false)}
        />
      )}
    </div>
  );

  if (!isBusinessRegistration) return formCard;

  // Business Registration: the whole journey up front (side or top stepper); later steps open after Save and Proceed.
  const brNavItems: BRNavItem[] = BR_FIRST_PAGE_IDS.map(id => ({
    id, label: BR_SECTION_LABELS[id], optional: id === 'groups' || id === 'vat',
    done: id === 'business' ? !!brBusinessName
      : id === 'license' ? !!(brLicenseNumber && brLicenseIssueDate && brLicenseValidFrom && brLicenseValidTo)
      : id === 'contact' ? !!(brPhone && brFax && brEmail && brOperationalEmail)
      : false,
  }));
  const brGoTo = (id: string) => {
    setBrActive(id);
    document.getElementById(`br-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <>
      <BRLayoutSwitch layout={brLayout} onChange={setBrLayout} />
      {brLayout === 'steps' && (
        <BRStepper steps={BR_FIRST_PAGE_STEPS} items={brNavItems} current={0} lockedAfter={0} onGo={() => brGoTo('business')} />
      )}
      <div className={brLayout === 'menu' ? `dc-br-layout${brRail ? ' dc-br-layout--rail' : ''}` : undefined}>
        {brLayout === 'menu' && (
          <BRSideNav items={brNavItems} active={brActive} onGo={brGoTo} rail={brRail} onToggleRail={toggleBrRail} lockedIds={BR_FIRST_PAGE_LOCKED} />
        )}
        {formCard}
      </div>
    </>
  );
}

// ─── AMEND / CANCEL TAB ───────────────────────────────────────────────────────
function AmendCancelForm({ service, tabName, navigate: _navigate }: {
  service: ServiceDef; tabName: 'amend' | 'cancel'; navigate: (page: Page) => void;
}) {
  const [reqNo, setReqNo] = useState('');
  const [email, setEmail] = useState('');
  const [comments, setComments] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);

  const SUBMITTED_REQ_NO = 'R02412-83605';
  const SUBMITTED_TICKET_NO = '2026060910000021';
  const SUBMITTED_DATE = '2026-06-09 00:54:56.0';

  if (submitted) {
    return (
      <div className="dc-form-card">
        <div className="dc-form-section dc-amend-confirm">
          {/* Green check icon */}
          <div className="dc-amend-confirm__icon">
            <svg width="55" height="55" viewBox="0 0 55 55" fill="none">
              <circle cx="27.5" cy="27.5" r="27.5" fill="#1AAC72"/>
              <polyline points="16,28 24,36 40,20" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Success message */}
          <p className="dc-amend-confirm__msg">
            Thank you for contacting us! We appreciate your taking the time to contact us. We will get back to you within 1 hour.
          </p>
          {/* Date/time */}
          <p className="dc-amend-confirm__date">Request Date &amp; Time {SUBMITTED_DATE}</p>
          <p className="dc-amend-confirm__print">Please print this page for future reference.</p>
          {/* 4-column result grid */}
          <div className="dc-amend-confirm__grid">
            <div className="dc-amend-confirm__col">
              <span className="dc-amend-confirm__label">Service Type Name</span>
              <span className="dc-amend-confirm__value">Record Trade Agency</span>
            </div>
            <div className="dc-amend-confirm__col">
              <span className="dc-amend-confirm__label">Request No.</span>
              <span className="dc-amend-confirm__value">{SUBMITTED_REQ_NO}</span>
            </div>
            <div className="dc-amend-confirm__col">
              <span className="dc-amend-confirm__label">Ticket Number</span>
              <span className="dc-amend-confirm__value">{SUBMITTED_TICKET_NO}</span>
            </div>
            <div className="dc-amend-confirm__col">
              <span className="dc-amend-confirm__label">Request Status</span>
              <span className="dc-amend-confirm__value">Payment Received</span>
            </div>
          </div>
        </div>
        <div className="dc-form-actions dc-form-actions--center dc-no-print" style={{ marginTop: 0 }}>
          <button className="dc-btn dc-btn--outline" onClick={() => setSubmitted(false)}>Back</button>
          <button className="dc-btn dc-btn--outline" onClick={() => window.print()}>Print</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dc-form-card">
      <div className="dc-form-section">
        <h4 className="dc-form-section__heading">Request Details</h4>
        <div className="dc-form-row">
          <div className="dc-float-wrapper dc-field--half">
            <div className="dc-float-field">
              <input className="dc-float-input" placeholder=" " value={reqNo} onChange={e => setReqNo(e.target.value)} />
              <label className="dc-float-label">Request No. <span className="dc-req">*</span></label>
            </div>
          </div>
          <div className="dc-float-wrapper dc-field--half">
            <div className="dc-float-field">
              <input className="dc-float-input" placeholder=" " value={email} onChange={e => setEmail(e.target.value)} />
              <label className="dc-float-label">Email <span className="dc-req">*</span></label>
            </div>
          </div>
        </div>
        <div className="dc-float-field" style={{ width: '100%' }}>
          <textarea className="dc-float-input dc-float-textarea" placeholder=" " value={comments} onChange={e => setComments(e.target.value)} rows={4} />
          <label className="dc-float-label">Comments <span className="dc-req">*</span></label>
        </div>
      </div>
      <div className="dc-form-section">
        <CaptchaWidget value={captcha} onChange={setCaptcha} />
      </div>
      <div className="dc-form-actions">
        <button className="dc-btn dc-btn--outline" onClick={() => { setReqNo(''); setEmail(''); setComments(''); setCaptcha(''); }}>Reset</button>
        <button className="dc-btn dc-btn--blue" onClick={() => setSubmitted(true)}>Submit</button>
      </div>
    </div>
  );
}

// ─── ENQUIRY TAB ──────────────────────────────────────────────────────────────
function EnquirySearchBar({ searchType, setSearchType, searchValue, setSearchValue }: {
  searchType: string; setSearchType: (v: string) => void;
  searchValue: string; setSearchValue: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const types = ['Request No.', 'Ticket No.'];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="dc-enq-search" ref={ref}>
      <div className={`dc-enq-search__bar${open ? ' dc-enq-search__bar--open' : ''}`}>
        <button type="button" className="dc-enq-search__type" onClick={() => setOpen(o => !o)}>
          <span>{searchType}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {open ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
          </svg>
        </button>
        <input
          className="dc-enq-search__input"
          placeholder={`Enter ${searchType}`}
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
        />
        <span className="dc-enq-search__icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7A8D" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </span>
      </div>
      {open && (
        <div className="dc-enq-search__menu">
          {types.map(t => (
            <div
              key={t}
              className={`dc-enq-search__option${searchType === t ? ' dc-enq-search__option--active' : ''}`}
              onClick={() => { setSearchType(t); setOpen(false); }}
            >{t}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function EnquiryForm({ service, navigate: _navigate }: { service: ServiceDef; navigate: (page: Page) => void }) {
  const [email, setEmail] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [searchType, setSearchType] = useState('Request No.');
  const [searchValue, setSearchValue] = useState('');
  const [showResults, setShowResults] = useState(false);

  const REF = searchValue || 'R00723-513232';
  const serviceFee = parseFloat(service.charges) || 0;
  const knowledgeFee = serviceFee >= 50 ? 20 : 0;
  const totalFee = serviceFee + knowledgeFee;

  if (showResults) {
    return (
      <>
        {/* Card 1: Status + Request Details */}
        <div className="dc-form-card dc-no-print">
          <div className="dc-form-section">
            <SuccessAlert refNo={REF} inProcess />
            <div className="dc-success-grid">
              <div className="dc-success-field">
                <span className="dc-success-field__label">Request Number</span>
                <span className="dc-success-field__value">{REF}</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Request Status</span>
                <span className="dc-badge dc-badge--draft">Under Process</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Service</span>
                <span className="dc-success-field__value">{service.serviceName}</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Service Type</span>
                <span className="dc-success-field__value">{service.serviceType}</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Name</span>
                <span className="dc-success-field__value">Testname</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Company</span>
                <span className="dc-success-field__value">Testcompany</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Contact Person</span>
                <span className="dc-success-field__value">Test</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Email</span>
                <span className="dc-success-field__value">{email || 'clasherschenmad@gmail.com'}</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Mobile</span>
                <span className="dc-success-field__value">00971-50-2298234</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Subject</span>
                <span className="dc-success-field__value">Test</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">No. of Units</span>
                <span className="dc-success-field__value">1</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Description</span>
                <span className="dc-success-field__value">Test</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Charges Summary */}
        <div className="dc-form-card dc-no-print">
          <div className="dc-form-section">
            <h4 className="dc-form-section__heading">Charges Summary</h4>
            <div className="dc-success-grid" style={{ marginBottom: 20 }}>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Payment Mode</span>
                <span className="dc-success-field__value">Credit Card</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Payment Status</span>
                <span className="dc-success-field__value">Success</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Receipt No.</span>
                <span className="dc-success-field__value">Z-12323</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Payment Reference No.</span>
                <span className="dc-success-field__value">5900080808</span>
              </div>
            </div>
            <hr className="dc-success-divider" style={{ margin: '0 0 20px' }} />
            <table className="dc-charges__table">
              <thead>
                <tr><th>Charge</th><th>Amount</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>{service.serviceName} Fee</td>
                  <td><DirhamIcon />{serviceFee.toFixed(1)}</td>
                </tr>
                {knowledgeFee > 0 && (
                  <tr>
                    <td>Knowledge-Innovation Dirhams</td>
                    <td><DirhamIcon />{knowledgeFee.toFixed(1)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total Amount</strong></td>
                  <td><DirhamIcon /><strong>{totalFee.toFixed(1)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Card 3: Transaction History */}
        <div className="dc-form-card dc-no-print">
          <div className="dc-result-txn-card">
            <div className="dc-result-txn-card__header">Transaction History</div>
            <div className="dc-result-txn-card__body">
              <div className="dc-success-grid">
                <div className="dc-success-field">
                  <span className="dc-success-field__label">Initiated By</span>
                  <span className="dc-success-field__value">test</span>
                </div>
                <div className="dc-success-field">
                  <span className="dc-success-field__label">Request No.</span>
                  <span className="dc-success-field__value">R02015-83581</span>
                </div>
                <div className="dc-success-field">
                  <span className="dc-success-field__label">Amount</span>
                  <span className="dc-success-field__value">{totalFee.toFixed(2)}</span>
                </div>
                <div className="dc-success-field">
                  <span className="dc-success-field__label">Transaction Status</span>
                  <span className="dc-success-field__value">Success</span>
                </div>
                <div className="dc-success-field">
                  <span className="dc-success-field__label">DEG Transaction No</span>
                  <span className="dc-success-field__value">590000237140228</span>
                </div>
                <div className="dc-success-field">
                  <span className="dc-success-field__label">Transaction Date</span>
                  <span className="dc-success-field__value">Fri May 15 00:00:00 GST 2026</span>
                </div>
                <div className="dc-success-field">
                  <span className="dc-success-field__label">Payment Status</span>
                  <span className="dc-success-field__value">Success</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dc-form-actions dc-form-actions--center dc-no-print" style={{ marginTop: 8 }}>
          <button className="dc-btn dc-btn--outline" onClick={() => setShowResults(false)}>Back</button>
          <button className="dc-btn dc-btn--outline" onClick={() => window.print()}>Print</button>
        </div>

        {/* Print-only section */}
        <div className="dc-print-only">
          <div className="dc-print-block">
            <div className="dc-print-inprocess-banner">Request is under process.</div>
            <div className="dc-success-grid">
              <div className="dc-success-field">
                <span className="dc-success-field__label">Request Number</span>
                <span className="dc-success-field__value">{REF}</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Request Status</span>
                <span className="dc-success-field__value">Under Process</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Ticket Number</span>
                <span className="dc-success-field__value">2026060910000021</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Service</span>
                <span className="dc-success-field__value">{service.serviceName}</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Service Type</span>
                <span className="dc-success-field__value">{service.serviceType}</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Name</span>
                <span className="dc-success-field__value">Testname</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Company</span>
                <span className="dc-success-field__value">Testcompany</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Contact Person</span>
                <span className="dc-success-field__value">Test</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Email</span>
                <span className="dc-success-field__value">{email || 'clasherschenmad@gmail.com'}</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Mobile</span>
                <span className="dc-success-field__value">00971-50-2298234</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Subject</span>
                <span className="dc-success-field__value">Test</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">No. of Units</span>
                <span className="dc-success-field__value">1</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Description</span>
                <span className="dc-success-field__value">Test</span>
              </div>
            </div>
          </div>
          <div className="dc-print-block" style={{ marginTop: 24 }}>
            <h4 className="dc-print-charges-title">Charges Summary</h4>
            <div className="dc-success-grid" style={{ margin: '12px 0 16px' }}>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Payment Mode</span>
                <span className="dc-success-field__value">Credit Card</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Payment Status</span>
                <span className="dc-success-field__value">Success</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Receipt No.</span>
                <span className="dc-success-field__value">Z-12323</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Payment Reference No.</span>
                <span className="dc-success-field__value">5900080808</span>
              </div>
            </div>
            <table className="dc-print-charges-table">
              <thead><tr><th>Charge</th><th>Amount</th></tr></thead>
              <tbody>
                <tr><td>{service.serviceName} Fee</td><td>Ð {serviceFee.toFixed(1)}</td></tr>
                {knowledgeFee > 0 && <tr><td>Knowledge-Innovation Dirhams</td><td>Ð {knowledgeFee.toFixed(1)}</td></tr>}
              </tbody>
              <tfoot><tr><td><strong>Total Amount</strong></td><td><strong>Ð {totalFee.toFixed(1)}</strong></td></tr></tfoot>
            </table>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="dc-form-card">
      <div className="dc-form-section">
        <h4 className="dc-form-section__heading">Enquiry Details</h4>
        <div className="dc-form-row">
          <EnquirySearchBar searchType={searchType} setSearchType={setSearchType} searchValue={searchValue} setSearchValue={setSearchValue} />
          <div className="dc-float-wrapper">
            <div className="dc-float-field">
              <input className="dc-float-input" placeholder=" " value={email} onChange={e => setEmail(e.target.value)} />
              <label className="dc-float-label">Email <span className="dc-req">*</span></label>
            </div>
          </div>
        </div>
      </div>
      <div className="dc-form-section">
        <CaptchaWidget value={captcha} onChange={setCaptcha} />
      </div>
      <div className="dc-form-actions">
        <button className="dc-btn dc-btn--outline" onClick={() => { setSearchValue(''); setEmail(''); setCaptcha(''); setShowResults(false); }}>Reset</button>
        <button className="dc-btn dc-btn--primary" onClick={() => setShowResults(true)}>Show</button>
      </div>
    </div>
  );
}

// ─── TRACK STATUS FORM ────────────────────────────────────────────────────────
const TRACK_SERVICE_TYPES: Record<string, { description: string; reqLabel: string; validationLabel: string }> = {
  'Declaration': {
    description: 'This service allows you to track the status of your customs declaration request.',
    reqLabel: 'Declaration Request Number',
    validationLabel: 'Trade License Number',
  },
  'Inspection': {
    description: 'This service allows you to track the status of your customs inspection request.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Claim & Refunds': {
    description: 'This service allows you to track the status of your claim and refund request with Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Business Registration': {
    description: 'This service enables clients to perform an online lookup of their request to register their business with Customs to allow them officially and legally transact with Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Reconciliation': {
    description: 'This service allows you to track the status of your reconciliation request with Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Request Goods Classification': {
    description: 'This service allows you to track the status of your goods classification request with Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Letters & Certificates': {
    description: 'This service allows you to track the status of your letters and certificates request with Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Pay Miscellaneous Charges': {
    description: 'This service allows you to track the status of your miscellaneous charges payment request.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Transactions Report': {
    description: 'This service allows you to track the status of your transactions report request with Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Customs Opinion': {
    description: 'This service allows you to track the status of a previously submitted customs opinion request.',
    reqLabel: 'Request Number',
    validationLabel: 'Customs File Number',
  },
  'Customs Broker Guarantee Refund': {
    description: 'This service allows you to track the status of your customs broker guarantee refund request.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Record Trademark': {
    description: 'This service allows Trademark Owners to track the status of their registered trademark and copyright recording requests.',
    reqLabel: 'Request Number',
    validationLabel: 'Trademark Registration Number',
  },
  'Trade Agency Registration': {
    description: 'This service allows clients to track the status of their trade agency registration request with Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Vendors Registration': {
    description: 'This service allows you to track the status of your vendors registration request with Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Appeal': {
    description: 'This service allows you to track the status of your appeal request with Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Client Accreditation': {
    description: 'This service allows you to track the status of your client accreditation request with Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Compliments & Enquiries': {
    description: 'This service allows you to track the status of your compliments and enquiries submitted to Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Awareness & Training': {
    description: 'This service allows you to track the status of your awareness and training request with Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Customs Case': {
    description: 'This service allows you to track the status of your customs case with Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Access Smart Reports': {
    description: 'This service allows you to track the status of your access smart reports request with Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Request Payment by Installments': {
    description: 'This service allows you to track the status of your request for payment by installments with Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Request Fines Reduction': {
    description: 'This service allows you to track the status of your fines reduction request with Dubai Customs.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
  'Request Dubai Foreign Trade Statistics Report': {
    description: 'This service allows you to track the status of your Dubai Foreign Trade Statistics Report request.',
    reqLabel: 'Request Number',
    validationLabel: 'Trade License Number',
  },
};

function TrackStatusForm({ service, navigate }: { service: ServiceDef; navigate: (page: Page) => void }) {
  const [serviceType, setServiceType] = useState('');
  const [reqNo, setReqNo] = useState('');
  const [validationCode, setValidationCode] = useState('');
  const [captcha, setCaptcha] = useState('');

  const selectedTrackType = serviceType ? TRACK_SERVICE_TYPES[serviceType] : null;

  return (
    <>
      <HeroBanner title={service.title} subtitle={service.subtitle} />
      <div className="dc-container">
        <Breadcrumb items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          { label: 'Service Center', onClick: () => navigate({ name: 'home' }) },
          { label: 'Dubai Trade', onClick: () => navigate({ name: 'home' }) },
          { label: service.title },
        ]} />
        <div className="dc-info-header">
          <button className="dc-back-btn" onClick={() => navigate({ name: 'home' })}><ArrowLeft /></button>
          <h2 className="dc-info-header__title">{service.title}</h2>
        </div>
        <div className="dc-form-card">
          <div className="dc-form-section dc-basic-info-section">
            <div className="dc-basic-info-header">
              <h4 className="dc-form-section__heading" style={{ margin: 0 }}>Service Type Details</h4>
            </div>
            <div className="dc-basic-info-cards">
              <div style={{ width: 'calc(50% - 6px)' }}>
                <FloatDropdown
                  label="Service Type"
                  required
                  value={serviceType}
                  onChange={setServiceType}
                  options={Object.keys(TRACK_SERVICE_TYPES)}
                />
              </div>
              {selectedTrackType && (
                <div className="dc-basic-info-card dc-basic-info-card--full">
                  <div className="dc-basic-info-card__icon dc-basic-info-card__icon--indigo">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <div className="dc-basic-info-card__body">
                    <span className="dc-basic-info-card__label">Service Description</span>
                    <span className="dc-basic-info-card__value">{selectedTrackType.description}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedTrackType && (
            <div className="dc-form-section">
              <div className="dc-form-row">
                <div className="dc-float-wrapper dc-field--half">
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={reqNo} onChange={e => setReqNo(e.target.value)} />
                    <label className="dc-float-label">{selectedTrackType.reqLabel} <span className="dc-req">*</span></label>
                  </div>
                </div>
                <div className="dc-float-wrapper dc-field--half">
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={validationCode} onChange={e => setValidationCode(e.target.value)} />
                    <label className="dc-float-label">{selectedTrackType.validationLabel} <span className="dc-req">*</span></label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="dc-form-section">
            <CaptchaWidget value={captcha} onChange={setCaptcha} />
          </div>
          <div className="dc-form-actions dc-form-actions--center">
            <button className="dc-btn dc-btn--primary" onClick={() => navigate({ name: 'success', serviceId: service.id })}>
              <InquiryIcon /> Inquiry
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── PAY BILLS FORM ───────────────────────────────────────────────────────────
function PayBillsForm({ service, navigate }: { service: ServiceDef; navigate: (page: Page) => void }) {
  const [activeTab, setActiveTab] = useState<'bills' | 'topup' | 'miscellaneous' | 'installments' | 'enquiry'>('bills');

  // Bills state
  const [invoiceType, setInvoiceType] = useState('');
  const [location, setLocation] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [amount, setAmount] = useState('');
  const [billCaptcha, setBillCaptcha] = useState('');
  const [billEmail, setBillEmail] = useState('');
  const [billMobile, setBillMobile] = useState('');
  const [billSearchDone, setBillSearchDone] = useState(false);
  const [billPayStep, setBillPayStep] = useState<'form' | 'payment'>('form');
  const [showBillPayConfirm, setShowBillPayConfirm] = useState(false);
  const [showBillTxnModal, setShowBillTxnModal] = useState(false);

  // Top Up state
  const [topupSubTab, setTopupSubTab] = useState<'topup' | 'enquiry'>('topup');
  const [topupBusinessCode, setTopupBusinessCode] = useState('');
  const [topupAccountType, setTopupAccountType] = useState('');
  const [topupAccountNumber, setTopupAccountNumber] = useState('');
  const [topupEmail, setTopupEmail] = useState('');
  const [topupCaptcha, setTopupCaptcha] = useState('');
  const [topupSearchDone, setTopupSearchDone] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [showTopupTxnModal, setShowTopupTxnModal] = useState(false);
  const [showTopupConfirm, setShowTopupConfirm] = useState(false);
  // Enquiry (sub-tab) state
  const [enqBusinessCode, setEnqBusinessCode] = useState('');
  const [enqAccountType, setEnqAccountType] = useState('');
  const [enqAccountNumber, setEnqAccountNumber] = useState('');
  const [enqTxnNo, setEnqTxnNo] = useState('');
  const [enqCaptcha2, setEnqCaptcha2] = useState('');
  const [enqSearchDone, setEnqSearchDone] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Miscellaneous state
  const [miscServiceType, setMiscServiceType] = useState('');
  const [miscUnits, setMiscUnits] = useState('');
  const [miscBusinessCode, setMiscBusinessCode] = useState('');
  const [miscNumCerts, setMiscNumCerts] = useState('');
  const [miscDeclNumber, setMiscDeclNumber] = useState('');
  const [miscDeclFocused, setMiscDeclFocused] = useState(false);
  const [miscCompany, setMiscCompany] = useState('');
  const [miscName, setMiscName] = useState('');
  const [miscContact, setMiscContact] = useState('');
  const [miscEmail, setMiscEmail] = useState('');
  const [miscEmailVerified, setMiscEmailVerified] = useState(false);
  const [miscShowVerify, setMiscShowVerify] = useState(false);
  const [miscPhone, setMiscPhone] = useState('');
  const [miscMobile, setMiscMobile] = useState('');
  const [miscFax, setMiscFax] = useState('');
  const [miscSubject, setMiscSubject] = useState('');
  const [miscDesc, setMiscDesc] = useState('');
  const [miscCaptcha, setMiscCaptcha] = useState('');

  // Instalments state
  const [instBusinessCode, setInstBusinessCode] = useState('');
  const [instName, setInstName] = useState('');
  const [instCompany, setInstCompany] = useState('');
  const [instContact, setInstContact] = useState('');
  const [instEmail, setInstEmail] = useState('');
  const [instEmailVerified, setInstEmailVerified] = useState(false);
  const [instShowVerify, setInstShowVerify] = useState(false);
  const [instPhone, setInstPhone] = useState('');
  const [instMobile, setInstMobile] = useState('');
  const [instFax, setInstFax] = useState('');
  const [instSubject, setInstSubject] = useState('');
  const [instDesc, setInstDesc] = useState('');
  const [instCaptcha, setInstCaptcha] = useState('');

  // Enquiry state
  const [enqRequestNo, setEnqRequestNo] = useState('');
  const [enqTicketNo, setEnqTicketNo] = useState('');
  const [enqEmail, setEnqEmail] = useState('');
  const [enqCaptcha, setEnqCaptcha] = useState('');

  const MISC_SERVICE_TYPES: Record<string, { description: string; requirements: string; charges: string }> = {
    'Kimberly Certificate Process Charge': { description: 'This is Dubai Customs Service Charge for issuing Kimberly Certificate.', requirements: 'Please enter declaration number(s) and Kimberly certificate number(s) in Description.', charges: '' },
    'Customs Declaration': { description: 'This form is used for printing the cleared declaration (One box contains 1500 declaration forms)', requirements: '', charges: '300' },
    'Import Authority for Restricted Goods': { description: 'Authority issued by Dubai Customs to allow the import of restricted or controlled goods.', requirements: '', charges: '' },
    'Application for Cargo Clearance under a Standing Guarantee': { description: 'Application to clear cargo from customs under an existing standing guarantee arrangement.', requirements: '', charges: '' },
    'Inter-Port Transfer Authority': { description: 'This form is used for authorised transfer of goods between the ports (10 Pads)', requirements: '', charges: '200' },
    'Customs Exit/ Entry Certificate': { description: 'Certificate issued by Dubai Customs confirming the exit or entry of goods through customs.', requirements: '', charges: '' },
    'Customs Exit/ Entry Certificate (Ships Spares)': { description: 'Certificate for the exit or entry of ship spare parts through Dubai Customs.', requirements: '', charges: '' },
    'Application for Customs Duty Exemption for Medicine': { description: 'Application to obtain customs duty exemption on imported medicines and medical supplies.', requirements: '', charges: '' },
    'Debit Slip': { description: 'Official debit slip issued by Dubai Customs for outstanding dues or charges.', requirements: '', charges: '' },
    'Application to Transfer Goods to Customs Bonded Storage': { description: 'Application to transfer goods to a customs bonded warehouse for temporary storage.', requirements: '', charges: '' },
    'Delivery Order': { description: 'Official order issued by Dubai Customs authorising the release and delivery of goods.', requirements: '', charges: '' },
    'Declaration of Export': { description: 'Official declaration for goods being exported through Dubai Customs.', requirements: '', charges: '' },
    'Customs Gate Pass for Airport Free Zone/Cargo Village': { description: 'Gate pass issued by Dubai Customs for movement of goods within Airport Free Zone or Cargo Village.', requirements: '', charges: '' },
    'List of Auction Goods': { description: 'Official list of goods approved by Dubai Customs for auction.', requirements: '', charges: '' },
    'DUCAMZ Delivery Advice & Valuation/Specification Report on Vehicle': { description: 'Delivery advice and valuation or specification report for vehicles processed through DUCAMZ.', requirements: '', charges: '' },
    'H.S Code Book': { description: 'Purchase of the Harmonised System (HS) Code Book from Dubai Customs.', requirements: '', charges: '' },
    'E payment Declaration Cancellation Charges': { description: 'Charges applied for the cancellation of an e-payment declaration.', requirements: '', charges: '' },
    'Wrong Declaration of H.S Code': { description: 'Fine or charge issued for incorrect declaration of the Harmonised System (HS) Code.', requirements: '', charges: '' },
    'Wrong Declaration of Origin': { description: 'Fine or charge issued for incorrect declaration of the country of origin of goods.', requirements: '', charges: '' },
    'CDM Fine / Penalty': { description: 'Fine or penalty issued under the Customs Disputes and Mediation (CDM) process.', requirements: '', charges: '' },
    'E payment Declaration Cancellation Fine': { description: 'Fine issued for the cancellation of a customs declaration made via e-payment.', requirements: '', charges: '' },
  };
  const selectedMiscType = miscServiceType ? MISC_SERVICE_TYPES[miscServiceType] : null;

  const tabs = [
    { id: 'bills', label: 'Bills' },
    { id: 'topup', label: 'Top Up' },
    { id: 'miscellaneous', label: 'Miscellaneous' },
    { id: 'installments', label: 'Installments' },
  ] as const;

  return (
    <>
      <HeroBanner title={service.title} subtitle={service.subtitle} />
      <div className="dc-container">
        <Breadcrumb items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          { label: 'Service Center', onClick: () => navigate({ name: 'home' }) },
          { label: 'Dubai Trade', onClick: () => navigate({ name: 'home' }) },
          { label: service.title },
        ]} />
        <div className="dc-info-header">
          <button className="dc-back-btn" onClick={() => navigate({ name: 'home' })}><ArrowLeft /></button>
          <h2 className="dc-info-header__title">{service.title}</h2>
        </div>
        <div className="dc-form-tabs">
          {tabs.map(tab => (
            <button key={tab.id} className={`dc-form-tab ${activeTab === tab.id ? 'dc-form-tab--active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── BILLS ── */}
        {activeTab === 'bills' && (() => {
          const INVOICE_TYPES = [
            'Auction Receivable',
            'Berthing/loading fee statement',
            'Case Management Demand Notice',
            'CRN SEA Discrepancy Export Manifest Fine Invoice',
            'CRN SEA Export Late manifest Fine Invoice',
            'CRN SEA Export Manifest Service Charges Invoice',
            'CRN SEA Import Manifest Discrepancy Fine Invoice',
            'DA Deposit Forfeiture Demand Notice',
            'Declaration - Short Collection Demand Notice',
            'Departure Permit Invoice',
            'Deposit Claim Receivable - Cash',
            'Deposit Claim Receivable - DA',
            'Deposit Claim Receivable - SG',
            'Deposit Forfeiture Demand Notice',
            'Deposit Receivable Invoice (DIPS)',
            'Document Submission Invoice',
            'Duty Claim Receivable - Cash',
            'Freezone NR Claim Registration Charges Invoice',
            'General Charge Invoice',
            'Inspection - Demand Notice',
            'NR Claim Receivable',
            'NR Forfeiture Demand Notice',
            'NR Receivable Invoice (FZ Exit Entry)',
            'SAS Invoice',
            'SG Deposit Forfeiture Demand Notice',
            'Standing Guarantee Demand Notice',
            'Standing Guarantee Duty/Fine Invoice',
            'Standing Guarantee Service Charge Invoice',
            'Vessel Registration Invoice',
            'Violation Seizure Report',
          ];
          const LOCATIONS = [
            'Dubai Humanitarian', 'World Trade Centre', 'FOR MIGRATN(HP-LH-C)', 'Client Partnership',
            'DUBAI LOGISTICS CITY', 'AL MAKTOUM CARGO', 'AL MAKTOUM PASSENGER', 'COASTAL BERTH OFFICE',
            'CREEK MARINA OFFICE', 'DUBAI CARGO VILLAGE', 'Aviation District', 'DUCAMZ',
            'COASTAL CUSTOMS', 'DUBAI AIRPORT', 'Dubai Design Dist D3', 'DryDocks World Dubai',
            'DUBAI HARBOUR PAX TE', 'Deira Post Office', 'TERMINAL 2', 'Expo City Dubai',
            'EXPO-2020', 'AIRPORT FREE ZONE',
          ];
          const isDIPS = invoiceType === 'Deposit Receivable Invoice (DIPS)';
          const locationPrefix = isDIPS && location ? (LOCATIONS.indexOf(location) + 1) : null;

          /* ── Payment step ── */
          if (billPayStep === 'payment') {
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* ── Invoice Details card ── */}
                <div className="dc-form-card">
                  <div className="dc-form-section">
                    <h4 className="dc-form-section__heading">Bill Payment</h4>

                    {/* Clean single-record detail layout */}
                    <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                      <table className="dc-charges__table" style={{ borderRadius: 8, overflow: 'hidden' }}>
                        <thead>
                          <tr>
                            <th>Payment Type</th>
                            <th>Invoice No.</th>
                            <th>Invoice Amount</th>
                            <th>Settled Amount</th>
                            <th style={{ textAlign: 'left' }}>Amount to Pay (AED) <span style={{ color: '#dc3545' }}>*</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Case Management Demand Notice</td>
                            <td>70003167</td>
                            <td><DirhamIcon />143,020.00</td>
                            <td><DirhamIcon />3,020.00</td>
                            <td style={{ textAlign: 'left' }}>
                              <div className="dc-float-wrapper" style={{ maxWidth: 180 }}>
                                <div className="dc-float-field">
                                  <input className="dc-float-input" placeholder=" " defaultValue="140000.00" type="number" min="0" />
                                  <label className="dc-float-label">Amount</label>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* ── Payment Method card ── */}
                <div className="dc-form-card">
                  <div className="dc-form-section">
                    <h4 className="dc-form-section__heading">Payment Details</h4>
                    <p style={{ fontSize: 16, color: '#888', marginBottom: 16 }}>Note* Card payment has maximum limit of AED 1,000,000.00</p>
                    <div className="dc-payment-summary" style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
                      <div style={{ borderLeft: '1px solid #e0e4ed', paddingLeft: 16, paddingRight: 40 }}>
                        <p style={{ fontSize: 16, color: '#7a8a99', marginBottom: 4 }}>Total Selected Transactions</p>
                        <p style={{ fontSize: 16, fontWeight: 600, color: '#1a2533' }}>1</p>
                      </div>
                      <div style={{ borderLeft: '1px solid #e0e4ed', paddingLeft: 16, paddingRight: 40 }}>
                        <p style={{ fontSize: 16, color: '#7a8a99', marginBottom: 4 }}>Total Amount</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#1360D2' }}>AED 140,000.00</p>
                      </div>
                      <div style={{ borderLeft: '1px solid #e0e4ed', paddingLeft: 16, paddingRight: 16 }}>
                        <p style={{ fontSize: 16, color: '#7a8a99', marginBottom: 4 }}>Payment Mode</p>
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#1360D2', background: '#e8f0fe', borderRadius: 5, padding: '5px 14px', display: 'inline-block' }}>E-Payment</span>
                      </div>
                    </div>
                  </div>
                  <div className="dc-form-actions">
                    <button className="dc-btn dc-btn--outline" onClick={() => setBillPayStep('form')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                      Previous
                    </button>
                    <button className="dc-btn dc-btn--blue" onClick={() => setShowBillPayConfirm(true)}>Complete Payment</button>
                  </div>
                </div>
                {showBillPayConfirm && (
                  <div className="dc-modal-overlay" onClick={() => setShowBillPayConfirm(false)}>
                    <div className="dc-modal dc-confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, textAlign: 'center', padding: '40px 36px 36px', gap: 0 }}>
                      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
                        <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
                          <circle cx="35" cy="35" r="33" stroke="#1360D2" strokeWidth="3" fill="none"/>
                          <circle cx="35" cy="23" r="3.5" fill="#1360D2"/>
                          <rect x="31.5" y="31" width="7" height="20" rx="3.5" fill="#1360D2"/>
                        </svg>
                      </div>
                      <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0E1B3D', margin: '0 0 16px' }}>Bill Payment Confirmation</h3>
                      <p style={{ fontSize: 16, color: '#3D4E63', lineHeight: 1.65, margin: '0 0 32px' }}>
                        By clicking the confirm button, you are authorizing us to redirect your request for payment of 1 transaction(s) of total <strong style={{ color: '#0E1B3D' }}>AED 140,000</strong> through Dubai E-Government payment site.
                      </p>
                      <div className="dc-confirm-actions" style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
                        <button onClick={() => setShowBillPayConfirm(false)} style={{ height: 48, padding: '0 28px', borderRadius: 4, border: '1.5px solid #1360D2', background: '#fff', color: '#1360D2', fontSize: 16, fontWeight: 500, cursor: 'pointer', minWidth: 140, boxShadow: '0 0 8px rgba(28,72,191,0.16)', fontFamily: 'inherit' }}>Cancel</button>
                        <button onClick={() => { setShowBillPayConfirm(false); setShowBillTxnModal(true); }} style={{ height: 48, padding: '0 28px', borderRadius: 4, border: 'none', background: '#1360D2', color: '#fff', fontSize: 16, fontWeight: 500, cursor: 'pointer', minWidth: 140, boxShadow: '0 0 8px rgba(28,72,191,0.16)', fontFamily: 'inherit' }}>Confirm</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Payment Transaction Details Modal (after confirm) ── */}
                {showBillTxnModal && (
                  <div className="dc-modal-overlay">
                    <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', width: '95vw', maxWidth: 1150, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

                      {/* ── Header — Figma dark navy #0E1B3D ── */}
                      <div style={{ background: '#0e1b3d', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 18, fontWeight: 600, color: '#f8fafd', letterSpacing: '0.01em' }}>Payment Transaction Details</span>
                        <button onClick={() => setShowBillTxnModal(false)}
                          style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700, transition: 'background 0.15s' }}>
                          ✕
                        </button>
                      </div>

                      {/* ── Body ── */}
                      <div style={{ padding: '24px 24px 8px' }}>
                        <div style={{ border: '1px solid #E8EDF2', borderRadius: 8, marginBottom: 24 }}>
                          {([
                            [
                              ['Transaction No.', '12984'],
                              ['Transaction Date', '19-05-2026'],
                              ['DEG Transaction No.', '000219502133-D'],
                              ['DEG Transaction Date', '19-05-2026 12:29:06'],
                              ['EPayment Transaction No', '20021630'],
                            ],
                            [
                              ['Initiated Date', '19-05-2026 12:29:00'],
                              ['Initiated By', 'BPS_OPENSERVICE'],
                              ['Payment Mode', 'Credit Card'],
                              ['Status', null],
                            ],
                            [
                              ['Message', null],
                            ],
                          ] as [string, string | null][][][]).map((rowItems, rowIdx, allRows) => (
                            <Fragment key={rowIdx}>
                              <div style={{ display: 'grid', gridTemplateColumns: rowItems.length === 1 ? '1fr' : 'repeat(5, 1fr)', gap: 0 }}>
                                {rowItems.map(([label, value]) => {
                                  const isStatus = label === 'Status';
                                  const isMessage = label === 'Message';
                                  return (
                                    <div key={label as string} style={{ padding: '14px 16px' }}>
                                      <p style={{ fontSize: 16, color: '#697498', marginBottom: 4 }}>{label}</p>
                                      {isStatus
                                        ? <span className="dc-status-badge dc-status-badge--danger">Failed</span>
                                        : isMessage
                                        ? <>
                                            <p style={{ fontSize: 16, color: '#1360d2', marginBottom: 4 }}>Payment Status Remarks: CANCELLED : DubaiPay - Transaction Cancelled</p>
                                            <p style={{ fontSize: 16, color: '#dc3545', fontWeight: 600 }}>Collection Status Remarks : DEG - CANCELLED : DubaiPay - Transaction Cancelled</p>
                                          </>
                                        : <p style={{ fontSize: 16, fontWeight: 600, color: '#0e1b3d' }}>{value}</p>
                                      }
                                    </div>
                                  );
                                })}
                              </div>
                              {rowIdx < allRows.length - 1 && (
                                <div style={{ borderBottom: '1px solid #F0F4FA', margin: '0 16px' }} />
                              )}
                            </Fragment>
                          ))}
                        </div>

                        <p style={{ fontWeight: 700, color: '#0E1B3D', marginBottom: 12, fontSize: 16 }}>Payment Details</p>
                        <table className="dc-charges__table" style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
                          <thead>
                            <tr>
                              <th>Payment Type</th>
                              <th>Invoice / Account No.</th>
                              <th>Amount</th>
                              <th>Receipt No.</th>
                              <th>Remarks</th>
                              <th style={{ textAlign: 'left' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Case Management Demand Notice</td>
                              <td>70003167</td>
                              <td><DirhamIcon />140,000.00</td>
                              <td></td>
                              <td></td>
                              <td style={{ textAlign: 'left' }}><span className="dc-status-badge dc-status-badge--danger">Failed</span></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Footer */}
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 24px 24px' }}>
                        <button onClick={() => setShowBillTxnModal(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0e1b3d', color: '#f8fafd', border: 'none', borderRadius: 4, padding: '11px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.02em' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          /* ── Search / Results step ── */
          return (
            <>
            <div className="dc-form-card">
              <div className="dc-form-section">
                <h4 className="dc-form-section__heading">Pay Invoice</h4>
                <div className="dc-form-row">
                  <FloatDropdown label="Invoice Type" required value={invoiceType}
                    onChange={v => { setInvoiceType(v); setLocation(''); setInvoiceNo(''); setBillSearchDone(false); }}
                    className="dc-field--half"
                    options={INVOICE_TYPES} />
                  <FloatDropdown label="Location" required value={location}
                    onChange={v => { setLocation(v); setInvoiceNo(''); setBillSearchDone(false); }}
                    className="dc-field--half"
                    disabled={!isDIPS}
                    options={LOCATIONS} />
                </div>
                <div className="dc-form-row">
                  <div className="dc-float-wrapper dc-field--half">
                    <div className={`dc-float-field${locationPrefix ? ' dc-float-field--prefixed' : ''}`}>
                      {locationPrefix && <span className="dc-invoice-prefix">{locationPrefix}-</span>}
                      <input className="dc-float-input" placeholder=" " value={invoiceNo} onChange={e => { setInvoiceNo(e.target.value); setBillSearchDone(false); }} />
                      <label className="dc-float-label">Invoice No. <span className="dc-req">*</span></label>
                    </div>
                  </div>
                  <div className="dc-float-wrapper dc-field--half">
                    <div className="dc-float-field">
                      <input className="dc-float-input" placeholder=" " value={amount} onChange={e => setAmount(e.target.value)} type="number" />
                      <label className="dc-float-label">Amount <span className="dc-req">*</span></label>
                    </div>
                  </div>
                </div>
                <div className="dc-form-row">
                  <div className="dc-float-wrapper dc-field--half">
                    <div className="dc-float-field">
                      <input className="dc-float-input" placeholder=" " value={billEmail} onChange={e => setBillEmail(e.target.value)} />
                      <label className="dc-float-label">Email</label>
                    </div>
                  </div>
                  <PhoneField label="Mobile" value={billMobile} onChange={setBillMobile} />
                </div>
              </div>
              <div className="dc-form-section">
                <CaptchaWidget value={billCaptcha} onChange={setBillCaptcha} />
              </div>
              <div className="dc-form-actions">
                <button className="dc-btn dc-btn--outline" onClick={() => { setInvoiceType(''); setLocation(''); setInvoiceNo(''); setAmount(''); setBillCaptcha(''); setBillEmail(''); setBillMobile(''); setBillSearchDone(false); }}>
                  <RefreshIcon /> Reset
                </button>
                <button className="dc-btn dc-btn--primary" onClick={() => setBillSearchDone(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Search
                </button>
              </div>

              {/* Results card */}
              {billSearchDone && (
                <div className="dc-form-section" style={{ marginTop: 8 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="dc-charges__table" style={{ borderRadius: 8, overflow: 'hidden' }}>
                      <thead>
                        <tr>
                          <th>Invoice Type</th>
                          <th>Invoice Number</th>
                          <th>Invoice Date</th>
                          <th>Customer</th>
                          <th>Amount</th>
                          <th>Settled Amount</th>
                          <th>Balance Amount</th>
                          <th style={{ textAlign: 'left' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Case Management Demand Notice</td>
                          <td>70003167</td>
                          <td>11-01-2024</td>
                          <td>AEOUAT1</td>
                          <td><DirhamIcon />143,020.00</td>
                          <td><DirhamIcon />3,020.00</td>
                          <td><DirhamIcon />140,000.00</td>
                          <td style={{ textAlign: 'left' }}><span className="dc-status-badge dc-status-badge--partial">Partially Paid</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                    <button className="dc-btn dc-btn--blue" onClick={() => setBillPayStep('payment')}>
                      Complete Payment
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Payment History — separate card ── */}
            {billSearchDone && (
              <div className="dc-form-card" style={{ marginTop: 0 }}>
                <div className="dc-form-section">
                  <h4 className="dc-form-section__heading">Payment History Details</h4>
                  <table className="dc-bills-table">
                    <thead>
                      <tr>
                        <th>Transaction Date</th>
                        <th>Payment Mode</th>
                        <th>Amount</th>
                        <th>Payment Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { date: '19-11-2025', mode: 'Debit Account', amount: '2,000.00', status: 'Success', print: true },
                        { date: '10-04-2025', mode: 'ePayment',      amount: '2,000.00', status: 'Failed',  print: false },
                        { date: '26-02-2024', mode: 'Debit Account', amount: '700.00',   status: 'Success', print: true },
                        { date: '25-01-2024', mode: 'Debit Account', amount: '100.00',   status: 'Success', print: true },
                        { date: '25-01-2024', mode: 'Debit Account', amount: '100.00',   status: 'Success', print: true },
                        { date: '11-01-2024', mode: 'Debit Account', amount: '120.00',   status: 'Success', print: true },
                      ].map((row, i) => (
                        <tr key={i}>
                          <td>{row.date}</td>
                          <td>{row.mode}</td>
                          <td><DirhamIcon />{row.amount}</td>
                          <td><span className={`dc-status-badge ${row.status === 'Success' ? 'dc-status-badge--success' : 'dc-status-badge--danger'}`}>{row.status}</span></td>
                          <td>
                            {row.print && (
                              <button style={{ background: '#222', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }} title="Print receipt">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </>
          );
        })()}

        {/* ── TOP UP (with Enquiry sub-tab) ── */}
        {activeTab === 'topup' && (
          <div className="dc-form-card">
            {/* ── Radio sub-tabs + form fields all inside one dc-form-section ── */}
            <div className="dc-form-section">
              {/* Radio sub-tabs */}
              <div style={{ display: 'flex', gap: 28, paddingBottom: 16, borderBottom: '1px solid #eee', marginBottom: 20 }}>
                {(['topup', 'enquiry'] as const).map(st => (
                  <label key={st} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: topupSubTab === st ? 600 : 400, cursor: 'pointer', color: topupSubTab === st ? '#1360D2' : '#555' }}>
                    <input type="radio" name="topupSubTab" checked={topupSubTab === st} onChange={() => setTopupSubTab(st)} style={{ accentColor: '#1360D2', width: 16, height: 16 }} />
                    {st === 'topup' ? 'Top Up' : 'Enquiry'}
                  </label>
                ))}
              </div>

              {/* ── Top Up fields ── */}
              {topupSubTab === 'topup' && <>
                <div className="dc-form-row">
                  <div className="dc-float-wrapper dc-field--half">
                    <div className="dc-float-field">
                      <input className="dc-float-input" placeholder=" " value={topupBusinessCode} onChange={e => { setTopupBusinessCode(e.target.value); setTopupSearchDone(false); }} />
                      <label className="dc-float-label">Business Code <span className="dc-req">*</span></label>
                    </div>
                  </div>
                  <FloatDropdown label="Account Type" required value={topupAccountType}
                    onChange={v => { setTopupAccountType(v); setTopupSearchDone(false); }}
                    className="dc-field--half"
                    options={['Credit Account (CDR)', 'Cash Account', 'Deposit Account']} />
                </div>
                <div className="dc-form-row">
                  <div className="dc-float-wrapper dc-field--half">
                    <div className="dc-float-field">
                      <input className="dc-float-input" placeholder=" " value={topupAccountNumber} onChange={e => { setTopupAccountNumber(e.target.value); setTopupSearchDone(false); }} />
                      <label className="dc-float-label">Account Number <span className="dc-req">*</span></label>
                    </div>
                  </div>
                  <div className="dc-float-wrapper dc-field--half">
                    <div className="dc-float-field">
                      <input className="dc-float-input" placeholder=" " value={topupEmail} onChange={e => setTopupEmail(e.target.value)} />
                      <label className="dc-float-label">Email <span className="dc-req">*</span></label>
                    </div>
                  </div>
                </div>
                <div className="dc-form-row">
                  <div className="dc-float-wrapper dc-field--half">
                    <CaptchaWidget value={topupCaptcha} onChange={setTopupCaptcha} />
                  </div>
                </div>
              </>}

              {/* ── Enquiry fields ── */}
              {topupSubTab === 'enquiry' && <>
                <div className="dc-form-row">
                  <div className="dc-float-wrapper dc-field--half">
                    <div className="dc-float-field">
                      <input className="dc-float-input" placeholder=" " value={enqBusinessCode} onChange={e => { setEnqBusinessCode(e.target.value); setEnqSearchDone(false); }} />
                      <label className="dc-float-label">Business Code <span className="dc-req">*</span></label>
                    </div>
                  </div>
                  <FloatDropdown label="Account Type" required value={enqAccountType}
                    onChange={v => { setEnqAccountType(v); setEnqSearchDone(false); }}
                    className="dc-field--half"
                    options={['Credit Account (CDR)', 'Cash Account', 'Deposit Account']} />
                </div>
                <div className="dc-form-row">
                  <div className="dc-float-wrapper dc-field--half">
                    <div className="dc-float-field">
                      <input className="dc-float-input" placeholder=" " value={enqAccountNumber} onChange={e => { setEnqAccountNumber(e.target.value); setEnqSearchDone(false); }} />
                      <label className="dc-float-label">Account Number <span className="dc-req">*</span></label>
                    </div>
                  </div>
                  <div className="dc-float-wrapper dc-field--half">
                    <div className="dc-float-field">
                      <input className="dc-float-input" placeholder=" " value={enqTxnNo} onChange={e => { setEnqTxnNo(e.target.value); setEnqSearchDone(false); }} />
                      <label className="dc-float-label">Transaction No. <span className="dc-req">*</span></label>
                    </div>
                  </div>
                </div>
                <div className="dc-form-row">
                  <div className="dc-float-wrapper dc-field--half">
                    <CaptchaWidget value={enqCaptcha2} onChange={setEnqCaptcha2} />
                  </div>
                </div>
              </>}
            </div>{/* end dc-form-section */}

            {/* ── Actions ── */}
            {topupSubTab === 'topup' && (
              <div className="dc-form-actions">
                <button className="dc-btn dc-btn--outline" onClick={() => { setTopupBusinessCode(''); setTopupAccountType(''); setTopupAccountNumber(''); setTopupEmail(''); setTopupCaptcha(''); setTopupSearchDone(false); setTopupAmount(''); }}>
                  <RefreshIcon /> Reset
                </button>
                <button className="dc-btn dc-btn--primary" onClick={() => setTopupSearchDone(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Search
                </button>
              </div>
            )}

            {topupSubTab === 'topup' && topupSearchDone && (
              <div className="dc-form-section">
                {/* Search result attributes — no dividing lines, gap only */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="dc-charges__table" style={{ borderRadius: 8, overflow: 'hidden' }}>
                      <thead>
                        <tr>
                          <th>Business Code &amp; Name</th>
                          <th>Account Number</th>
                          <th>Account Type</th>
                          <th style={{ textAlign: 'left' }}>Email</th>
                          <th style={{ textAlign: 'left' }}>Amount to Top Up (AED) <span style={{ color: '#dc3545' }}>*</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{topupBusinessCode || 'AE-1050879'} — AEOUAT1</td>
                          <td>{topupAccountNumber || '1222683'} — AEOUAT1</td>
                          <td>{topupAccountType || 'Credit Account (CDR)'}</td>
                          <td style={{ textAlign: 'left' }}>{topupEmail || 'user@example.com'}</td>
                          <td style={{ textAlign: 'left' }}>
                            <div className="dc-float-wrapper" style={{ maxWidth: 200 }}>
                              <div className="dc-float-field">
                                <input className="dc-float-input" type="number" min="0" placeholder=" " value={topupAmount} onChange={e => setTopupAmount(e.target.value)} />
                                <label className="dc-float-label">Amount (AED)</label>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Method — separate card, vertical layout matching Bills tab */}
                <div className="dc-form-card" style={{ marginBottom: 0 }}>
                  <div className="dc-form-section">
                    <h4 className="dc-form-section__heading">Payment Details</h4>
                    <p style={{ fontSize: 16, color: '#888', marginBottom: 16 }}>Note* Card payment has maximum limit of AED 1,000,000.00</p>
                    <div className="dc-payment-summary" style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
                      <div style={{ borderLeft: '1px solid #e0e4ed', paddingLeft: 16, paddingRight: 40 }}>
                        <p style={{ fontSize: 16, color: '#7a8a99', marginBottom: 4 }}>Total Selected Transactions</p>
                        <p style={{ fontSize: 16, fontWeight: 600, color: '#1a2533' }}>1</p>
                      </div>
                      <div style={{ borderLeft: '1px solid #e0e4ed', paddingLeft: 16, paddingRight: 40 }}>
                        <p style={{ fontSize: 16, color: '#7a8a99', marginBottom: 4 }}>Total Amount</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#1360D2' }}>AED {topupAmount || '0.00'}</p>
                      </div>
                      <div style={{ borderLeft: '1px solid #e0e4ed', paddingLeft: 16, paddingRight: 16 }}>
                        <p style={{ fontSize: 16, color: '#7a8a99', marginBottom: 4 }}>Payment Mode</p>
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#1360D2', background: '#e8f0fe', borderRadius: 5, padding: '5px 14px', display: 'inline-block' }}>E-Payment</span>
                      </div>
                    </div>
                  </div>
                  <div className="dc-form-actions">
                    <button className="dc-btn dc-btn--blue" onClick={() => setShowTopupConfirm(true)}>Complete Payment</button>
                  </div>
                </div>

                {/* Topup confirm popup */}
                {showTopupConfirm && (
                  <div className="dc-modal-overlay" onClick={() => setShowTopupConfirm(false)}>
                    <div className="dc-modal dc-confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, textAlign: 'center', padding: '40px 36px 36px', gap: 0 }}>
                      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
                        <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
                          <circle cx="35" cy="35" r="33" stroke="#1360D2" strokeWidth="3" fill="none"/>
                          <circle cx="35" cy="23" r="3.5" fill="#1360D2"/>
                          <rect x="31.5" y="31" width="7" height="20" rx="3.5" fill="#1360D2"/>
                        </svg>
                      </div>
                      <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0E1B3D', margin: '0 0 16px' }}>Top Up Confirmation</h3>
                      <p style={{ fontSize: 16, color: '#3D4E63', lineHeight: 1.65, margin: '0 0 32px' }}>
                        By clicking the confirm button, you are authorizing us to redirect your request for top-up of <strong style={{ color: '#0E1B3D' }}>AED {topupAmount || '0.00'}</strong> through Dubai E-Government payment site.
                      </p>
                      <div className="dc-confirm-actions" style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
                        <button onClick={() => setShowTopupConfirm(false)} style={{ height: 48, padding: '0 28px', borderRadius: 4, border: '1.5px solid #1360D2', background: '#fff', color: '#1360D2', fontSize: 16, fontWeight: 500, cursor: 'pointer', minWidth: 140, boxShadow: '0 0 8px rgba(28,72,191,0.16)', fontFamily: 'inherit' }}>Cancel</button>
                        <button onClick={() => { setShowTopupConfirm(false); setShowTopupTxnModal(true); }} style={{ height: 48, padding: '0 28px', borderRadius: 4, border: 'none', background: '#1360D2', color: '#fff', fontSize: 16, fontWeight: 500, cursor: 'pointer', minWidth: 140, boxShadow: '0 0 8px rgba(28,72,191,0.16)', fontFamily: 'inherit' }}>Confirm</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

              {showTopupTxnModal && (
                <div className="dc-modal-overlay">
                  <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', width: '95vw', maxWidth: 1150, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                    <div style={{ background: '#0e1b3d', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 18, fontWeight: 600, color: '#f8fafd', letterSpacing: '0.01em' }}>Payment Transaction Details</span>
                      <button onClick={() => setShowTopupTxnModal(false)}
                        style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700 }}>
                        ✕
                      </button>
                    </div>
                    <div style={{ padding: '24px 24px 8px' }}>
                      <div style={{ border: '1px solid #E8EDF2', borderRadius: 8, marginBottom: 24 }}>
                        {([
                          [
                            ['Transaction No.', '12701'],
                            ['Transaction Date', '22-10-2024'],
                            ['DEG Transaction No.', '000217361166-D'],
                            ['DEG Transaction Date', '22-10-2024 03:59:05'],
                            ['EPayment Transaction No', '20019640'],
                          ],
                          [
                            ['Initiated Date', '22-10-2024 03:59:00'],
                            ['Initiated By', 'aeouat1'],
                            ['Payment Mode', 'Not Selected'],
                            ['Status', null],
                          ],
                          [
                            ['Message', null],
                          ],
                        ] as [string, string | null][][][]).map((rowItems, rowIdx, allRows) => (
                          <Fragment key={rowIdx}>
                            <div style={{ display: 'grid', gridTemplateColumns: rowItems.length === 1 ? '1fr' : 'repeat(5, 1fr)', gap: 0 }}>
                              {rowItems.map(([label, value]) => {
                                const isStatus = label === 'Status';
                                const isMessage = label === 'Message';
                                return (
                                  <div key={label as string} style={{ padding: '14px 16px' }}>
                                    <p style={{ fontSize: 16, color: '#697498', marginBottom: 4 }}>{label}</p>
                                    {isStatus
                                      ? <span className="dc-status-badge dc-status-badge--danger">Failed</span>
                                      : isMessage
                                      ? <>
                                          <p style={{ fontSize: 16, color: '#1360d2', marginBottom: 4 }}>Payment Status Remarks: SP Terminated</p>
                                          <p style={{ fontSize: 16, color: '#dc3545', fontWeight: 600 }}>Collection Status Remarks : DEG - SP Terminated</p>
                                        </>
                                      : <p style={{ fontSize: 16, fontWeight: 600, color: '#0e1b3d' }}>{value}</p>
                                    }
                                  </div>
                                );
                              })}
                            </div>
                            {rowIdx < allRows.length - 1 && (
                              <div style={{ borderBottom: '1px solid #F0F4FA', margin: '0 16px' }} />
                            )}
                          </Fragment>
                        ))}
                      </div>
                      <p style={{ fontWeight: 700, color: '#0E1B3D', marginBottom: 12, fontSize: 16 }}>Payment Details</p>
                      <table className="dc-charges__table" style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
                        <thead>
                          <tr>
                            <th>Payment Type</th>
                            <th>Invoice / Account No.</th>
                            <th>Amount</th>
                            <th>Receipt No.</th>
                            <th>Remarks</th>
                            <th style={{ textAlign: 'left' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Credit Account</td>
                            <td>{topupAccountNumber || '1222683'} AEOUAT1</td>
                            <td><DirhamIcon />{topupAmount || '25,163.00'}</td>
                            <td></td>
                            <td></td>
                            <td style={{ textAlign: 'left' }}><span className="dc-status-badge dc-status-badge--danger">Failed</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 24px 24px' }}>
                      <button onClick={() => setShowTopupTxnModal(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0e1b3d', color: '#f8fafd', border: 'none', borderRadius: 4, padding: '11px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* ── Enquiry actions ── */}
            {topupSubTab === 'enquiry' && (
              <div className="dc-form-actions">
                <button className="dc-btn dc-btn--outline" onClick={() => { setEnqBusinessCode(''); setEnqAccountType(''); setEnqAccountNumber(''); setEnqTxnNo(''); setEnqCaptcha2(''); setEnqSearchDone(false); }}>
                  <RefreshIcon /> Reset
                </button>
                <button className="dc-btn dc-btn--primary" onClick={() => setEnqSearchDone(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Search
                </button>
              </div>
            )}

            {topupSubTab === 'enquiry' && enqSearchDone && (
                <div className="dc-form-section" style={{ marginTop: 8 }}>
                  <div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="dc-charges__table" style={{ borderRadius: 8, overflow: 'hidden' }}>
                        <thead>
                          <tr>
                            <th>Business Code &amp; Name</th>
                            <th>Account</th>
                            <th>Amount (AED)</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'left' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{enqBusinessCode || 'AE-1050879'} — AEOUAT1</td>
                            <td>{enqAccountNumber || '1222683'} — AEOUAT1</td>
                            <td><DirhamIcon />88.00</td>
                            <td><span className="dc-status-badge dc-status-badge--success">Success</span></td>
                            <td style={{ textAlign: 'left' }}>
                              <button onClick={() => setShowReceiptModal(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0e1b3d', border: 'none', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontSize: 16, color: '#fff', fontWeight: 600 }}
                                title="Print receipt">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                                Print
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Bill Payment Settlement Receipt Modal */}
              {showReceiptModal && (
                <div className="dc-modal-overlay">
                  <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', width: '90vw', maxWidth: 860, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                    <div style={{ background: '#0e1b3d', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 18, fontWeight: 600, color: '#f8fafd', letterSpacing: '0.01em' }}>Bill Payment Settlement Receipt</span>
                      <button onClick={() => setShowReceiptModal(false)}
                        style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700 }}>
                        ✕
                      </button>
                    </div>
                    <div style={{ padding: '24px 24px 8px' }}>
                      <p style={{ fontWeight: 700, color: '#0E1B3D', marginBottom: 12, fontSize: 16 }}>Business Details</p>
                      <table className="dc-charges__table" style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
                        <thead>
                          <tr>
                            <th>Payment Type</th>
                            <th>Invoice / Account No.</th>
                            <th>Receipt No.</th>
                            <th>Amount</th>
                            <th style={{ textAlign: 'left' }}>Status</th>
                            <th style={{ textAlign: 'left' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Credit Account</td>
                            <td>{enqAccountNumber || '1222683'} AEOUAT1</td>
                            <td>Z-12585</td>
                            <td><DirhamIcon />88.00</td>
                            <td style={{ textAlign: 'left' }}><span className="dc-status-badge dc-status-badge--success">Success</span></td>
                            <td style={{ textAlign: 'left' }}>M1CS 1926536; BPS Transaction for CDR-{enqAccountNumber || '1222683'}</td>
                          </tr>
                        </tbody>
                      </table>

                      <p style={{ fontWeight: 700, color: '#0E1B3D', marginBottom: 12, fontSize: 16 }}>Settlement Details</p>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #E8EDF2', borderRadius: 8, marginBottom: 16 }}>
                        <tbody>
                          {[
                            ['Payment Method', 'Credit Card'] as [string, React.ReactNode],
                            ['Transaction No.', enqTxnNo || '12985'] as [string, React.ReactNode],
                            ['Transaction Date', '19-05-2026'] as [string, React.ReactNode],
                            ['E-Payment Transaction No.', '20021631'] as [string, React.ReactNode],
                            ['Amount', <><DirhamIcon />88.00</>] as [string, React.ReactNode],
                          ].map(([label, value]) => (
                            <tr key={label as string} style={{ borderBottom: '1px solid #F0F4FA' }}>
                              <td style={{ padding: '12px 16px', color: '#697498', width: '40%', fontSize: 16 }}>{label}</td>
                              <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 16, color: '#0e1b3d' }}>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p style={{ fontSize: 14, color: '#888', padding: '4px 0 16px' }}>This Receipt is generated by the system and therefore does not require a signature</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', padding: '4px 24px 24px' }}>
                      <button onClick={() => window.print()}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#e07b2a', color: '#fff', border: 'none', borderRadius: 4, padding: '11px 28px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        Print
                      </button>
                      <button onClick={() => setShowReceiptModal(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0e1b3d', color: '#f8fafd', border: 'none', borderRadius: 4, padding: '11px 28px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* ── MISCELLANEOUS ── */}
        {activeTab === 'miscellaneous' && (
          <div className="dc-form-card">
            {/* Section 1: Service Details */}
            <div className="dc-form-section dc-basic-info-section">
              <div className="dc-basic-info-header">
                <h4 className="dc-form-section__heading" style={{ margin: 0 }}>Service Details</h4>
              </div>
              <div className="dc-basic-info-cards">
                <div className="dc-basic-info-card dc-basic-info-card--wide">
                  <div className="dc-basic-info-card__icon dc-basic-info-card__icon--blue">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  </div>
                  <div className="dc-basic-info-card__body">
                    <span className="dc-basic-info-card__label">Service Name</span>
                    <span className="dc-basic-info-card__value">Pay Miscellaneous Charges</span>
                  </div>
                </div>
                <div className="dc-basic-info-card dc-basic-info-card--full">
                  <div className="dc-basic-info-card__icon dc-basic-info-card__icon--indigo">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <div className="dc-basic-info-card__body">
                    <span className="dc-basic-info-card__label">Service Description</span>
                    <span className="dc-basic-info-card__value">This service enables the Customer to make a payment for miscellaneous Service Types such as sale of official printed forms &amp; documents and Fines.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Service Type Details */}
            <div className="dc-form-section dc-basic-info-section">
              <div className="dc-basic-info-header">
                <h4 className="dc-form-section__heading" style={{ margin: 0 }}>Service Type Details</h4>
              </div>
              <div className="dc-basic-info-cards">
                {/* Row 1: Dropdown + Charges */}
                <div style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 'calc(50% - 6px)' }}>
                    <FloatDropdown label="Service Type" required value={miscServiceType} onChange={setMiscServiceType} options={Object.keys(MISC_SERVICE_TYPES)} />
                  </div>
                  {selectedMiscType && (
                    <div className="dc-basic-info-card" style={{ flex: 1, height: 56, alignItems: 'center' }}>
                      <div className="dc-basic-info-card__icon dc-basic-info-card__icon--green">
                        <img src={dirham} width="18" height="18" alt="AED" style={{ filter: 'brightness(0)' }} />
                      </div>
                      <div className="dc-basic-info-card__body">
                        <span className="dc-basic-info-card__label">Charges</span>
                        <span className="dc-basic-info-card__value dc-basic-info-card__value--charge">AED {selectedMiscType.charges}</span>
                      </div>
                    </div>
                  )}
                </div>
                {/* Row 2: Description + Requirements (equal height; description expands if no requirements) */}
                {selectedMiscType && (
                  <div style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'stretch' }}>
                    <div className="dc-basic-info-card" style={{ flex: 1 }}>
                      <div className="dc-basic-info-card__icon dc-basic-info-card__icon--indigo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      </div>
                      <div className="dc-basic-info-card__body">
                        <span className="dc-basic-info-card__label">Service Type Description</span>
                        <span className="dc-basic-info-card__value">{selectedMiscType.description}</span>
                      </div>
                    </div>
                    {selectedMiscType.requirements && (
                      <div className="dc-basic-info-card" style={{ flex: 1 }}>
                        <div className="dc-basic-info-card__icon dc-basic-info-card__icon--teal">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        </div>
                        <div className="dc-basic-info-card__body">
                          <span className="dc-basic-info-card__label">Requirements</span>
                          <span className="dc-basic-info-card__value">{selectedMiscType.requirements}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {miscServiceType && (<>
            {/* Section 2b: Business Information — Business Code only (Kimberly) */}
            {miscServiceType === 'Kimberly Certificate Process Charge' && (
              <div className="dc-form-section">
                <h4 className="dc-form-section__heading">Business Information</h4>
                <div className="dc-form-row">
                  <div className="dc-float-wrapper dc-field--half" style={{ maxWidth: 'calc(50% - 8px)' }}>
                    <div className="dc-float-field">
                      <input className="dc-float-input" placeholder=" " value={miscBusinessCode} onChange={e => setMiscBusinessCode(e.target.value)} />
                      <label className="dc-float-label">Business Code <span className="dc-req">*</span></label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="dc-form-section">
              <h4 className="dc-form-section__heading">Contact Information</h4>
              <div className="dc-form-row">
                <div className="dc-float-wrapper dc-field--half">
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={miscName} onChange={e => setMiscName(e.target.value)} />
                    <label className="dc-float-label">Name <span className="dc-req">*</span></label>
                  </div>
                </div>
                <div className="dc-float-wrapper dc-field--half">
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={miscCompany} onChange={e => setMiscCompany(e.target.value)} />
                    <label className="dc-float-label">Company <span className="dc-req">*</span></label>
                  </div>
                </div>
              </div>
              <div className="dc-form-row">
                <div className="dc-float-wrapper dc-field--half">
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={miscContact} onChange={e => setMiscContact(e.target.value)} />
                    <label className="dc-float-label">Contact Person <span className="dc-req">*</span></label>
                  </div>
                </div>
                <div className="dc-float-wrapper dc-field--half">
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={miscEmail} onChange={e => { setMiscEmail(e.target.value); setMiscEmailVerified(false); }} style={{ paddingRight: 100 }} />
                    <label className="dc-float-label">Email <span className="dc-req">*</span></label>
                    {miscEmailVerified ? (
                      <span className="dc-verified-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Verified</span>
                    ) : (
                      <button className="dc-float-trail-btn" onClick={() => setMiscShowVerify(true)}>Verify</button>
                    )}
                  </div>
                </div>
              </div>
              <div className="dc-form-row">
                <PhoneField label="Phone" value={miscPhone} onChange={setMiscPhone} tooltip="Numbers and hyphen only, e.g. 4-4177777" />
                <PhoneField label="Mobile" required value={miscMobile} onChange={setMiscMobile} tooltip="Contact person mobile number (numbers and hyphen)" />
              </div>
            </div>

            <div className="dc-form-section">
              <h4 className="dc-form-section__heading">Request Information</h4>
              <div className="dc-form-row">
                <div className="dc-float-wrapper dc-field--half">
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={miscSubject} onChange={e => setMiscSubject(e.target.value)} />
                    <label className="dc-float-label">Subject <span className="dc-req">*</span></label>
                  </div>
                </div>
              </div>
              <div className="dc-float-field" style={{ width: '100%' }}>
                <textarea className="dc-float-input dc-float-textarea" placeholder=" " value={miscDesc} onChange={e => setMiscDesc(e.target.value)} rows={3} />
                <label className="dc-float-label">Description <span className="dc-req">*</span></label>
              </div>
              {selectedMiscType && (
                <div className="dc-form-row" style={{ marginTop: 12 }}>
                  {miscServiceType === 'Kimberly Certificate Process Charge' && (
                    <div className="dc-float-wrapper dc-field--half" style={{ maxWidth: 'calc(50% - 8px)' }}>
                      <div className="dc-float-field">
                        <input className="dc-float-input" placeholder=" " type="number" min="0" value={miscNumCerts} onChange={e => setMiscNumCerts(e.target.value)} />
                        <label className="dc-float-label">No. of Certificates <span className="dc-req">*</span></label>
                      </div>
                    </div>
                  )}
                  {miscServiceType === 'E payment Declaration Cancellation Charges' && (
                    <div className="dc-float-wrapper dc-field--half" style={{ maxWidth: 'calc(50% - 8px)' }}>
                      <div className="dc-float-field">
                        <input
                          className="dc-float-input"
                          placeholder={miscDeclFocused ? 'M2 Declaration number' : ' '}
                          value={miscDeclNumber}
                          onChange={e => setMiscDeclNumber(e.target.value)}
                          onFocus={() => setMiscDeclFocused(true)}
                          onBlur={() => setMiscDeclFocused(false)}
                        />
                        <label className="dc-float-label">Declaration Number <span className="dc-req">*</span></label>
                      </div>
                    </div>
                  )}
                  {miscServiceType !== 'Kimberly Certificate Process Charge' && miscServiceType !== 'E payment Declaration Cancellation Charges' && (
                    <div className="dc-float-wrapper dc-field--half" style={{ maxWidth: 'calc(50% - 8px)' }}>
                      <div className="dc-float-field">
                        <input className="dc-float-input" placeholder=" " type="number" min="0" value={miscUnits} onChange={e => setMiscUnits(e.target.value)} />
                        <label className="dc-float-label">No. of Units <span className="dc-req">*</span></label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="dc-form-section">
              <CaptchaWidget value={miscCaptcha} onChange={setMiscCaptcha} />
            </div>
            <div className="dc-form-actions">
              <button className="dc-btn dc-btn--outline" onClick={() => { setMiscServiceType(''); setMiscUnits(''); setMiscBusinessCode(''); setMiscNumCerts(''); setMiscDeclNumber(''); setMiscDeclFocused(false); setMiscCompany(''); setMiscName(''); setMiscContact(''); setMiscEmail(''); setMiscEmailVerified(false); setMiscPhone(''); setMiscMobile(''); setMiscSubject(''); setMiscDesc(''); setMiscCaptcha(''); }}>Reset</button>
              <button className="dc-btn dc-btn--blue" onClick={() => navigate({ name: 'success', serviceId: service.id, activePayBillsTab: 'Miscellaneous' })}>Submit</button>
            </div>
            </>)}
            {miscShowVerify && <EmailVerifyModal email={miscEmail} onVerify={() => setMiscEmailVerified(true)} onClose={() => setMiscShowVerify(false)} />}
          </div>
        )}

        {/* ── INSTALMENTS ── */}
        {activeTab === 'installments' && (
          <div className="dc-form-card">
            <div className="dc-form-section dc-basic-info-section">
              <div className="dc-basic-info-header">
                <h4 className="dc-form-section__heading" style={{ margin: 0 }}>Service Details</h4>
              </div>
              <div className="dc-basic-info-cards">
                {/* Row 1: Service Name */}
                <div style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'stretch' }}>
                  <div className="dc-basic-info-card" style={{ flex: 1 }}>
                    <div className="dc-basic-info-card__icon dc-basic-info-card__icon--blue">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    </div>
                    <div className="dc-basic-info-card__body">
                      <span className="dc-basic-info-card__label">Service Name</span>
                      <span className="dc-basic-info-card__value">Request Payment by Installments</span>
                    </div>
                  </div>
                </div>
                {/* Row 2: Service Description + Requirements */}
                <div style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'stretch' }}>
                  <div className="dc-basic-info-card" style={{ flex: 1 }}>
                    <div className="dc-basic-info-card__icon dc-basic-info-card__icon--indigo">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    <div className="dc-basic-info-card__body">
                      <span className="dc-basic-info-card__label">Service Description</span>
                      <span className="dc-basic-info-card__value">This service is offered to business community to request settlement of invoices and demand notices by instalment payment.</span>
                    </div>
                  </div>
                  <div className="dc-basic-info-card" style={{ flex: 1 }}>
                    <div className="dc-basic-info-card__icon dc-basic-info-card__icon--teal">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    </div>
                    <div className="dc-basic-info-card__body">
                      <span className="dc-basic-info-card__label">Requirements</span>
                      <span className="dc-basic-info-card__value">1. Request Letter for Payment by Installments</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dc-form-section">
              <h4 className="dc-form-section__heading">Business Information</h4>
              <div className="dc-form-row">
                <div className="dc-float-wrapper dc-field--half" style={{ maxWidth: 'calc(50% - 8px)' }}>
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={instBusinessCode} onChange={e => setInstBusinessCode(e.target.value)} />
                    <label className="dc-float-label">Business Code <span className="dc-req">*</span></label>
                  </div>
                  <InfoTooltip tip="Registered business code xx-xxxxxx" />
                </div>
              </div>
            </div>

            <div className="dc-form-section">
              <h4 className="dc-form-section__heading">Contact Information</h4>
              <div className="dc-form-row">
                <div className="dc-float-wrapper dc-field--half">
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={instName} onChange={e => setInstName(e.target.value)} />
                    <label className="dc-float-label">Name <span className="dc-req">*</span></label>
                  </div>
                </div>
              </div>
              <div className="dc-form-row">
                <div className="dc-float-wrapper dc-field--half">
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={instCompany} onChange={e => setInstCompany(e.target.value)} />
                    <label className="dc-float-label">Company <span className="dc-req">*</span></label>
                  </div>
                </div>
                <div className="dc-float-wrapper dc-field--half">
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={instContact} onChange={e => setInstContact(e.target.value)} />
                    <label className="dc-float-label">Contact Person <span className="dc-req">*</span></label>
                  </div>
                </div>
              </div>
              <div className="dc-form-row">
                <div className="dc-float-wrapper dc-field--half">
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={instEmail} onChange={e => { setInstEmail(e.target.value); setInstEmailVerified(false); }} style={{ paddingRight: 100 }} />
                    <label className="dc-float-label">Email <span className="dc-req">*</span></label>
                    {instEmailVerified ? (
                      <span className="dc-verified-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Verified</span>
                    ) : (
                      <button className="dc-float-trail-btn" onClick={() => setInstShowVerify(true)}>Verify</button>
                    )}
                  </div>
                </div>
                <PhoneField label="Phone" value={instPhone} onChange={setInstPhone} tooltip="Numbers and hyphen only, e.g. 4-4177777" />
              </div>
              <div className="dc-form-row">
                <PhoneField label="Mobile" required value={instMobile} onChange={setInstMobile} tooltip="Contact person mobile number (numbers and hyphen)" />
              </div>
            </div>

            <div className="dc-form-section">
              <h4 className="dc-form-section__heading">Request Information</h4>
              <div className="dc-form-row">
                <div className="dc-float-wrapper dc-field--half">
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={instSubject} onChange={e => setInstSubject(e.target.value)} />
                    <label className="dc-float-label">Subject <span className="dc-req">*</span></label>
                  </div>
                </div>
              </div>
              <div className="dc-float-field" style={{ width: '100%' }}>
                <textarea className="dc-float-input dc-float-textarea" placeholder=" " value={instDesc} onChange={e => setInstDesc(e.target.value)} rows={3} />
                <label className="dc-float-label">Description <span className="dc-req">*</span></label>
              </div>
            </div>

            <div className="dc-form-section">
              <CaptchaWidget value={instCaptcha} onChange={setInstCaptcha} />
            </div>

            <div className="dc-form-section">
              <h4 className="dc-form-section__heading">Attachments</h4>
              <div className="dc-attachments">
                <div className="dc-field-hint" style={{ marginBottom: 12, marginTop: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5E6B7A" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
                  <span>Only .rtf .doc .docx .pdf .jpg .jpeg .gif .png .bmp .tiff is allowed, maximum 5MB per file</span>
                </div>
                <FileUploadRow />
              </div>
            </div>

            <div className="dc-form-actions">
              <button className="dc-btn dc-btn--outline" onClick={() => { setInstBusinessCode(''); setInstName(''); setInstCompany(''); setInstContact(''); setInstEmail(''); setInstEmailVerified(false); setInstPhone(''); setInstMobile(''); setInstSubject(''); setInstDesc(''); setInstCaptcha(''); }}>Reset</button>
              <button className="dc-btn dc-btn--blue" onClick={() => navigate({ name: 'success', serviceId: service.id, activePayBillsTab: 'Installments' })}>Submit</button>
            </div>
            {instShowVerify && <EmailVerifyModal email={instEmail} onVerify={() => setInstEmailVerified(true)} onClose={() => setInstShowVerify(false)} />}
          </div>
        )}

        {/* ── ENQUIRY ── */}
        {activeTab === 'enquiry' && (
          <div className="dc-form-card">
            <div className="dc-form-section">
              <h4 className="dc-form-section__heading">Pay Customs</h4>
              <div className="dc-form-row">
                <EnquirySearchBar
                  searchType={enqRequestNo || 'Request No.'}
                  setSearchType={setEnqRequestNo}
                  searchValue={enqTicketNo}
                  setSearchValue={setEnqTicketNo}
                />
                <div className="dc-float-wrapper dc-field--half">
                  <div className="dc-float-field">
                    <input className="dc-float-input" placeholder=" " value={enqEmail} onChange={e => setEnqEmail(e.target.value)} />
                    <label className="dc-float-label">Email <span className="dc-req">*</span></label>
                  </div>
                </div>
              </div>
            </div>
            <div className="dc-form-section">
              <CaptchaWidget value={enqCaptcha} onChange={setEnqCaptcha} />
            </div>
            <div className="dc-form-actions">
              <button className="dc-btn dc-btn--outline" onClick={() => { setEnqRequestNo(''); setEnqTicketNo(''); setEnqEmail(''); setEnqCaptcha(''); }}>
                <RefreshIcon /> Reset
              </button>
              <button className="dc-btn dc-btn--primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Show
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── SUCCESS PAGE ─────────────────────────────────────────────────────────────
function SuccessPage({ service, navigate, activePayBillsTab, brData }: { service: ServiceDef; navigate: (page: Page) => void; activePayBillsTab?: string; brData?: BRData & { tab?: FormTab } }) {
  const REF = 'R00723-513232';
  const relatedServices = SERVICES.filter(s => s.id !== service.id && s.hasInfo).slice(0, 3);
  const serviceFee = parseFloat(service.charges) || 0;
  const knowledgeFee = serviceFee >= 50 ? 20 : 0;
  const totalFee = serviceFee + knowledgeFee;

  // Payment flow: 'pending' | 'paid'
  const [paymentState, setPaymentState] = useState<'pending' | 'paid'>('pending');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirmPayment = () => {
    setShowConfirm(false);
    // Business Registration continues to its own Service Request Detail confirmation once paid.
    if (brData) { navigate({ name: 'br-submitted', serviceId: service.id, data: brData }); return; }
    setPaymentState('paid');
  };

  return (
    <>
      <HeroBanner title={service.title} subtitle={service.subtitle} />
      <div className="dc-container">
        <Breadcrumb items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          { label: 'Service Center', onClick: () => navigate({ name: 'home' }) },
          { label: 'Dubai Trade', onClick: () => navigate({ name: 'home' }) },
          { label: service.title },
        ]} />
        <div className="dc-info-header">
          <button className="dc-back-btn" onClick={() => navigate({ name: 'form', serviceId: service.id })}><ArrowLeft /></button>
          <h2 className="dc-info-header__title">{service.title}</h2>
        </div>

        <div className="dc-form-tabs">
          {service.id === 'pay-bills'
            ? (['Bills', 'Top Up', 'Miscellaneous', 'Installments'] as const).map((tab) => (
                <button key={tab} className={`dc-form-tab ${(activePayBillsTab ?? 'Bills') === tab ? 'dc-form-tab--active' : ''}`}
                  onClick={() => navigate({ name: 'form', serviceId: service.id })}>
                  {tab}
                </button>
              ))
            : formTabsFor(service.id).map(tab => (
                <button key={tab} className={`dc-form-tab ${tab === (brData?.tab ?? 'new') ? 'dc-form-tab--active' : ''}`}
                  onClick={() => goFormTab(navigate, service.id, tab)}>
                  {FORM_TAB_LABELS[tab]}
                </button>
              ))
          }
        </div>

        {/* ── Card 1: Status banner + Request Details ── */}
        <div className="dc-form-card dc-no-print">
          <div className="dc-form-section">
            {paymentState === 'pending' ? (
              <div className="dc-payment-pending-alert">
                <div className="dc-payment-pending-alert__left">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#B45309"/><path d="M12 7v5m0 4h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                  <div>
                    <div className="dc-payment-pending-alert__title">Payment Pending</div>
                    <div className="dc-payment-pending-alert__msg">Please continue with the payment in order to complete the service request.</div>
                  </div>
                </div>
              </div>
            ) : (
              <SuccessAlert refNo={REF} inProcess />
            )}
            <div className="dc-success-grid">
              <div className="dc-success-field">
                <span className="dc-success-field__label">Request Number</span>
                <span className="dc-success-field__value">{REF}</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Request Status</span>
                <span className="dc-badge dc-badge--draft">Draft</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Service</span>
                <span className="dc-success-field__value">{service.serviceName}</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Service Type</span>
                <span className="dc-success-field__value">{service.serviceType}</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Name</span>
                <span className="dc-success-field__value">Testname</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Company</span>
                <span className="dc-success-field__value">Testcompany</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Contact Person</span>
                <span className="dc-success-field__value">Test</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Email</span>
                <span className="dc-success-field__value">clasherschenmad@gmail.com</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Mobile</span>
                <span className="dc-success-field__value">00971-50-2298234</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Subject</span>
                <span className="dc-success-field__value">Test</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">No. of Units</span>
                <span className="dc-success-field__value">1</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Description</span>
                <span className="dc-success-field__value">Test</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Card 2: Charges Summary + Payment Details (after payment) ── */}
        <div className="dc-form-card dc-no-print">
          <div className="dc-form-section">
            <h4 className="dc-form-section__heading">Charges Summary</h4>
            {paymentState === 'paid' && (
              <>
                <div className="dc-success-grid" style={{ marginBottom: 20 }}>
                  <div className="dc-success-field">
                    <span className="dc-success-field__label">Payment Mode</span>
                    <span className="dc-success-field__value">Credit Card</span>
                  </div>
                  <div className="dc-success-field">
                    <span className="dc-success-field__label">Payment Status</span>
                    <span className="dc-success-field__value">Success</span>
                  </div>
                  <div className="dc-success-field">
                    <span className="dc-success-field__label">Receipt No.</span>
                    <span className="dc-success-field__value">Z-12323</span>
                  </div>
                  <div className="dc-success-field">
                    <span className="dc-success-field__label">Payment Reference No.</span>
                    <span className="dc-success-field__value">5900080808</span>
                  </div>
                </div>
                <hr className="dc-success-divider" style={{ margin: '0 0 20px' }} />
              </>
            )}
            <table className="dc-charges__table">
              <thead>
                <tr><th>Charge</th><th>Amount</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>{service.serviceName} Fee</td>
                  <td><DirhamIcon />{serviceFee.toFixed(1)}</td>
                </tr>
                {knowledgeFee > 0 && (
                  <tr>
                    <td>Knowledge-Innovation Dirhams</td>
                    <td><DirhamIcon />{knowledgeFee.toFixed(1)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total Amount</strong></td>
                  <td><DirhamIcon /><strong>{totalFee.toFixed(1)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── Card 3: Transaction History (after payment) ── */}
        {paymentState === 'paid' && (
          <div className="dc-form-card dc-no-print">
            <div className="dc-result-txn-card">
              <div className="dc-result-txn-card__header">Transaction History</div>
              <div className="dc-result-txn-card__body">
                <div className="dc-success-grid">
                  <div className="dc-success-field">
                    <span className="dc-success-field__label">Initiated By</span>
                    <span className="dc-success-field__value">test</span>
                  </div>
                  <div className="dc-success-field">
                    <span className="dc-success-field__label">Request No.</span>
                    <span className="dc-success-field__value">R02015-83581</span>
                  </div>
                  <div className="dc-success-field">
                    <span className="dc-success-field__label">Amount</span>
                    <span className="dc-success-field__value">{totalFee.toFixed(2)}</span>
                  </div>
                  <div className="dc-success-field">
                    <span className="dc-success-field__label">Transaction Status</span>
                    <span className="dc-success-field__value">Success</span>
                  </div>
                  <div className="dc-success-field">
                    <span className="dc-success-field__label">DEG Transaction No</span>
                    <span className="dc-success-field__value">590000237140228</span>
                  </div>
                  <div className="dc-success-field">
                    <span className="dc-success-field__label">Transaction Date</span>
                    <span className="dc-success-field__value">Fri May 15 00:00:00 GST 2026</span>
                  </div>
                  <div className="dc-success-field">
                    <span className="dc-success-field__label">Payment Status</span>
                    <span className="dc-success-field__value">Success</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="dc-form-actions dc-form-actions--center dc-no-print" style={{ marginTop: 8 }}>
          {paymentState === 'paid' && (
            <button className="dc-btn dc-btn--outline" onClick={() => navigate({ name: 'form', serviceId: service.id })}>Back</button>
          )}
          {paymentState === 'pending' && (
            <button className="dc-btn dc-btn--blue" style={{ paddingLeft: 15, paddingRight: 15 }} onClick={() => setShowConfirm(true)}>Complete Payment</button>
          )}
          <button className="dc-btn dc-btn--outline" onClick={() => window.print()}>Print</button>
        </div>

        {/* ── Print-only full details view ── */}
        <div className="dc-print-only">
          {/* Request Details block */}
          <div className="dc-print-block">
            <div className="dc-print-inprocess-banner">
              {paymentState === 'paid' ? 'Request is under process.' : 'Payment Pending — Please continue with the payment to complete the service request.'}
            </div>
            <div className="dc-success-grid">
              <div className="dc-success-field">
                <span className="dc-success-field__label">Request Number</span>
                <span className="dc-success-field__value">{REF}</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Request Status</span>
                <span className="dc-success-field__value">{paymentState === 'paid' ? 'Payment Received' : 'Draft'}</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Ticket Number</span>
                <span className="dc-success-field__value">2026060910000021</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Service</span>
                <span className="dc-success-field__value">{service.serviceName}</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Service Type</span>
                <span className="dc-success-field__value">{service.serviceType}</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Name</span>
                <span className="dc-success-field__value">Testname</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Company</span>
                <span className="dc-success-field__value">Testcompany</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Contact Person</span>
                <span className="dc-success-field__value">Test</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Email</span>
                <span className="dc-success-field__value">clasherschenmad@gmail.com</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Mobile</span>
                <span className="dc-success-field__value">00971-50-2298234</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Subject</span>
                <span className="dc-success-field__value">Test</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">No. of Units</span>
                <span className="dc-success-field__value">1</span>
              </div>
              <div className="dc-success-field">
                <span className="dc-success-field__label">Description</span>
                <span className="dc-success-field__value">Test</span>
              </div>
            </div>
          </div>
          {/* Charges Summary block */}
          <div className="dc-print-block" style={{ marginTop: 24 }}>
            <h4 className="dc-print-charges-title">Charges Summary</h4>
            {paymentState === 'paid' && (
              <div className="dc-success-grid" style={{ margin: '12px 0 16px' }}>
                <div className="dc-success-field">
                  <span className="dc-success-field__label">Payment Mode</span>
                  <span className="dc-success-field__value">Credit Card</span>
                </div>
                <div className="dc-success-field">
                  <span className="dc-success-field__label">Payment Status</span>
                  <span className="dc-success-field__value">Success</span>
                </div>
                <div className="dc-success-field">
                  <span className="dc-success-field__label">Receipt No.</span>
                  <span className="dc-success-field__value">Z-12323</span>
                </div>
                <div className="dc-success-field">
                  <span className="dc-success-field__label">Payment Reference No.</span>
                  <span className="dc-success-field__value">5900080808</span>
                </div>
              </div>
            )}
            <table className="dc-print-charges-table">
              <thead><tr><th>Charge</th><th>Amount</th></tr></thead>
              <tbody>
                <tr><td>{service.serviceName} Fee</td><td>Ð {serviceFee.toFixed(1)}</td></tr>
                {knowledgeFee > 0 && <tr><td>Knowledge-Innovation Dirhams</td><td>Ð {knowledgeFee.toFixed(1)}</td></tr>}
              </tbody>
              <tfoot><tr><td><strong>Total Amount</strong></td><td><strong>Ð {totalFee.toFixed(1)}</strong></td></tr></tfoot>
            </table>
          </div>
        </div>

        {/* Confirm Payment Modal */}
        {showConfirm && (
          <div className="dc-modal-overlay" onClick={() => setShowConfirm(false)}>
            <div className="dc-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, textAlign: 'center', padding: '40px 36px 36px', gap: 0 }}>
              {/* Info icon */}
              <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
                <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
                  <circle cx="35" cy="35" r="33" stroke="#1360D2" strokeWidth="3" fill="none"/>
                  <circle cx="35" cy="23" r="3.5" fill="#1360D2"/>
                  <rect x="31.5" y="31" width="7" height="20" rx="3.5" fill="#1360D2"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0E1B3D', margin: '0 0 16px' }}>Confirm Transaction</h3>
              <p style={{ fontSize: 16, color: '#3D4E63', lineHeight: 1.65, margin: '0 0 32px' }}>
                By clicking the confirm button, you are authorizing us to redirect your request for payment of <strong style={{ color: '#0E1B3D' }}>{totalFee.toFixed(0)} AED</strong> through Dubai eGovernment Payment site.
              </p>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
                <button
                  onClick={() => setShowConfirm(false)}
                  style={{ height: 48, padding: '0 28px', borderRadius: 4, border: '1.5px solid #1360D2', background: '#fff', color: '#1360D2', fontSize: 16, fontWeight: 500, cursor: 'pointer', minWidth: 140, boxShadow: '0 0 8px rgba(28,72,191,0.16)', fontFamily: 'inherit' }}
                >Cancel</button>
                <button
                  onClick={handleConfirmPayment}
                  style={{ height: 48, padding: '0 28px', borderRadius: 4, border: 'none', background: '#1360D2', color: '#fff', fontSize: 16, fontWeight: 500, cursor: 'pointer', minWidth: 140, boxShadow: '0 0 8px rgba(28,72,191,0.16)', fontFamily: 'inherit' }}
                >Confirm</button>
              </div>
            </div>
          </div>
        )}

        {relatedServices.length > 0 && (
          <div className="dc-related">
            <h3 className="dc-related__title">Related Services</h3>
            <div className="dc-related__grid">
              {relatedServices.map(s => (
                <div key={s.id} className="dc-service-card">
                  <div className="dc-service-card__icon">
                    {s.iconFile
                      ? <img src={s.iconFile} alt={s.title} width={48} height={48} />
                      : SERVICE_ICONS[s.id]}
                  </div>
                  <h3 className="dc-service-card__title">{s.title}</h3>
                  <p className="dc-service-card__desc">{s.description}</p>
                  <div className="dc-service-card__actions">
                    {s.hasInfo && (
                      <button className="dc-btn dc-btn--outline dc-btn--sm" onClick={() => navigate({ name: 'info', serviceId: s.id })}>
                        Information
                      </button>
                    )}
                    <button className="dc-btn dc-btn--blue dc-btn--sm" onClick={() => navigate({ name: 'form', serviceId: s.id })}>
                      Start Service
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
const CORRECT_PASSWORD = 'Open_Services';
const AUTH_KEY = 'dt_open_services_auth';

function LoginPage({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === CORRECT_PASSWORD) {
      onAuth();
    } else {
      setError('Incorrect password. Please try again.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #EBF2FC 0%, #F7F9FF 60%, #fff 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Header strip */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        background: '#fff',
        borderBottom: '1px solid #E2EBF9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64, zIndex: 100,
        boxShadow: '0 1px 6px rgba(19,96,210,0.06)',
      }}>
        <img src={governmentOfDubai} alt="Government of Dubai" style={{ height: 36 }} />
        <img src={dubaitrade} alt="Dubai Trade" style={{ height: 28 }} />
      </div>

      {/* Card */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(19,96,210,0.12)',
          padding: '48px 44px 40px',
          width: '100%',
          maxWidth: 420,
          animation: shaking ? 'dt-shake 0.45s ease' : undefined,
        }}
      >
        {/* App logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <img src={figmaIcon} alt="DC Open Services" style={{ height: 72, width: 72 }} />
        </div>

        <h1 style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#0e1b3d', marginBottom: 6 }}>
          DC Open Services
        </h1>
        <p style={{ textAlign: 'center', fontSize: 14, color: '#697498', marginBottom: 32 }}>
          Restricted access. Enter password to proceed.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3a4a5c', marginBottom: 6 }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={e => { setPw(e.target.value); setError(''); }}
              placeholder="Enter access password"
              autoFocus
              style={{
                width: '100%',
                padding: '11px 44px 11px 14px',
                borderRadius: 8,
                border: error ? '1.5px solid #dc3545' : '1.5px solid #CBD5E1',
                fontSize: 15,
                color: '#0e1b3d',
                background: '#FAFBFD',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { if (!error) e.currentTarget.style.borderColor = '#1360D2'; }}
              onBlur={e => { if (!error) e.currentTarget.style.borderColor = '#CBD5E1'; }}
            />
            {/* Show/hide toggle */}
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#8898aa',
                display: 'flex', alignItems: 'center', padding: 2,
              }}
            >
              {showPw ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {error && (
            <p style={{ color: '#dc3545', fontSize: 13, marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </p>
          )}

          <button
            type="submit"
            style={{
              marginTop: 24,
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(90deg, #1360D2 0%, #2176e8 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: 0.3,
              boxShadow: '0 3px 12px rgba(19,96,210,0.28)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.92')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Access Portal
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#b0b8c9', marginTop: 28 }}>
          Dubai Customs · DC Open Services
        </p>
      </div>

      {/* Shake animation keyframes */}
      <style>{`
        @keyframes dt-shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-8px); }
          30%      { transform: translateX(8px); }
          45%      { transform: translateX(-6px); }
          60%      { transform: translateX(6px); }
          75%      { transform: translateX(-3px); }
          90%      { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}

// ─── BUSINESS REGISTRATION FLOW ───────────────────────────────────────────────
// New tab (Request Details, stepper preview) → Save and Proceed → full registration (BRRegistrationPage) with the
// "saved as draft" card on top and every section editable.
type BRData = {
  businessName: string; businessNameAr: string; regCategory: string; employeeCount: string;
  licenseNumber: string; licenseType: string; issuingAuthority: string;
  issueDate: string; validFrom: string; validTo: string; // YYYY-MM-DD
  phone: string; fax: string; email: string; operationalEmail: string; website: string; nocNumber: string;
};

const BR_REQUEST_ID = '1-12402908268';
const BR_VALIDATION_CODE = '1928389';

const BR_SAMPLE_BUSINESS_CODE = 'AE-1012345';

// Renew, Amend and Update Contact load an existing business into the same form.
type BRChange = { kind: 'renew' | 'amend' | 'contact'; code: string };
const BR_CHANGE_TEXT: Record<BRChange['kind'], { title: string; purpose: string; message: string }> = {
  renew: { title: 'Renew Business Code', purpose: 'Renewal',
    message: 'Review and update the business details below, then submit the request to renew the Business Code.' },
  amend: { title: 'Amend Business Registration', purpose: 'Amendment',
    message: 'Update the business details that have changed below, then submit the amendment request.' },
  contact: { title: 'Update Contact Details', purpose: 'Contact Update',
    message: 'Update the Business Contact Details below, then submit the request.' },
};

// Blank fields fall back to these so the demo always moves forward.
const BR_SAMPLE: BRData = {
  businessName: 'test', businessNameAr: 'شركة تجربة', regCategory: 'GCC based Companies', employeeCount: '0 - 5',
  licenseNumber: '1928389', licenseType: 'Commercial', issuingAuthority: 'Department of Economy & Tourism - Dubai (DET)',
  issueDate: '2026-11-01', validFrom: '2026-11-06', validTo: '2026-11-20',
  phone: '971-5-5953448', fax: '971-3-2311243', email: 'test@gmail.com', operationalEmail: 'test@gmail.com', website: '', nocNumber: '',
};

function withBRSamples(d: BRData): BRData {
  const out = { ...d };
  (Object.keys(out) as (keyof BRData)[]).forEach(k => { if (!out[k].trim()) out[k] = BR_SAMPLE[k]; });
  return out;
}

const BR_EMPLOYEE_COUNTS = ['0 - 5', '6 - 10', '11 - 50', '51 - 100', '101 - 500', '500+'];
const BR_DATE_HINT = 'Dates provided should match with the dates in the License';
const BR_PHONE_HINT = 'Country-Area-Number i.e. 971-55-1234567';
const BR_COUNTRIES = ['United Arab Emirates', 'Saudi Arabia', 'Oman', 'Qatar', 'Kuwait', 'Bahrain', 'India', 'Pakistan', 'Egypt', 'United Kingdom', 'United States'];
const BR_REGIONS: Record<string, string[]> = {
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'],
  'Saudi Arabia': ['Riyadh Province', 'Makkah Province', 'Eastern Province'],
  'India': ['Kerala', 'Maharashtra', 'Karnataka', 'Tamil Nadu'],
};
const BR_CITIES: Record<string, string[]> = {
  'Dubai': ['Dubai', 'Jebel Ali', 'Hatta'],
  'Abu Dhabi': ['Abu Dhabi', 'Al Ain', 'Ruwais'],
  'Sharjah': ['Sharjah', 'Khor Fakkan', 'Kalba'],
  'Riyadh Province': ['Riyadh', 'Al Kharj'],
  'Makkah Province': ['Jeddah', 'Makkah', 'Taif'],
  'Eastern Province': ['Dammam', 'Khobar', 'Jubail'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode'],
  'Maharashtra': ['Mumbai', 'Pune'],
};
const BR_BUSINESS_TYPES = [
  'Broker', 'Airline Agent', 'CH (Cargo Handler)', 'Courier', 'Customs Warehouse',
  'Exporter (Commercial)', 'Importer (Commercial)', 'Shipping line Agent', 'e-Commerce',
];
const BR_FACILITY_TYPES = ['Branch', 'Head Office', 'Warehouse', 'Showroom', 'Factory'];
const BR_RELATIONSHIP_TYPES = ['Parent Company', 'Subsidiary', 'Sister Company', 'Affiliate', 'Branch'];
const BR_DOCUMENT_TYPES = ['Trade License Copy', 'Proof-Airline Agent for Cargo', 'Passport Copy', 'Emirates ID Copy', 'Power of Attorney', 'Memorandum of Association', 'Other'];
const BR_LICENSE_ACTIVITIES = [
  'Access Cradles Manufacturing', 'Accidents & Liabilities Insurance', 'Accounting & Bookkeeping', 'Accounting & Office Machinery Rental',
  'Acid Manufacturing', 'Acids & Alkalines Trading', 'Acquarium Park', 'Acupuncture Therapy Clinc', 'Adhesives Manufacturing', 'Adhesives Trading',
  'Advertising Agency', 'Aerial Photography', 'Agricultural Equipment Trading', 'Agricultural Seeds Trading', 'Air Cargo Agents',
  'Air Conditioning Contracting', 'Aircraft Spare Parts Trading', 'Alcoholic Beverages Trading', 'Aluminium Products Trading', 'Animal Feed Trading',
  'Antiques Trading', 'Apparel Trading', 'Auto Spare Parts Trading', 'Bakery Products Trading', 'Batteries Trading', 'Building Materials Trading',
  'Car Rental', 'Cargo Packing Services', 'Clearing & Forwarding Services', 'Cosmetics Trading', 'Customs Brokerage', 'Electronics Trading',
  'Foodstuff Trading', 'Furniture Trading', 'General Trading', 'Jewellery Trading', 'Medical Equipment Trading', 'Shipping Lines Agents',
  'Textiles Trading', 'Watches Trading',
];
const BR_USER_DIRECTORY = [
  { firstName: 'Mohammed', lastName: 'Saeed', userCode: 'USR10234', businessCode: 'BC00871', businessName: 'Al Noor Trading LLC' },
  { firstName: 'Fatima', lastName: 'Ali', userCode: 'USR10577', businessCode: 'BC00871', businessName: 'Al Noor Trading LLC' },
  { firstName: 'Rahul', lastName: 'Menon', userCode: 'USR11002', businessCode: 'BC01245', businessName: 'Gulf Star Logistics FZE' },
];

type BRAddress = { line1: string; line2: string; street: string; area: string; poBox: string; country: string; emirate: string; city: string };
type BRFacility = { name: string; type: string; status: string };
type BRUser = {
  userCode: string; firstName: string; middleName: string; lastName: string; arabicName: string; gender: string;
  designation: string; placeOfWork: string; contactMode: string; nationality: string; dob: string; placeOfBirth: string;
  mobile: string; email: string; phone: string; fax: string; altEmail: string;
};
type BRGroup = { code: string; name: string; relationship: string };
type BRCredential = { number: string; type: string; country: string; issueDate: string; expiryDate: string };
type BRAttachment = { title: string; docType: string; fileName: string; fileType: string; fileSize: number };
type BRUserAccount = {
  loginId: string; password: string; existingPortalUser: boolean; hintQuestion: string; hintAnswer: string;
  roles: string[]; credentials: BRCredential[]; addresses: BRAddress[]; attachments: BRAttachment[];
};
type BRUserRecord = BRUser & { account: BRUserAccount };
type BRListKind = 'address' | 'carrier' | 'activity' | 'facility' | 'user' | 'group' | 'attachment';

const BR_EMPTY_ADDRESS: BRAddress = { line1: '', line2: '', street: '', area: '', poBox: '', country: '', emirate: '', city: '' };
const BR_EMPTY_USER: BRUser = {
  userCode: '', firstName: '', middleName: '', lastName: '', arabicName: '', gender: '', designation: '', placeOfWork: '',
  contactMode: '', nationality: '', dob: '', placeOfBirth: '', mobile: '', email: '', phone: '', fax: '', altEmail: '',
};
const BR_EMPTY_ACCOUNT: BRUserAccount = {
  loginId: '', password: '', existingPortalUser: false, hintQuestion: '', hintAnswer: '',
  roles: [], credentials: [], addresses: [], attachments: [],
};
const BR_EMPTY_CREDENTIAL: BRCredential = { number: '', type: '', country: '', issueDate: '', expiryDate: '' };
const BR_ROLES = ['Authorized Person', 'Broker Representative', 'Individual', 'Manager', 'Owner', 'Partner', 'Sponsor', 'Trader Representative'];
const BR_IDENTITY_TYPES = ['Emirates ID', 'Passport', 'Visa', 'National ID', 'Driving License'];
const BR_HINT_QUESTIONS = ['What is your Mothers name?', 'What is the name of your first school?', 'What is your favourite city?', 'What was the name of your first pet?'];
const BR_USER_DOCUMENT_TYPES = ['Emirates ID/National ID', 'Passport Copy', 'Visa Copy', 'Power of Attorney', 'Other'];

// ── Small building blocks ──
function FloatInput({ label, required, value, onChange, readOnly, dir, hint, onFocus, type, maxLength, className = 'dc-field--half' }: {
  label: string; required?: boolean; value: string; onChange?: (v: string) => void; readOnly?: boolean;
  dir?: 'rtl' | 'ltr'; hint?: string; onFocus?: () => void; type?: string; maxLength?: number; className?: string;
}) {
  return (
    <div className={`dc-float-wrapper ${className}`}>
      <div className="dc-float-field">
        <input className={`dc-float-input${readOnly ? ' dc-float-input--readonly' : ''}`} placeholder=" " dir={dir} type={type} maxLength={maxLength}
          value={value} readOnly={readOnly} onFocus={onFocus} onChange={e => onChange?.(e.target.value)} />
        <label className="dc-float-label">{label}{required && <span className="dc-req"> *</span>}</label>
      </div>
      {hint && <InfoTooltip tip={hint} />}
    </div>
  );
}

function BRNote({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'danger' | 'success' }) {
  return (
    <div className={`dc-br-note${tone === 'info' ? '' : ` dc-br-note--${tone}`}`}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
        <path d="M9.9974 13.3327V9.99935M9.9974 6.66602H10.0057M18.3307 9.99935C18.3307 14.6017 14.5998 18.3327 9.9974 18.3327C5.39502 18.3327 1.66406 14.6017 1.66406 9.99935C1.66406 5.39698 5.39502 1.66602 9.9974 1.66602C14.5998 1.66602 18.3307 5.39698 18.3307 9.99935Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div>{children}</div>
    </div>
  );
}

function BRSummaryField({ label, value, dir }: { label: string; value: string; dir?: 'rtl' }) {
  return (
    <div className="dc-success-field">
      <span className="dc-success-field__label">{label}</span>
      <span className="dc-success-field__value" dir={dir} style={dir ? { textAlign: 'left' } : undefined}>{value || '—'}</span>
    </div>
  );
}

function BRPageShell({ service, navigate, title, parent, tab = 'new', children }: {
  service: ServiceDef; navigate: (page: Page) => void; title: string; children: React.ReactNode;
  parent?: { label: string; onClick: () => void }; tab?: FormTab;
}) {
  const back = parent?.onClick ?? (() => navigate({ name: 'form', serviceId: service.id }));
  return (
    <>
      <HeroBanner title={service.title} subtitle={service.subtitle} />
      <div className="dc-container">
        <Breadcrumb items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          { label: 'Service Center', onClick: () => navigate({ name: 'home' }) },
          { label: 'Dubai Trade', onClick: () => navigate({ name: 'home' }) },
          { label: service.title, onClick: () => navigate({ name: 'form', serviceId: service.id }) },
          ...(parent ? [parent] : []),
          { label: title },
        ]} />
        <div className="dc-info-header">
          <button className="dc-back-btn" onClick={back}><ArrowLeft /></button>
          <h2 className="dc-info-header__title">{title}</h2>
        </div>
        <div className="dc-form-tabs">
          {formTabsFor(service.id).map(t => (
            <button key={t} className={`dc-form-tab ${t === tab ? 'dc-form-tab--active' : ''}`}
              onClick={() => goFormTab(navigate, service.id, t)}>
              {FORM_TAB_LABELS[t]}
            </button>
          ))}
        </div>
        {children}
      </div>
    </>
  );
}

function EditIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
}
function TrashIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}

// A page section the side menu / stepper can jump to. The heading collapses it; the body is only
// hidden (not unmounted) so half-typed entry fields survive a collapse.
type BRSectionCtl = { id: string; collapsed: boolean; onToggle: () => void };

function BRSection({ id, collapsed, onToggle, title, count, aside, children }: BRSectionCtl & {
  title: string; count?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section id={`br-${id}`} className="dc-form-section dc-br-section">
      <div className="dc-br-list__head">
        <h4 className="dc-form-section__heading" style={{ margin: 0 }}>
          <button type="button" className="dc-br-section__toggle" aria-expanded={!collapsed} aria-controls={`br-${id}-body`} onClick={onToggle}>
            {title}
            {count !== undefined && <span className="dc-br-section__count">{count}</span>}
          </button>
        </h4>
        <div className="dc-br-section__right">
          {aside}
          {/* Same toggle as the title; hidden from the accessibility tree to avoid a duplicate control */}
          <button type="button" className="dc-br-section__chev-btn" tabIndex={-1} aria-hidden="true" onClick={onToggle}>
            <svg className={`dc-br-section__chev${collapsed ? '' : ' dc-br-section__chev--open'}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </div>
      <div id={`br-${id}-body`} className="dc-br-section__body" hidden={collapsed}>{children}</div>
    </section>
  );
}

function BRListSection<T>({ title, columns, rows, cells, form, action, editingIndex = null, onEdit, onDelete, note, emptyText, ...ctl }: BRSectionCtl & {
  title: string; columns: string[]; rows: T[]; cells: (row: T) => React.ReactNode[];
  form?: React.ReactNode; action?: React.ReactNode; editingIndex?: number | null; onEdit?: (i: number) => void; onDelete?: (i: number) => void;
  note?: React.ReactNode; emptyText?: string;
}) {
  const hasActions = !!(onEdit || onDelete);
  return (
    <BRSection {...ctl} title={title} count={rows.length}
      aside={<>
        {editingIndex !== null && <span className="dc-br-editing">Editing row {editingIndex + 1} · Reset to cancel</span>}
        {action}
      </>}>
      {note}
      {form}
      <div style={{ overflowX: 'auto' }}>
        <table className="dc-charges__table dc-br-table">
          <thead>
            <tr>
              {columns.map(c => <th key={c}>{c}</th>)}
              {hasActions && <th className="dc-br-table__actions">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="dc-br-table__empty" colSpan={columns.length + (hasActions ? 1 : 0)}>
                  {emptyText ?? 'No records added yet. Enter the details above and click Save.'}
                </td>
              </tr>
            ) : rows.map((row, i) => (
              <tr key={i} className={i === editingIndex ? 'dc-br-table__row--selected' : undefined}>
                {cells(row).map((c, j) => <td key={j}>{c}</td>)}
                {hasActions && (
                  <td className="dc-br-table__actions">
                    {onEdit && <button className="dc-br-icon-btn" title="Edit" aria-label={`Edit ${title} row ${i + 1}`} onClick={() => onEdit(i)}><EditIcon /></button>}
                    {onDelete && <button className="dc-br-icon-btn dc-br-icon-btn--danger" title="Delete" aria-label={`Delete ${title} row ${i + 1}`} onClick={() => onDelete(i)}><TrashIcon /></button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BRSection>
  );
}

// ── Page navigation: sticky side menu, or the same sections split into steps ──
type BRNavItem = { id: string; label: string; done: boolean; optional?: boolean };
const BR_SECTION_LABELS: Record<string, string> = {
  business: 'Business Details', license: 'License Details', contact: 'Business Contact Details', types: 'Business Types',
  epl: 'Emirates Post License (EPL) Details', carriers: 'Carrier Codes', activities: 'License Activities',
  addresses: 'Business Addresses', facilities: 'Facility Details', users: 'User Registration', groups: 'Group Information',
  attachments: 'Attachments', vat: 'VAT Registration Certificate', validation: 'Validation Code',
};
type BRStep = { label: string; ids: string[] };
// Steps carry the section names; only the three request sections share one step.
const BR_REQUEST_DETAIL_IDS = ['business', 'license', 'contact'];
const brSteps = (items: BRNavItem[]): BRStep[] => [
  { label: 'Request Details', ids: BR_REQUEST_DETAIL_IDS },
  ...items.filter(s => !BR_REQUEST_DETAIL_IDS.includes(s.id)).map(s => ({ label: s.label, ids: [s.id] })),
];
// First page (New tab): Request Details is being filled; the rest unlock after Save and Proceed.
const BR_FIRST_PAGE_IDS = ['business', 'license', 'contact', 'types', 'activities', 'addresses', 'facilities', 'users', 'groups', 'attachments', 'vat'];
const BR_FIRST_PAGE_LOCKED = BR_FIRST_PAGE_IDS.slice(3);
const BR_FIRST_PAGE_STEPS = brSteps(BR_FIRST_PAGE_IDS.map(id => ({ id, label: BR_SECTION_LABELS[id], done: false })));

function CheckMark() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}

function BRSideNav({ items, active, onGo, rail, onToggleRail, lockedIds = [] }: {
  items: BRNavItem[]; active: string; onGo: (id: string) => void; rail: boolean; onToggleRail: () => void; lockedIds?: string[];
}) {
  const required = items.filter(s => !s.optional);
  const doneCount = required.filter(s => s.done).length;
  const listRef = useRef<HTMLOListElement>(null);
  // On narrow screens the menu is a horizontal bar: keep the active chip in view.
  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>('.dc-br-nav__item--active');
    if (!list || !item || list.scrollWidth <= list.clientWidth) return;
    list.scrollLeft += item.getBoundingClientRect().left - list.getBoundingClientRect().left - 16;
  }, [active]);
  return (
    <nav className={`dc-br-nav${rail ? ' dc-br-nav--rail' : ''}`} aria-label="Form sections">
      <div className="dc-br-nav__top">
        {rail ? (
          <span className="dc-br-nav__mini" title={`${doneCount} of ${required.length} required sections complete`}>{doneCount}/{required.length}</span>
        ) : (
          <div className="dc-br-nav__progress">
            <span><strong>{doneCount} of {required.length}</strong> required sections complete</span>
            <div className="dc-br-nav__bar"><div style={{ width: `${(doneCount / required.length) * 100}%` }} /></div>
          </div>
        )}
        <button type="button" className="dc-br-nav__collapse" onClick={onToggleRail} aria-expanded={!rail}
          aria-label={rail ? 'Expand section menu' : 'Collapse section menu'} title={rail ? 'Expand menu' : 'Collapse menu'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: rail ? 'rotate(180deg)' : undefined }}>
            <polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>
          </svg>
        </button>
      </div>
      <ol className="dc-br-nav__list" ref={listRef}>
        {items.map((s, i) => (
          <li key={s.id}>
            <button type="button" className={`dc-br-nav__item${s.id === active ? ' dc-br-nav__item--active' : ''}`}
              aria-current={s.id === active ? 'location' : undefined} onClick={() => onGo(s.id)}
              disabled={lockedIds.includes(s.id)}
              title={lockedIds.includes(s.id) ? 'Available after Save and Proceed' : rail ? s.label : undefined} aria-label={`${s.label}${s.optional ? ' (optional)' : ''}${s.done ? ', complete' : ''}`}>
              <span className={`dc-br-nav__mark${s.done ? ' dc-br-nav__mark--done' : ''}`} aria-label={s.done ? 'Complete' : undefined}>
                {s.done ? <CheckMark /> : i + 1}
              </span>
              <span className="dc-br-nav__label">{s.label}{s.optional && <em>Optional</em>}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Side stepper or top stepper; the choice carries from the first page to the full form (remembered per browser).
type BRLayout = 'menu' | 'steps';
function useBRLayout() {
  const [layout, setLayoutState] = useState<BRLayout>(() => {
    try { return localStorage.getItem('br-layout') === 'menu' ? 'menu' : 'steps'; } catch { return 'steps'; }
  });
  const setLayout = (l: BRLayout) => {
    setLayoutState(l);
    try { localStorage.setItem('br-layout', l); } catch { /* storage unavailable */ }
  };
  return [layout, setLayout] as const;
}

// The side stepper can shrink to a narrow rail of numbers/ticks; remembered per browser.
function useBRNavRail() {
  const [rail, setRail] = useState(() => { try { return localStorage.getItem('br-nav-rail') === '1'; } catch { return false; } });
  const toggle = () => setRail(r => {
    try { localStorage.setItem('br-nav-rail', r ? '0' : '1'); } catch { /* storage unavailable */ }
    return !r;
  });
  return [rail, toggle] as const;
}

// The section (by id, comma-separated) currently under the sticky header while scrolling.
function useBRActiveSection(sectionIds: string, enabled = true) {
  const ids = sectionIds.split(',');
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    if (!enabled) return;
    const list = sectionIds.split(',');
    const onScroll = () => {
      const line = (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--br-offset')) || 96) + 40;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = list[0];
      for (const id of list) {
        const el = document.getElementById(`br-${id}`);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActive(atBottom ? list[list.length - 1] : current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sectionIds, enabled]);
  return [active, setActive] as const;
}

function BRLayoutSwitch({ layout, onChange }: { layout: BRLayout; onChange: (l: BRLayout) => void }) {
  return (
    <div className="dc-br-viewbar">
      <span>Layout</span>
      <div className="dc-br-viewbar__toggle" role="group" aria-label="Page layout">
        <button type="button" aria-pressed={layout === 'menu'} onClick={() => onChange('menu')}>Side stepper</button>
        <button type="button" aria-pressed={layout === 'steps'} onClick={() => onChange('steps')}>Top stepper</button>
      </div>
    </div>
  );
}

// Sticky offsets follow the site header, which wraps to two rows on narrow screens. Sections must also
// clear the sticky stepper, or the side menu once it turns into a bar below 1100px.
function useBRStickyOffsets(enabled: boolean, dep?: unknown) {
  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    const measure = () => {
      const header = document.querySelector('.dc-navbar')?.getBoundingClientRect().height ?? 60;
      const stacked = window.matchMedia('(max-width: 1100px)').matches;
      const bar = document.querySelector('.dc-br-steps') ?? (stacked ? document.querySelector('.dc-br-nav') : null);
      const top = Math.round(header) + (stacked ? 8 : 16);
      root.style.setProperty('--br-top', `${top}px`);
      root.style.setProperty('--br-offset', `${top + (bar ? Math.round(bar.getBoundingClientRect().height) + 8 : 0)}px`);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      root.style.removeProperty('--br-top');
      root.style.removeProperty('--br-offset');
    };
  }, [enabled, dep]);
}

function BRStepper({ steps, items, current, onGo, lockedAfter }: {
  steps: BRStep[]; items: BRNavItem[]; current: number; onGo: (step: number) => void; lockedAfter?: number;
}) {
  return (
    <div className="dc-br-steps">
    <ol className="dc-br-steps__list" aria-label="Steps">
      {steps.map(({ label, ids }, i) => {
        const own = items.filter(s => ids.includes(s.id));
        const required = own.filter(s => !s.optional);
        const done = required.length ? required.every(s => s.done) : own.some(s => s.done);
        const state = i === current ? 'current' : done ? 'done' : 'todo';
        return (
          <li key={label} className={`dc-br-steps__step dc-br-steps__step--${state}`}>
            <button type="button" onClick={() => onGo(i)} aria-current={i === current ? 'step' : undefined}
              disabled={lockedAfter !== undefined && i > lockedAfter} title={lockedAfter !== undefined && i > lockedAfter ? 'Available after Save and Proceed' : undefined}>
              <span className="dc-br-steps__mark">{state === 'done' ? <CheckMark /> : i + 1}</span>
              <span className="dc-br-steps__label">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
    <p className="dc-br-steps__caption">Step {current + 1} of {steps.length} · {steps[current]?.label}</p>
    </div>
  );
}

function BRModal({ title, onClose, onSave, saveLabel = 'Save', width = 900, children }: {
  title: string; onClose: () => void; onSave: () => void; saveLabel?: string; width?: number; children: React.ReactNode;
}) {
  return (
    <div className="dc-modal-overlay dc-br-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dc-br-modal" style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={title}>
        <div className="dc-br-modal__head">
          <h3>{title}</h3>
          <button className="dc-br-modal__close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="dc-br-modal__body">{children}</div>
        <div className="dc-br-modal__foot">
          <button className="dc-btn dc-btn--outline" onClick={onClose}>Cancel</button>
          <button className="dc-btn dc-btn--primary" onClick={onSave}>{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}

function BRDeleteConfirm({ what, onNo, onYes }: { what: string; onNo: () => void; onYes: () => void }) {
  return (
    <div className="dc-modal-overlay dc-br-overlay dc-br-overlay--center" onMouseDown={e => { if (e.target === e.currentTarget) onNo(); }}>
      <div className="dc-br-modal" style={{ maxWidth: 440, textAlign: 'center', padding: '36px 32px 32px' }} role="alertdialog" aria-label="Confirm delete">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="32" fill="#FEF3C7"/>
            <path d="M32 18L47 44H17L32 18Z" fill="#F59E0B"/>
            <rect x="30.5" y="26" width="3" height="10" rx="1.5" fill="#fff"/>
            <circle cx="32" cy="39.5" r="1.8" fill="#fff"/>
          </svg>
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0E1B3D', margin: '0 0 10px' }}>Are you sure to delete?</h3>
        <p style={{ fontSize: 16, color: '#3D4E63', lineHeight: 1.6, margin: '0 0 28px' }}>This {what} will be removed from the request.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="dc-btn dc-btn--outline" style={{ minWidth: 120 }} onClick={onNo}>No</button>
          <button className="dc-btn dc-btn--primary" style={{ minWidth: 120 }} onClick={onYes}>Yes</button>
        </div>
      </div>
    </div>
  );
}

// ── User Code lookup (the one pop-up left: it searches existing users) ──
function BRUserCodeSearchModal({ onClose, onSelect }: { onClose: () => void; onSelect: (u: typeof BR_USER_DIRECTORY[number]) => void }) {
  const [code, setCode] = useState('');
  const [results, setResults] = useState<typeof BR_USER_DIRECTORY | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const go = () => {
    const q = code.trim().toLowerCase();
    setResults(BR_USER_DIRECTORY.filter(u => !q || u.userCode.toLowerCase().includes(q)));
    setPicked(null);
  };
  return (
    <BRModal title="User Code Search" saveLabel="OK" width={860} onClose={onClose} onSave={() => {
      const user = BR_USER_DIRECTORY.find(u => u.userCode === picked) ?? results?.[0] ?? BR_USER_DIRECTORY[0];
      onSelect(user);
    }}>
      <div className="dc-form-row" style={{ alignItems: 'flex-start' }}>
        <div className="dc-float-wrapper dc-field--half">
          <div className="dc-float-field">
            <input className="dc-float-input" placeholder=" " value={code} autoFocus
              onChange={e => setCode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') go(); }} />
            <label className="dc-float-label">User Code</label>
          </div>
          <InfoTooltip tip="Please enter existing User Code, e.g. USR10234" />
        </div>
        <div className="dc-field--half" style={{ display: 'flex', alignItems: 'center', height: 56 }}>
          <button className="dc-btn dc-btn--primary" style={{ minWidth: 120 }} onClick={go}>Go</button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="dc-charges__table dc-br-table">
          <thead>
            <tr><th>First Name</th><th>Last Name</th><th>User Code</th><th>Business Code</th><th style={{ textAlign: 'left' }}>Business Name</th></tr>
          </thead>
          <tbody>
            {!results ? (
              <tr><td className="dc-br-table__empty" colSpan={5}>Enter a User Code and click Go.</td></tr>
            ) : results.length === 0 ? (
              <tr><td className="dc-br-table__empty" colSpan={5}>No users found for "{code}".</td></tr>
            ) : results.map(u => (
              <tr key={u.userCode} className={`dc-br-table__row--selectable${u.userCode === picked ? ' dc-br-table__row--selected' : ''}`}
                onClick={() => setPicked(u.userCode)} aria-selected={u.userCode === picked}>
                <td>{u.firstName}</td><td>{u.lastName}</td><td>{u.userCode}</td><td>{u.businessCode}</td>
                <td style={{ textAlign: 'left' }}>{u.businessName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BRModal>
  );
}

// ── Inline entry forms (fields sit above each table; Save adds or updates a row) ──
function BREntryActions({ onSave, onReset }: { onSave: () => void; onReset: () => void }) {
  return (
    <div className="dc-br-entry__actions">
      <button type="button" className="dc-btn dc-btn--primary" onClick={onSave}>Save</button>
      <button type="button" className="dc-btn dc-btn--outline" onClick={onReset}>Reset</button>
    </div>
  );
}

type BREntryProps<T> = { initial: T; onSave: (x: T) => void; onReset: () => void };

function BRAddressForm({ initial, onSave, onReset }: BREntryProps<BRAddress>) {
  const [a, setA] = useState(initial);
  const set = (k: keyof BRAddress) => (v: string) => setA(p => ({ ...p, [k]: v }));
  const regions = a.country ? (BR_REGIONS[a.country] ?? ['Capital Region', 'Northern Region', 'Southern Region']) : [];
  const cities = a.emirate ? (BR_CITIES[a.emirate] ?? [a.emirate]) : [];
  return (
    <div className="dc-br-entry">
      <FloatInput label="Address Line 1" required value={a.line1} onChange={set('line1')} />
      <FloatInput label="Address Line 2" required value={a.line2} onChange={set('line2')} />
      <FloatInput label="Street" value={a.street} onChange={set('street')} />
      <FloatInput label="Area" value={a.area} onChange={set('area')} />
      <FloatInput label="P.O.Box" required value={a.poBox} onChange={set('poBox')} />
      <FloatDropdown label="Country" required value={a.country} options={BR_COUNTRIES}
        onChange={v => setA(p => ({ ...p, country: v, emirate: '', city: '' }))} />
      <div className="dc-float-wrapper">
        <FloatDropdown label="Emirate/State/Province" required value={a.emirate} options={regions} disabled={!a.country}
          onChange={v => setA(p => ({ ...p, emirate: v, city: '' }))} />
        {!a.country && <InfoTooltip tip="Select Country first" />}
      </div>
      <div className="dc-float-wrapper">
        <FloatDropdown label="City" required value={a.city} options={cities} disabled={!a.emirate} onChange={set('city')} />
        {!a.emirate && <InfoTooltip tip="Select Emirate/State/Province first" />}
      </div>
      <BREntryActions onReset={onReset} onSave={() => onSave({
        ...a,
        line1: a.line1 || 'Office 1204, Business Bay Tower', line2: a.line2 || 'Business Bay', poBox: a.poBox || '12345',
        country: a.country || 'United Arab Emirates', emirate: a.emirate || 'Dubai', city: a.city || 'Dubai',
      })} />
    </div>
  );
}

function BRCarrierCodeForm({ initial, onSave, onReset }: BREntryProps<string>) {
  const [c, setC] = useState(initial);
  return (
    <>
      <BRNote tone="danger">Note: It is mandatory to upload the "Proof-Airline Agent for Cargo" document for every carrier being registered.</BRNote>
      <div className="dc-br-entry">
        <FloatInput label="Carrier Code" required value={c} onChange={setC} />
        <BREntryActions onReset={onReset} onSave={() => onSave(c.trim().toUpperCase() || 'EK')} />
      </div>
    </>
  );
}

function BRLicenseActivityForm({ initial, licenseType, onSave, onReset }: BREntryProps<string> & { licenseType: string }) {
  const [a, setA] = useState(initial);
  return (
    <div className="dc-br-entry">
      <div className="dc-float-wrapper">
        <FloatDropdown label="License Activity" required value={a} onChange={setA} options={BR_LICENSE_ACTIVITIES} />
        <InfoTooltip tip={`Select an activity for the ${licenseType || 'selected'} license. Type in the list to search.`} />
      </div>
      <BREntryActions onReset={onReset} onSave={() => onSave(a || BR_LICENSE_ACTIVITIES[0])} />
    </div>
  );
}

function BRFacilityForm({ initial, onSave, onReset }: BREntryProps<BRFacility>) {
  const [f, setF] = useState(initial);
  return (
    <div className="dc-br-entry">
      <FloatInput label="Facility Name" required value={f.name} onChange={v => setF(p => ({ ...p, name: v }))} />
      <FloatDropdown label="Facility Type" required value={f.type} onChange={v => setF(p => ({ ...p, type: v }))} options={BR_FACILITY_TYPES} />
      <FloatInput label="Status" required readOnly value={f.status} />
      <BREntryActions onReset={onReset} onSave={() => onSave({ ...f, name: f.name || 'Main Branch', type: f.type || 'Branch' })} />
    </div>
  );
}

// User fields shared by the inline User Registration entry and the full User Registration page.
function BRUserDetailFields({ u, set, onSearch }: { u: BRUser; set: (k: keyof BRUser) => (v: string) => void; onSearch: () => void }) {
  return (
    <>
      <div className="dc-float-wrapper">
        <div className="dc-float-field">
          <input className="dc-float-input dc-float-input--icon dc-float-input--readonly" placeholder=" " readOnly value={u.userCode} />
          <label className="dc-float-label">User Code</label>
          <button type="button" className="dc-float-icon-suffix" aria-label="Search existing User Code"
            style={{ pointerEvents: 'auto', cursor: 'pointer', padding: 0, color: '#1360D2' }} onClick={onSearch}>
            <SearchIcon />
          </button>
        </div>
        <InfoTooltip tip="To select an existing User, kindly click on search icon in the User Code field." />
      </div>
      <FloatInput label="First Name" required value={u.firstName} onChange={set('firstName')} />
      <FloatInput label="Middle Name" value={u.middleName} onChange={set('middleName')} />
      <FloatInput label="Last Name" required value={u.lastName} onChange={set('lastName')} />
      <FloatInput label="Full Arabic Name" dir="rtl" value={u.arabicName} onChange={set('arabicName')} />
      <FloatDropdown label="Gender" value={u.gender} onChange={set('gender')} options={['Male', 'Female']} />
      <FloatInput label="Designation" required value={u.designation} onChange={set('designation')} />
      <FloatInput label="Place of Work" value={u.placeOfWork} onChange={set('placeOfWork')} />
      <FloatDropdown label="Preferred Mode of Contact" value={u.contactMode} onChange={set('contactMode')} options={['Email', 'Mobile', 'Phone']} />
      <FloatDropdown label="Nationality" value={u.nationality} onChange={set('nationality')} options={BR_COUNTRIES} />
      <DateField label="Date of Birth" value={u.dob} onChange={set('dob')} />
      <FloatDropdown label="Place of Birth" value={u.placeOfBirth} onChange={set('placeOfBirth')} options={BR_COUNTRIES} />
    </>
  );
}

function BRUserContactFields({ u, set }: { u: BRUser; set: (k: keyof BRUser) => (v: string) => void }) {
  return (
    <>
      <PhoneField label="Mobile" required value={u.mobile} onChange={set('mobile')} tooltip={BR_PHONE_HINT} />
      <FloatInput label="Email" required value={u.email} onChange={set('email')} />
      <PhoneField label="Phone" required value={u.phone} onChange={set('phone')} tooltip={BR_PHONE_HINT} />
      <PhoneField label="Fax" required value={u.fax} onChange={set('fax')} tooltip={BR_PHONE_HINT} />
      <FloatInput label="Alternate Email" value={u.altEmail} onChange={set('altEmail')} />
    </>
  );
}

const withUserSamples = (u: BRUser): BRUser => ({
  ...u,
  firstName: u.firstName || 'Ahmed', lastName: u.lastName || 'Khan', designation: u.designation || 'Operations Manager',
  mobile: u.mobile || '971-55-1234567', phone: u.phone || '971-4-1234567', fax: u.fax || '971-4-1234568',
  email: u.email || 'ahmed.khan@test.com',
});

function BRAddUserButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="dc-btn dc-btn--blue dc-br-add-user" onClick={onClick}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add User
    </button>
  );
}

function BRCredentialForm({ initial, onSave, onReset }: BREntryProps<BRCredential>) {
  const [c, setC] = useState(initial);
  const set = (k: keyof BRCredential) => (v: string) => setC(p => ({ ...p, [k]: v }));
  return (
    <div className="dc-br-entry">
      <FloatInput label="Identity Number" required value={c.number} onChange={set('number')} />
      <FloatDropdown label="Identity Type" required value={c.type} onChange={set('type')} options={BR_IDENTITY_TYPES} />
      <FloatDropdown label="Issuing Country" required value={c.country} onChange={set('country')} options={BR_COUNTRIES} />
      <DateField label="Issuing Date" required value={c.issueDate} onChange={set('issueDate')} />
      <DateField label="Expiry Date" required value={c.expiryDate} onChange={set('expiryDate')} />
      <BREntryActions onReset={onReset} onSave={() => onSave({
        number: c.number || '784-1990-1234567-1', type: c.type || 'Emirates ID', country: c.country || 'United Arab Emirates',
        issueDate: c.issueDate || '2024-01-15', expiryDate: c.expiryDate || '2029-01-14',
      })} />
    </div>
  );
}

// Rows + inline-entry editing + delete confirmation for one list on the User Registration page.
function useBREntryList<T>(initial: T[]) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<number | null>(null);
  const [rev, setRev] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const reset = () => { setEditing(null); setRev(r => r + 1); };
  return {
    rows, editing, pendingDelete, reset,
    formKey: `${editing ?? 'new'}-${rev}`,
    save: (item: T) => {
      setRows(list => editing === null ? [...list, item] : list.map((x, i) => i === editing ? item : x));
      reset();
    },
    edit: (i: number) => setEditing(i),
    askDelete: (i: number) => setPendingDelete(i),
    cancelDelete: () => setPendingDelete(null),
    confirmDelete: () => {
      if (pendingDelete === null) return;
      setRows(list => list.filter((_, i) => i !== pendingDelete));
      if (editing === pendingDelete) reset();
      else if (editing !== null && editing > pendingDelete) setEditing(editing - 1);
      setPendingDelete(null);
    },
  };
}

// ── User Registration (opened from the User Registration section's Add User or a row's Edit) ──
function BRUserRegistrationPage({ service, navigate, initial, onSave, onBack, parentTitle, tab }: {
  service: ServiceDef; navigate: (page: Page) => void; initial: BRUserRecord;
  onSave: (u: BRUserRecord) => void; onBack: () => void; parentTitle: string; tab: FormTab;
}) {
  const { account, ...details } = initial;
  const [u, setU] = useState<BRUser>(details);
  const [acc, setAcc] = useState(account);
  const credentials = useBREntryList(account.credentials);
  const addresses = useBREntryList(account.addresses);
  const attachments = useBREntryList(account.attachments);
  const [searching, setSearching] = useState(false);
  const [loginCheck, setLoginCheck] = useState<'available' | 'verified' | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const sec = (id: string): BRSectionCtl => ({ id, collapsed: !!collapsed[id], onToggle: () => setCollapsed(c => ({ ...c, [id]: !c[id] })) });
  const set = (k: keyof BRUser) => (v: string) => setU(p => ({ ...p, [k]: v }));
  const setA = <K extends keyof BRUserAccount>(k: K, v: BRUserAccount[K]) => setAcc(p => ({ ...p, [k]: v }));

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const loginId = () => acc.loginId.trim() || `${u.firstName}${u.lastName}`.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16) || 'NEWUSER01';
  const checkLogin = (result: 'available' | 'verified') => { setA('loginId', loginId()); setLoginCheck(result); };
  const toggleRole = (r: string) => setA('roles', acc.roles.includes(r) ? acc.roles.filter(x => x !== r) : [...acc.roles, r]);

  const pending = credentials.pendingDelete !== null ? { what: 'user credential', list: credentials }
    : addresses.pendingDelete !== null ? { what: 'user address', list: addresses }
    : attachments.pendingDelete !== null ? { what: 'attachment', list: attachments } : null;

  const save = () => onSave({
    ...withUserSamples(u),
    account: {
      ...acc, loginId: loginId(), hintQuestion: acc.hintQuestion || BR_HINT_QUESTIONS[0],
      credentials: credentials.rows, addresses: addresses.rows, attachments: attachments.rows,
    },
  });

  return (
    <BRPageShell service={service} navigate={navigate} title="User Registration" tab={tab} parent={{ label: parentTitle, onClick: onBack }}>
      <div className="dc-form-card">
        <BRSection {...sec('user-details')} title="User Details">
          <div className="dc-br-fields"><BRUserDetailFields u={u} set={set} onSearch={() => setSearching(true)} /></div>
        </BRSection>

        <BRSection {...sec('user-contact')} title="User Contact Details">
          <div className="dc-br-fields"><BRUserContactFields u={u} set={set} /></div>
        </BRSection>

        <BRSection {...sec('user-login')} title="Login Details">
          <BRNote>Please Note: Login Id once created cannot be removed</BRNote>
          {loginCheck && (
            <BRNote tone="success">{loginCheck === 'available' ? 'Login ID is Available' : 'Login details verified for the existing Dubai Trade Portal user'}</BRNote>
          )}
          <div className="dc-br-fields">
            <FloatInput label="Login Id" required value={acc.loginId} onChange={v => { setA('loginId', v); setLoginCheck(null); }} />
            <FloatInput label="Password (Max 16 Char)" required type="password" maxLength={16} value={acc.password} onChange={v => setA('password', v)} />
            {!acc.existingPortalUser && (
              <>
                <FloatDropdown label="Hint Question" required value={acc.hintQuestion} onChange={v => setA('hintQuestion', v)} options={BR_HINT_QUESTIONS} />
                <FloatInput label="Hint Answer" required value={acc.hintAnswer} onChange={v => setA('hintAnswer', v)} />
              </>
            )}
          </div>
          <label className="dc-br-check" style={{ margin: '20px 0 0' }}>
            <input type="checkbox" checked={acc.existingPortalUser}
              onChange={e => { setA('existingPortalUser', e.target.checked); setLoginCheck(null); }} />
            Already Existing Dubai Trade Portal User
          </label>
          <div className="dc-br-login-actions">
            <button type="button" className="dc-btn dc-btn--outline" disabled={acc.existingPortalUser} onClick={() => checkLogin('available')}>Check Login Availability</button>
            <button type="button" className="dc-btn dc-btn--outline" disabled={!acc.existingPortalUser} onClick={() => checkLogin('verified')}>Check Login Details</button>
          </div>
        </BRSection>

        <BRSection {...sec('user-roles')} title="Roles"
          aside={<span className="dc-br-count">{acc.roles.length} of {BR_ROLES.length} selected</span>}>
          <div className="dc-br-type-grid" role="group" aria-label="Roles">
            {BR_ROLES.map(r => (
              <label key={r} className={`dc-br-type${acc.roles.includes(r) ? ' dc-br-type--checked' : ''}`}>
                <input type="checkbox" checked={acc.roles.includes(r)} onChange={() => toggleRole(r)} />
                {r}
              </label>
            ))}
          </div>
        </BRSection>

        <BRListSection {...sec('user-credentials')} title="User Credentials"
          columns={['Identity Number', 'Identity Type', 'Issue Date', 'Expiry Date', 'Issuing Country']}
          rows={credentials.rows} cells={c => [c.number, c.type, fmtDate(c.issueDate), fmtDate(c.expiryDate), c.country]}
          form={<BRCredentialForm key={credentials.formKey}
            initial={credentials.editing !== null ? credentials.rows[credentials.editing] : BR_EMPTY_CREDENTIAL}
            onSave={credentials.save} onReset={credentials.reset} />}
          editingIndex={credentials.editing} onEdit={credentials.edit} onDelete={credentials.askDelete} />

        <BRListSection {...sec('user-addresses')} title="User Address" columns={['Address Line 1', 'Country', 'City', 'P.O.Box']}
          rows={addresses.rows} cells={a => [a.line1, a.country, a.city, a.poBox]}
          form={<BRAddressForm key={addresses.formKey}
            initial={addresses.editing !== null ? addresses.rows[addresses.editing] : BR_EMPTY_ADDRESS}
            onSave={addresses.save} onReset={addresses.reset} />}
          editingIndex={addresses.editing} onEdit={addresses.edit} onDelete={addresses.askDelete} />

        <BRListSection {...sec('user-attachments')} title="User Attachments"
          columns={['File Name', 'Document Title', 'Document Type', 'File Type', 'Document Size (In Bytes)']}
          rows={attachments.rows} cells={a => [a.fileName, a.title, a.docType, a.fileType, a.fileSize.toLocaleString()]}
          form={<BRAttachmentForm key={attachments.formKey} docTypes={BR_USER_DOCUMENT_TYPES} fallbackType="Emirates ID/National ID"
            onSave={attachments.save} onReset={attachments.reset} />}
          onDelete={attachments.askDelete}
          note={<>
            <p className="dc-br-warn"><InfoIcon size={18} /> Uploading Trade License Copy is not required if it is issued by "Department of Economy &amp; Tourism - Dubai (DET)"</p>
            <div className="dc-br-required-docs">
              <span>Required Documents:</span>
              <ul>
                <li>Emirates ID/National ID</li>
                <li>Passport Copy</li>
                <li>Visa Copy</li>
              </ul>
            </div>
          </>} />

        <div className="dc-form-actions dc-br-actions">
          <button className="dc-btn dc-btn--outline" onClick={onBack}><ArrowLeft /> Back to Business Registration</button>
          <button className="dc-btn dc-btn--blue" onClick={save}>Save User</button>
        </div>
      </div>

      {searching && (
        <BRUserCodeSearchModal onClose={() => setSearching(false)} onSelect={found => {
          setU(p => ({ ...p, userCode: found.userCode, firstName: found.firstName, lastName: found.lastName }));
          setSearching(false);
        }} />
      )}
      {pending && <BRDeleteConfirm what={pending.what} onNo={pending.list.cancelDelete} onYes={pending.list.confirmDelete} />}
    </BRPageShell>
  );
}

function BRGroupForm({ initial, onSave, onReset }: BREntryProps<BRGroup>) {
  const [g, setG] = useState(initial);
  const lookupName = () => {
    if (g.code.trim() && !g.name) setG(p => ({ ...p, name: 'Al Noor Holding Group LLC' }));
  };
  return (
    <>
      <BRNote>Kindly provide the Group business UCID and then click on Group Business Name field.</BRNote>
      <div className="dc-br-entry">
        <FloatInput label="Group Business Code" required value={g.code} onChange={v => setG(p => ({ ...p, code: v, name: '' }))} />
        <FloatInput label="Group Business Name" required readOnly value={g.name} onFocus={lookupName} />
        <FloatDropdown label="Relationship Type" required value={g.relationship} onChange={v => setG(p => ({ ...p, relationship: v }))} options={BR_RELATIONSHIP_TYPES} />
        <BREntryActions onReset={onReset} onSave={() => onSave({
          code: g.code || 'UC00451', name: g.name || 'Al Noor Holding Group LLC', relationship: g.relationship || 'Parent Company',
        })} />
      </div>
    </>
  );
}

function BRAttachmentForm({ onSave, onReset, docTypes = BR_DOCUMENT_TYPES, fallbackType = 'Trade License Copy' }: Omit<BREntryProps<BRAttachment>, 'initial'> & {
  docTypes?: string[]; fallbackType?: string;
}) {
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('');
  return (
    <div className="dc-br-entry">
      <FloatDropdown label="Document Type" value={docType} onChange={setDocType} options={docTypes} />
      <FloatInput label="Document Title" value={title} onChange={setTitle} hint="e.g. Broker Certification" />
      <div className="dc-attachments dc-br-entry__full">
        <div className="dc-field-hint" style={{ marginBottom: 12, marginTop: 0 }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}><path d="M9.9974 13.3327V9.99935M9.9974 6.66602H10.0057M18.3307 9.99935C18.3307 14.6017 14.5998 18.3327 9.9974 18.3327C5.39502 18.3327 1.66406 14.6017 1.66406 9.99935C1.66406 5.39698 5.39502 1.66602 9.9974 1.66602C14.5998 1.66602 18.3307 5.39698 18.3307 9.99935Z" stroke="#5E6B7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Only .doc .docx .pdf .jpg .xls .xlsx .gif .bmp .txt is allowed, one file per document, file name maximum 200 characters</span>
        </div>
        <FileUploadRow multiple={false} accept=".doc,.docx,.pdf,.jpg,.jpeg,.xls,.xlsx,.gif,.bmp,.txt"
          onFilesChange={fs => setFile(fs[0] ? { name: fs[0].name.slice(0, 200), size: fs[0].size } : null)} />
      </div>
      <BREntryActions onReset={onReset} onSave={() => {
        const name = file?.name ?? 'Trade_License.pdf';
        onSave({
          fileName: name, fileType: (name.split('.').pop() ?? '').toUpperCase(), fileSize: file?.size ?? 245760,
          title: title || fallbackType, docType: docType || fallbackType,
        });
      }} />
    </div>
  );
}

// ── New Business Registration (full request, opened by Save and Proceed) ──
// ── Amend / Update Contact: Dubai Trade login first, then the registered business opens for the change ──
function BRLoginPage({ service, navigate, kind }: { service: ServiceDef; navigate: (page: Page) => void; kind: 'amend' | 'contact' }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const login = () => navigate({
    name: 'br-registration', serviceId: service.id, data: withBRSamples(BR_SAMPLE), change: { kind, code: BR_SAMPLE_BUSINESS_CODE },
  });
  return (
    <BRPageShell service={service} navigate={navigate} title="Login" tab={kind}>
      <div className="dc-form-card dc-br-login">
        <div className="dc-form-section">
          <h4 className="dc-form-section__heading">Login to Dubai Trade</h4>
          <BRNote>
            To {kind === 'amend' ? 'amend the business registration' : 'update the business contact details'}, kindly log in with your Dubai Trade account.
          </BRNote>
          <div className="dc-br-login__fields">
            <FloatInput label="User Name" required value={username} onChange={setUsername} className="" />
            <FloatInput label="Password" required type="password" value={password} onChange={setPassword} className="" />
          </div>
          <div className="dc-br-login__links">
            <a href="#" onClick={e => e.preventDefault()}>Forgot Password?</a>
            <a href="#" onClick={e => e.preventDefault()}>Forgot User Name?</a>
          </div>
          <button type="button" className="dc-btn dc-btn--blue dc-br-login__submit" onClick={login}>Login</button>
          <p className="dc-br-login__register">
            New to Dubai Trade? <a href="#" onClick={e => { e.preventDefault(); navigate({ name: 'form', serviceId: service.id, tab: 'new' }); }}>Register your business</a>
          </p>
        </div>
      </div>
    </BRPageShell>
  );
}

// ── Renew: Business Code + Validation Code; OK loads the registered business into the form for renewal ──
function BRRenewForm({ service, navigate }: { service: ServiceDef; navigate: (page: Page) => void }) {
  const [businessCode, setBusinessCode] = useState('');
  const [captcha, setCaptcha] = useState('');
  return (
    <div className="dc-form-card">
      <div className="dc-form-section">
        <h4 className="dc-form-section__heading">Renew Business Code</h4>
        <div className="dc-br-fields">
          <FloatInput label="Business Code" required value={businessCode} onChange={setBusinessCode} hint={`e.g. ${BR_SAMPLE_BUSINESS_CODE}`} />
        </div>
      </div>
      <div className="dc-form-section">
        <h4 className="dc-form-section__heading">Validation Code</h4>
        <CaptchaWidget value={captcha} onChange={setCaptcha} />
      </div>
      <div className="dc-form-actions">
        <button className="dc-btn dc-btn--outline" onClick={() => { setBusinessCode(''); setCaptcha(''); }}>Reset</button>
        <button className="dc-btn dc-btn--blue" onClick={() => navigate({
          name: 'br-registration', serviceId: service.id, data: withBRSamples(BR_SAMPLE), change: { kind: 'renew', code: businessCode.trim().toUpperCase() || BR_SAMPLE_BUSINESS_CODE },
        })}>OK</button>
      </div>
    </div>
  );
}

// ── Enquiry: Track Request by Request ID and Validation Code (or License Number); OK reopens the request to continue ──
function BREnquiryForm({ service, navigate }: { service: ServiceDef; navigate: (page: Page) => void }) {
  const [requestId, setRequestId] = useState('');
  const [code, setCode] = useState('');
  const [captcha, setCaptcha] = useState('');
  return (
    <div className="dc-form-card">
      <div className="dc-form-section">
        <h4 className="dc-form-section__heading">Track Request</h4>
        <div className="dc-br-fields">
          <FloatInput label="Request ID" required value={requestId} onChange={setRequestId} hint={`e.g. ${BR_REQUEST_ID}`} />
          <FloatInput label="Validation Code / License Number" required value={code} onChange={setCode} hint={`e.g. ${BR_VALIDATION_CODE}`} />
        </div>
      </div>
      <div className="dc-form-section">
        <h4 className="dc-form-section__heading">Validation Code</h4>
        <CaptchaWidget value={captcha} onChange={setCaptcha} />
      </div>
      <div className="dc-form-actions">
        <button className="dc-btn dc-btn--outline" onClick={() => { setRequestId(''); setCode(''); setCaptcha(''); }}>Reset</button>
        <button className="dc-btn dc-btn--blue" onClick={() => navigate({ name: 'br-registration', serviceId: service.id, data: withBRSamples(BR_SAMPLE) })}>OK</button>
      </div>
    </div>
  );
}

// ── Confirmation after Submit: request reference details, with Print Request (the submitted details) and Print Screen ──
function BRSubmittedPage({ service, navigate, data }: { service: ServiceDef; navigate: (page: Page) => void; data: BRData }) {
  const [requestDate] = useState(() => {
    const t = new Date();
    return [t.getDate(), t.getMonth() + 1].map(n => String(n).padStart(2, '0')).join('-') + `-${t.getFullYear()}`;
  });
  const printRequest = () => {
    document.body.classList.add('br-print-request');
    const done = () => { document.body.classList.remove('br-print-request'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
  };
  const reference = (
    <div className="dc-success-grid">
      <BRSummaryField label="Request ID" value={BR_REQUEST_ID} />
      <BRSummaryField label="Request Date" value={requestDate} />
      <div className="dc-success-field">
        <span className="dc-success-field__label">Status</span>
        <span className="dc-badge dc-badge--success">Submitted</span>
      </div>
      <BRSummaryField label="Validation Code" value={BR_VALIDATION_CODE} />
    </div>
  );
  return (
    <BRPageShell service={service} navigate={navigate} title="Service Request Detail">
      <div className="dc-form-card dc-br-confirm">
        <div className="dc-form-section">
          <h3 className="dc-br-confirm__title">Confirmation</h3>
          <div className="dc-success-alert">
            <div className="dc-success-alert__left">
              <CheckCircle />
              <div>
                <div className="dc-success-alert__title">Request Submitted Successfully</div>
                <div className="dc-success-alert__msg">
                  New registration request has been sent for approval. Please note the following information for your reference.
                </div>
              </div>
            </div>
          </div>
          {reference}
          <div className="dc-form-actions dc-form-actions--center dc-no-print">
            <button className="dc-btn dc-btn--outline" onClick={printRequest}><PrintIcon /> Print Request</button>
            <button className="dc-btn dc-btn--outline" onClick={() => window.print()}><PrintIcon /> Print Screen</button>
          </div>
        </div>
      </div>

      {/* Printed only by Print Request */}
      <div className="dc-br-print-request">
        <h2 className="dc-br-print-request__title">{service.title}</h2>
        <h3 className="dc-br-confirm__title">Request Details</h3>
        {reference}
        <h3 className="dc-br-confirm__title">Business Details</h3>
        <div className="dc-success-grid">
          <BRSummaryField label="Business Name" value={data.businessName} />
          <BRSummaryField label="Business Name (Arabic)" value={data.businessNameAr} dir="rtl" />
          <BRSummaryField label="Registration Category" value={data.regCategory} />
          <BRSummaryField label="No. of Employee" value={data.employeeCount} />
        </div>
        <h3 className="dc-br-confirm__title">License Details</h3>
        <div className="dc-success-grid">
          <BRSummaryField label="License Number" value={data.licenseNumber} />
          <BRSummaryField label="License Type" value={data.licenseType} />
          <BRSummaryField label="Issuing Authority" value={data.issuingAuthority} />
          <BRSummaryField label="Issue Date" value={data.issueDate} />
          <BRSummaryField label="Valid From" value={data.validFrom} />
          <BRSummaryField label="Valid To" value={data.validTo} />
        </div>
        <h3 className="dc-br-confirm__title">Business Contact Details</h3>
        <div className="dc-success-grid">
          <BRSummaryField label="Phone" value={data.phone} />
          <BRSummaryField label="Fax" value={data.fax} />
          <BRSummaryField label="Email" value={data.email} />
          <BRSummaryField label="Operational Email" value={data.operationalEmail} />
          {data.website && <BRSummaryField label="Website" value={data.website} />}
        </div>
      </div>
    </BRPageShell>
  );
}

function BRRegistrationPage({ service, navigate, data, change }: { service: ServiceDef; navigate: (page: Page) => void; data: BRData; change?: BRChange }) {
  const pageTitle = change ? BR_CHANGE_TEXT[change.kind].title : 'New Business Registration';
  const pageTab: FormTab = change?.kind ?? 'new';
  const [d, setD] = useState(data);
  const set = (k: keyof BRData) => (v: string) => setD(p => ({ ...p, [k]: v }));

  const [addresses, setAddresses] = useState<BRAddress[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<BRFacility[]>([]);
  const [users, setUsers] = useState<BRUserRecord[]>([]);
  // The full User Registration page (login, roles, credentials, addresses, attachments) for a new or existing user row.
  const [userPage, setUserPage] = useState<{ index: number | null; user: BRUserRecord } | null>(null);
  const addUser = () => setUserPage({ index: null, user: { ...BR_EMPTY_USER, account: BR_EMPTY_ACCOUNT } });
  const [attachments, setAttachments] = useState<BRAttachment[]>([]);
  const [groups, setGroups] = useState<BRGroup[]>([]);
  const [carriers, setCarriers] = useState<string[]>([]);
  const [applyVat, setApplyVat] = useState(false);
  const [charteredFlightHandler, setCharteredFlightHandler] = useState(false);
  const [epl, setEpl] = useState({ number: '', issueDate: '', expiryDate: '' });

  // Some fields and sections only apply to particular business types.
  const has = (t: string) => types.includes(t);
  const toggleType = (t: string) => setTypes(list => list.includes(t) ? list.filter(x => x !== t) : [...list, t]);
  const nocRequired = has('Broker');
  const showCarrierCodes = has('Airline Agent') || has('Shipping line Agent');
  const showEpl = has('Courier');
  const websiteRequired = has('e-Commerce');

  // Which row (if any) each section's entry form is editing; bumping formRev remounts the forms empty.
  const [editing, setEditing] = useState<{ kind: BRListKind; index: number } | null>(null);
  const [formRev, setFormRev] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<{ kind: BRListKind; index: number } | null>(null);

  const editIdx = (kind: BRListKind) => editing?.kind === kind ? editing.index : null;
  const formKey = (kind: BRListKind) => `${kind}-${editIdx(kind) ?? 'new'}-${formRev}`;
  const resetForm = () => { setEditing(null); setFormRev(r => r + 1); };
  const upsert = <T,>(kind: BRListKind, setter: React.Dispatch<React.SetStateAction<T[]>>) => (item: T) => {
    const idx = editIdx(kind);
    setter(list => idx === null ? [...list, item] : list.map((x, i) => i === idx ? item : x));
    resetForm();
  };
  const startEdit = (kind: BRListKind) => (index: number) => setEditing({ kind, index });
  const askDelete = (kind: BRListKind) => (index: number) => setPendingDelete({ kind, index });

  const DELETE_LABEL: Record<BRListKind, string> = {
    address: 'business address', carrier: 'carrier code', activity: 'license activity', facility: 'facility',
    user: 'user', group: 'group information record', attachment: 'attachment',
  };
  const confirmDelete = () => {
    if (!pendingDelete) return;
    const drop = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>) => setter(list => list.filter((_, i) => i !== pendingDelete.index));
    ({
      address: () => drop(setAddresses), carrier: () => drop(setCarriers), activity: () => drop(setActivities),
      facility: () => drop(setFacilities), user: () => drop(setUsers), group: () => drop(setGroups), attachment: () => drop(setAttachments),
    })[pendingDelete.kind]();
    if (editing?.kind === pendingDelete.kind) {
      if (editing.index === pendingDelete.index) resetForm();
      else if (editing.index > pendingDelete.index) setEditing({ ...editing, index: editing.index - 1 });
    }
    setPendingDelete(null);
  };

  // ── Layout: full-length form with either a sticky side menu or a sticky stepper above it ──
  const [layout, setLayout] = useBRLayout();
  const [captcha, setCaptcha] = useState('');
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [navRail, toggleNavRail] = useBRNavRail();
  const sec = (id: string): BRSectionCtl => ({ id, collapsed: !!collapsed[id], onToggle: () => setCollapsed(c => ({ ...c, [id]: !c[id] })) });

  const sections: BRNavItem[] = [
    { id: 'business', label: BR_SECTION_LABELS.business, done: !!d.businessName && (!nocRequired || !!d.nocNumber) },
    { id: 'license', label: BR_SECTION_LABELS.license, done: !!(d.licenseNumber && d.issueDate && d.validFrom && d.validTo) },
    { id: 'contact', label: BR_SECTION_LABELS.contact, done: !!(d.phone && d.fax && d.email && d.operationalEmail && (!websiteRequired || d.website)) },
    { id: 'types', label: BR_SECTION_LABELS.types, done: types.length > 0 },
    ...(showEpl ? [{ id: 'epl', label: BR_SECTION_LABELS.epl, done: !!(epl.number && epl.issueDate && epl.expiryDate) }] : []),
    ...(showCarrierCodes ? [{ id: 'carriers', label: BR_SECTION_LABELS.carriers, done: carriers.length > 0 }] : []),
    { id: 'activities', label: BR_SECTION_LABELS.activities, done: activities.length > 0 },
    { id: 'addresses', label: BR_SECTION_LABELS.addresses, done: addresses.length > 0 },
    { id: 'facilities', label: BR_SECTION_LABELS.facilities, done: facilities.length > 0 },
    { id: 'users', label: BR_SECTION_LABELS.users, done: users.length > 0 },
    { id: 'groups', label: BR_SECTION_LABELS.groups, done: groups.length > 0, optional: true },
    { id: 'attachments', label: BR_SECTION_LABELS.attachments, done: attachments.length > 0 },
    { id: 'vat', label: BR_SECTION_LABELS.vat, done: applyVat, optional: true },
    { id: 'validation', label: BR_SECTION_LABELS.validation, done: !!captcha.trim() },
  ];
  // The Validation Code at the foot of the form is not a menu item or a step.
  const navItems = sections.filter(s => s.id !== 'validation');
  const sectionIds = navItems.map(s => s.id).join(',');

  useBRStickyOffsets(true, layout);

  const [active, setActive] = useBRActiveSection(sectionIds);

  const goTo = (id: string) => {
    setCollapsed(c => ({ ...c, [id]: false }));
    setActive(id);
    requestAnimationFrame(() => document.getElementById(`br-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const steps = brSteps(navItems);
  const stepIdx = steps.findIndex(st => st.ids.includes(active));
  const step = stepIdx === -1 ? 0 : stepIdx;
  const goStep = (n: number) => goTo(steps[n].ids[0]);
  // Update Contact opens straight at Business Contact Details.
  useEffect(() => {
    // Waits for the page-change scroll to the top to finish, then jumps without animation.
    if (change?.kind === 'contact') setTimeout(() => {
      setActive('contact');
      document.getElementById('br-contact')?.scrollIntoView({ block: 'start' });
    }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (userPage) {
    const closeUserPage = () => {
      setUserPage(null);
      setTimeout(() => document.getElementById('br-users')?.scrollIntoView({ block: 'start' }), 0);
    };
    return (
      <BRUserRegistrationPage service={service} navigate={navigate} initial={userPage.user} onBack={closeUserPage} parentTitle={pageTitle} tab={pageTab}
        onSave={u => {
          setUsers(list => userPage.index === null ? [...list, u] : list.map((x, i) => i === userPage.index ? u : x));
          closeUserPage();
        }} />
    );
  }

  const body: Record<string, React.ReactNode> = {
    business: (
      <BRSection {...sec('business')} title="Business Details">
        <div className="dc-br-fields">
          <FloatInput label="Request ID" readOnly value={BR_REQUEST_ID} />
          <FloatInput label="Business Name" required value={d.businessName} onChange={set('businessName')} />
          <FloatInput label="Business Name (Arabic)" dir="rtl" value={d.businessNameAr} onChange={set('businessNameAr')} />
          <FloatInput label="Registration Category" required readOnly value={d.regCategory} />
          <FloatDropdown label="No. of Employee" value={d.employeeCount} onChange={set('employeeCount')} options={BR_EMPLOYEE_COUNTS} />
          <FloatInput label="NOC Number" required={nocRequired} value={d.nocNumber} onChange={set('nocNumber')}
            hint={nocRequired ? 'Required for the Broker business type' : undefined} />
        </div>
        {has('Airline Agent') && (
          <label className="dc-br-check" style={{ margin: '20px 0 0' }}>
            <input type="checkbox" checked={charteredFlightHandler} onChange={e => setCharteredFlightHandler(e.target.checked)} />
            Chartered Flight Handler
          </label>
        )}
      </BRSection>
    ),
    license: (
      <BRSection {...sec('license')} title="License Details">
        <div className="dc-br-fields">
          <FloatInput label="License Number" required value={d.licenseNumber} onChange={set('licenseNumber')} />
          <FloatInput label="License Type" required readOnly value={d.licenseType} />
          <FloatInput label="Issuing Authority" required readOnly value={d.issuingAuthority} />
          <DateField label="License Original Issue Date" required value={d.issueDate} onChange={set('issueDate')} hint={BR_DATE_HINT} />
          <DateField label="License Valid From" required value={d.validFrom} onChange={set('validFrom')} hint={BR_DATE_HINT} />
          <DateField label="License Valid To" required value={d.validTo} onChange={set('validTo')} hint={BR_DATE_HINT} />
        </div>
      </BRSection>
    ),
    contact: (
      <BRSection {...sec('contact')} title="Business Contact Details">
        <div className="dc-br-fields">
          <PhoneField label="Phone" required value={d.phone} onChange={set('phone')} tooltip={BR_PHONE_HINT} />
          <PhoneField label="Fax" required value={d.fax} onChange={set('fax')} tooltip={BR_PHONE_HINT} />
          <FloatInput label="Email" required value={d.email} onChange={set('email')} />
          <FloatInput label="Operational Email" required value={d.operationalEmail} onChange={set('operationalEmail')} />
          <FloatInput label="Website" required={websiteRequired} value={d.website} onChange={set('website')} hint="Website URL i.e. company.com, www.company.com, http://company.com" />
        </div>
      </BRSection>
    ),
    types: (
      <BRSection {...sec('types')} title="Business Types"
        aside={<span className="dc-br-count">{types.length} of {BR_BUSINESS_TYPES.length} selected</span>}>
        <div className="dc-br-type-grid" role="group" aria-label="Business Types">
          {BR_BUSINESS_TYPES.map(t => (
            <label key={t} className={`dc-br-type${has(t) ? ' dc-br-type--checked' : ''}`}>
              <input type="checkbox" checked={has(t)} onChange={() => toggleType(t)} />
              {t}
            </label>
          ))}
        </div>
        <InfoTooltip tip="Additional details are requested based on the business types selected." />
      </BRSection>
    ),
    epl: (
      <BRSection {...sec('epl')} title="Emirates Post License (EPL) Details">
        <div className="dc-br-fields">
          <FloatInput label="EPL Number" required value={epl.number} onChange={v => setEpl(p => ({ ...p, number: v }))} />
          <DateField label="Issue Date" required value={epl.issueDate} onChange={v => setEpl(p => ({ ...p, issueDate: v }))} hint="dd-mm-yyyy i.e. 01-01-2013" />
          <DateField label="Expiry Date" required value={epl.expiryDate} onChange={v => setEpl(p => ({ ...p, expiryDate: v }))} hint="dd-mm-yyyy i.e. 01-01-2013" />
        </div>
      </BRSection>
    ),
    carriers: (
      <BRListSection {...sec('carriers')} title="Carrier Codes" columns={['Carrier Code']}
        rows={carriers} cells={c => [c]}
        form={<BRCarrierCodeForm key={formKey('carrier')} initial={editIdx('carrier') !== null ? carriers[editIdx('carrier')!] : ''}
          onSave={upsert('carrier', setCarriers)} onReset={resetForm} />}
        editingIndex={editIdx('carrier')} onEdit={startEdit('carrier')} onDelete={askDelete('carrier')} />
    ),
    activities: (
      <BRSection {...sec('activities')} title="License Activities" count={activities.length}>
        <BRLicenseActivityForm key={formKey('activity')} initial="" licenseType={d.licenseType} onReset={resetForm}
          onSave={a => { setActivities(list => list.includes(a) ? list : [...list, a]); resetForm(); }} />
        {activities.length === 0 ? (
          <p className="dc-br-tags-empty">No license activities added yet. Select an activity above and click Save.</p>
        ) : (
          <ul className="dc-br-tag-list" aria-label="License activities">
            {activities.map((a, i) => (
              <li key={a} className="dc-br-tag dc-br-tag--removable">
                {a}
                <button type="button" title="Delete" aria-label={`Delete ${a}`} onClick={() => askDelete('activity')(i)}><TrashIcon /></button>
              </li>
            ))}
          </ul>
        )}
      </BRSection>
    ),
    addresses: (
      <BRListSection {...sec('addresses')} title="Business Addresses" columns={['Address Line 1', 'Country', 'City', 'P.O.Box']}
        rows={addresses} cells={a => [a.line1, a.country, a.city, a.poBox]}
        form={<BRAddressForm key={formKey('address')} initial={editIdx('address') !== null ? addresses[editIdx('address')!] : BR_EMPTY_ADDRESS}
          onSave={upsert('address', setAddresses)} onReset={resetForm} />}
        editingIndex={editIdx('address')} onEdit={startEdit('address')} onDelete={askDelete('address')} />
    ),
    facilities: (
      <BRListSection {...sec('facilities')} title="Facility Details" columns={['Facility Name', 'Facility Type', 'Status']}
        rows={facilities} cells={f => [f.name, f.type, <span className="dc-status-badge dc-status-badge--success">{f.status}</span>]}
        form={<BRFacilityForm key={formKey('facility')} initial={editIdx('facility') !== null ? facilities[editIdx('facility')!] : { name: '', type: '', status: 'Active' }}
          onSave={upsert('facility', setFacilities)} onReset={resetForm} />}
        editingIndex={editIdx('facility')} onEdit={startEdit('facility')} onDelete={askDelete('facility')} />
    ),
    users: (
      <BRListSection {...sec('users')} title="User Registration" columns={['User ID', 'First Name', 'Middle Name', 'Last Name', 'Company Name', 'Roles']}
        rows={users} cells={u => [u.account.loginId || u.userCode || 'New User', u.firstName, u.middleName || '—', u.lastName, d.businessName, u.account.roles.join(', ') || '—']}
        action={<BRAddUserButton onClick={addUser} />}
        emptyText="No users added yet. Click Add User to register a user with their login, roles, credentials, address and documents."
        onEdit={i => setUserPage({ index: i, user: users[i] })} onDelete={askDelete('user')} />
    ),
    groups: (
      <BRListSection {...sec('groups')} title="Group Information (Optional)" columns={['Group Business Name', 'Relationship Type']}
        rows={groups} cells={g => [g.name, g.relationship]}
        form={<BRGroupForm key={formKey('group')} initial={editIdx('group') !== null ? groups[editIdx('group')!] : { code: '', name: '', relationship: '' }}
          onSave={upsert('group', setGroups)} onReset={resetForm} />}
        editingIndex={editIdx('group')} onEdit={startEdit('group')} onDelete={askDelete('group')} />
    ),
    attachments: (
      <BRListSection {...sec('attachments')} title="Attachments" columns={['Document Title', 'Document Type', 'File Name', 'File Type', 'File Size (Bytes)']}
        rows={attachments} cells={a => [a.title, a.docType, a.fileName, a.fileType, a.fileSize.toLocaleString()]}
        form={<BRAttachmentForm key={formKey('attachment')} onSave={upsert('attachment', setAttachments)} onReset={resetForm} />}
        onDelete={askDelete('attachment')}
        note={<>
          <p className="dc-br-warn"><InfoIcon size={18} /> Uploading Trade License Copy is not required if it is issued by "Department of Economy &amp; Tourism - Dubai (DET)"</p>
          <div className="dc-br-required-docs">
            <span>Required Documents:</span>
            <ul>
              <li>Trade License Copy</li>
              {showCarrierCodes && <li>Proof-Airline Agent for Cargo (one for every carrier being registered)</li>}
            </ul>
          </div>
        </>} />
    ),
    vat: (
      <BRSection {...sec('vat')} title="VAT Registration Certificate (Optional)">
        <label className="dc-br-check">
          <input type="checkbox" checked={applyVat} onChange={e => setApplyVat(e.target.checked)} />
          Apply for VAT Certificate
        </label>
        <BRNote>
          <ul className="dc-br-note__list">
            <li>Select this option to receive the VAT Registration Letter.</li>
            <li>You will require this Letter to register the Customs Business code with FTA to avoid any delay in Customs declaration processing.</li>
            <li>Charges: VAT registration certificate charge (<DirhamIcon />100) and Knowledge-Innovation Dirham (<DirhamIcon />20) will be applicable.</li>
          </ul>
        </BRNote>
      </BRSection>
    ),
    validation: (
      <BRSection {...sec('validation')} title="Validation Code">
        <CaptchaWidget value={captcha} onChange={setCaptcha} />
      </BRSection>
    ),
  };

  const actions = (
    <div className="dc-form-actions dc-br-actions">
      <button className="dc-btn dc-btn--outline" onClick={() => navigate({ name: 'form', serviceId: service.id })}>Cancel</button>
      <button className="dc-btn dc-btn--outline" onClick={() => {
        setD(withBRSamples(d));
        setDraftSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}>Save as Draft</button>
      <button className="dc-btn dc-btn--blue" onClick={() => navigate({ name: 'success', serviceId: service.id, brData: { ...withBRSamples(d), tab: pageTab } })}>Submit</button>
    </div>
  );

  return (
    <BRPageShell service={service} navigate={navigate} title={pageTitle} tab={pageTab}>
      {change ? (
        <div className="dc-form-section dc-br-saved">
          <div className="dc-success-alert">
            <div className="dc-success-alert__left">
              <CheckCircle />
              <div>
                <div className="dc-success-alert__title">Business Code {change.code} Loaded for {BR_CHANGE_TEXT[change.kind].purpose}</div>
                <div className="dc-success-alert__msg">
                  {BR_CHANGE_TEXT[change.kind].message}
                  {draftSavedAt && <> Draft last saved at {draftSavedAt}.</>}
                </div>
              </div>
            </div>
          </div>
          <div className="dc-success-grid" style={{ marginBottom: 0 }}>
            <BRSummaryField label="Business Code" value={change.code} />
            <BRSummaryField label="Business Name" value={d.businessName} />
            <BRSummaryField label="License Number" value={d.licenseNumber} />
            <BRSummaryField label="License Valid To" value={d.validTo} />
          </div>
        </div>
      ) : (
      <div className="dc-form-section dc-br-saved">
        <div className="dc-success-alert">
          <div className="dc-success-alert__left">
            <CheckCircle />
            <div>
              <div className="dc-success-alert__title">Business Profile Saved Successfully as Draft!</div>
              <div className="dc-success-alert__msg">
                To view this draft later, go to the <strong>Enquiry</strong> tab and enter the Request ID and Validation Code below.
                Continue filling the form below and submit it within 15 days, otherwise the request will be deleted automatically.
                {draftSavedAt && <> Draft last saved at {draftSavedAt}.</>}
              </div>
            </div>
          </div>
        </div>
        <div className="dc-success-grid" style={{ marginBottom: 0 }}>
          <BRSummaryField label="Request ID" value={BR_REQUEST_ID} />
          <BRSummaryField label="Validation Code" value={BR_VALIDATION_CODE} />
        </div>
      </div>
      )}

      <BRLayoutSwitch layout={layout} onChange={setLayout} />

      {layout === 'steps' && <BRStepper steps={steps} items={navItems} current={step} onGo={goStep} />}

      <div className={layout === 'menu' ? `dc-br-layout${navRail ? ' dc-br-layout--rail' : ''}` : undefined}>
        {layout === 'menu' && <BRSideNav items={navItems} active={active} onGo={goTo} rail={navRail} onToggleRail={toggleNavRail} />}
        <div className="dc-form-card">
          {sections.map(s => <Fragment key={s.id}>{body[s.id]}</Fragment>)}
          {actions}
        </div>
      </div>

      {pendingDelete && (
        <BRDeleteConfirm what={DELETE_LABEL[pendingDelete.kind]} onNo={() => setPendingDelete(null)} onYes={confirmDelete} />
      )}
    </BRPageShell>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
function getInitialPage(): Page {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const pageName = params.get('page');
  const serviceId = params.get('serviceId');
  if (pageName === 'info' && serviceId) return { name: 'info', serviceId };
  if (pageName === 'form' && serviceId) return { name: 'form', serviceId };
  if (pageName === 'success' && serviceId) return { name: 'success', serviceId };
  return { name: 'home' };
}

export function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === 'true');
  const [page, setPage] = useState<Page>(getInitialPage);

  if (!authed) {
    return <LoginPage onAuth={() => { localStorage.setItem(AUTH_KEY, 'true'); setAuthed(true); }} />;
  }

  const navigate = (next: Page) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const service = page.name !== 'home' ? getService((page as { serviceId: string }).serviceId) : null;

  return (
    <div className="dc-app">
      <Navbar onHome={() => navigate({ name: 'home' })} />
      <main className="dc-main">
        {page.name === 'home' && <HomePage navigate={navigate} />}
        {page.name === 'info' && service && <InfoPage service={service} navigate={navigate} />}
        {page.name === 'form' && service && <ServiceFormPage key={page.tab ?? 'new'} service={service} navigate={navigate} initialTab={page.tab} />}
        {page.name === 'success' && service && <SuccessPage service={service} navigate={navigate} activePayBillsTab={page.activePayBillsTab} brData={page.brData} />}
        {page.name === 'br-registration' && service && <BRRegistrationPage service={service} navigate={navigate} data={page.data} change={page.change} />}
        {page.name === 'br-login' && service && <BRLoginPage service={service} navigate={navigate} kind={page.kind} />}
        {page.name === 'br-submitted' && service && <BRSubmittedPage service={service} navigate={navigate} data={page.data} />}
      </main>
      <Footer />
    </div>
  );
}
