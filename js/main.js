const FORM_ENDPOINT = "https://api.web3forms.com/submit";

function isInRevealViewport(element) {
  const rect = element.getBoundingClientRect();
  const navbarHeight =
    Number.parseFloat(
      window.getComputedStyle(document.documentElement).getPropertyValue("--navbar-height")
    ) || 0;
  const revealOffset = 24;

  return (
    rect.bottom > navbarHeight + revealOffset &&
    rect.top < window.innerHeight * 0.86 - revealOffset
  );
}

function setupReveal() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const elements = [...document.querySelectorAll(".revelar")];

  if (reduceMotion) {
    elements.forEach((element) => element.classList.add("visivel"));
    return;
  }

  function updateReveals() {
    elements.forEach((element) => {
      element.classList.toggle("visivel", isInRevealViewport(element));
    });
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

function setupMethodologySequence() {
  const scrollContainer = document.querySelector(".methodology-scroll");
  const sticky = document.querySelector(".methodology-sticky");
  const stages = [...document.querySelectorAll("[data-methodology-stage]")];
  const handlingGrid = document.querySelector(
    '[data-methodology-stage="handling"] .process-grid'
  );
  const pinDuration = 320;
  const stageSwitchOffset = 190;

  if (!scrollContainer || !sticky || !handlingGrid || stages.length !== 2) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    stages.forEach((stage) => {
      stage.classList.add("is-active");
    });
    return;
  }

  let activeStage;
  let maxStageHeight = 0;
  let handlingGridPageTop = 0;

  function measureStages() {
    maxStageHeight = sticky.offsetHeight;
    const regionTop = scrollContainer.getBoundingClientRect().top + window.scrollY;
    handlingGridPageTop =
      regionTop +
      handlingGrid.getBoundingClientRect().top -
      sticky.getBoundingClientRect().top;
  }

  function updateStage(remeasure = false) {
    if (remeasure) {
      maxStageHeight = 0;
      measureStages();
    }

    const stickyTop =
      Number.parseFloat(
        window.getComputedStyle(document.documentElement).getPropertyValue("--navbar-height")
      ) || 0;
    const regionTop = scrollContainer.getBoundingClientRect().top + window.scrollY;
    const pinStart = regionTop - stickyTop;
    const scrollY = window.scrollY;
    const canPin = window.innerHeight - stickyTop >= maxStageHeight;
    const switchAt = canPin
      ? pinStart + stageSwitchOffset
      : handlingGridPageTop - window.innerHeight * 0.55 + stageSwitchOffset;
    const showPrinciples = scrollY >= switchAt;
    const nextStage = showPrinciples ? "principles" : "handling";
    const stageChanged = nextStage !== activeStage;

    if (stageChanged) {
      stages.forEach((stage) => {
        stage.classList.toggle("is-active", stage.dataset.methodologyStage === nextStage);
      });
      activeStage = nextStage;
    }

    const activePinDuration = canPin ? pinDuration : 0;
    const pinEnd = pinStart + activePinDuration;

    if (stageChanged || remeasure) {
      scrollContainer.style.minHeight = `${sticky.offsetHeight + activePinDuration}px`;
    }

    const shouldPin = canPin && scrollY >= pinStart && scrollY <= pinEnd;
    scrollContainer.classList.toggle("is-pinned", shouldPin);
    scrollContainer.classList.toggle("is-released", canPin && scrollY > pinEnd);
  }

  window.addEventListener("scroll", updateStage, { passive: true });
  window.addEventListener("resize", () => updateStage(true));
  window.addEventListener("load", () => updateStage(true), { once: true });
  updateStage(true);
}

function setupCustodyLogs() {
  const notepad = document.querySelector(".notepad");
  const entries = notepad?.querySelectorAll(".notepad-logs li");

  if (!notepad || !entries || entries.length === 0) {
    return;
  }

  let animationId = 0;
  let isTyping = false;

  const clearLogs = () => {
    entries.forEach((entry) => {
      entry.textContent = "";
    });
  };

  const fillLogs = async (currentAnimationId) => {
    for (const entry of entries) {
      if (currentAnimationId !== animationId) {
        return;
      }

      const text = entry.dataset.text || "";
      entry.textContent = "";

      for (const character of text) {
        if (currentAnimationId !== animationId) {
          return;
        }
        entry.textContent += character;
        await new Promise((resolve) => window.setTimeout(resolve, 6));
      }

      await new Promise((resolve) => window.setTimeout(resolve, 140));
    }
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    entries.forEach((entry) => {
      entry.textContent = entry.dataset.text || "";
    });
    return;
  }

  entries.forEach((entry) => {
    entry.textContent = "";
  });

  function updateLogs() {
    if (isInRevealViewport(notepad)) {
      if (!isTyping) {
        isTyping = true;
        animationId += 1;
        fillLogs(animationId);
      }
    } else {
      animationId += 1;
      isTyping = false;
      clearLogs();
    }
  }

  window.addEventListener("scroll", updateLogs, { passive: true });
  window.addEventListener("resize", updateLogs);
  updateLogs();
}

function setupForm() {
  const form = document.querySelector(".contact-form");
  const status = document.getElementById("form-status");

  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const honeypot = form.querySelector("#website");
    if (honeypot && honeypot.value.trim() !== "") {
      return;
    }

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
  setupMethodologySequence();
  setupCustodyLogs();
  setupForm();
});
