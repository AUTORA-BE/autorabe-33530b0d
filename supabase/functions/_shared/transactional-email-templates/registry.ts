/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as contactConfirmation } from './contact-confirmation.tsx'
import { template as sellerNotification } from './seller-notification.tsx'
import { template as welcome } from './welcome.tsx'
import { template as listingStatus } from './listing-status.tsx'
import { template as newDealerSignup } from './new-dealer-signup.tsx'
import { template as dealerApproved } from './dealer-approved.tsx'
import { template as dealerRejected } from './dealer-rejected.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-confirmation': contactConfirmation,
  'seller-notification': sellerNotification,
  'welcome': welcome,
  'listing-status': listingStatus,
  'new-dealer-signup': newDealerSignup,
  'dealer-approved': dealerApproved,
  'dealer-rejected': dealerRejected,
}
