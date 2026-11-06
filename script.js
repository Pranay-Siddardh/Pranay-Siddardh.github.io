
/* =================================
   SID.DEV — MAIN JAVASCRIPT
   Navigation, animations and UI
================================= */

/* =================================
   ELEMENT REFERENCES
================================= */

const pages = [...document.querySelectorAll(".page")];
const navLinks = [...document.querySelectorAll(".nav-link")];
const pageButtons = [...document.querySelectorAll("[data-page]")];

const menuToggle = document.getElementById("menuToggle");
const navLinksContainer = document.getElementById("navLinks");

const filterButtons = [
    ...document.querySelectorAll(".filter-btn")
];

const projectCards = [
    ...document.querySelectorAll(".project-card")
];

const cursorGlow = document.querySelector(".cursor-glow");
const progressBar = document.getElementById("progressBar");

const contactForm = document.getElementById("contactForm");
const formFeedback = document.getElementById("formFeedback");

const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

const validPageIds = new Set(
    pages.map(page => page.id)
);

/* =================================
   GLOBAL STATE
================================= */

let currentPage = "home";
let pendingTransition = null;
let revealObserver = null;
let transitionToken = 0;


/* =================================
   MOBILE MENU
================================= */

function closeMobileMenu() {

    if (navLinksContainer) {
        navLinksContainer.classList.remove("open");
    }

    if (menuToggle) {
        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}

if (menuToggle && navLinksContainer) {

    menuToggle.addEventListener("click", () => {

        const isOpen =
            navLinksContainer.classList.toggle("open");

        menuToggle.setAttribute(
            "aria-expanded",
            String(isOpen)
        );
    });

    document.addEventListener("click", event => {

        if (
            !navLinksContainer.contains(event.target) &&
            !menuToggle.contains(event.target)
        ) {
            closeMobileMenu();
        }
    });
}


/* =================================
   NAVIGATION UI
================================= */

function updateNavigation(pageId) {

    navLinks.forEach(link => {

        const active =
            link.dataset.page === pageId;

        link.classList.toggle("active", active);

        if (active) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}


/* =================================
   CANCEL PREVIOUS TRANSITION
================================= */

function cancelPendingTransition() {

    if (!pendingTransition) return;

    pendingTransition.cancel();

    pendingTransition = null;
}


/* =================================
   ACTIVATE PAGE IMMEDIATELY
================================= */

function activatePageImmediately(pageId) {

    cancelPendingTransition();

    pages.forEach(page => {

        const active = page.id === pageId;

        page.classList.remove("is-leaving");
        page.classList.toggle("active", active);

        page.setAttribute(
            "aria-hidden",
            String(!active)
        );
    });

    currentPage = pageId;

    updateNavigation(pageId);

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });

    initializeReveals(
        document.getElementById(pageId)
    );
}


/* =================================
   PAGE NAVIGATION
================================= */

function navigateTo(pageId, options = {}) {

    const {
        updateHistory = true
    } = options;

    const target = document.getElementById(pageId);

    // Reject invalid page IDs.
    if (!target || !validPageIds.has(pageId)) {
        closeMobileMenu();
        return;
    }

    closeMobileMenu();

    // Avoid duplicate navigation events.
    if (
        pendingTransition &&
        pendingTransition.target === target
    ) {
        return;
    }

    if (
        !pendingTransition &&
        pageId === currentPage
    ) {
        return;
    }

    // Update browser history for normal button navigation.
    if (updateHistory) {

        const newHash = `#${pageId}`;

        if (window.location.hash !== newHash) {

            history.pushState(
                { page: pageId },
                "",
                newHash
            );
        }
    }

    // Cancel any animation that was still running.
    cancelPendingTransition();

    const previous = pages.find(page =>
        page.classList.contains("active")
    );

    // No previous active page: activate directly.
    if (!previous || previous === target) {

        activatePageImmediately(pageId);
        return;
    }

    // Remove unwanted active states from other pages.
    pages.forEach(page => {

        if (
            page !== previous &&
            page !== target
        ) {
            page.classList.remove(
                "active",
                "is-leaving"
            );

            page.setAttribute(
                "aria-hidden",
                "true"
            );
        }
    });

    // Reduced-motion users should not wait for animations.
    if (reducedMotion) {

        activatePageImmediately(pageId);
        return;
    }

    const token = ++transitionToken;

    let completed = false;
    let fallback = null;

    function cleanup() {

        previous.removeEventListener(
            "animationend",
            onAnimationEnd
        );

        if (fallback !== null) {
            clearTimeout(fallback);
            fallback = null;
        }
    }

    function finishTransition() {

        if (completed) return;

        completed = true;

        cleanup();

        if (token !== transitionToken) return;

        previous.classList.remove(
            "active",
            "is-leaving"
        );

        previous.setAttribute(
            "aria-hidden",
            "true"
        );

        target.classList.add("active");

        target.setAttribute(
            "aria-hidden",
            "false"
        );

        currentPage = pageId;

        pendingTransition = null;

        updateNavigation(pageId);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        initializeReveals(target);
    }

    function onAnimationEnd(event) {

        if (
            event.target === previous &&
            event.animationName === "pageExit"
        ) {
            finishTransition();
        }
    }

    // Register the listener before starting the animation.
    previous.addEventListener(
        "animationend",
        onAnimationEnd
    );

    previous.classList.remove("is-leaving");

    // Force the browser to restart the exit animation.
    void previous.offsetWidth;

    previous.classList.add("is-leaving");

    // Fallback if animationend does not fire.
    fallback = setTimeout(
        finishTransition,
        350
    );

    // Store cancellation logic for rapid navigation.
    pendingTransition = {

        target,

        cancel() {

            cleanup();

            previous.classList.remove(
                "is-leaving"
            );

            transitionToken++;
        }
    };
}


/* =================================
   NAVIGATION BUTTON EVENTS
================================= */

pageButtons.forEach(button => {

    button.addEventListener("click", event => {

        event.preventDefault();

        navigateTo(button.dataset.page);
    });
});


/* =================================
   BROWSER BACK / FORWARD
================================= */

function handleHistoryNavigation() {

    const hash = window.location.hash;

    const requestedPage = hash.startsWith("#")
        ? hash.slice(1)
        : "";

    const pageId = validPageIds.has(requestedPage)
        ? requestedPage
        : "home";

    if (
        pendingTransition &&
        pendingTransition.target.id === pageId
    ) {
        return;
    }

    if (
        !pendingTransition &&
        currentPage === pageId
    ) {
        return;
    }

    navigateTo(pageId, {
        updateHistory: false
    });
}

window.addEventListener(
    "popstate",
    handleHistoryNavigation
);

window.addEventListener(
    "hashchange",
    handleHistoryNavigation
);


/* =================================
   SCROLL REVEAL
================================= */

function initializeReveals(container) {

    // Disconnect the observer belonging to the previous page.
    if (revealObserver) {

        revealObserver.disconnect();

        revealObserver = null;
    }

    if (!container) return;

    const elements = [
        ...container.querySelectorAll(".reveal")
    ];

    if (elements.length === 0) return;

    elements.forEach((element, index) => {

        element.classList.remove("visible");

        element.style.transitionDelay =
            `${Math.min(index * 75, 450)}ms`;
    });

    // Reduced-motion mode: show everything immediately.
    if (reducedMotion) {

        elements.forEach(element => {
            element.classList.add("visible");
        });

        return;
    }

    // Fallback for browsers without IntersectionObserver.
    if (!("IntersectionObserver" in window)) {

        elements.forEach(element => {
            element.classList.add("visible");
        });

        return;
    }

    const observer = new IntersectionObserver(
        entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("visible");

                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.01,
            rootMargin: "0px 0px -5% 0px"
        }
    );

    revealObserver = observer;

    elements.forEach(element => {

        observer.observe(element);
    });
}


/* =================================
   PROJECT FILTERS
================================= */

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        const filter = button.dataset.filter;

        filterButtons.forEach(item => {

            item.classList.toggle(
                "active",
                item === button
            );
        });

        projectCards.forEach(card => {

            const categories = (
                card.dataset.category || ""
            ).split(/\s+/);

            const matches =
                filter === "all" ||
                categories.includes(filter);

            card.classList.toggle(
                "is-filtered",
                !matches
            );

            if (
                matches &&
                !reducedMotion &&
                typeof card.animate === "function"
            ) {

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

            if (card.classList.contains("is-filtered")) {
                return;
            }

            const rect = card.getBoundingClientRect();

            if (!rect.width || !rect.height) return;

            const x =
                (event.clientX - rect.left) / rect.width;

            const y =
                (event.clientY - rect.top) / rect.height;

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

if (
    cursorGlow &&
    window.matchMedia("(hover: hover)").matches
) {

    window.addEventListener("pointermove", event => {

        cursorGlow.style.left =
            `${event.clientX}px`;

        cursorGlow.style.top =
            `${event.clientY}px`;
    });
}


/* =================================
   READING PROGRESS
================================= */

function updateReadingProgress() {

    if (!progressBar) return;

    const scrollable =
        document.documentElement.scrollHeight -
        window.innerHeight;

    const progress = scrollable > 0
        ? (window.scrollY / scrollable) * 100
        : 0;

    progressBar.style.width =
        `${Math.min(100, Math.max(0, progress))}%`;
}

window.addEventListener(
    "scroll",
    updateReadingProgress,
    { passive: true }
);

window.addEventListener(
    "resize",
    updateReadingProgress
);


/* =================================
   CONTACT FORM
================================= */

if (contactForm && formFeedback) {

    contactForm.addEventListener("submit", event => {

        event.preventDefault();

        const senderEmail =
            document.getElementById("senderEmail")
                ?.value.trim();

        const subject =
            document.getElementById("subject")
                ?.value.trim();

        const message =
            document.getElementById("message")
                ?.value.trim();

        if (!senderEmail || !subject || !message) {

            formFeedback.textContent =
                "Please complete all fields.";

            return;
        }

        if (!contactForm.reportValidity()) {
            return;
        }

        const recipient =
            "pranaysiddardhareddy@gmail.com";

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
}


/* =================================
   CURRENT YEAR
================================= */

const yearElement = document.getElementById("year");

if (yearElement) {

    yearElement.textContent =
        new Date().getFullYear();
}


/* =================================
   INITIALIZATION
================================= */

function initializeWebsite() {

    // Restore the requested page from the URL.
    const hash = window.location.hash;

    const requestedPage = hash.startsWith("#")
        ? hash.slice(1)
        : "";

    const initialPage = validPageIds.has(requestedPage)
        ? requestedPage
        : "home";

    // Normalize an invalid URL hash.
    if (
        hash &&
        !validPageIds.has(requestedPage)
    ) {

        history.replaceState(
            { page: "home" },
            "",
            "#home"
        );
    }

    // Set the correct page without running a transition.
    activatePageImmediately(initialPage);

    // Start reading progress at the correct position.
    updateReadingProgress();

    // Make sure the mobile menu starts closed.
    closeMobileMenu();
}

initializeWebsite();

