import type { BookingCopy } from "@/lib/i18n";
import type { BookingBreadcrumbItem } from "./BookingBreadcrumb";
import type { BookingService } from "./BookingWizard";

type BuildBookingBreadcrumbInput = {
  copy: BookingCopy;
  service: BookingService;
  showContactForm: boolean;
  showStaffStep: boolean;
  needsStaffPicker: boolean;
  hubHref?: string | null;
  lockServiceSelection: boolean;
  multiService: boolean;
  onBackToServices: () => void;
  onBackToStaff: () => void;
  onBackToDateTime: () => void;
};

export function buildBookingBreadcrumbItems({
  copy,
  service,
  showContactForm,
  showStaffStep,
  needsStaffPicker,
  hubHref,
  lockServiceSelection,
  multiService,
  onBackToServices,
  onBackToStaff,
  onBackToDateTime,
}: BuildBookingBreadcrumbInput): BookingBreadcrumbItem[] {
  const items: BookingBreadcrumbItem[] = [];

  if (hubHref) {
    items.push({ label: copy.allServices, href: hubHref });
  } else if (!lockServiceSelection && multiService) {
    items.push({ label: copy.chooseService, onClick: onBackToServices });
  }

  if (showContactForm) {
    if (needsStaffPicker) {
      items.push({ label: service.name, onClick: onBackToServices });
      items.push({ label: copy.chooseTeam, onClick: onBackToStaff });
      items.push({ label: copy.dateTime, onClick: onBackToDateTime });
      items.push({ label: copy.details, current: true });
      return items;
    }
    items.push({ label: copy.dateTime, onClick: onBackToDateTime });
    items.push({ label: copy.details, current: true });
    return items;
  }

  if (showStaffStep) {
    items.push({ label: service.name, onClick: onBackToServices });
    items.push({ label: copy.chooseTeam, current: true });
    return items;
  }

  if (needsStaffPicker) {
    items.push({ label: service.name, onClick: onBackToServices });
    items.push({ label: copy.chooseTeam, onClick: onBackToStaff });
    items.push({ label: copy.dateTime, current: true });
    return items;
  }

  items.push({ label: service.name, current: true });
  return items;
}
