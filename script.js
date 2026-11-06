
const pages = [...document.querySelectorAll(".page")];
const navLinks = [...document.querySelectorAll(".nav-link")];
const pageButtons = [...document.querySelectorAll("[data-page]")];

const menuToggle = document.getElementById("menuToggle");
const navLinksContainer = document.getElementById("navLinks");

let currentPage = "home";
let transitionToken = 0;

const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

// PAGE NAVIGATION

function navigateTo(pageId) {
    const target = document.getElementById(pageId);

    if (!target || target === document.getElementById(currentPage)) {
        closeMobileMenu();
        return;
    }

    const token = ++transitionToken;
    const previous = document.getElementById(currentPage);

    closeMobileMenu();

    // Cancel any previous transition.
    pages.forEach(page => {
        page.classList.remove("is-leaving");
    });

    // Hide other pages immediately.
    pages.forEach(page => {
        if (page !== previous && page !== target) {
            page.classList.remove("active");
            page.setAttribute("aria-hidden", "true");
        }
    });

    previous.classList.add("is-leaving");

    const finishTransition = () => {
        if (token !== transitionToken) return;

        previous.classList.remove("active", "is-leaving");
        previous.setAttribute("aria-hidden", "true");

        target.classList.add("active");
        target.setAttribute("aria-hidden", "false");

        currentPage = pageId;

        updateNavigation(pageId);

        // Restart reveal animations on the new page.
        initializeReveals(target);

        // Animate the page in only after the old one has left.
        target.style.animation = "none";
        void target.offsetHeight;
        target.style.animation = "";

        window.scrollTo({
            top: 0,
            behavior: reducedMotion ? "instant" : "smooth"
        });
    };

    if (reducedMotion) {
        finishTransition();
    } else {
        previous.addEventListener("animationend", function handler(event) {
            if (event.target !== previous ||
                event.animationName !== "pageExit") return;

            previous.removeEventListener("animationend", handler);
            finishTransition();
        });

        // Fallback in case animationend does not fire.
        setTimeout(finishTransition, 260);
    }
}

function updateNavigation(pageId) {
    navLinks.forEach(link => {
        const active = link.dataset.page === pageId;

        link.classList.toggle("active", active);

        if (active) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

pageButtons.forEach(button => {
    button.addEventListener("click", event => {
        event.preventDefault();
        navigateTo(button.dataset.page);
    });
});

// MOBILE MENU

menuToggle.addEventListener("click", () => {
    const isOpen = navLinksContainer.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
});

function closeMobileMenu() {
    navLinksContainer.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
}

document.addEventListener("click", event => {
    if (
        !navLinksContainer.contains(event.target) &&
        !menuToggle.contains(event.target)
    ) {
        closeMobileMenu();
    }
});

// SCROLL REVEAL

let revealObserver;

function initializeReveals(container) {
    if (revealObserver) {
        revealObserver.disconnect();
    }

    const elements = container.querySelectorAll(".reveal");

    elements.forEach((element, index) => {
        element.classList.remove("visible");

        element.style.transitionDelay =
            `${Math.min(index * 75, 450)}ms`;

        if (reducedMotion) {
            element.classList.add("visible");
        }
    });

    if (reducedMotion) return;

    revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12
    });

    elements.forEach(element => revealObserver.observe(element));
}

// PROJECT FILTERS

const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        const filter = button.dataset.filter;

        filterButtons.forEach(item =>
            item.classList.remove("active")
        );

        button.classList.add("active");

        projectCards.forEach(card => {
            const categories = card.dataset.category.split(" ");
            const matches =
                filter === "all" || categories.includes(filter);

            card.classList.toggle("is-filtered", !matches);

            if (matches && !reducedMotion) {
                card.animate(
                    [
                        { opacity: 0, transform: "translateY(15px)" },
                        { opacity: 1, transform: "translateY(0)" }
                    ],
                    {
                        duration: 400,
                        easing: "cubic-bezier(.2,.8,.2,1)"
                    }
                );
            }
        });
    });
});

// PROJECT CARD 3D TILT

if (window.matchMedia("(hover: hover)").matches && !reducedMotion) {
    projectCards.forEach(card => {
        card.addEventListener("pointermove", event => {
            if (card.classList.contains("is-filtered")) return;

            const rect = card.getBoundingClientRect();

            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;

            const rotateX = (0.5 - y) * 7;
            const rotateY = (x - 0.5) * 7;

            card.style.transform =
                `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
        });

        card.addEventListener("pointerleave", () => {
            card.style.transform = "";
        });
    });
}

// CURSOR GLOW

const cursorGlow = document.querySelector(".cursor-glow");

if (window.matchMedia("(hover: hover)").matches) {
    window.addEventListener("pointermove", event => {
        cursorGlow.style.left = `${event.clientX}px`;
        cursorGlow.style.top = `${event.clientY}px`;
    });
}

// READING PROGRESS

const progressBar = document.getElementById("progressBar");

window.addEventListener("scroll", () => {
    const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;

    const progress = scrollable > 0
        ? (window.scrollY / scrollable) * 100
        : 0;

    progressBar.style.width = `${progress}%`;
}, { passive: true });

// COPY EMAIL

const copyButton = document.getElementById("copyEmail");
const copyFeedback = document.getElementById("copyFeedback");

const email = "pranaysiddhardhareddy@gmail.com";

copyButton.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(email);
        copyFeedback.textContent = "Email copied!";
    } catch {
        copyFeedback.textContent =
            "Copy unavailable. Select the email address above.";
    }

    setTimeout(() => {
        copyFeedback.textContent = "";
    }, 2500);
});

// CURRENT YEAR

document.getElementById("year").textContent =
    new Date().getFullYear();

// INITIALIZE

initializeReveals(document.getElementById("home"));
updateNavigation("home");

