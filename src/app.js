/**
 * Linux Cheat Sheet – app.js
 * Loads commands from commands.json, renders a categorised table,
 * provides live search filtering, and handles the collapsible FAQ section.
 */

(function () {
  "use strict";

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Escape HTML special characters to prevent injection. */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Render commands ───────────────────────────────────────────────────────

  /**
   * Build the commands section and inject it into #commands-container.
   * @param {Array} categories  Parsed array from commands.json
   * @param {string} filter     Lower-cased search term (may be empty)
   */
  function renderCommands(categories, filter) {
    const container = document.getElementById("commands-container");
    if (!container) return;

    let html = "";
    let totalVisible = 0;

    categories.forEach(function (category) {
      const matchingCommands = category.commands.filter(function (cmd) {
        if (!filter) return true;
        return (
          cmd.command.toLowerCase().includes(filter) ||
          cmd.description.toLowerCase().includes(filter) ||
          cmd.syntax.toLowerCase().includes(filter) ||
          (cmd.example && cmd.example.toLowerCase().includes(filter)) ||
          category.name.toLowerCase().includes(filter)
        );
      });

      if (matchingCommands.length === 0) return;
      totalVisible += matchingCommands.length;

      const categoryId = "cat-" + category.name.replace(/\s+/g, "-").toLowerCase();

      html += `
        <section class="category-section" id="${escapeHtml(categoryId)}">
          <h2 class="category-title">${escapeHtml(category.name)}</h2>
          <div class="table-wrapper">
            <table class="commands-table" aria-label="${escapeHtml(category.name)} commands">
              <thead>
                <tr>
                  <th scope="col">Command</th>
                  <th scope="col">Syntax</th>
                  <th scope="col">Description</th>
                  <th scope="col">Example</th>
                </tr>
              </thead>
              <tbody>
                ${matchingCommands
                  .map(function (cmd) {
                    return `
                  <tr>
                    <td><code class="cmd-name">${escapeHtml(cmd.command)}</code></td>
                    <td><code class="cmd-syntax">${escapeHtml(cmd.syntax)}</code></td>
                    <td>${escapeHtml(cmd.description)}</td>
                    <td><code class="cmd-example">${escapeHtml(cmd.example || "")}</code></td>
                  </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </section>`;
    });

    if (totalVisible === 0) {
      html = `<p class="no-results">No commands match "<strong>${escapeHtml(
        filter
      )}</strong>". Try a different keyword.</p>`;
    }

    container.innerHTML = html;
    updateResultCount(totalVisible, filter);
  }

  /** Show or hide the result-count badge. */
  function updateResultCount(count, filter) {
    const badge = document.getElementById("result-count");
    if (!badge) return;
    if (filter) {
      badge.textContent = `${count} result${count !== 1 ? "s" : ""} for "${filter}"`;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  }

  // ── Category navigation ───────────────────────────────────────────────────

  /** Populate the #category-nav list with anchor links. */
  function renderNav(categories) {
    const nav = document.getElementById("category-nav");
    if (!nav) return;
    const items = categories
      .map(function (cat) {
        const id = "cat-" + cat.name.replace(/\s+/g, "-").toLowerCase();
        return `<li><a href="#${escapeHtml(id)}">${escapeHtml(cat.name)}</a></li>`;
      })
      .join("");
    nav.innerHTML = items;
  }

  // ── Search ────────────────────────────────────────────────────────────────

  /** Wire up the search input to filter the rendered table live. */
  function initSearch(categories) {
    const input = document.getElementById("search-input");
    const clearBtn = document.getElementById("search-clear");
    if (!input) return;

    function doFilter() {
      const filter = input.value.trim().toLowerCase();
      renderCommands(categories, filter);
      if (clearBtn) {
        clearBtn.style.display = filter ? "inline-block" : "none";
      }
    }

    input.addEventListener("input", doFilter);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        input.value = "";
        doFilter();
        input.blur();
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        input.value = "";
        doFilter();
        input.focus();
      });
    }
  }

  // ── FAQ ───────────────────────────────────────────────────────────────────

  /** Attach click handlers to all FAQ question buttons. */
  function initFaq() {
    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(function (item) {
      const btn = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");
      if (!btn || !answer) return;

      // Start collapsed
      answer.hidden = true;
      btn.setAttribute("aria-expanded", "false");

      btn.addEventListener("click", function () {
        const isOpen = !answer.hidden;
        // Close all other items
        faqItems.forEach(function (other) {
          const otherAnswer = other.querySelector(".faq-answer");
          const otherBtn = other.querySelector(".faq-question");
          if (otherAnswer && otherBtn && other !== item) {
            otherAnswer.hidden = true;
            otherBtn.setAttribute("aria-expanded", "false");
            other.classList.remove("faq-open");
          }
        });
        // Toggle current item
        answer.hidden = isOpen;
        btn.setAttribute("aria-expanded", String(!isOpen));
        item.classList.toggle("faq-open", !isOpen);
      });
    });
  }

  // ── Back-to-top button ────────────────────────────────────────────────────

  function initBackToTop() {
    const btn = document.getElementById("back-to-top");
    if (!btn) return;
    window.addEventListener("scroll", function () {
      btn.style.display = window.scrollY > 400 ? "flex" : "none";
    });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  /** Fetch commands.json and kick off rendering. */
  function init() {
    fetch("commands.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to load commands.json: " + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        const categories = data.categories || [];
        renderNav(categories);
        renderCommands(categories, "");
        initSearch(categories);
        initFaq();
        initBackToTop();

        // Highlight the nav link matching the current hash on page load
        const loadingMsg = document.getElementById("loading-msg");
        if (loadingMsg) loadingMsg.remove();
      })
      .catch(function (err) {
        const container = document.getElementById("commands-container");
        if (container) {
          container.innerHTML =
            `<p class="error-msg">⚠ Could not load commands: ${escapeHtml(err.message)}</p>`;
        }
        console.error(err);
      });
  }

  // Run after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
