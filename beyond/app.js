(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TZ = "Australia/Melbourne";
  const chapters = [...document.querySelectorAll("main [data-vo]")];
  const navLinks = [...document.querySelectorAll(".orbit-nav [data-nav]")];
  const soundBtn = document.getElementById("sound");
  const veil = document.getElementById("veil");
  const enter = document.getElementById("enter");
  const nowEl = document.getElementById("now");
  const keeperNow = document.getElementById("keeperNow");
  const cursor = document.querySelector(".cursor");
  const wheel = document.getElementById("timeWheel");
  const hourClock = document.getElementById("hourClock");
  const hourName = document.getElementById("hourName");
  const hourCopy = document.getElementById("hourCopy");
  const timeVeil = document.getElementById("timeVeil");
  const copied = document.getElementById("copied");
  const player = new Audio();
  player.preload = "none";

  const clips = {
    open: "assets/vo-open.mp3",
    dimensions: "assets/vo-dimensions.mp3",
    directions: "assets/vo-directions.mp3",
    times: "assets/vo-times.mp3",
    law: "assets/vo-law.mp3",
    keeper: "assets/vo-keeper.mp3",
    gates: "assets/vo-gates.mp3",
    return: "assets/vo-return.mp3",
  };

  let entered = false;
  let soundOn = true;
  let currentVo = "";
  let activeId = "";
  let ticking = false;

  function stopVoice() {
    player.pause();
    player.removeAttribute("src");
    try {
      player.load();
    } catch {
      /* ignore */
    }
  }

  function playVoice(name, force = false) {
    if (!entered || !soundOn || !name || !clips[name]) return;
    if (!force && name === currentVo) return;
    currentVo = name;
    player.pause();
    player.src = clips[name];
    player.play().catch(() => {});
  }

  function formatMelbourne(date = new Date()) {
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  }

  function melbourneMinutes(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-AU", {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
    const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
    return hour * 60 + minute;
  }

  function tickClock() {
    const stamp = formatMelbourne();
    if (nowEl) {
      nowEl.dateTime = new Date().toISOString();
      nowEl.textContent = `${stamp} MEL`;
    }
    if (keeperNow) keeperNow.textContent = `${stamp} · Melbourne`;
  }

  tickClock();
  setInterval(tickClock, 1000);

  function applyInstance(chapter, voiceForce = false) {
    if (!chapter) return;
    const id = chapter.id;
    const already = id === activeId;
    activeId = id;
    document.body.dataset.instance = id;
    chapters.forEach((node) => {
      node.classList.toggle("is-current", node === chapter);
    });
    navLinks.forEach((link) => {
      link.toggleAttribute("aria-current", link.getAttribute("data-nav") === chapter.dataset.nav);
    });
    if (!already || voiceForce) playVoice(chapter.dataset.vo || "", voiceForce);
  }

  function nearestChapter() {
    const mid = window.innerHeight * 0.45;
    let best = chapters[0];
    let bestDist = Infinity;
    chapters.forEach((chapter) => {
      const rect = chapter.getBoundingClientRect();
      const dist = Math.abs(rect.top + rect.height / 2 - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = chapter;
      }
    });
    return best;
  }

  function onScroll() {
    if (!entered || ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      applyInstance(nearestChapter());
      ticking = false;
    });
  }

  function openCircle() {
    entered = true;
    document.body.classList.add("entered");
    veil?.setAttribute("data-state", "gone");
    const now = melbourneMinutes();
    if (wheel) {
      wheel.value = String(now);
      setHour(now);
    }
    applyInstance(document.getElementById("beyond"), true);
    startField();
  }

  enter?.addEventListener("click", openCircle);

  document.getElementById("again")?.addEventListener("click", () => {
    currentVo = "";
    activeId = "";
    applyInstance(document.getElementById("beyond"), true);
  });

  soundBtn?.addEventListener("click", () => {
    soundOn = !soundOn;
    soundBtn.setAttribute("aria-pressed", String(soundOn));
    soundBtn.textContent = soundOn ? "Sound on" : "Sound off";
    if (!soundOn) {
      stopVoice();
      currentVo = "";
    } else if (entered) {
      playVoice(nearestChapter()?.dataset.vo || "", true);
    }
  });

  window.addEventListener("scroll", onScroll, { passive: true });

  const dims = {
    0: {
      index: "00",
      title: "The Seed",
      copy: "A point that contains every later world. Nothing around it. Everything inside it.",
    },
    1: {
      index: "01",
      title: "The Narrow Path",
      copy: "Not farther. Through. One instance at a time, until the line remembers it is a circle.",
    },
    2: {
      index: "02",
      title: "The Plane",
      copy: "Every direction you can draw. A map that has not yet learned height.",
    },
    3: {
      index: "03",
      title: "The World",
      copy: "The room, the body, the claw. Depth arrives and calls itself real.",
    },
    4: {
      index: "04",
      title: "The River",
      copy: "Time is a circle seen from the side. What looks like a line is only the turning.",
    },
    inf: {
      index: "∞",
      title: "The Circle",
      copy: "Where the first touches the last. The door without a name. The only shape that lasts.",
    },
  };

  const dimCard = document.getElementById("dimCard");
  document.querySelectorAll("[data-dim]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-dim]").forEach((other) => {
        other.setAttribute("aria-selected", String(other === button));
      });
      const next = dims[button.getAttribute("data-dim") || "0"];
      if (!dimCard || !next) return;
      dimCard.innerHTML = `<p class="dim-index">${next.index}</p><h3>${next.title}</h3><p>${next.copy}</p>`;
    });
  });

  const directions = [
    ["North", 0],
    ["North-east", 45],
    ["East", 90],
    ["South-east", 135],
    ["South", 180],
    ["South-west", 225],
    ["West", 270],
    ["North-west", 315],
    ["In", 0],
    ["Out", 180],
    ["Before", 270],
    ["After", 90],
  ];

  const dirGrid = document.getElementById("dirGrid");
  const rose = document.getElementById("rose");
  const compass = document.getElementById("compass");
  const bearing = document.getElementById("bearing");
  let angle = 0;

  function setAngle(next) {
    angle = ((next % 360) + 360) % 360;
    if (rose) rose.style.transform = `rotate(${-angle}deg)`;
    if (compass) compass.setAttribute("aria-valuenow", String(Math.round(angle)));
    const named =
      directions.find(([, deg]) => deg === Math.round(angle / 45) * 45) || directions[0];
    if (bearing) {
      bearing.innerHTML = `Facing <strong>${named[0]}</strong> — ${Math.round(angle)}°`;
    }
    dirGrid?.querySelectorAll("button").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.deg) === named[1] && button.dataset.name === named[0]),
      );
    });
  }

  directions.forEach(([name, deg]) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    button.dataset.deg = String(deg);
    button.dataset.name = name;
    button.setAttribute("aria-pressed", String(name === "North"));
    button.addEventListener("click", () => setAngle(deg));
    item.appendChild(button);
    dirGrid?.appendChild(item);
  });

  let dragging = false;
  function pointerAngle(event) {
    if (!compass) return angle;
    const box = compass.getBoundingClientRect();
    const x = event.clientX - (box.left + box.width / 2);
    const y = event.clientY - (box.top + box.height / 2);
    return (Math.atan2(x, -y) * 180) / Math.PI;
  }

  compass?.addEventListener("pointerdown", (event) => {
    dragging = true;
    compass.setPointerCapture(event.pointerId);
    setAngle(pointerAngle(event));
  });
  compass?.addEventListener("pointermove", (event) => {
    if (dragging) setAngle(pointerAngle(event));
  });
  compass?.addEventListener("pointerup", () => {
    dragging = false;
  });
  compass?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") setAngle(angle + 15);
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") setAngle(angle - 15);
  });

  const hours = [
    { until: 180, name: "The deep", copy: "Last night still holds the room." },
    { until: 360, name: "The turning", copy: "The last hour begins to remember the first." },
    { until: 540, name: "First light", copy: "The first morning opens its hands." },
    { until: 720, name: "High morning", copy: "The day stands in its own gold." },
    { until: 900, name: "The seam", copy: "Noon is midnight seen through the ring." },
    { until: 1080, name: "The long afternoon", copy: "Every shadow points home." },
    { until: 1260, name: "Last light", copy: "The first morning is already on its way back." },
    { until: 1440, name: "The deep", copy: "There is no edge to this hour." },
  ];

  function setHour(mins) {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    const slot = hours.find((entry) => mins < entry.until) || hours[hours.length - 1];
    if (hourClock) hourClock.textContent = `${h}:${m}`;
    if (hourName) hourName.textContent = slot.name;
    if (hourCopy) hourCopy.textContent = slot.copy;
    if (timeVeil) {
      const night = Math.abs(mins - 720) / 720;
      timeVeil.style.opacity = String(0.15 + night * 0.55);
    }
  }

  wheel?.addEventListener("input", (event) => {
    setHour(Number(event.target.value));
  });
  setHour(Number(wheel?.value || 360));

  document.querySelectorAll("[data-mail]").forEach((gate) => {
    gate.addEventListener("click", async (event) => {
      const mail = gate.getAttribute("data-mail");
      const name = gate.getAttribute("data-name") || "Gate";
      if (!mail) return;
      event.preventDefault();
      try {
        await navigator.clipboard.writeText(mail);
        if (copied) {
          copied.hidden = false;
          copied.textContent = `${name} copied to the circle`;
        }
      } catch {
        window.location.href = `mailto:${mail}`;
      }
    });
  });

  const canvas = document.getElementById("void");
  const ctx = canvas?.getContext("2d");
  const starsField = [];
  let width = 0;
  let height = 0;
  let mouseX = 0.5;
  let mouseY = 0.5;
  let fieldOn = false;

  function resize() {
    if (!canvas) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    starsField.length = 0;
    const count = Math.min(140, Math.floor((width * height) / 18000));
    for (let i = 0; i < count; i += 1) {
      starsField.push({
        x: Math.random(),
        y: Math.random(),
        z: 0.2 + Math.random() * 0.8,
        r: Math.random() * 1.4 + 0.2,
      });
    }
  }

  function draw(stamp) {
    if (!ctx || !canvas || !fieldOn) return;
    ctx.clearRect(0, 0, width, height);
    const driftX = (mouseX - 0.5) * 30;
    const driftY = (mouseY - 0.5) * 30;
    starsField.forEach((star) => {
      const x = star.x * width + driftX * star.z;
      const y = star.y * height + driftY * star.z;
      const twinkle = reduced ? 0.7 : 0.45 + Math.sin(stamp * 0.001 + star.x * 12) * 0.35;
      ctx.beginPath();
      ctx.fillStyle = `rgba(244, 226, 176, ${twinkle * star.z})`;
      ctx.arc(x, y, star.r * star.z, 0, Math.PI * 2);
      ctx.fill();
    });
    if (!reduced && fieldOn) requestAnimationFrame(draw);
  }

  function startField() {
    if (fieldOn) return;
    fieldOn = true;
    resize();
    if (!reduced) requestAnimationFrame(draw);
    else draw(0);
  }

  window.addEventListener("resize", () => {
    if (fieldOn) resize();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopVoice();
      currentVo = "";
    }
  });

  window.addEventListener("pointermove", (event) => {
    mouseX = event.clientX / window.innerWidth;
    mouseY = event.clientY / window.innerHeight;
    if (cursor) {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    }
  });

  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.body.classList.add("fine");
    document.querySelectorAll("a, button, input, summary").forEach((node) => {
      node.addEventListener("pointerenter", () => cursor?.classList.add("hot"));
      node.addEventListener("pointerleave", () => cursor?.classList.remove("hot"));
    });
  }
})();
