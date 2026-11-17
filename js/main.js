/**
 * ParkEase - Sidebar Controller (js/main.js)
 * Manages mobile drawer open/close, backdrop overlay, desktop collapse/expand, and tablet auto-collapse.
 * Complies with strict project constraints:
 * - In-memory state only (no localStorage or sessionStorage)
 * - Animations 150ms-300ms ease-out (transform, opacity, background-color, box-shadow only)
 * - Respects prefers-reduced-motion
 * - Event delegation for seamless compatibility with dynamic React mounts
 */

(function () {
  'use strict';

  // In-memory collapse state (no persistence per project rules)
  var isCollapsed = false;

  // Open mobile drawer
  function openMobileDrawer() {
    var sidebar = document.querySelector('.sidebar');
    var overlay = document.querySelector('.sidebar-mobile-overlay');
    var menuBtn = document.querySelector('.portal-mobile-menu-btn');

    if (sidebar) {
      sidebar.classList.add('mobile-open');
      sidebar.setAttribute('aria-hidden', 'false');
    }
    if (overlay) {
      overlay.classList.add('active');
    }
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'true');
    }
    document.body.style.overflow = 'hidden';
  }

  // Close mobile drawer
  function closeMobileDrawer() {
    var sidebar = document.querySelector('.sidebar');
    var overlay = document.querySelector('.sidebar-mobile-overlay');
    var menuBtn = document.querySelector('.portal-mobile-menu-btn');

    if (sidebar) {
      sidebar.classList.remove('mobile-open');
      sidebar.setAttribute('aria-hidden', 'true');
    }
    if (overlay) {
      overlay.classList.remove('active');
    }
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  }

  // Toggle desktop/tablet collapse state
  function toggleSidebarCollapse() {
    var sidebar = document.querySelector('.sidebar');
    var toggleBtn = document.querySelector('.sidebar-collapse-toggle');

    if (!sidebar) return;

    isCollapsed = !isCollapsed;
    sidebar.classList.toggle('collapsed', isCollapsed);

    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
      toggleBtn.setAttribute('title', isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
    }
  }

  // Event delegation to catch clicks even after React renders
  document.addEventListener('click', function (e) {
    var target = e.target;

    // Mobile menu toggle button
    var menuBtn = target.closest('.portal-mobile-menu-btn');
    if (menuBtn) {
      e.preventDefault();
      openMobileDrawer();
      return;
    }

    // Mobile close button
    var closeBtn = target.closest('.sidebar-mobile-close-btn');
    if (closeBtn) {
      e.preventDefault();
      closeMobileDrawer();
      return;
    }

    // Mobile backdrop overlay click
    if (target.classList && target.classList.contains('sidebar-mobile-overlay')) {
      e.preventDefault();
      closeMobileDrawer();
      return;
    }

    // Collapse / expand toggle button
    var collapseBtn = target.closest('.sidebar-collapse-toggle');
    if (collapseBtn) {
      e.preventDefault();
      toggleSidebarCollapse();
      return;
    }

    // Close drawer when clicking a navigation link inside mobile drawer
    if (window.innerWidth <= 640 && target.closest('.sidebar-link')) {
      closeMobileDrawer();
    }
  });

  // Keyboard accessibility: Escape closes mobile drawer
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var sidebar = document.querySelector('.sidebar.mobile-open');
      if (sidebar) {
        closeMobileDrawer();
      }
    }
  });

  // Responsive resize handler: Tablet (641px - 1024px) defaults to collapsed
  function handleResize() {
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    var width = window.innerWidth;
    if (width <= 640) {
      // In mobile, drawer mode is used
      sidebar.classList.remove('collapsed');
    } else if (width <= 1024) {
      // Tablet: auto-collapsed to icons by default
      sidebar.classList.add('collapsed');
      closeMobileDrawer();
    } else {
      // Desktop: restore in-memory state
      sidebar.classList.toggle('collapsed', isCollapsed);
      closeMobileDrawer();
    }
  }

  window.addEventListener('resize', handleResize);

  // Initial setup on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleResize);
  } else {
    handleResize();
  }
})();

/**
 * Shared Live Refresh Polling Utility
 * Periodically invokes `loadFunction` on the requested `interval` (defaults to 5000ms),
 * prevents overlapping runs, refreshes on tab focus, and returns a `stop()` cleanup callback.
 *
 * @param {Function} loadFunction - Callback or async function that reloads view data
 * @param {number} [interval=5000] - Refresh interval in milliseconds (default 5000ms)
 * @returns {Function} stop - Call to cancel periodic polling and detach listeners
 */
function startLiveRefresh(loadFunction, interval) {
  if (typeof loadFunction !== 'function') {
    return function noop() {};
  }

  var resolvedInterval = typeof interval === 'number' && interval > 0 ? interval : 5000;
  var isRunning = false;
  var isStopped = false;

  function updateIndicators(stateLabel) {
    var indicators = document.querySelectorAll('[data-live-refresh-indicator]');
    for (var i = 0; i < indicators.length; i += 1) {
      indicators[i].setAttribute('data-live-state', stateLabel);
    }
  }

  function runCycle() {
    if (isStopped || isRunning) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

    isRunning = true;
    updateIndicators('syncing');

    try {
      var result = loadFunction();
      if (result && typeof result.then === 'function') {
        result.then(
          function () {
            isRunning = false;
            updateIndicators('live');
          },
          function () {
            isRunning = false;
            updateIndicators('live');
          }
        );
      } else {
        isRunning = false;
        updateIndicators('live');
      }
    } catch (_err) {
      isRunning = false;
      updateIndicators('live');
    }
  }

  function handleVisibilityChange() {
    if (!isStopped && document.visibilityState === 'visible') {
      runCycle();
    }
  }

  var timerId = window.setInterval(runCycle, resolvedInterval);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return function stopLiveRefresh() {
    if (isStopped) return;
    isStopped = true;
    window.clearInterval(timerId);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  };
}

if (typeof window !== 'undefined') {
  window.startLiveRefresh = startLiveRefresh;
}
