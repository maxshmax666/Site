const MENU_SCROLL_OFFSET_PX = 96;

/**
 * Scrolls viewport to the home menu section with a fixed offset for sticky header.
 * Returns false when the element is not mounted yet.
 */
export function scrollToMenuSection(behavior: ScrollBehavior = "smooth"): boolean {
  const menuSection = document.getElementById("menu");

  if (!menuSection) {
    return false;
  }

  const top = menuSection.getBoundingClientRect().top + window.scrollY - MENU_SCROLL_OFFSET_PX;

  window.scrollTo({
    top: Math.max(0, top),
    behavior,
  });

  return true;
}
