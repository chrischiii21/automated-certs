export type EventStatus = 'draft' | 'open' | 'closed';

/** Where and how the participant's name is drawn on the template. */
export interface NameLayout {
  x: number; // % of template width (center of the text)
  y: number; // % of template height (center of the text)
  maxWidth: number; // % of template width before the text shrinks to fit
  fontFamily: string;
  fontWeight: number;
  fontSize: number; // px, relative to the template's natural size
  color: string;
}

export interface CertEvent {
  id: string;
  name: string;
  templateUrl: string;
  logoUrl: string | null;
  organizer: string | null;
  layout: NameLayout;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EventSummary extends CertEvent {
  participantCount: number;
  claimedCount: number;
}

export interface Participant {
  id: string;
  name: string;
  claimCount: number;
  firstClaimedAt: string | null;
  lastClaimedAt: string | null;
  createdAt: string;
}

/** What the public claim page is allowed to know about an event. */
export type PublicEvent = Pick<CertEvent, 'id' | 'name' | 'templateUrl' | 'logoUrl' | 'organizer' | 'layout' | 'status'>;
