(function () {
  function visibleItems(rail) {
    var items = Array.from(rail.children).filter(function (item) {
      return item.matches(".node, .flow-step, .system-flow, .journey-grid") && item.getClientRects().length;
    });
    if (items.length === 1 && items[0].matches(".system-flow, .journey-grid")) {
      return Array.from(items[0].children).filter(function (item) {
        return item.getClientRects().length;
      });
    }
    return items;
  }

  function itemLeft(rail, item) {
    return item.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
  }

  function normalizeLabels() {
    document.querySelectorAll(".node-label").forEach(function (label) {
      label.textContent = label.textContent.replace(/^(?:[A-Z]-\d+[A-Z]?|\d+\.)\s*(?:·\s*)?/, "");
    });
  }

  function addControls(rail) {
    var items = visibleItems(rail);
    if (!items.length) return;

    var section = rail.closest(".story-chapter, .lane, .story");
    if (!section) return;
    var head = section.querySelector(":scope > .chapter-head, :scope > .lane-label, :scope > .story-head");
    if (!head || head.querySelector(":scope > .rail-controls")) return;

    var controls = document.createElement("div");
    controls.className = "rail-controls";
    var position = document.createElement("span");
    position.className = "rail-position";
    position.setAttribute("aria-live", "polite");
    var previous = document.createElement("button");
    previous.type = "button";
    previous.className = "rail-button";
    previous.setAttribute("aria-label", "이전 화면");
    previous.textContent = "←";
    var next = document.createElement("button");
    next.type = "button";
    next.className = "rail-button";
    next.setAttribute("aria-label", "다음 화면");
    next.textContent = "→";
    controls.append(position, previous, next);
    head.appendChild(controls);
    rail.tabIndex = rail.hasAttribute("tabindex") ? rail.tabIndex : 0;

    function currentIndex() {
      var max = Math.max(0, rail.scrollWidth - rail.clientWidth);
      if (max && rail.scrollLeft >= max - 3) return items.length - 1;
      var target = rail.scrollLeft + 12;
      var bestIndex = 0;
      var bestDistance = Infinity;
      items.forEach(function (item, index) {
        var distance = Math.abs(itemLeft(rail, item) - target);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });
      return bestIndex;
    }

    function update() {
      var max = Math.max(0, rail.scrollWidth - rail.clientWidth);
      var index = currentIndex();
      controls.classList.toggle("is-static", max < 4);
      position.textContent = "화면 " + (index + 1) + " / " + items.length;
      previous.disabled = rail.scrollLeft <= 3;
      next.disabled = rail.scrollLeft >= max - 3;
    }

    function move(direction) {
      var index = Math.max(0, Math.min(items.length - 1, currentIndex() + direction));
      rail.scrollTo({ left: itemLeft(rail, items[index]), behavior: "smooth" });
    }

    previous.addEventListener("click", function () { move(-1); });
    next.addEventListener("click", function () { move(1); });
    var frame = 0;
    rail.addEventListener("scroll", function () {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener("resize", update);
    requestAnimationFrame(update);
  }

  function initialize() {
    normalizeLabels();
    document.querySelectorAll(".story-rail, .flow, .rail").forEach(addControls);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
