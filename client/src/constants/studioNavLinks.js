import { STUDIO_TABS } from "./studioTabs.js";

export const STUDIO_NAV_LINKS = STUDIO_TABS.map(({ id, label, to }) => ({
  id,
  label,
  to,
}));

export default STUDIO_NAV_LINKS;
