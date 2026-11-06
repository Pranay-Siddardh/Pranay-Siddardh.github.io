
const pages = [...document.querySelectorAll(".page")];
const navLinks = [...document.querySelectorAll(".nav-link")];
const pageButtons = [...document.querySelectorAll("[data-page]")];

const menuToggle = document.getElementById("menuToggle");
const navLinksContainer = document.getElementById("navLinks");

let currentPage = "home";
let transitionToken = 0;
let revealObserver = null;

const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

/* =================================
   PAGE NAVIGATION
================================= */

function navigateTo(pageId) {
    const target = document.getElementById(pageId);
    const previous = document.getElementById(currentPage);

    if (!target || target === previous) {
        closeMobileMenu();
        return;
    }

    const token = ++transitionToken;

    closeMobileMenu();

    pages.forEach(page => {
        page.classList.remove("is-leaving");

        if (page !== previous && page !== target) {
            page.classList.remove("active");
            page.setAttribute("aria-hidden", "true");
        }
    });

    if (reducedMotion) {
        finishTransition();
        return;
    }

    previous.classList.remove("is-leaving");
    void previous.offsetWidth;
    previous.classList.add("is-leaving");

    let completed = false;

    function cleanup() {
        previous.removeEventListener("animationend", onAnimationEnd);
        clearTimeout(fallback);
    }

    function onAnimationEnd(event) {
        if (
            event.target === previous &&
            event.animationName === "pageExit"
        ) {
            finishTransition();
        }
    }

    function finishTransition() {
        if (completed) return;
        completed = true;
        cleanup();

        if (token !== transitionToken) return;

        previous.classList.remove("active", "is-leaving");
        previous.setAttribute("aria-hidden", "true");

        target.classList.add("active");
        target.setAttribute("aria-hidden", "false");

        currentPage = pageId;

        updateNavigation(pageId);

        window.scrollTo({
            top: 0,
            behavior: reducedMotion ? "instant" : "smooth"
        });

        initializeReveals(target);
    }

    previous.addEventListener("animationend", onAnimationEnd);

    // Fallback if the animation event is not fired.
    const fallback = setTimeout(finishTransition, 280);
}

/* NAVIGATION BUTTONS */

pageButtons.forEach(button => {
    button.addEventListener("click", event => {
        event.preventDefault();
        navigateTo(button.dataset.page);
    });
});

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

/* =================================
   MOBILE MENU
================================= */

menuToggle.addEventListener("click", () => {
    const isOpen = navLinksContainer.classList.toggle("open");

    menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
    );
});

function closeMobileMenu() {
    navLinksContainer.classList.remove("open");

    menuToggle.setAttribute(
        "aria-expanded",
        "false"
    );
}

document.addEventListener("click", event => {
    if (
        !navLinksContainer.contains(event.target) &&
        !menuToggle.contains(event.target)
    ) {
        closeMobileMenu();
    }
});

/* =================================
   SCROLL REVEAL
================================= */

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

    elements.forEach(element => {
        revealObserver.observe(element);
    });
}

/* =================================
   PROJECT FILTERS
================================= */

const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");

filterButtons.forEach(button => {
    button.addEventListener("click", () => {

        const filter = button.dataset.filter;

        filterButtons.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        projectCards.forEach(card => {
            const categories = card.dataset.category.split(" ");

            const matches =
                filter === "all" ||
                categories.includes(filter);

            card.classList.toggle("is-filtered", !matches);

            if (matches && !reducedMotion) {
                card.animate(
                    [
                        {
                            opacity: 0,
                            transform: "translateY(15px)"
                        },
                        {
                            opacity: 1,
                            transform: "translateY(0)"
                        }
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

/* =================================
   PROJECT CARD 3D TILT
================================= */

if (
    window.matchMedia("(hover: hover)").matches &&
    !reducedMotion
) {
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

/* =================================
   CURSOR GLOW
================================= */

const cursorGlow = document.querySelector(".cursor-glow");

if (window.matchMedia("(hover: hover)").matches) {

    window.addEventListener("pointermove", event => {
        cursorGlow.style.left = `${event.clientX}px`;
        cursorGlow.style.top = `${event.clientY}px`;
    });
}

/* =================================
   READING PROGRESS
================================= */

const progressBar = document.getElementById("progressBar");

window.addEventListener("scroll", () => {

    const scrollable =
        document.documentElement.scrollHeight -
        window.innerHeight;

    const progress = scrollable > 0
        ? (window.scrollY / scrollable) * 100
        : 0;

    progressBar.style.width = `${progress}%`;

}, { passive: true });

/* =================================
   CONTACT FORM
================================= */

const contactForm = document.getElementById("contactForm");
const formFeedback = document.getElementById("formFeedback");

contactForm.addEventListener("submit", event => {

    event.preventDefault();

    const senderEmail =
        document.getElementById("senderEmail").value.trim();

    const subject =
        document.getElementById("subject").value.trim();

    const message =
        document.getElementById("message").value.trim();

    if (!senderEmail || !subject || !message) {
        formFeedback.textContent =
            "Please complete all fields.";
        return;
    }

    if (!contactForm.reportValidity()) {
        return;
    }

    const recipient = "pranaysiddardhareddy@gmail.com";

    const emailBody =
        `From: ${senderEmail}\n\n${message}`;

    const mailtoLink =
        `mailto:${recipient}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(emailBody)}`;

    formFeedback.textContent =
        "Opening your default email application...";

    window.location.href = mailtoLink;
});

/* =================================
   CURRENT YEAR
================================= */

document.getElementById("year").textContent =
    new Date().getFullYear();

/* =================================
   INITIALIZATION
================================= */

initializeReveals(document.getElementById("home"));
updateNavigation("home");

