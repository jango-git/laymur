/**
 * ui.js
 *
 * Tab switching.
 */

export function setupTabs() {
  document.getElementById("tabs").addEventListener("click", (event) => {
    const button = event.target.closest(".tab-button");
    if (!button) return;
    const tab = button.dataset.tab;

    document.querySelectorAll(".tab-button").forEach((b) => {
      b.classList.toggle("active", b === button);
    });
    document.querySelectorAll(".tab-panel").forEach((p) => {
      p.classList.toggle("active", p.id === `tab-${tab}`);
    });
  });
}
