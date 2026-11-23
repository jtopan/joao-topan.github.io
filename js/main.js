const FORM_ENDPOINT = "https://api.web3forms.com/submit";

function isInRevealViewport(element) {
  const rect = element.getBoundingClientRect();
  const navbarHeight =
    Number.parseFloat(
      window.getComputedStyle(document.documentElement).getPropertyValue("--navbar-height")
    ) || 0;

  return rect.bottom > navbarHeight + 24 && rect.top < window.innerHeight * 0.86 - 24;
}

function setupReveal() {
  const elements = [...document.querySelectorAll(".revelar")];

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((element) => element.classList.add("visivel"));
    return;
  }

  let previousScrollY = window.scrollY;

  function updateReveals() {
    const scrollingDown = window.scrollY >= previousScrollY;

    elements.forEach((element) => {
      if (scrollingDown && isInRevealViewport(element)) {
        element.classList.add("visivel");
      } else if (!scrollingDown) {
        const rect = element.getBoundingClientRect();
        if (rect.top >= window.innerHeight * 0.86) {
          element.classList.remove("visivel");
        }
      }
    });

    previousScrollY = window.scrollY;
  }

  window.addEventListener("scroll", updateReveals, { passive: true });
  window.addEventListener("resize", updateReveals);
  updateReveals();
}

function setupNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("nav-menu");

  if (!toggle || !menu) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function setupAreasCarousel() {
  const carousel = document.querySelector(".areas-carousel");
  const track = document.getElementById("areas-track");
  const cards = [...document.querySelectorAll(".area-card")];
  const indicators = carousel?.querySelector(".carousel-indicators");
  const previous = carousel?.querySelector('[data-carousel="previous"]');
  const next = carousel?.querySelector('[data-carousel="next"]');

  if (!carousel || !track || cards.length === 0 || !indicators || !previous || !next) {
    return;
  }

  cards.forEach((card, index) => {
    const indicator = document.createElement("button");
    indicator.type = "button";
    indicator.className = "carousel-indicator";
    indicator.setAttribute("aria-label", `Ir para a área ${index + 1}`);
    indicator.addEventListener("click", () => {
      cards[index].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      cards[index].focus({ preventScroll: true });
    });
    indicators.appendChild(indicator);
  });

  const indicatorButtons = [...indicators.querySelectorAll("button")];

  function updateIndicators() {
    const trackLeft = track.getBoundingClientRect().left;
    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - trackLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    indicatorButtons.forEach((button, index) => {
      button.classList.toggle("is-active", index === closestIndex);
      button.setAttribute("aria-current", index === closestIndex ? "true" : "false");
    });

    previous.disabled = closestIndex === 0;
    next.disabled = closestIndex === cards.length - 1;
  }

  function moveBy(direction) {
    const trackLeft = track.getBoundingClientRect().left;
    let targetIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - trackLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        targetIndex = index;
      }
    });

    const target = cards[Math.min(cards.length - 1, Math.max(0, targetIndex + direction))];
    target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }

  previous.addEventListener("click", () => moveBy(-1));
  next.addEventListener("click", () => moveBy(1));
  track.addEventListener("scroll", updateIndicators, { passive: true });
  window.addEventListener("resize", updateIndicators);
  updateIndicators();
}

function setupAreasOrbit() {
  const orbit = document.querySelector(".areas-orbit");
  const detail = orbit?.querySelector(".orbit-detail");
  const nodesWrapper = orbit?.querySelector(".orbit-nodes");
  const nodes = [...(orbit?.querySelectorAll(".orbit-node") || [])];
  const cards = [...document.querySelectorAll(".area-card")];

  if (!orbit || !detail || !nodesWrapper || nodes.length === 0 || nodes.length !== cards.length) {
    return;
  }

  let selectedIndex = Number(orbit.querySelector(".orbit-node.is-active")?.dataset.areaIndex || 0);
  let currentRotation = 0;

  function selectArea(index) {
    if (!cards[index]) {
      return;
    }

    selectedIndex = index;
    nodes.forEach((node) => {
      const selected = Number(node.dataset.areaIndex) === index;
      node.classList.toggle("is-active", selected);
      node.setAttribute("aria-pressed", String(selected));
    });

    const targetRotation = 90 - index * 90;
    let rotationDelta = (targetRotation - currentRotation) % 360;
    if (rotationDelta > 180) {
      rotationDelta -= 360;
    } else if (rotationDelta < -180) {
      rotationDelta += 360;
    }
    currentRotation += rotationDelta;
    nodesWrapper.style.setProperty("--orbit-rotation", `${currentRotation}deg`);
    nodesWrapper.style.setProperty("--orbit-counter-rotation", `${-currentRotation}deg`);

    const card = cards[index];
    detail.replaceChildren(card.querySelector("h3").cloneNode(true), card.querySelector("ul").cloneNode(true));
  }

  nodes.forEach((node) => {
    node.addEventListener("click", () => selectArea(Number(node.dataset.areaIndex)));
  });

  selectArea(selectedIndex);
}

function setupForm() {
  const form = document.querySelector(".contact-form");
  const status = document.getElementById("form-status");

  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const requiredFields = [...form.querySelectorAll("input[required], textarea[required]")];
    const hasEmptyField = requiredFields.some((field) => !field.value.trim());

    if (hasEmptyField) {
      if (status) {
        status.textContent = "Preencha todos os campos obrigatórios.";
        status.className = "form-status error";
      }
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }

    const payload = {
      access_key: form.querySelector("#access_key")?.value || "",
      name: form.querySelector("#name")?.value.trim() || "",
      email: form.querySelector("#email")?.value.trim() || "",
      subject: form.querySelector("#subject")?.value.trim() || "",
      message: form.querySelector("#message")?.value.trim() || ""
    };

    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Erro ao enviar");
        }
        return result;
      })
      .then(() => {
        if (status) {
          status.textContent = "Mensagem enviada com sucesso.";
          status.className = "form-status success";
        }
        form.reset();
      })
      .catch(() => {
        if (status) {
          status.textContent = "Não foi possível enviar agora. Tente novamente mais tarde.";
          status.className = "form-status error";
        }
      })
      .finally(() => {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Enviar";
        }
      });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupReveal();
  setupNavigation();
  setupAreasCarousel();
  setupAreasOrbit();
  setupForm();

  const currentYear = document.getElementById("current-year");
  if (currentYear) {
    currentYear.textContent = String(new Date().getFullYear());
  }
});
