(() => {
  const timeline = document.querySelector(".timeline");
  if (!timeline) return;

  const entries = [...timeline.querySelectorAll(".timeline-entry")];
  const verticalLayout = window.matchMedia(
    "(max-width: 760px), (max-width: 1100px) and (orientation: portrait), (hover: none) and (max-device-width: 700px)",
  );
  let frame = 0;

  const clear = () => {
    entries.forEach((entry) => entry.classList.remove("is-current"));
    timeline.querySelectorAll(".timeline-mobile-end").forEach((endpoint) => {
      endpoint.classList.remove("is-current-end");
    });
    timeline.style.removeProperty("--highlight-top");
    timeline.style.removeProperty("--highlight-height");
  };

  const endpointFor = (entry) => {
    if (entry.classList.contains("entry-tongji")) return timeline.querySelector(".endpoint-tongji");
    if (entry.classList.contains("entry-niq")) return timeline.querySelector(".endpoint-niq");
    if (entry.classList.contains("entry-prudential")) return timeline.querySelector(".endpoint-now");
    return null;
  };

  const update = () => {
    frame = 0;
    if (!verticalLayout.matches) {
      clear();
      return;
    }

    const timelineBounds = timeline.getBoundingClientRect();
    const scrollTop = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;
    const maximumScroll = Math.max(1, documentHeight - window.innerHeight);
    const timelineTop = timelineBounds.top + scrollTop;
    const timelineStart = Math.max(0, timelineTop - window.innerHeight * 0.08);
    const timelineEnd = Math.max(
      timelineStart + 1,
      maximumScroll - Math.min(72, window.innerHeight * 0.08),
    );
    const progress = Math.max(
      0,
      Math.min(1, (scrollTop - timelineStart) / Math.max(1, timelineEnd - timelineStart)),
    );
    const visualEntries = [...entries].sort(
      (first, second) => first.getBoundingClientRect().top - second.getBoundingClientRect().top,
    );
    const firstBounds = visualEntries[0].getBoundingClientRect();
    const firstAnchor = firstBounds.top + scrollTop + Math.min(firstBounds.height * 0.42, 56);
    const lastBounds = visualEntries.at(-1).getBoundingClientRect();
    const lastAnchor = lastBounds.top + scrollTop + Math.min(lastBounds.height * 0.42, 56);
    const focusPosition = firstAnchor + (lastAnchor - firstAnchor) * progress;
    let current = visualEntries[0];
    let shortestDistance = Number.POSITIVE_INFINITY;

    visualEntries.forEach((entry) => {
      const bounds = entry.getBoundingClientRect();
      const anchor = bounds.top + scrollTop + Math.min(bounds.height * 0.42, 56);
      const distance = Math.abs(anchor - focusPosition);
      if (distance < shortestDistance) {
        current = entry;
        shortestDistance = distance;
      }
    });

    entries.forEach((entry) => {
      entry.classList.toggle("is-current", entry === current);
    });

    const currentBounds = current.getBoundingClientRect();
    const currentAnchor = currentBounds.top + Math.min(currentBounds.height * 0.42, 56);
    const endpoint = endpointFor(current);
    timeline.querySelectorAll(".timeline-mobile-end").forEach((item) => {
      item.classList.toggle("is-current-end", item === endpoint);
    });
    const endpointBounds = endpoint?.getBoundingClientRect();
    const segmentStart = currentAnchor - timelineBounds.top;
    const segmentEnd = endpointBounds
      ? endpointBounds.top + 4 - timelineBounds.top
      : segmentStart + Math.min(currentBounds.height * 0.44, 54);
    const top = Math.max(0, Math.min(segmentStart, segmentEnd));
    const height = Math.max(14, Math.abs(segmentEnd - segmentStart));
    timeline.style.setProperty("--highlight-top", `${(top / timelineBounds.height) * 100}%`);
    timeline.style.setProperty("--highlight-height", `${(height / timelineBounds.height) * 100}%`);
  };

  const scheduleUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  if (verticalLayout.addEventListener) {
    verticalLayout.addEventListener("change", scheduleUpdate);
  } else {
    verticalLayout.addListener(scheduleUpdate);
  }
  scheduleUpdate();
})();
