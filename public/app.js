(function () {
  "use strict";

  const views = {
    landing: document.getElementById("landing-view"),
    login: document.getElementById("login-view"),
    dashboard: document.getElementById("dashboard-view"),
    admin: document.getElementById("admin-view"),
    input: document.getElementById("view-input"),
    loading: document.getElementById("view-loading"),
    error: document.getElementById("view-error"),
    result: document.getElementById("view-result"),
  };

  const form = document.getElementById("pricecheck-form");
  const textarea = document.getElementById("description");
  const deliverablesInput = document.getElementById("deliverables");
  const currencySelect = document.getElementById("currency");
  const fieldError = document.getElementById("field-error");
  const submitBtn = document.getElementById("submit-btn");
  const submitLabel = submitBtn?.querySelector(".btn-label");
  const loadingText = document.getElementById("loading-text");
  const loadingPercent = document.getElementById("loading-percent");
  const loadingProgressFill = document.getElementById("loading-progress-fill");
  const loadingProgressTrack = document.getElementById(
    "loading-progress-track",
  );

  const errorMessageEl = document.getElementById("error-message");
  const errorRetryBtn = document.getElementById("error-retry-btn");
  const errorReturnBtn = document.getElementById("error-return-btn");

  const recommendedQuoteEl = document.getElementById("recommended-quote");
  const fairRangeEl = document.getElementById("fair-range");
  const rangeFillEl = document.getElementById("range-fill");
  const rangeMarkerEl = document.getElementById("range-marker");
  const rangeMinLabel = document.getElementById("range-min-label");
  const rangeMaxLabel = document.getElementById("range-max-label");
  const resultProjectName = document.getElementById("result-project-name");
  const resultExperience = document.getElementById("result-experience");
  const resultDeadline = document.getElementById("result-deadline");

  const breakdownListEl = document.getElementById("breakdown-list");
  const reasonsListEl = document.getElementById("reasons-list");
  const adviceTextEl = document.getElementById("advice-text");
  const negotiationTipEl = document.getElementById("negotiation-tip");
  const missingCardEl = document.getElementById("missing-card");
  const missingListEl = document.getElementById("missing-list");

  const copyBtn = document.getElementById("copy-btn");
  const downloadBtn = document.getElementById("download-btn");
  const invoiceBtn = document.getElementById("invoice-btn");
  const invoiceForm = document.getElementById("invoice-form");
  const invoiceCloseBtn = document.getElementById("invoice-close-btn");
  const invoiceFrom = document.getElementById("invoice-from");
  const invoiceClient = document.getElementById("invoice-client");
  const invoiceEmail = document.getElementById("invoice-email");
  const invoiceDue = document.getElementById("invoice-due");
  const invoiceBank = document.getElementById("invoice-bank");
  const invoiceAccountName = document.getElementById("invoice-account-name");
  const invoiceAccountNumber = document.getElementById(
    "invoice-account-number",
  );
  const invoiceNotes = document.getElementById("invoice-notes");
  const invoiceDownloadBtn = document.getElementById("invoice-download-btn");
  const newCheckBtn = document.getElementById("new-check-btn");
  const feedbackForm = document.getElementById("feedback-form");
  const feedbackAmount = document.getElementById("feedback-amount");
  const feedbackOutcome = document.getElementById("feedback-outcome");
  const feedbackReason = document.getElementById("feedback-reason");
  const feedbackMessage = document.getElementById("feedback-message");
  const historyListEl = document.getElementById("history-list");
  const historyPanelEl = document.getElementById("history-panel");
  const historyEmptyEl = document.getElementById("history-empty");
  const historyClearBtn = document.getElementById("history-clear-btn");
  const dashboardStartBtn = document.getElementById("dashboard-start-btn");
  const dashboardHistoryBtn = document.getElementById("dashboard-history-btn");
  const dashboardInvoiceBtn = document.getElementById("dashboard-invoice-btn");
  const dashboardEstimateCount = document.getElementById(
    "dashboard-estimate-count",
  );
  const dashboardLatestQuote = document.getElementById(
    "dashboard-latest-quote",
  );
  const dashboardLatestCategory = document.getElementById(
    "dashboard-latest-category",
  );
  const dashboardCategoryCount = document.getElementById(
    "dashboard-category-count",
  );
  const dashboardRecentList = document.getElementById("dashboard-recent-list");
  const dashboardEmpty = document.getElementById("dashboard-empty");
  const adminSourceBadge = document.getElementById("admin-source-badge");
  const adminRefreshBtn = document.getElementById("admin-refresh-btn");
  const adminResetBtn = document.getElementById("admin-reset-btn");
  const adminFeedbackTotal = document.getElementById("admin-feedback-total");
  const adminUserTotal = document.getElementById("admin-user-total");
  const adminEstimateTotal = document.getElementById("admin-estimate-total");
  const adminAcceptedRate = document.getElementById("admin-accepted-rate");
  const adminAccuracy = document.getElementById("admin-accuracy");
  const adminBarChart = document.getElementById("admin-bar-chart");
  const adminRecentList = document.getElementById("admin-recent-list");
  const adminMessage = document.getElementById("admin-message");
  const adminNotificationButton = document.getElementById(
    "admin-notification-button",
  );
  const adminNotificationCount = document.getElementById(
    "admin-notification-count",
  );
  const adminFeedbackDrawer = document.getElementById("admin-feedback-drawer");
  const adminDrawerBackdrop = document.getElementById("admin-drawer-backdrop");
  const adminDrawerClose = document.getElementById("admin-drawer-close");
  const adminDrawerClear = document.getElementById("admin-drawer-clear");
  const adminDrawerSummary = document.getElementById("admin-drawer-summary");
  const adminFeedbackList = document.getElementById("admin-feedback-list");
  const adminDrawerNotificationCount = document.getElementById(
    "admin-drawer-notification-count",
  );
  const adminDrawerFeedbackCount = document.getElementById(
    "admin-drawer-feedback-count",
  );
  const adminNotificationFilters = [
    ...document.querySelectorAll("[data-notification-filter]"),
  ];
  let adminNotifications = [];
  let activeNotificationFilter = "all";
  const adminOutcomeDonut = document.getElementById("admin-outcome-donut");
  const adminOutcomeLegend = document.getElementById("admin-outcome-legend");
  const adminPerformanceGrid = document.getElementById(
    "admin-performance-grid",
  );
  const adminScatter = document.getElementById("admin-scatter");
  const adminCategoryTable = document.getElementById("admin-category-table");
  const loginGoogleButton = document.getElementById("login-google-button");
  const loginCredentialForm = document.getElementById("login-credential-form");
  const loginModeButtons = [...document.querySelectorAll("[data-auth-mode]")];
  const loginNameField = document.getElementById("login-name-field");
  const loginNameInput = document.getElementById("login-name");
  const loginPhoneField = document.getElementById("login-phone-field");
  const loginPhoneInput = document.getElementById("login-phone");
  const loginSkillField = document.getElementById("login-skill-field");
  const loginSkillInput = document.getElementById("login-skill");
  const loginExperienceField = document.getElementById(
    "login-experience-field",
  );
  const loginExperienceInput = document.getElementById("login-experience");
  const loginCurrencyField = document.getElementById("login-currency-field");
  const loginCurrencyInput = document.getElementById("login-currency");
  const loginUpdatesField = document.getElementById("login-updates-field");
  const loginUpdatesInput = document.getElementById("login-updates");
  const loginPasswordInput = document.getElementById("login-password");
  const loginEmailInput = document.getElementById("login-email");
  const loginStatusBox = document.getElementById("login-status-box");
  const loginPasswordStrength = document.getElementById(
    "login-password-strength",
  );
  const loginPasswordStrengthMeter = document.getElementById(
    "login-password-strength-meter",
  );
  const loginPasswordStrengthLabel = document.getElementById(
    "login-password-strength-label",
  );
  const loginPasswordRules = [
    ...document.querySelectorAll("[data-password-rule]"),
  ];
  const loginSubmitButton = document.getElementById("login-submit");
  const loginAccountCopy = document.getElementById("login-account-copy");
  const loginDivider = document.getElementById("login-divider");
  const loginBrand = document.getElementById("login-brand");
  const loginKicker = document.getElementById("login-kicker");
  const loginTitle = document.getElementById("login-title");
  const loginSubtitle = document.getElementById("login-subtitle");
  const loginBackLink = document.getElementById("login-back-link");
  const loginOtpEmailAddress = document.getElementById(
    "login-otp-email-address",
  );
  const appNavMenuToggle = document.getElementById("app-nav-menu-toggle");
  const appNavLinks = document.getElementById("app-nav-links");
  if (appNavMenuToggle && appNavLinks) {
    const closeAppNavMenu = () => {
      appNavMenuToggle.setAttribute("aria-expanded", "false");
      appNavMenuToggle.setAttribute("aria-label", "Open navigation menu");
      appNavLinks.classList.remove("is-open");
    };

    appNavMenuToggle.addEventListener("click", () => {
      const isOpen = appNavMenuToggle.getAttribute("aria-expanded") === "true";
      appNavMenuToggle.setAttribute("aria-expanded", String(!isOpen));
      appNavMenuToggle.setAttribute(
        "aria-label",
        isOpen ? "Open navigation menu" : "Close navigation menu",
      );
      appNavLinks.classList.toggle("is-open", !isOpen);
    });

    appNavLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeAppNavMenu();
    });

    window
      .matchMedia("(min-width: 721px)")
      .addEventListener("change", closeAppNavMenu);
  }
  const navAdminDashboard = document.getElementById("nav-admin-dashboard");
  const navGetStarted = document.querySelector(
    '#app-nav-links [data-nav-item="get-started"]',
  );
  const navDashboard = document.getElementById("nav-dashboard");
  const authUser = document.getElementById("auth-user");
  const authName = document.getElementById("auth-name");
  const authAvatar = document.getElementById("auth-avatar");
  const authSignout = document.getElementById("auth-signout");
  const authMessage = document.getElementById("auth-message");
  const loginAuthMessage = document.getElementById("login-auth-message");
  const loginOtpForm = document.getElementById("login-otp-form");
  const loginOtpInput = document.getElementById("login-otp");
  const loginOtpBack = document.getElementById("login-otp-back");
  const loginOtpResend = document.getElementById("login-otp-resend");
  const loginOtpStatus = document.getElementById("login-otp-status");

  let isSubmitting = false;
  let loginMode = "signin";
  let passwordAuthEnabled = false;
  let pendingEmailConfirmation = "";
  let authSubmitCooldownUntil = 0;
  let otpResendCooldownUntil = 0;
  let otpVerifyCooldownUntil = 0;
  let otpVerifyInFlight = false;
  const OTP_RESEND_COOLDOWN_SECONDS = 60;

  function setAuthSubmitCooldown(ms = 1500) {
    authSubmitCooldownUntil = 0;
    // Temporary browser-side protection disabled for now.
    // Server-side auth limits remain in place.
  }

  function isAuthSubmitCoolingDown() {
    return false;
  }

  function setOtpResendCooldown(seconds = 30) {
    otpResendCooldownUntil = Date.now() + seconds * 1000;
    updateOtpResendUi();
  }

  function setOtpVerifyCooldown(seconds = 0) {
    otpVerifyCooldownUntil = Date.now() + Math.max(0, seconds) * 1000;
    updateOtpVerifyUi();
  }

  function updateOtpVerifyUi() {
    const submit = document.getElementById("login-otp-submit");
    if (!submit) return;
    const remainingSeconds = Math.max(
      0,
      Math.ceil((otpVerifyCooldownUntil - Date.now()) / 1000),
    );
    submit.disabled = otpVerifyInFlight || remainingSeconds > 0;
    submit.setAttribute("aria-disabled", String(submit.disabled));
    submit.textContent = otpVerifyInFlight
      ? "Verifying..."
      : remainingSeconds > 0
        ? `Try again (${remainingSeconds}s)`
        : "Verify Email";
  }

  function updateOtpResendUi() {
    if (!loginOtpResend) return;
    const remainingSeconds = Math.max(
      0,
      Math.ceil((otpResendCooldownUntil - Date.now()) / 1000),
    );
    const disabled = remainingSeconds > 0;
    loginOtpResend.disabled = disabled;
    loginOtpResend.setAttribute("aria-disabled", String(disabled));
    loginOtpResend.textContent =
      remainingSeconds > 0
        ? `Resend code (${remainingSeconds}s)`
        : "Resend code";
  }

  function updateOtpStatus(message = "", state = "") {
    if (!loginOtpStatus) return;
    loginOtpStatus.textContent = message;
    loginOtpStatus.classList.toggle("is-error", state === "error");
    loginOtpStatus.classList.toggle("is-success", state === "success");
    loginOtpStatus.hidden = !message;
  }

  function showEmailOtp(email) {
    pendingEmailConfirmation = email;
    setOtpResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    setOtpVerifyCooldown(0);
    if (loginCredentialForm) loginCredentialForm.hidden = true;
    if (loginOtpForm) loginOtpForm.hidden = false;
    if (loginAccountCopy) loginAccountCopy.hidden = true;
    if (loginDivider) loginDivider.hidden = true;
    if (loginGoogleButton) loginGoogleButton.hidden = true;
    if (loginBrand) loginBrand.hidden = true;
    if (loginKicker) loginKicker.hidden = true;
    if (loginTitle) loginTitle.textContent = "Verify your email";
    if (loginSubtitle) loginSubtitle.hidden = true;
    if (loginBackLink) loginBackLink.hidden = true;
    if (loginOtpEmailAddress) loginOtpEmailAddress.textContent = email;
    if (loginOtpBack) loginOtpBack.textContent = "Change email";
    const otpSubmit = document.getElementById("login-otp-submit");
    if (otpSubmit) otpSubmit.textContent = "Verify email";
    updateOtpStatus();
    showAuthMessage();
    if (loginOtpInput) {
      loginOtpInput.value = "";
      loginOtpInput.focus();
    }
  }

  function hideEmailOtp() {
    pendingEmailConfirmation = "";
    otpResendCooldownUntil = 0;
    otpVerifyCooldownUntil = 0;
    otpVerifyInFlight = false;
    if (loginOtpForm) loginOtpForm.hidden = true;
    if (loginCredentialForm) loginCredentialForm.hidden = false;
    if (loginAccountCopy) loginAccountCopy.hidden = false;
    if (loginBrand) loginBrand.hidden = false;
    if (loginKicker) loginKicker.hidden = false;
    if (loginTitle)
      loginTitle.textContent = "Sign in to continue to PriceCheck";
    if (loginSubtitle) loginSubtitle.hidden = false;
    if (loginBackLink) loginBackLink.hidden = false;
    if (loginGoogleButton) loginGoogleButton.hidden = false;
    if (loginDivider)
      loginDivider.hidden = !(
        passwordAuthEnabled &&
        loginGoogleButton &&
        !loginGoogleButton.hidden
      );
    updateOtpStatus();
    showAuthMessage();
    setLoginMode("signin");
  }
  let lastResult = null;
  const integrationWarningKeys = new Set();
  const selections = {
    experienceLevel: "professional",
    deadline: "3_6_days",
    currency: "NGN",
  };
  const HISTORY_KEY = "pricecheck-history";
  const MAX_HISTORY_ITEMS = 8;
  let accountUserId = null;
  let currentSessionUser = null;
  const ADMIN_PERMISSION_BY_TAB = {
    "tab-btn-overview": "analytics",
    "tab-btn-pricing": "pricing",
    "tab-btn-rbac": "access",
    "tab-btn-telemetry": "telemetry",
  };
  const ROLE_PERMISSION_FALLBACK = {
    Owner: ["pricing", "access", "analytics", "telemetry"],
    "Super Admin": ["pricing", "access", "analytics", "telemetry"],
    "Pricing Manager": ["pricing", "analytics"],
    Analyst: ["analytics"],
    "Standard User": [],
  };

  function getUserPermissions(user) {
    if (Array.isArray(user?.permissions) && user.permissions.length) {
      return user.permissions;
    }
    if (user?.role && ROLE_PERMISSION_FALLBACK[user.role]) {
      return ROLE_PERMISSION_FALLBACK[user.role];
    }
    if (user?.isAdmin) {
      return ["pricing", "access", "analytics", "telemetry"];
    }
    return [];
  }

  function hasPermission(user, permission) {
    return Boolean(permission && getUserPermissions(user).includes(permission));
  }

  function hasAnyAdminPermission(user) {
    return Object.values(ADMIN_PERMISSION_BY_TAB).some((permission) =>
      hasPermission(user, permission),
    );
  }

  function showAuthMessage(message = "") {
    const target = isLoginPath ? loginAuthMessage : authMessage;
    const other = isLoginPath ? authMessage : loginAuthMessage;
    if (other) {
      other.textContent = "";
      other.hidden = true;
    }
    if (!target) return;
    target.textContent = message;
    target.hidden = !message;
  }

  function getAdminGreeting(date = new Date()) {
    const hour = date.getHours();
    if (hour < 12) return "Good morning, admin.";
    if (hour < 18) return "Good afternoon, admin.";
    return "Good evening, admin.";
  }

  function updateAdminGreeting(date = new Date()) {
    const heading = document.getElementById("admin-greeting-title");
    if (!heading) return;
    heading.textContent = getAdminGreeting(date);
  }

  function updateAdminNavigation(user) {
    const hasAccess = hasAnyAdminPermission(user);
    if (navAdminDashboard) navAdminDashboard.hidden = !hasAccess;
  }

  function syncAdminTabAccess() {
    const tabBtns = [...document.querySelectorAll(".admin-tab-btn")];
    const tabPanels = [...document.querySelectorAll(".admin-tab-panel")];
    if (!tabBtns.length || !tabPanels.length) return;

    let activeTab = tabBtns.find(
      (btn) => btn.classList.contains("is-active") && !btn.hidden,
    );

    tabBtns.forEach((btn) => {
      const permission = ADMIN_PERMISSION_BY_TAB[btn.id];
      const isAllowed =
        !permission || hasPermission(currentSessionUser, permission);
      btn.hidden = !isAllowed;
      btn.disabled = !isAllowed;
      btn.setAttribute("aria-disabled", String(!isAllowed));
      if (!isAllowed) {
        btn.classList.remove("is-active");
        btn.setAttribute("aria-selected", "false");
      }
    });

    const nextTab =
      tabBtns.find((btn) => !btn.hidden && btn === activeTab) ||
      tabBtns.find((btn) => !btn.hidden);

    if (!nextTab) return;

    const controlsId = nextTab.getAttribute("aria-controls");
    tabPanels.forEach((panel) => {
      panel.hidden = panel.id !== controlsId;
    });

    tabBtns.forEach((btn) => {
      const isTarget = btn === nextTab;
      btn.classList.toggle("is-active", isTarget);
      btn.setAttribute("aria-selected", isTarget ? "true" : "false");
      btn.setAttribute("tabindex", isTarget ? "0" : "-1");
    });
  }

  function renderAuthenticatedUser(user) {
    const signedIn = Boolean(user);
    currentSessionUser = user || null;
    document.body.dataset.authState = signedIn ? "authenticated" : "public";
    // Keep the public informational links available from the authenticated
    // dashboard and admin views. Get started remains a public-only CTA.
    if (navGetStarted) navGetStarted.hidden = signedIn;
    if (navDashboard) navDashboard.hidden = !signedIn;
    if (authUser) authUser.hidden = !signedIn;
    if (loginGoogleButton) loginGoogleButton.hidden = signedIn;
    updateAdminNavigation(user);
    syncAdminTabAccess();
    if (!signedIn) {
      if (accountUserId) {
        accountUserId = null;
        renderHistory();
      }
      return;
    }
    if (authName) authName.textContent = user.name || user.email;
    if (authAvatar) {
      authAvatar.hidden = !user.picture;
      if (user.picture) authAvatar.src = user.picture;
    }
    if (accountUserId !== user.id) {
      accountUserId = user.id;
      renderHistory();
      void loadAccountHistory();
    }
  }

  function loadGoogleIdentityScript() {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]',
      );
      if (existing)
        return window.google
          ? resolve()
          : existing.addEventListener("load", resolve, { once: true });
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = resolve;
      script.onerror = () =>
        reject(new Error("Google sign-in could not be loaded."));
      document.head.appendChild(script);
    });
  }

  async function handleGoogleCredential(response) {
    showAuthMessage();
    try {
      const result = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || "Google sign-in failed.");
      currentSessionUser = data.user || null;
      renderAuthenticatedUser(data.user);
      if (isLoginPath) {
        window.location.assign(
          hasAnyAdminPermission(data.user) ? "/admin" : "/estimate",
        );
      }
    } catch (error) {
      showAuthMessage(error.message);
    }
  }

  function setLoginMode(mode) {
    loginMode = mode === "signup" ? "signup" : "signin";
    if (isLoginPath) {
      const currentUrl = new URL(window.location.href);
      if (loginMode === "signup") {
        currentUrl.searchParams.set("mode", "signup");
      } else if (currentUrl.searchParams.get("mode") === "signup") {
        currentUrl.searchParams.delete("mode");
      }
      window.history.replaceState(
        {},
        document.title,
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
      );
      window.PriceCheckNavbar?.updateActive();
    }
    loginModeButtons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.authMode === loginMode),
      );
    });
    const isSignup = loginMode === "signup";

    if (loginNameField) loginNameField.hidden = !isSignup;
    if (loginNameInput) loginNameInput.required = isSignup;
    if (loginPhoneField) loginPhoneField.hidden = !isSignup;
    if (loginPhoneInput) loginPhoneInput.required = false;
    if (loginSkillField) loginSkillField.hidden = !isSignup;
    if (loginSkillInput) loginSkillInput.required = false;
    if (loginExperienceField) loginExperienceField.hidden = !isSignup;
    if (loginExperienceInput) loginExperienceInput.required = false;
    if (loginCurrencyField) loginCurrencyField.hidden = !isSignup;
    if (loginCurrencyInput) loginCurrencyInput.required = false;
    if (loginUpdatesField) loginUpdatesField.hidden = !isSignup;
    if (loginUpdatesInput) loginUpdatesInput.checked = false;
    if (loginPasswordInput) {
      loginPasswordInput.autocomplete = isSignup
        ? "new-password"
        : "current-password";
      loginPasswordInput.minLength = isSignup ? 8 : 0;
      loginPasswordInput.required = true;
      loginPasswordInput.placeholder = isSignup
        ? "Create a password"
        : "Password";
    }
    if (loginPasswordStrength) loginPasswordStrength.hidden = !isSignup;
    updatePasswordStrength();
    if (loginSubmitButton) {
      loginSubmitButton.textContent =
        loginMode === "signup" ? "Create Account" : "Sign in";
      updateLoginSubmitState();
    }
  }

  function validateSignupForm(formData) {
    const fullName = String(formData.get("name") || "").trim();
    if (!fullName) return "Enter your full name.";

    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return "Enter a valid email address.";
    }

    const password = String(formData.get("password") || "");
    if ([...password].length < 8 || password.length > 128) {
      return "Password must be between 8 and 128 characters.";
    }
    if (!/\p{L}/u.test(password)) return "Password must contain a letter.";
    if (!/\d/.test(password)) return "Password must contain a number.";
    if (!/[\p{P}\p{S}]/u.test(password)) {
      return "Password must contain a symbol.";
    }
    const phone = String(formData.get("phone") || "").trim();
    if (phone && !/^\+?[0-9()\-\s]{7,30}$/.test(phone)) {
      return "Enter a valid phone number.";
    }

    return "";
  }

  function updateLoginSubmitState() {
    if (!loginSubmitButton || !loginCredentialForm) return;
    const formData = new FormData(loginCredentialForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const validEmail =
      email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validPassword = password.length > 0 && password.length <= 128;
    const validSignup = loginMode !== "signup" || !validateSignupForm(formData);
    const enabled =
      passwordAuthEnabled && validEmail && validPassword && validSignup;
    loginSubmitButton.disabled = !enabled;
    loginSubmitButton.setAttribute("aria-disabled", String(!enabled));
  }

  function updatePasswordStrength() {
    if (!loginPasswordStrengthMeter || !loginPasswordInput) return;

    const password = loginPasswordInput.value;
    const rules = {
      length: [...password].length >= 8,
      letter: /\p{L}/u.test(password),
      number: /\d/.test(password),
      symbol: /[\p{P}\p{S}]/u.test(password),
    };
    const score = Object.values(rules).filter(Boolean).length;
    let strength = "empty";
    let label = "";

    if (password) {
      strength = ["weak", "weak", "fair", "good", "good"][score];
      label = strength[0].toUpperCase() + strength.slice(1);
      if (
        score === 4 &&
        ([...password].length >= 12 ||
          (/\p{Lu}/u.test(password) && /\p{Ll}/u.test(password)))
      ) {
        strength = "strong";
        label = "Strong";
      }
    }

    loginPasswordStrengthMeter.dataset.strength = strength;
    loginPasswordStrengthMeter.setAttribute("aria-valuenow", String(score));
    loginPasswordStrengthMeter.setAttribute("aria-valuetext", label || "Empty");
    loginPasswordStrengthMeter.style.setProperty(
      "--password-strength-progress",
      `${(score / 4) * 100}%`,
    );
    if (loginPasswordStrengthLabel) {
      loginPasswordStrengthLabel.textContent = label;
    }
    loginPasswordRules.forEach((rule) => {
      rule.classList.toggle("is-satisfied", rules[rule.dataset.passwordRule]);
    });
  }

  function togglePasswordVisibility(button) {
    if (!button) return;
    const targetId = button.dataset.passwordToggle;
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;
    const nextType = target.type === "password" ? "text" : "password";
    target.type = nextType;
    const isVisible = nextType === "text";
    button.setAttribute(
      "aria-label",
      isVisible ? "Hide password" : "Show password",
    );
    button.setAttribute("aria-pressed", String(isVisible));
    button.title = isVisible ? "Hide password" : "Show password";
  }

  async function handlePasswordAuth(event) {
    event.preventDefault();
    if (!loginCredentialForm || loginSubmitButton?.disabled) return;
    if (isAuthSubmitCoolingDown()) {
      showAuthMessage("Please wait a moment before trying again.");
      return;
    }
    showAuthMessage();
    setAuthSubmitCooldown();

    const formData = new FormData(loginCredentialForm);
    if (loginMode === "signup") {
      const validationError = validateSignupForm(formData);
      if (validationError) {
        showAuthMessage(validationError);
        return;
      }
    }
    loginSubmitButton.disabled = true;
    loginSubmitButton.textContent =
      loginMode === "signup" ? "Creating account..." : "Signing in...";

    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };
    if (loginMode === "signup") {
      const profession = String(formData.get("profession") || "").trim();
      const experience = String(formData.get("experience") || "").trim();
      const currency = String(formData.get("currency") || "").trim();
      const productUpdates = formData.get("productUpdates") === "true";
      payload.name = String(formData.get("name") || "").trim();
      payload.skillWork = profession || "";
      payload.phone = String(formData.get("phone") || "").trim();
      payload.experience = experience;
      payload.currency = currency;
      payload.productUpdates = productUpdates;
    }

    try {
      const response = await fetch(
        loginMode === "signup" ? "/api/auth/signup" : "/api/auth/password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data.error || "Authentication failed.";
        if (
          loginMode === "signin" &&
          /invalid login credentials|invalid credentials|please check your email and password/i.test(
            errorMessage,
          )
        ) {
          throw new Error("Incorrect email or password.");
        }
        if (
          loginMode === "signup" &&
          /already exists|account with this email|email already/i.test(
            errorMessage,
          )
        ) {
          throw new Error("An account with this email already exists.");
        }
        throw new Error(errorMessage);
      }
      if (data.user) {
        currentSessionUser = data.user;
        renderAuthenticatedUser(data.user);
        window.location.assign(
          hasAnyAdminPermission(data.user) ? "/admin" : "/estimate",
        );
        return;
      }
      loginCredentialForm.reset();
      showEmailOtp(
        String(data.email || formData.get("email") || "")
          .trim()
          .toLowerCase(),
      );
    } catch (error) {
      showAuthMessage(
        error.message || "Authentication failed. Please try again.",
      );
    } finally {
      loginSubmitButton.disabled = false;
      if (!pendingEmailConfirmation) {
        setLoginMode(loginMode);
      }
    }
  }

  async function initializeAuth() {
    try {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const authError = hashParams.get("error");
      const authErrorCode = hashParams.get("error_code");
      if (authError || authErrorCode) {
        const confirmationMessage =
          authErrorCode === "otp_expired" || authError === "access_denied"
            ? "This confirmation link is invalid or has expired. Request a new confirmation email and try again."
            : "Email confirmation could not be completed. Request a new confirmation email and try again.";
        showAuthMessage(confirmationMessage);
        window.history.replaceState(
          {},
          document.title,
          `${window.location.pathname}${window.location.search}`,
        );
      }
      const configResponse = await fetch("/api/auth/config", {
        cache: "no-store",
      });
      const config = await configResponse.json();
      const sessionResponse = await fetch("/api/auth/session", {
        cache: "no-store",
      });
      const session = await sessionResponse.json();
      if (session.user) {
        currentSessionUser = session.user;
        renderAuthenticatedUser(session.user);
        if (window.location.pathname === "/") {
          window.location.assign(
            hasAnyAdminPermission(session.user) ? "/admin" : "/estimate",
          );
        }
        if (isAdminPath && !hasAnyAdminPermission(session.user)) {
          window.location.assign("/estimate");
        }
        if (isLoginPath) {
          window.location.assign(
            hasAnyAdminPermission(session.user) ? "/admin" : "/estimate",
          );
        }
        return;
      }
      renderAuthenticatedUser(null);
      if (isEstimatePath || isAdminPath) {
        window.location.assign("/login");
        return;
      }
      if (!isLoginPath) return;

      passwordAuthEnabled = Boolean(config.passwordEnabled);
      setLoginMode(new URLSearchParams(window.location.search).get("mode"));
      if (loginStatusBox) loginStatusBox.hidden = passwordAuthEnabled;
      if (loginPasswordInput) {
        loginPasswordInput.addEventListener("input", () => {
          updatePasswordStrength();
          updateLoginSubmitState();
        });
      }
      if (loginEmailInput) {
        loginEmailInput.addEventListener("input", updateLoginSubmitState);
      }
      if (loginCredentialForm) {
        loginCredentialForm.hidden = false;
        loginCredentialForm.addEventListener("submit", handlePasswordAuth);
        loginCredentialForm.addEventListener("input", updateLoginSubmitState);
        loginCredentialForm.addEventListener("change", updateLoginSubmitState);
      }
      loginOtpInput?.addEventListener("input", () => {
        if (!loginOtpInput) return;
        const digits = loginOtpInput.value.replace(/\D/g, "").slice(0, 6);
        loginOtpInput.value = digits;
      });
      loginOtpInput?.addEventListener("paste", (event) => {
        const pasted =
          (event.clipboardData || window.clipboardData)?.getData("text") || "";
        const digits = pasted.replace(/\D/g, "").slice(0, 6);
        if (!digits) return;
        event.preventDefault();
        if (loginOtpInput) {
          loginOtpInput.value = digits;
        }
      });
      loginOtpForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (otpVerifyInFlight) return;
        const verificationWait = Math.max(
          0,
          Math.ceil((otpVerifyCooldownUntil - Date.now()) / 1000),
        );
        if (verificationWait > 0) {
          updateOtpStatus(
            `Please wait ${verificationWait}s before trying the code again.`,
            "error",
          );
          return;
        }
        if (isAuthSubmitCoolingDown()) {
          updateOtpStatus("Please wait a moment before trying again.", "error");
          return;
        }
        const token = loginOtpInput?.value.trim() || "";
        if (!pendingEmailConfirmation || !/^\d{6}$/.test(token)) {
          updateOtpStatus(
            "Enter the 6-digit verification code sent to your email.",
            "error",
          );
          return;
        }
        otpVerifyInFlight = true;
        updateOtpVerifyUi();
        try {
          const response = await fetch("/api/auth/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: pendingEmailConfirmation, token }),
          });
          const data = await response.json();
          if (!response.ok) {
            if (response.status === 429) {
              setOtpVerifyCooldown(
                Number(data.retryAfterSeconds) || OTP_RESEND_COOLDOWN_SECONDS,
              );
            }
            const errorMessage = data.error || "Email verification failed.";
            if (/expired|otp_expired/i.test(errorMessage)) {
              throw new Error(
                "That verification code has expired. Request a new one.",
              );
            }
            if (/invalid|not accepted|incorrect/i.test(errorMessage)) {
              throw new Error("Invalid verification code. Try again.");
            }
            throw new Error(errorMessage);
          }
          currentSessionUser = data.user;
          renderAuthenticatedUser(data.user);
          updateOtpStatus("Email verified.", "success");
          window.setTimeout(() => {
            window.location.assign(
              hasAnyAdminPermission(data.user) ? "/admin" : "/estimate",
            );
          }, 700);
        } catch (error) {
          updateOtpStatus(error.message || "Verification failed.", "error");
          if (
            /too many|rate limit|temporarily limiting|security purposes/i.test(
              error.message,
            ) &&
            otpVerifyCooldownUntil <= Date.now()
          ) {
            setOtpVerifyCooldown(OTP_RESEND_COOLDOWN_SECONDS);
          }
        } finally {
          otpVerifyInFlight = false;
          updateOtpVerifyUi();
        }
      });
      loginOtpBack?.addEventListener("click", hideEmailOtp);
      loginOtpResend?.addEventListener("click", async () => {
        if (!pendingEmailConfirmation) return;
        const remaining = Math.max(
          0,
          Math.ceil((otpResendCooldownUntil - Date.now()) / 1000),
        );
        if (remaining > 0) {
          updateOtpStatus(
            `Please wait ${remaining}s before requesting a new code.`,
            "error",
          );
          return;
        }
        setOtpResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
        updateOtpStatus("Sending a new verification code…", "success");
        let retryAfterSeconds = 0;
        try {
          const response = await fetch("/api/auth/resend-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: pendingEmailConfirmation }),
          });
          const data = await response.json();
          retryAfterSeconds = Number(data.retryAfterSeconds) || 0;
          if (!response.ok) {
            throw new Error(
              data.error || "A new verification code could not be sent.",
            );
          }
          updateOtpStatus("New code sent.", "success");
          if (loginOtpInput) {
            loginOtpInput.value = "";
            loginOtpInput.focus();
          }
        } catch (error) {
          updateOtpStatus(error.message, "error");
          setOtpResendCooldown(
            retryAfterSeconds
              ? retryAfterSeconds
              : /too many|rate limit|temporarily limiting/i.test(error.message)
                ? OTP_RESEND_COOLDOWN_SECONDS
                : 0,
          );
        }
      });
      if (loginOtpResend) {
        updateOtpResendUi();
        window.setInterval(() => {
          if (otpResendCooldownUntil > 0) updateOtpResendUi();
          if (otpVerifyCooldownUntil > 0) updateOtpVerifyUi();
        }, 1000);
      }
      document.querySelectorAll(".password-toggle").forEach((toggleButton) => {
        toggleButton.addEventListener("click", () => {
          togglePasswordVisibility(toggleButton);
        });
      });
      loginModeButtons.forEach((button) => {
        button.hidden = false;
        button.addEventListener("click", () => {
          showAuthMessage();
          setLoginMode(button.dataset.authMode);
        });
      });
      if (loginGoogleButton) loginGoogleButton.hidden = !config.enabled;
      if (loginDivider)
        loginDivider.hidden = !(config.enabled && config.passwordEnabled);

      if (config.enabled && config.clientId) {
        await loadGoogleIdentityScript();
        window.google.accounts.id.initialize({
          client_id: config.clientId,
          callback: handleGoogleCredential,
          auto_select: false,
        });
        if (loginGoogleButton) {
          const renderGoogleButton = () => {
            loginGoogleButton.replaceChildren();
            window.google.accounts.id.renderButton(loginGoogleButton, {
              theme:
                document.documentElement.getAttribute("data-theme") === "light"
                  ? "outline"
                  : "filled_black",
              size: "large",
              text: "continue_with",
              shape: "rectangular",
              logo_alignment: "center",
            });
            const generatedIcon = loginGoogleButton.querySelector(
              '[role="button"] svg',
            );
            if (generatedIcon) {
              const assetIcon = document.createElement("img");
              assetIcon.src = "/assets/google-icon.png";
              assetIcon.alt = "";
              assetIcon.setAttribute("aria-hidden", "true");
              assetIcon.className = "login-google-icon";
              generatedIcon.replaceWith(assetIcon);
            }
          };
          renderGoogleButton();
          new MutationObserver(renderGoogleButton).observe(
            document.documentElement,
            { attributes: true, attributeFilter: ["data-theme"] },
          );
        }
      }
      if (!config.enabled && !config.passwordEnabled) {
        showAuthMessage(
          "Sign-in is not configured yet. Please try again later.",
        );
      }
    } catch (error) {
      renderAuthenticatedUser(null);
      showAuthMessage(error.message);
    }
  }

  const LABELS = {
    experience: {
      starting_out: "Starting out",
      intermediate: "Intermediate",
      professional: "Professional",
      expert: "Expert",
    },
    complexity: {
      simple: "Simple",
      medium: "Medium",
      complex: "Complex",
      very_complex: "Very Complex",
    },
    clientType: {
      individual: "Individual",
      startup: "Startup",
      small_business: "Small Business",
      corporate: "Corporate",
      nonprofit: "Nonprofit",
    },
    deadline: {
      flexible: "Flexible",
      "7_plus_days": "7+ days",
      "3_6_days": "3–6 days",
      "1_2_days": "1–2 days",
      same_day_rush: "Same day / Rush",
    },
  };

  function showView(name) {
    Object.entries(views).forEach(([key, el]) => {
      el.hidden = key !== name;
    });
  }

  function showSection(target) {
    const view = target.closest(".view");
    if (!view) return;
    showView(view.id.replace("-view", ""));
    requestAnimationFrame(() =>
      target.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  function animateNumber(
    element,
    value,
    formatter = (number) => String(number),
  ) {
    if (!element) return;
    const end = Number(value);
    if (!Number.isFinite(end)) {
      element.textContent = "—";
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.textContent = formatter(end);
      return;
    }
    const startedAt = performance.now();
    const duration = 700;
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatter(end * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function formatMetricNumber(value) {
    return Math.round(value).toLocaleString();
  }

  function formatMetricAmount(value) {
    if (value === null || value === undefined) return "—";
    return formatCurrency(value, { code: "NGN" });
  }

  function formatFeedbackDate(value) {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Date unavailable"
      : date.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        });
  }

  function reportFrontendError(error, context = "Frontend error") {
    const message = error?.message || String(error || "Unknown frontend error");
    void fetch("/api/notifications/frontend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: context,
        message: message.slice(0, 500),
        severity: "error",
        path: window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => {});
  }

  window.addEventListener("error", (event) => {
    reportFrontendError(event.error || event.message, "Frontend runtime error");
  });
  window.addEventListener("unhandledrejection", (event) => {
    reportFrontendError(event.reason, "Frontend promise rejection");
  });

  function createFeedbackItem(item, detailed = false) {
    const article = document.createElement("article");
    article.className = detailed
      ? "admin-feedback-item admin-feedback-item-detailed"
      : "admin-feedback-item";

    const heading = document.createElement("div");
    heading.className = "admin-feedback-item-heading";
    const outcome = document.createElement("strong");
    outcome.textContent = item.outcome || "Unknown";
    const date = document.createElement("time");
    date.textContent = formatFeedbackDate(item.createdAt ?? item.created_at);
    heading.append(outcome, date);

    const category = document.createElement("span");
    category.className = "admin-feedback-item-category";
    category.textContent = item.category || "Unknown category";

    const amounts = document.createElement("div");
    amounts.className = "admin-feedback-item-amounts";
    const suggested = Number(item.suggestedAmount ?? item.suggested_amount);
    const actual = Number(item.actualAmount ?? item.actual_amount);
    const suggestedLabel = document.createElement("span");
    suggestedLabel.textContent = `Estimate ${formatMetricAmount(suggested)}`;
    const actualLabel = document.createElement("span");
    actualLabel.textContent = `Actual ${formatMetricAmount(actual)}`;
    amounts.append(suggestedLabel, actualLabel);

    article.append(heading, category, amounts);
    if (detailed) {
      const reason = document.createElement("p");
      reason.className = "admin-feedback-item-reason";
      reason.textContent = `Adjustment reason: ${item.adjustmentReason ?? item.adjustment_reason ?? "none"}`;
      article.appendChild(reason);
    }
    return article;
  }

  function createNotificationItem(item) {
    const article = document.createElement("article");
    article.className = `admin-notification-item admin-notification-${item.severity || "info"}`;
    const heading = document.createElement("div");
    heading.className = "admin-feedback-item-heading";
    const title = document.createElement("strong");
    title.textContent = item.title || "Notification";
    const date = document.createElement("time");
    date.textContent = formatFeedbackDate(item.createdAt ?? item.created_at);
    heading.append(title, date);
    const meta = document.createElement("span");
    meta.className = "admin-notification-meta";
    meta.textContent = `${item.source || "backend"} · ${item.severity || "info"}`;
    const message = document.createElement("p");
    message.textContent = item.message || "No details provided.";
    article.append(heading, meta, message);
    return article;
  }

  function renderFeedbackDrawer(items = []) {
    adminNotifications = items;
    if (!adminFeedbackList || !adminDrawerSummary) return;
    const feedbackCount = items.filter(
      (item) => item.source === "feedback",
    ).length;
    const systemCount = items.length - feedbackCount;
    if (adminDrawerNotificationCount)
      adminDrawerNotificationCount.textContent = `${systemCount} notification${systemCount === 1 ? "" : "s"}`;
    if (adminDrawerFeedbackCount)
      adminDrawerFeedbackCount.textContent = `${feedbackCount} feedback record${feedbackCount === 1 ? "" : "s"}`;
    const filteredItems =
      activeNotificationFilter === "all"
        ? items
        : items.filter((item) => item.source === activeNotificationFilter);
    adminDrawerSummary.textContent = `${filteredItems.length} item${filteredItems.length === 1 ? "" : "s"} shown. Analytics and feedback totals are unchanged by clearing notifications.`;
    adminFeedbackList.innerHTML = "";
    if (!filteredItems.length) {
      adminFeedbackList.innerHTML =
        '<div class="admin-empty-state">No matching notifications.<small>New events will appear here when available.</small></div>';
      return;
    }
    filteredItems.forEach((item) => {
      adminFeedbackList.appendChild(
        item.source
          ? createNotificationItem(item)
          : createFeedbackItem(item, true),
      );
    });
  }

  function setFeedbackDrawerOpen(isOpen) {
    if (!adminFeedbackDrawer || !adminDrawerBackdrop) return;
    adminFeedbackDrawer.classList.toggle("is-open", isOpen);
    adminDrawerBackdrop.hidden = !isOpen;
    adminFeedbackDrawer.setAttribute("aria-hidden", String(!isOpen));
    adminNotificationButton?.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("admin-drawer-open", isOpen);
    if (isOpen) {
      void loadAdminDashboard();
      adminDrawerClose?.focus();
    }
  }

  function renderAdminAnalytics(summary) {
    animateNumber(adminFeedbackTotal, summary.total, formatMetricNumber);
    animateNumber(adminUserTotal, summary.userCount, formatMetricNumber);
    animateNumber(
      adminEstimateTotal,
      summary.estimateCount,
      formatMetricNumber,
    );
    animateNumber(
      adminAcceptedRate,
      summary.acceptanceRate * 100,
      (value) => `${Math.round(value)}%`,
    );
    animateNumber(
      adminAccuracy,
      summary.averageAccuracy * 100,
      (value) => `${Math.round(value)}%`,
    );

    const outcomes = summary.outcomeCounts || {};
    const outcomeEntries = [
      ["accepted", "Accepted", "#4ade80"],
      ["negotiating", "Adjusted", "#fbbf24"],
      ["declined", "Rejected", "#f87171"],
      ["not_sent", "Not sent", "#8b93a7"],
    ];
    const totalOutcomes = outcomeEntries.reduce(
      (sum, [key]) => sum + (outcomes[key] || 0),
      0,
    );
    if (adminOutcomeDonut) {
      if (!totalOutcomes) {
        adminOutcomeDonut.className = "admin-donut admin-donut-empty";
        adminOutcomeDonut.textContent = "No data";
      } else {
        let offset = 0;
        const stops = outcomeEntries.map(([key, , color]) => {
          const amount = ((outcomes[key] || 0) / totalOutcomes) * 360;
          const stop = `${color} ${offset}deg ${offset + amount}deg`;
          offset += amount;
          return stop;
        });
        adminOutcomeDonut.className = "admin-donut";
        adminOutcomeDonut.style.background = `conic-gradient(${stops.join(", ")})`;
        adminOutcomeDonut.innerHTML = `<strong>${totalOutcomes}</strong><span>feedback</span>`;
      }
    }
    if (adminOutcomeLegend) {
      adminOutcomeLegend.innerHTML = "";
      outcomeEntries.forEach(([key, label, color]) => {
        const row = document.createElement("div");
        row.className = "admin-legend-row";
        row.innerHTML = `<i style="background:${color}"></i><span>${label}</span><strong>${outcomes[key] || 0}</strong>`;
        adminOutcomeLegend.appendChild(row);
      });
    }

    const performance = summary.pricingPerformance || {};
    if (adminPerformanceGrid) {
      adminPerformanceGrid.innerHTML = "";
      [
        ["Avg. estimate", performance.averageSuggestedAmount],
        ["Avg. actual", performance.averageActualAmount],
        ["Avg. variance", performance.averageVariance],
        ["Median variance", performance.medianVariance],
      ].forEach(([label, value]) => {
        const item = document.createElement("div");
        item.className = "admin-performance-item";
        item.innerHTML = `<span>${label}</span><strong>${formatMetricAmount(value)}</strong>`;
        adminPerformanceGrid.appendChild(item);
      });
    }
    if (adminScatter) {
      adminScatter.innerHTML = "";
      const points = summary.estimateVsActual || [];
      if (!points.length) {
        adminScatter.innerHTML =
          '<div class="admin-empty-state">No feedback data yet.<small>Estimate versus actual pricing will appear here.</small></div>';
      } else {
        const maxAmount = Math.max(
          ...points.flatMap((point) => [point.suggested, point.actual]),
          1,
        );
        const reference = document.createElement("span");
        reference.className = "admin-scatter-reference";
        reference.style.transform = "rotate(-45deg)";
        adminScatter.appendChild(reference);
        points.forEach((point) => {
          const dot = document.createElement("i");
          dot.className = "admin-scatter-point";
          dot.title = `Estimate ${formatMetricAmount(point.suggested)} · Actual ${formatMetricAmount(point.actual)}`;
          dot.style.left = `${(point.suggested / maxAmount) * 88 + 6}%`;
          dot.style.bottom = `${(point.actual / maxAmount) * 82 + 8}%`;
          adminScatter.appendChild(dot);
        });
        const xLabel = document.createElement("span");
        xLabel.className = "admin-scatter-axis admin-scatter-axis-x";
        xLabel.textContent = "PriceCheck estimate";
        const yLabel = document.createElement("span");
        yLabel.className = "admin-scatter-axis admin-scatter-axis-y";
        yLabel.textContent = "Actual amount";
        adminScatter.append(xLabel, yLabel);
      }
    }
    if (adminCategoryTable) {
      adminCategoryTable.innerHTML = "";
      (summary.categories || []).forEach((category) => {
        const row = document.createElement("tr");
        const nameCell = document.createElement("td");
        const name = document.createElement("strong");
        name.textContent = category.name;
        nameCell.appendChild(name);
        [
          nameCell,
          category.count,
          formatMetricAmount(category.averageSuggestedAmount),
          formatMetricAmount(category.averageActualAmount),
          `${Math.round(category.acceptanceRate * 100)}%`,
        ].forEach((value, index) => {
          if (index === 0) {
            row.appendChild(value);
            return;
          }
          const cell = document.createElement("td");
          cell.textContent = String(value);
          row.appendChild(cell);
        });
        adminCategoryTable.appendChild(row);
      });
    }
  }

  async function loadAdminDashboard() {
    updateAdminGreeting();
    adminMessage.hidden = true;
    try {
      const response = await fetch("/api/pricecheck/admin/summary");
      const summary = await response.json();
      if (!response.ok)
        throw new Error(summary.error || "Admin data unavailable.");
      adminSourceBadge.textContent =
        summary.source === "supabase" ? "Supabase live" : "Local session";
      renderAdminAnalytics(summary);
      if (adminNotificationCount) {
        adminNotificationCount.textContent = String(
          (summary.notifications || []).length || summary.total || 0,
        );
      }
      const feedbackNotifications = (summary.feedback || []).map((item) => ({
        ...item,
        source: "feedback",
        severity: "info",
        title: `${item.outcome || "New"} feedback received`,
      }));
      renderFeedbackDrawer([
        ...(summary.notifications || []),
        ...feedbackNotifications,
      ]);
      if (adminBarChart) adminBarChart.innerHTML = "";
      const feedbackCategories = summary.feedbackCategories || [];
      const maxCategoryCount = Math.max(
        ...feedbackCategories.map((category) => category.count),
        1,
      );

      if (!feedbackCategories.length && adminBarChart) {
        adminBarChart.innerHTML =
          '<div class="admin-empty-state">Not enough data yet.<small>Category performance will appear after feedback is submitted.</small></div>';
      }
      feedbackCategories.forEach((category) => {
        const row = document.createElement("div");
        row.className = "admin-analytics-row";

        const meta = document.createElement("div");
        meta.className = "admin-analytics-meta";

        const name = document.createElement("strong");
        name.textContent = category.name;

        const details = document.createElement("span");
        details.textContent = `${category.count} feedback · ${Math.round(category.averageAccuracy * 100)}% signal`;

        meta.append(name, details);

        const trackWrap = document.createElement("div");
        trackWrap.className = "admin-analytics-track-wrap";

        const volumeTrack = document.createElement("div");
        volumeTrack.className = "admin-analytics-volume-track";
        const volumeFill = document.createElement("i");
        volumeFill.className = "admin-analytics-volume-fill";
        volumeFill.style.width = `${(category.count / maxCategoryCount) * 100}%`;
        volumeTrack.appendChild(volumeFill);

        const signalTrack = document.createElement("div");
        signalTrack.className = "admin-analytics-signal-track";
        const signalFill = document.createElement("i");
        signalFill.className = "admin-analytics-signal-fill";
        signalFill.style.width = `${Math.max(10, category.averageAccuracy * 100)}%`;
        signalTrack.appendChild(signalFill);

        const gauge = document.createElement("div");
        gauge.className = "admin-analytics-gauge";
        gauge.append(volumeTrack, signalTrack);

        const score = document.createElement("span");
        score.className = "admin-analytics-score";
        score.textContent = `${Math.round(category.acceptanceRate * 100)}% accepted`;

        row.append(meta, gauge, score);
        adminBarChart.appendChild(row);
      });
      if (adminRecentList) {
        adminRecentList.innerHTML = summary.recent?.length
          ? ""
          : '<div class="admin-empty-state">No feedback data yet.<small>Recent outcomes will appear here.</small></div>';
      }
      (summary.recent || []).forEach((item) => {
        adminRecentList.appendChild(createFeedbackItem(item));
      });

      // Load interactive Admin enhancement views
      void loadAdminPricing();
      void loadAdminAccess();
      void loadAdminTelemetry();
      setupTelemetryControls();
    } catch (error) {
      adminSourceBadge.textContent = "Unavailable";
      adminMessage.textContent = error.message;
      adminMessage.hidden = false;
    }
  }

  async function loadAdminPricing() {
    const grid = document.getElementById("admin-pricing-grid");
    if (!grid) return;
    if (grid.children.length === 0) {
      grid.innerHTML = Array(4)
        .fill(0)
        .map(
          () => `
        <div class="admin-pricing-card">
          <div class="skeleton-box" style="height: 24px; width: 60%; margin-bottom: 12px;"></div>
          <div class="skeleton-box" style="height: 44px; width: 100%; margin-bottom: 12px;"></div>
          <div class="skeleton-box" style="height: 36px; width: 100%;"></div>
        </div>
      `,
        )
        .join("");
    }
    try {
      const res = await fetch("/api/admin/pricing");
      if (!res.ok) return;
      const data = await res.json();
      const categories = data.categories || {};
      grid.innerHTML = "";

      Object.entries(categories).forEach(([name, cfg]) => {
        const slug = name.replace(/\s+/g, "-");
        const card = document.createElement("div");
        card.className = "admin-pricing-card";
        card.innerHTML = `
          <div class="admin-pricing-card-header">
            <span class="admin-pricing-card-title">${name}</span>
            <span class="admin-kpi-badge">Active Config</span>
          </div>

          <div class="admin-range-visualizer">
            <div class="admin-range-track-bar">
              <input type="range" id="price-slider-${slug}" min="${cfg.minimumPrice}" max="${cfg.maximumPrice}" value="${cfg.basePrice}" step="1000" aria-label="${name} Base Price Slider">
            </div>
            <div class="admin-range-labels">
              <span>Min: ₦<span id="label-min-${slug}">${cfg.minimumPrice.toLocaleString()}</span></span>
              <span>Base: ₦<strong id="label-base-${slug}">${cfg.basePrice.toLocaleString()}</strong></span>
              <span>Max: ₦<span id="label-max-${slug}">${cfg.maximumPrice.toLocaleString()}</span></span>
            </div>
          </div>

          <div class="admin-pricing-card-inputs">
            <label class="admin-pricing-field">
              <span>Base Price (₦)</span>
              <input type="number" step="1000" id="price-base-${slug}" value="${cfg.basePrice}">
            </label>
            <label class="admin-pricing-field">
              <span>Min Limit (₦)</span>
              <input type="number" step="1000" id="price-min-${slug}" value="${cfg.minimumPrice}">
            </label>
            <label class="admin-pricing-field">
              <span>Max Limit (₦)</span>
              <input type="number" step="1000" id="price-max-${slug}" value="${cfg.maximumPrice}">
            </label>
          </div>

          <div class="pricing-validation-error" id="validation-err-${slug}" hidden></div>

          <div class="admin-card-actions">
            <button class="admin-pricing-save-btn" type="button" id="btn-preview-${slug}" data-category="${name}">Preview & Save</button>
            <button class="admin-pricing-reset-btn" type="button" id="btn-reset-${slug}" data-category="${name}">Reset Default</button>
          </div>
        `;
        grid.appendChild(card);

        // Real-time synchronization & validation
        const baseInput = card.querySelector(`#price-base-${slug}`);
        const minInput = card.querySelector(`#price-min-${slug}`);
        const maxInput = card.querySelector(`#price-max-${slug}`);
        const sliderInput = card.querySelector(`#price-slider-${slug}`);
        const errEl = card.querySelector(`#validation-err-${slug}`);
        const previewBtn = card.querySelector(`#btn-preview-${slug}`);
        const resetBtn = card.querySelector(`#btn-reset-${slug}`);
        const labelBase = card.querySelector(`#label-base-${slug}`);
        const labelMin = card.querySelector(`#label-min-${slug}`);
        const labelMax = card.querySelector(`#label-max-${slug}`);

        function validateAndSync() {
          const base = Number(baseInput.value);
          const min = Number(minInput.value);
          const max = Number(maxInput.value);

          // Sync slider bounds & value
          sliderInput.min = String(min > 0 ? min : 0);
          sliderInput.max = String(max > min ? max : min + 1000);
          sliderInput.value = String(base);

          labelMin.textContent = Number.isFinite(min)
            ? min.toLocaleString()
            : "0";
          labelMax.textContent = Number.isFinite(max)
            ? max.toLocaleString()
            : "0";
          labelBase.textContent = Number.isFinite(base)
            ? base.toLocaleString()
            : "0";

          let err = "";
          if (
            !Number.isFinite(base) ||
            base <= 0 ||
            !Number.isFinite(min) ||
            min <= 0 ||
            !Number.isFinite(max) ||
            max <= 0
          ) {
            err = "All prices must be positive numbers.";
          } else if (min > base) {
            err = "Minimum limit cannot be greater than base price.";
          } else if (base > max) {
            err = "Base price cannot be greater than maximum limit.";
          } else if (min > max) {
            err = "Minimum limit cannot be greater than maximum limit.";
          }

          if (err) {
            errEl.textContent = err;
            errEl.hidden = false;
            previewBtn.disabled = true;
          } else {
            errEl.hidden = true;
            previewBtn.disabled = false;
          }
        }

        baseInput.addEventListener("input", validateAndSync);
        minInput.addEventListener("input", validateAndSync);
        maxInput.addEventListener("input", validateAndSync);
        sliderInput.addEventListener("input", () => {
          baseInput.value = sliderInput.value;
          validateAndSync();
        });

        previewBtn.addEventListener("click", () => {
          const base = Number(baseInput.value);
          const min = Number(minInput.value);
          const max = Number(maxInput.value);

          openPricingConfirmModal({
            category: name,
            previous: cfg,
            next: { basePrice: base, minimumPrice: min, maximumPrice: max },
            onConfirm: async (reason) => {
              previewBtn.disabled = true;
              previewBtn.textContent = "Applying...";
              try {
                const saveRes = await fetch("/api/admin/pricing", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    category: name,
                    basePrice: base,
                    minimumPrice: min,
                    maximumPrice: max,
                    reason,
                  }),
                });
                if (saveRes.ok) {
                  previewBtn.textContent = "Saved!";
                  showToast(
                    `Pricing for '${name}' saved successfully!`,
                    "success",
                  );
                  loadAdminPricing();
                } else {
                  const data = await saveRes.json();
                  showToast(
                    data.error || "Failed to save pricing configuration.",
                    "error",
                  );
                  previewBtn.disabled = false;
                  previewBtn.textContent = "Preview & Save";
                }
              } catch {
                showToast(
                  "Network error. Failed to save pricing configuration.",
                  "error",
                );
                previewBtn.disabled = false;
                previewBtn.textContent = "Preview & Save";
              }
            },
          });
        });

        resetBtn.addEventListener("click", async () => {
          if (!window.confirm(`Reset ${name} to configured baseline defaults?`))
            return;
          resetBtn.disabled = true;
          try {
            const resetRes = await fetch("/api/admin/pricing/reset", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ category: name }),
            });
            if (resetRes.ok) {
              showToast(
                `Pricing for '${name}' reset to configured defaults.`,
                "warning",
              );
              loadAdminPricing();
            } else {
              showToast("Failed to reset category baseline.", "error");
              resetBtn.disabled = false;
            }
          } catch {
            showToast("Network error. Failed to reset category.", "error");
            resetBtn.disabled = false;
          }
        });
      });
    } catch {
      // Pricing load fallback
    }
  }

  function openPricingConfirmModal({ category, previous, next, onConfirm }) {
    const backdrop = document.getElementById("pricing-confirm-backdrop");
    const modal = document.getElementById("pricing-confirm-modal");
    const catEl = document.getElementById("pricing-confirm-category");
    const prevBaseEl = document.getElementById("pricing-diff-prev-base");
    const prevRangeEl = document.getElementById("pricing-diff-prev-range");
    const nextBaseEl = document.getElementById("pricing-diff-next-base");
    const nextRangeEl = document.getElementById("pricing-diff-next-range");
    const reasonInput = document.getElementById("pricing-confirm-reason");
    const cancelBtn = document.getElementById("pricing-confirm-cancel");
    const closeBtn = document.getElementById("pricing-confirm-close");
    const submitBtn = document.getElementById("pricing-confirm-submit");

    if (!modal || !backdrop) return;

    catEl.textContent = category;
    prevBaseEl.textContent = `₦${previous.basePrice.toLocaleString()}`;
    prevRangeEl.textContent = `₦${previous.minimumPrice.toLocaleString()} – ₦${previous.maximumPrice.toLocaleString()}`;

    nextBaseEl.textContent = `₦${next.basePrice.toLocaleString()}`;
    nextRangeEl.textContent = `₦${next.minimumPrice.toLocaleString()} – ₦${next.maximumPrice.toLocaleString()}`;

    reasonInput.value = "";
    backdrop.hidden = false;
    modal.hidden = false;

    function closeModal() {
      backdrop.hidden = true;
      modal.hidden = true;
      submitBtn.onclick = null;
    }

    cancelBtn.onclick = closeModal;
    closeBtn.onclick = closeModal;
    backdrop.onclick = closeModal;

    submitBtn.onclick = async () => {
      const reason = reasonInput.value.trim();
      closeModal();
      if (onConfirm) await onConfirm(reason);
    };
  }

  function openRbacConfirmModal({ user, oldRole, newRole, onConfirm }) {
    const backdrop = document.getElementById("rbac-confirm-backdrop");
    const modal = document.getElementById("rbac-confirm-modal");
    const nameEl = document.getElementById("rbac-modal-user-name");
    const oldBadgeEl = document.getElementById("rbac-modal-old-badge");
    const newBadgeEl = document.getElementById("rbac-modal-new-badge");
    const permDescEl = document.getElementById("rbac-modal-permission-desc");
    const reasonInput = document.getElementById("rbac-confirm-reason");
    const cancelBtn = document.getElementById("rbac-confirm-cancel");
    const closeBtn = document.getElementById("rbac-confirm-close");
    const submitBtn = document.getElementById("rbac-confirm-submit");

    if (!modal || !backdrop) return;

    const oldSlug = (oldRole || "standard-user")
      .toLowerCase()
      .replace(/\s+/g, "-");
    const newSlug = (newRole || "standard-user")
      .toLowerCase()
      .replace(/\s+/g, "-");

    nameEl.textContent = `${user.name} (${user.email})`;
    oldBadgeEl.className = `admin-role-badge role-${oldSlug}`;
    oldBadgeEl.textContent = oldRole;

    newBadgeEl.className = `admin-role-badge role-${newSlug}`;
    newBadgeEl.textContent = newRole;

    const descriptions = {
      Owner:
        "Full access granted: Pricing Studio, RBAC management, analytics, and live telemetry at the highest hierarchy level.",
      "Super Admin":
        "Full access granted: Pricing Studio, Access Control RBAC, System Analytics, and Server Telemetry.",
      "Pricing Manager":
        "Pricing control granted: Baseline adjustments, range limits, and analytics inspection.",
      Analyst:
        "Read-only access granted: Feedback trends, summary metrics, and client outcome statistics.",
      "Standard User":
        "Administrative access revoked: Account limited to standard PriceCheck features.",
    };

    permDescEl.textContent =
      descriptions[newRole] || "Updated role privileges.";
    reasonInput.value = "";
    backdrop.hidden = false;
    modal.hidden = false;

    function closeModal() {
      backdrop.hidden = true;
      modal.hidden = true;
      submitBtn.onclick = null;
    }

    cancelBtn.onclick = closeModal;
    closeBtn.onclick = closeModal;
    backdrop.onclick = closeModal;

    submitBtn.onclick = async () => {
      const reason = reasonInput.value.trim();
      closeModal();
      if (onConfirm) await onConfirm(reason);
    };
  }

  let rbacUsersCache = [];
  let rbacRoleFilter = "all";
  let rbacSearchQuery = "";

  async function loadAdminAccess() {
    const table = document.getElementById("admin-access-table");
    const searchInput = document.getElementById("rbac-search-input");
    const filterBtns = document.querySelectorAll(
      "#rbac-role-filters .rbac-filter-btn",
    );
    if (!table) return;

    if (!rbacUsersCache.length) {
      table.innerHTML = Array(4)
        .fill(0)
        .map(
          () => `
        <tr>
          <td colspan="6" style="padding: 14px;"><div class="skeleton-box" style="height: 20px; width: 100%;"></div></td>
        </tr>
      `,
        )
        .join("");
    }

    try {
      const res = await fetch("/api/admin/access");
      if (!res.ok) return;
      const data = await res.json();
      rbacUsersCache = data.users || [];
      const rolesConfig = data.roles || {};
      const currentUserId = String(
        data.currentUserId || currentSessionUser?.id || "",
      ).trim();
      const currentUserEmail = String(currentSessionUser?.email || "")
        .trim()
        .toLowerCase();

      function renderFilteredTable() {
        const counts = {
          Owner: 0,
          "Super Admin": 0,
          "Pricing Manager": 0,
          Analyst: 0,
          "Standard User": 0,
        };
        rbacUsersCache.forEach((u) => {
          if (counts[u.role] !== undefined) counts[u.role] += 1;
        });

        Object.entries(counts).forEach(([role, count]) => {
          const el = document.getElementById(
            `count-${role.toLowerCase().replace(/\s+/g, "-")}`,
          );
          if (el) el.textContent = String(count);
        });

        const filtered = rbacUsersCache.filter((u) => {
          const matchesRole =
            rbacRoleFilter === "all" || u.role === rbacRoleFilter;
          const query = rbacSearchQuery.toLowerCase();
          const matchesSearch =
            !query ||
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.role.toLowerCase().includes(query);
          return matchesRole && matchesSearch;
        });

        table.innerHTML = "";
        if (!filtered.length) {
          table.innerHTML =
            '<tr><td colspan="6" class="admin-empty-state">No matching users found.</td></tr>';
          return;
        }

        filtered.forEach((u) => {
          const tr = document.createElement("tr");
          const roleSlug = (u.role || "standard-user")
            .toLowerCase()
            .replace(/\s+/g, "-");
          const availableRoles = [
            "Owner",
            "Super Admin",
            "Pricing Manager",
            "Analyst",
            "Standard User",
          ];
          const permissions =
            u.permissions || rolesConfig[u.role]?.permissions || [];
          const isProtectedAdmin = String(u.role || "").trim() === "Owner";
          const isCurrentUser =
            (currentUserId && String(u.id).trim() === currentUserId) ||
            (currentUserEmail &&
              String(u.email || "")
                .trim()
                .toLowerCase() === currentUserEmail);

          const permTags = permissions.length
            ? permissions
                .map((p) => `<span class="rbac-perm-tag perm-${p}">${p}</span>`)
                .join(" ")
            : '<span class="rbac-perm-tag">No Admin Privileges</span>';

          const roleCell = isProtectedAdmin
            ? '<span class="admin-role-badge role-owner">Owner</span>'
            : `<span class="admin-role-badge role-${roleSlug}">${u.role}</span>`;

          const roleSelectCell = isCurrentUser
            ? '<span class="rbac-self-role-state">Your role</span>'
            : isProtectedAdmin
              ? '<span class="rbac-perm-tag perm-access">Owner · fixed</span>'
              : `<select class="admin-role-select" data-user-id="${u.id}">
                ${availableRoles.map((r) => `<option value="${r}" ${r === u.role ? "selected" : ""}>${r}</option>`).join("")}
              </select>`;

          const actionCell = isCurrentUser
            ? '<span class="rbac-self-role-state">Not editable</span>'
            : isProtectedAdmin
              ? '<button class="history-action" type="button" disabled>Owner</button>'
              : `<button class="history-action admin-update-role-btn" data-user-id="${u.id}" type="button">Update Role</button>`;

          tr.innerHTML = `
            <td>
              <div>
                <strong>${u.name}</strong>${isCurrentUser ? ' <span class="rbac-you-badge">You</span>' : ""}
                <div style="font-size: 0.78rem; color: var(--text-tertiary);">${u.email}</div>
              </div>
            </td>
            <td>${roleCell}</td>
            <td>
              <span class="user-status-pill ${u.status === "active" ? "status-active" : "status-inactive"}">
                ${u.status === "active" ? "Active" : "Not active"}
              </span>
            </td>
            <td>${roleSelectCell}</td>
            <td><div class="rbac-privileges-wrap">${permTags}</div></td>
            <td>${actionCell}</td>
          `;
          table.appendChild(tr);
        });

        table.querySelectorAll(".admin-update-role-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const userId = btn.dataset.userId;
            const user = rbacUsersCache.find((item) => item.id === userId);
            const select = table.querySelector(
              `select[data-user-id="${userId}"]`,
            );
            const targetRole = select?.value;

            if (!user || !targetRole || targetRole === user.role) {
              if (targetRole === user?.role)
                showToast("User is already assigned to this role.", "info");
              return;
            }

            openRbacConfirmModal({
              user,
              oldRole: user.role,
              newRole: targetRole,
              onConfirm: async (reason) => {
                btn.disabled = true;
                btn.textContent = "Saving...";
                try {
                  const updateRes = await fetch("/api/admin/access", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: user.id,
                      userEmail: user.email,
                      role: targetRole,
                      reason,
                    }),
                  });
                  if (updateRes.ok) {
                    btn.textContent = "Updated!";
                    showToast(
                      `User ${user.email || user.id} assigned to role '${targetRole}'.`,
                      "success",
                    );
                    loadAdminAccess();
                  } else {
                    const errData = await updateRes.json().catch(() => ({}));
                    showToast(
                      errData.error || "Failed to update role privileges.",
                      "error",
                    );
                    btn.disabled = false;
                    btn.textContent = "Update Role";
                  }
                } catch {
                  showToast(
                    "Network error. Failed to update user role.",
                    "error",
                  );
                  btn.disabled = false;
                  btn.textContent = "Update Role";
                }
              },
            });
          });
        });
      }

      if (searchInput && !searchInput.dataset.initialized) {
        searchInput.dataset.initialized = "true";
        searchInput.addEventListener("input", () => {
          rbacSearchQuery = searchInput.value.trim();
          renderFilteredTable();
        });
      }

      if (filterBtns.length) {
        filterBtns.forEach((btn) => {
          if (btn.dataset.initialized) return;
          btn.dataset.initialized = "true";
          btn.addEventListener("click", () => {
            filterBtns.forEach((b) => b.classList.remove("is-active"));
            btn.classList.add("is-active");
            rbacRoleFilter = btn.dataset.roleFilter;
            renderFilteredTable();
          });
        });
      }

      renderFilteredTable();
    } catch {
      // Access load fallback
    }
  }

  let telemetryAutoRefreshTimer = null;
  let telemetryLogsCache = [];
  let telemetryLogFilter = "all";
  let telemetryLogSearch = "";

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showToast(message, type = "info", duration = 4000) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const validTypes = ["success", "error", "warning", "info"];
    const toastType = validTypes.includes(type) ? type : "info";

    const toast = document.createElement("div");
    toast.className = `toast-item toast-${toastType}`;
    toast.setAttribute("role", toastType === "error" ? "alert" : "status");

    const icons = {
      success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
      error: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
      warning: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
      info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    };

    toast.innerHTML = `
      <div class="toast-icon-wrap">${icons[toastType]}</div>
      <div class="toast-content">${escapeHtml(message)}</div>
      <button class="toast-close-btn" type="button" aria-label="Dismiss notification">&times;</button>
    `;

    container.appendChild(toast);

    void toast.offsetHeight;
    toast.classList.add("is-visible");

    let timer = null;

    function dismiss() {
      toast.classList.remove("is-visible");
      toast.classList.add("is-leaving");
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }

    if (duration > 0) {
      timer = setTimeout(dismiss, duration);
    }

    const closeBtn = toast.querySelector(".toast-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        if (timer) clearTimeout(timer);
        dismiss();
      });
    }

    toast.addEventListener("mouseenter", () => {
      if (timer) clearTimeout(timer);
    });
    toast.addEventListener("mouseleave", () => {
      if (duration > 0) timer = setTimeout(dismiss, duration);
    });
  }

  async function loadAdminTelemetry() {
    const nodeVerEl = document.getElementById("telemetry-node-version");
    const uptimeEl = document.getElementById("telemetry-uptime-value");
    const envEl = document.getElementById("telemetry-env");
    const platformEl = document.getElementById("telemetry-platform");
    const pidEl = document.getElementById("telemetry-pid");

    const memBadgeEl = document.getElementById("telemetry-mem-percent-badge");
    const heapUsedEl = document.getElementById("telemetry-heap-used");
    const heapTotalEl = document.getElementById("telemetry-heap-total");
    const memoryBar = document.getElementById("telemetry-memory-bar");
    const rssEl = document.getElementById("telemetry-rss");
    const sysFreeEl = document.getElementById("telemetry-sys-free");

    const healthStatusEl = document.getElementById("telemetry-health-status");
    const statusGeminiEl = document.getElementById("telemetry-status-gemini");
    const statusSupabaseEl = document.getElementById(
      "telemetry-status-supabase",
    );
    const statusGoogleEl = document.getElementById("telemetry-status-google");
    const statusBillingEl = document.getElementById("telemetry-status-billing");

    const cachedCountEl = document.getElementById("telemetry-cached-count");
    const lastSyncEl = document.getElementById("telemetry-last-sync");

    if (!uptimeEl) return;

    try {
      const res = await fetch("/api/admin/health");
      if (!res.ok) return;
      const data = await res.json();

      // Process Runtime
      if (nodeVerEl)
        nodeVerEl.textContent = data.process?.nodeVersion || "Node.js";
      if (uptimeEl)
        uptimeEl.textContent =
          data.process?.uptimeFormatted ||
          `${Math.floor((data.process?.uptimeSeconds || 0) / 60)}m`;
      if (envEl)
        envEl.textContent = (data.process?.env || "development").toUpperCase();
      if (platformEl)
        platformEl.textContent = `${data.process?.platform || "os"} (${data.process?.arch || "x64"})`;
      if (pidEl) pidEl.textContent = data.process?.pid || "—";

      // Memory Usage
      const heapUsed = data.memory?.heapUsedMb || 0;
      const heapTotal = data.memory?.heapTotalMb || 0;
      const memPercent =
        data.memory?.heapUsedPercent ||
        (heapTotal ? Math.round((heapUsed / heapTotal) * 100) : 0);

      if (heapUsedEl) heapUsedEl.textContent = `${heapUsed} MB`;
      if (heapTotalEl) heapTotalEl.textContent = `${heapTotal} MB`;
      if (memBadgeEl) memBadgeEl.textContent = `${memPercent}%`;
      if (rssEl) rssEl.textContent = `${data.memory?.rssMb || 0} MB`;
      if (sysFreeEl)
        sysFreeEl.textContent = data.memory?.systemFreeMb
          ? `${data.memory.systemFreeMb} MB`
          : "N/A";

      if (memoryBar) {
        memoryBar.style.width = `${Math.min(100, Math.max(0, memPercent))}%`;
        if (memPercent > 85) {
          memoryBar.style.background =
            "linear-gradient(90deg, #ef5350, #b71c1c)";
        } else if (memPercent > 70) {
          memoryBar.style.background =
            "linear-gradient(90deg, #ffa726, #f57c00)";
        } else {
          memoryBar.style.background =
            "linear-gradient(90deg, #66bb6a, #2e7d32)";
        }
      }

      // Services Status
      if (healthStatusEl) {
        healthStatusEl.textContent = (data.status || "healthy").toUpperCase();
        healthStatusEl.className =
          data.status === "healthy"
            ? "badge badge-success"
            : "badge badge-warning";
      }

      function updateServicePill(
        el,
        isConfigured,
        textActive,
        textInactive,
        warningTitle,
        warningMessage,
      ) {
        if (!el) return;
        el.textContent = isConfigured ? textActive : textInactive;
        el.className = `user-status-pill ${isConfigured ? "status-active" : "status-inactive"}`;

        if (!isConfigured && warningTitle && warningMessage) {
          const warningKey = `${warningTitle}:${warningMessage}`;
          if (!integrationWarningKeys.has(warningKey)) {
            integrationWarningKeys.add(warningKey);
            void fetch("/api/notifications/frontend", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: warningTitle,
                message: warningMessage,
                severity: "warning",
                path: window.location.pathname,
              }),
              keepalive: true,
            }).catch(() => {});
          }
        }
      }

      updateServicePill(
        statusGeminiEl,
        data.services?.geminiKeyConfigured,
        "Configured (Active)",
        "Not Configured (Fallback Mode)",
        "Core integration warning",
        "Gemini AI Engine is not configured; the app is running in local fallback mode.",
      );
      updateServicePill(
        statusSupabaseEl,
        data.services?.supabaseConfigured,
        "Connected (PostgreSQL)",
        "Memory Fallback Mode",
        "Core integration warning",
        "Supabase is not configured; the app is using in-memory fallback storage.",
      );
      updateServicePill(
        statusGoogleEl,
        data.services?.googleAuthConfigured,
        "Configured",
        "Not Configured",
        "Core integration warning",
        "Google OAuth is not configured; sign-in and session protection are disabled.",
      );
      updateServicePill(
        statusBillingEl,
        data.services?.billingConfigured,
        "Configured",
        "Unconfigured",
        "Core integration warning",
        "Payment gateway is not configured; billing and invoice features are disabled.",
      );

      // Diagnostics & Cache
      if (cachedCountEl)
        cachedCountEl.textContent = String(
          data.metrics?.cachedEstimatesCount ?? 0,
        );
      if (lastSyncEl) {
        const date = new Date(data.timestamp || Date.now());
        lastSyncEl.textContent = date.toLocaleTimeString();
      }

      // Render Logs
      telemetryLogsCache = data.systemLogs || [];
      renderTelemetryLogs();
    } catch {
      // Telemetry fetch fallback
    }
  }

  let auditActionFilter = "all";

  function renderTelemetryLogs() {
    const terminal = document.getElementById("telemetry-log-terminal");
    const countEl = document.getElementById("telemetry-log-count");
    if (!terminal) return;

    let filtered = telemetryLogsCache.slice();

    if (telemetryLogFilter !== "all") {
      filtered = filtered.filter((log) => {
        const sev = (log.severity || "info").toLowerCase();
        if (telemetryLogFilter === "system")
          return (
            sev === "system" || (log.action && log.action.startsWith("system."))
          );
        if (telemetryLogFilter === "feedback")
          return (
            sev === "feedback" ||
            (log.action && log.action.startsWith("feedback."))
          );
        if (telemetryLogFilter === "warning")
          return sev === "warning" || sev === "warn";
        if (telemetryLogFilter === "critical")
          return sev === "critical" || sev === "error";
        return true;
      });
    }

    if (auditActionFilter !== "all") {
      filtered = filtered.filter(
        (log) => (log.action || "").toLowerCase() === auditActionFilter,
      );
    }

    if (telemetryLogSearch) {
      const q = telemetryLogSearch.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          (log.actor || "").toLowerCase().includes(q) ||
          (log.action || "").toLowerCase().includes(q) ||
          (log.description || log.message || "").toLowerCase().includes(q) ||
          (log.entity || "").toLowerCase().includes(q),
      );
    }

    if (countEl)
      countEl.textContent = `${filtered.length} Event${filtered.length === 1 ? "" : "s"}`;

    if (!filtered.length) {
      terminal.innerHTML = `
        <div class="telemetry-log-empty">
          No activity recorded yet.
        </div>
      `;
      return;
    }

    terminal.innerHTML = "";
    filtered.forEach((log) => {
      const entry = document.createElement("div");
      entry.className = "telemetry-log-entry";
      const sev = (log.severity || "info").toLowerCase();
      const sevClass =
        sev === "critical" || sev === "error"
          ? "sev-critical"
          : sev === "warning" || sev === "warn"
            ? "sev-warning"
            : sev === "system"
              ? "sev-system"
              : sev === "feedback"
                ? "sev-feedback"
                : "sev-info";

      const timeStr = log.createdAt
        ? new Date(log.createdAt).toLocaleTimeString()
        : new Date().toLocaleTimeString();

      const desc = escapeHtml(
        log.description || log.message || log.title || "",
      );
      const actor = escapeHtml(log.actor || "system");
      const action = escapeHtml(log.action || log.source || "event");
      const entity = log.entity ? escapeHtml(log.entity) : null;

      entry.innerHTML = `
        <span class="telemetry-log-timestamp">[${timeStr}]</span>
        <span class="telemetry-log-sev-badge ${sevClass}">${escapeHtml(sev.toUpperCase())}</span>
        <span class="telemetry-log-action-badge">${action}</span>
        <span class="telemetry-log-actor-badge">👤 ${actor}</span>
        ${entity ? `<span class="telemetry-log-entity-badge">[${entity}]</span>` : ""}
        <span class="telemetry-log-title">${desc}</span>
      `;
      terminal.appendChild(entry);
    });
  }

  function setupTelemetryControls() {
    const refreshBtn = document.getElementById("telemetry-manual-refresh-btn");
    const intervalSelect = document.getElementById(
      "telemetry-refresh-interval",
    );
    const pulseDot = document.getElementById("telemetry-pulse-dot");
    const searchInput = document.getElementById("telemetry-log-search");
    const actionSelect = document.getElementById("audit-action-filter");
    const filterBtns = document.querySelectorAll("[data-log-filter]");
    const clearBtn = document.getElementById("telemetry-clear-logs-btn");

    if (refreshBtn && !refreshBtn.dataset.initialized) {
      refreshBtn.dataset.initialized = "true";
      refreshBtn.addEventListener("click", () => {
        refreshBtn.disabled = true;
        refreshBtn.textContent = "Loading...";
        loadAdminTelemetry().finally(() => {
          refreshBtn.disabled = false;
          refreshBtn.textContent = "↻ Refresh";
          showToast("System telemetry and audit logs refreshed.", "info");
        });
      });
    }

    function resetAutoRefresh() {
      if (telemetryAutoRefreshTimer) {
        clearInterval(telemetryAutoRefreshTimer);
        telemetryAutoRefreshTimer = null;
      }
      const ms = Number(intervalSelect?.value || 0);
      if (ms > 0) {
        if (pulseDot) pulseDot.classList.add("is-active");
        telemetryAutoRefreshTimer = setInterval(() => {
          void loadAdminTelemetry();
        }, ms);
      } else {
        if (pulseDot) pulseDot.classList.remove("is-active");
      }
    }

    if (intervalSelect && !intervalSelect.dataset.initialized) {
      intervalSelect.dataset.initialized = "true";
      intervalSelect.addEventListener("change", resetAutoRefresh);
      resetAutoRefresh();
    }

    if (searchInput && !searchInput.dataset.initialized) {
      searchInput.dataset.initialized = "true";
      searchInput.addEventListener("input", () => {
        telemetryLogSearch = searchInput.value.trim();
        renderTelemetryLogs();
      });
    }

    if (actionSelect && !actionSelect.dataset.initialized) {
      actionSelect.dataset.initialized = "true";
      actionSelect.addEventListener("change", () => {
        auditActionFilter = actionSelect.value.trim();
        renderTelemetryLogs();
      });
    }

    if (filterBtns.length) {
      filterBtns.forEach((btn) => {
        if (btn.dataset.initialized) return;
        btn.dataset.initialized = "true";
        btn.addEventListener("click", () => {
          filterBtns.forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          telemetryLogFilter = btn.dataset.logFilter;
          renderTelemetryLogs();
        });
      });
    }

    if (clearBtn && !clearBtn.dataset.initialized) {
      clearBtn.dataset.initialized = "true";
      clearBtn.addEventListener("click", async () => {
        if (!window.confirm("Clear all system audit event logs?")) return;
        clearBtn.disabled = true;
        try {
          const response = await fetch("/api/admin/audit-logs", {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Could not clear audit logs.");
          telemetryLogsCache = [];
          renderTelemetryLogs();
        } catch (err) {
          alert(err.message || "Failed to clear audit logs.");
        } finally {
          clearBtn.disabled = false;
        }
      });
    }
  }

  function initAdminTabs() {
    const tabBtns = [...document.querySelectorAll(".admin-tab-btn")];
    const tabPanels = [...document.querySelectorAll(".admin-tab-panel")];
    const accessDeniedEl = document.getElementById("admin-access-denied");
    const accessDeniedMessage = document.getElementById(
      "admin-access-denied-message",
    );
    if (!tabBtns.length || !tabPanels.length) return;

    function hideAccessDenied() {
      if (accessDeniedEl) accessDeniedEl.hidden = true;
    }

    function showAccessDenied(permission, targetBtn) {
      if (!accessDeniedEl || !accessDeniedMessage) return;
      const label = targetBtn?.textContent?.trim() || "this section";
      const requiredPermission = permission
        ? permission.toUpperCase()
        : "ADMINISTRATIVE";
      accessDeniedMessage.innerHTML = `Access to <strong>${label}</strong> is restricted. This area requires the <strong>${requiredPermission}</strong> permission for your current role: <strong>${currentSessionUser?.role || "Standard User"}</strong>.`;
      accessDeniedEl.hidden = false;
    }

    function activateTab(targetBtn, setHash = true) {
      if (!targetBtn) return;
      const requiredPermission = ADMIN_PERMISSION_BY_TAB[targetBtn.id];
      if (
        requiredPermission &&
        !hasPermission(currentSessionUser, requiredPermission)
      ) {
        showAccessDenied(requiredPermission, targetBtn);
        return;
      }
      hideAccessDenied();

      tabBtns.forEach((btn) => {
        const isTarget = btn === targetBtn;
        btn.classList.toggle("is-active", isTarget);
        btn.setAttribute("aria-selected", isTarget ? "true" : "false");
        btn.setAttribute("tabindex", isTarget ? "0" : "-1");
      });

      const controlsId = targetBtn.getAttribute("aria-controls");
      tabPanels.forEach((panel) => {
        const isMatch = panel.id === controlsId;
        panel.hidden = !isMatch;
      });

      if (setHash) {
        const hash = controlsId.replace("admin-panel-", "#");
        if (window.location.hash !== hash) {
          history.replaceState(null, "", hash);
        }
      }
    }

    function applyAccessRestrictions() {
      const allowedTabs = [];
      tabBtns.forEach((btn) => {
        const requiredPermission = ADMIN_PERMISSION_BY_TAB[btn.id];
        const isAllowed =
          !requiredPermission ||
          hasPermission(currentSessionUser, requiredPermission);
        btn.hidden = !isAllowed;
        btn.disabled = !isAllowed;
        btn.setAttribute("aria-disabled", String(!isAllowed));
        if (isAllowed) allowedTabs.push(btn);
      });

      const currentHash = window.location.hash.replace("#", "");
      const preferredBtn =
        allowedTabs.find(
          (btn) =>
            btn.getAttribute("aria-controls") === `admin-panel-${currentHash}`,
        ) || allowedTabs[0];

      if (preferredBtn) {
        const activeBtn = tabBtns.find(
          (btn) => btn.classList.contains("is-active") && !btn.hidden,
        );
        if (!activeBtn || activeBtn.hidden) activateTab(preferredBtn, false);
      }
    }

    tabBtns.forEach((btn, index) => {
      btn.addEventListener("click", () => activateTab(btn));

      btn.addEventListener("keydown", (e) => {
        let targetIndex = null;
        if (e.key === "ArrowRight") {
          targetIndex = (index + 1) % tabBtns.length;
        } else if (e.key === "ArrowLeft") {
          targetIndex = (index - 1 + tabBtns.length) % tabBtns.length;
        } else if (e.key === "Home") {
          targetIndex = 0;
        } else if (e.key === "End") {
          targetIndex = tabBtns.length - 1;
        }

        if (targetIndex !== null) {
          const targetBtn = tabBtns[targetIndex];
          if (!targetBtn.hidden) {
            e.preventDefault();
            targetBtn.focus();
            activateTab(targetBtn);
          }
        }
      });
    });

    applyAccessRestrictions();
    const currentHash = window.location.hash.replace("#", "");
    if (currentHash) {
      const matchingBtn = tabBtns.find(
        (btn) =>
          btn.getAttribute("aria-controls") === `admin-panel-${currentHash}` &&
          !btn.hidden,
      );
      if (matchingBtn) activateTab(matchingBtn, false);
    }
  }

  initAdminTabs();

  adminRefreshBtn?.addEventListener("click", loadAdminDashboard);
  adminNotificationButton?.addEventListener("click", () => {
    setFeedbackDrawerOpen(true);
  });
  adminDrawerClear?.addEventListener("click", async () => {
    if (
      !window.confirm(
        "Clear notification history? Analytics will not be affected.",
      )
    )
      return;
    adminDrawerClear.disabled = true;
    try {
      const response = await fetch("/api/pricecheck/admin/notifications", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Notifications could not be cleared.");
      adminNotifications = [];
      renderFeedbackDrawer([]);
    } catch (error) {
      adminMessage.textContent = error.message;
      adminMessage.hidden = false;
    } finally {
      adminDrawerClear.disabled = false;
    }
  });
  adminNotificationFilters.forEach((button) => {
    button.addEventListener("click", () => {
      activeNotificationFilter = button.dataset.notificationFilter;
      adminNotificationFilters.forEach((item) =>
        item.classList.toggle("is-active", item === button),
      );
      renderFeedbackDrawer(adminNotifications);
    });
  });
  adminDrawerClose?.addEventListener("click", () =>
    setFeedbackDrawerOpen(false),
  );
  adminDrawerBackdrop?.addEventListener("click", () =>
    setFeedbackDrawerOpen(false),
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setFeedbackDrawerOpen(false);
  });
  adminResetBtn.addEventListener("click", async () => {
    if (
      !window.confirm(
        "Reset all pricing feedback metrics? This cannot be undone.",
      )
    )
      return;
    adminResetBtn.disabled = true;
    try {
      const response = await fetch("/api/pricecheck/admin/metrics", {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Metrics could not be reset.");
      }
      await loadAdminDashboard();
    } catch (error) {
      adminMessage.textContent = error.message;
      adminMessage.hidden = false;
    } finally {
      adminResetBtn.disabled = false;
    }
  });

  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];

  function setActiveNavLink(link) {
    navLinks.forEach((navLink) => {
      const active = navLink === link;
      navLink.classList.toggle("is-active", active);
      if (active) navLink.setAttribute("aria-current", "page");
      else navLink.removeAttribute("aria-current");
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      setActiveNavLink(link);

      const targetView = target.closest(".view");
      if (targetView && views[targetView.id.replace("-view", "")].hidden) {
        event.preventDefault();
        showSection(target);
      }
      if (target.id === "admin-view") loadAdminDashboard();
    });
  });

  const isAdminPath = window.location.pathname === "/admin";
  const isLoginPath = window.location.pathname === "/login";
  const isEstimatePath = window.location.pathname === "/estimate";
  setActiveNavLink(
    navLinks.find(
      (link) =>
        link.getAttribute("href") ===
        (isAdminPath ? "#admin-view" : "#dashboard-view"),
    ) || navLinks[0],
  );

  showView(
    isLoginPath
      ? "login"
      : isAdminPath
        ? "admin"
        : isEstimatePath
          ? "input"
          : "landing",
  );
  updateAdminGreeting();
  if (isAdminPath) {
    loadAdminDashboard();
    const adminRefreshTimer = window.setInterval(loadAdminDashboard, 15000);
    window.addEventListener(
      "beforeunload",
      () => {
        window.clearInterval(adminRefreshTimer);
      },
      { once: true },
    );
  }

  function formatCurrency(amount, currency = { code: "NGN", locale: "en-NG" }) {
    return new Intl.NumberFormat(currency.locale || "en-US", {
      style: "currency",
      currency: currency.code || "NGN",
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  }

  function historyStorageKey() {
    return accountUserId ? `${HISTORY_KEY}:${accountUserId}` : HISTORY_KEY;
  }

  function readHistory() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(historyStorageKey()) || "[]",
      );
      return Array.isArray(stored) ? stored : [];
    } catch (err) {
      return [];
    }
  }

  function writeHistory(items) {
    try {
      localStorage.setItem(historyStorageKey(), JSON.stringify(items));
    } catch (err) {
      // History is optional and should never interrupt a completed estimate.
    }
  }

  async function loadAccountHistory() {
    const userId = accountUserId;
    if (!userId) return;
    try {
      const response = await fetch("/api/account/estimates", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const { estimates } = await response.json();
      if (accountUserId !== userId || !Array.isArray(estimates)) return;
      writeHistory(estimates.slice(0, MAX_HISTORY_ITEMS));
      renderHistory();
    } catch (error) {
      console.warn("Saved estimate history could not be loaded.");
    }
  }

  function getHistoryTitle(result) {
    return (
      result.project.projectType ||
      result.pricing.category ||
      "Untitled estimate"
    );
  }

  function renderHistory() {
    if (!historyListEl || !historyEmptyEl || !historyClearBtn) return;
    const items = readHistory();
    historyListEl.innerHTML = "";
    historyEmptyEl.hidden = items.length > 0;
    historyClearBtn.hidden = items.length === 0;
    renderDashboard(items);

    items.forEach((item) => {
      const article = document.createElement("article");
      article.className = "history-item";

      const content = document.createElement("div");
      content.className = "history-item-content";

      const title = document.createElement("h3");
      title.className = "history-item-title";
      title.textContent = getHistoryTitle(item.result);

      const meta = document.createElement("p");
      meta.className = "history-item-meta";
      meta.textContent = `${item.result.pricing.category} · ${item.result.pricing.currency?.code || "NGN"} · ${new Date(item.createdAt).toLocaleDateString("en-NG")}`;

      const price = document.createElement("strong");
      price.className = "history-item-price";
      price.textContent = formatCurrency(
        item.result.pricing.recommendedQuote,
        item.result.pricing.currency,
      );

      content.append(title, meta, price);

      const actions = document.createElement("div");
      actions.className = "history-item-actions";

      const reopenButton = document.createElement("button");
      reopenButton.className = "history-action";
      reopenButton.type = "button";
      reopenButton.dataset.historyAction = "reopen";
      reopenButton.dataset.historyId = item.id;
      reopenButton.textContent = "Open";

      const editButton = document.createElement("button");
      editButton.className = "history-action";
      editButton.type = "button";
      editButton.dataset.historyAction = "edit";
      editButton.dataset.historyId = item.id;
      editButton.setAttribute(
        "aria-label",
        `Edit ${getHistoryTitle(item.result)}`,
      );
      editButton.textContent = "Edit";

      const deleteButton = document.createElement("button");
      deleteButton.className = "history-action history-action-muted";
      deleteButton.type = "button";
      deleteButton.dataset.historyAction = "delete";
      deleteButton.dataset.historyId = item.id;
      deleteButton.setAttribute(
        "aria-label",
        `Delete ${getHistoryTitle(item.result)}`,
      );
      deleteButton.textContent = "Delete";

      actions.append(reopenButton, editButton, deleteButton);
      article.append(content, actions);
      historyListEl.appendChild(article);
    });
  }

  function renderDashboard(items = readHistory()) {
    if (
      !dashboardEstimateCount ||
      !dashboardCategoryCount ||
      !dashboardLatestQuote ||
      !dashboardLatestCategory ||
      !dashboardRecentList ||
      !dashboardEmpty
    ) {
      return;
    }
    dashboardEstimateCount.textContent = String(items.length);
    const categories = new Set(
      items.map((item) => item.result?.pricing?.category).filter(Boolean),
    );
    dashboardCategoryCount.textContent = String(categories.size);
    const latest = items[0]?.result;
    if (!latest) {
      dashboardLatestQuote.textContent = "—";
      dashboardLatestCategory.textContent = "No estimates yet";
      dashboardRecentList.innerHTML = "";
      dashboardEmpty.hidden = false;
      return;
    }
    dashboardLatestQuote.textContent = formatCurrency(
      latest.pricing.recommendedQuote,
      latest.pricing.currency,
    );
    dashboardLatestCategory.textContent = latest.pricing.category;
    dashboardEmpty.hidden = true;
    dashboardRecentList.innerHTML = "";
    items.slice(0, 4).forEach((item) => {
      const row = document.createElement("div");
      row.className = "dashboard-recent-item";
      const title = document.createElement("strong");
      title.textContent = getHistoryTitle(item.result);
      const meta = document.createElement("span");
      meta.textContent = `${item.result.pricing.category} · ${formatCurrency(item.result.pricing.recommendedQuote, item.result.pricing.currency)}`;
      row.append(title, meta);
      dashboardRecentList.appendChild(row);
    });
  }

  function saveToHistory(result) {
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      result,
    };
    writeHistory([item, ...readHistory()].slice(0, MAX_HISTORY_ITEMS));
    renderHistory();
  }

  function setFieldError(message) {
    if (!message) {
      fieldError.hidden = true;
      fieldError.textContent = "";
      textarea.removeAttribute("aria-invalid");
      return;
    }
    fieldError.hidden = false;
    fieldError.textContent = message;
    textarea.setAttribute("aria-invalid", "true");
  }

  function setSubmitting(submitting) {
    isSubmitting = submitting;
    if (submitBtn) submitBtn.disabled = submitting;
    if (submitLabel) {
      submitLabel.textContent = submitting
        ? "Analyzing project..."
        : "Check My Price";
    }
  }

  function updateLoadingProgress(progress, phase) {
    loadingText.classList.remove("loading-text-changing");
    void loadingText.offsetWidth;
    loadingText.classList.add("loading-text-changing");
    loadingText.textContent = phase;
    loadingPercent.textContent = `${progress}%`;
    loadingProgressFill.style.width = `${progress}%`;
    loadingProgressTrack.setAttribute("aria-valuenow", String(progress));
  }

  function validateInput(value) {
    if (!value.trim()) {
      return "Tell us what you're charging for before we can estimate a price.";
    }
    if (value.trim().length < 10) {
      return "Add a bit more detail about the project so we can estimate it accurately.";
    }
    return null;
  }

  async function submitDescription(description, deliverables) {
    const progressId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const progressSource = new EventSource(
      `/api/pricecheck/progress/${progressId}`,
    );
    progressSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      updateLoadingProgress(update.progress, update.phase);
    };
    progressSource.onerror = () => progressSource.close();

    const response = await fetch("/api/pricecheck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        deliverables,
        progressId,
        ...selections,
      }),
    });

    let payload;
    try {
      payload = await response.json();
    } catch (err) {
      throw new Error(
        "Something went wrong while analyzing your project. Please try again.",
      );
    }

    progressSource.close();
    if (!response.ok) {
      throw new Error(
        payload?.error ||
          "Something went wrong while analyzing your project. Please try again.",
      );
    }

    return payload;
  }

  function renderBreakdown(project) {
    const rows = [
      ["Service", project.pricing?.category || project.service],
      ["Currency", project.pricing?.currency?.code || "NGN"],
      ["Project", project.project.projectType],
      [
        "Experience",
        LABELS.experience[project.project.experience] ||
          project.project.experience,
      ],
      [
        "Deadline",
        LABELS.deadline[project.project.deadline] || project.project.deadline,
      ],
      ["Duration", project.project.duration || "—"],
      [
        "Deliverables",
        project.project.deliverables && project.project.deliverables.length > 0
          ? project.project.deliverables.join(", ")
          : "—",
      ],
      [
        "Client",
        LABELS.clientType[project.project.clientType] ||
          project.project.clientType,
      ],
      [
        "Complexity",
        LABELS.complexity[project.project.complexity] ||
          project.project.complexity,
      ],
    ];

    breakdownListEl.innerHTML = "";
    rows.forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "breakdown-row";

      const dt = document.createElement("dt");
      dt.textContent = label;

      const dd = document.createElement("dd");
      dd.textContent = value;

      row.appendChild(dt);
      row.appendChild(dd);
      breakdownListEl.appendChild(row);
    });
  }

  function renderReasons(reasons) {
    reasonsListEl.innerHTML = "";
    reasons.forEach((reason) => {
      const li = document.createElement("li");
      li.textContent = reason;
      reasonsListEl.appendChild(li);
    });
  }

  function renderMissingInformation(missingInformation) {
    if (!missingInformation || missingInformation.length === 0) {
      missingCardEl.hidden = true;
      missingListEl.innerHTML = "";
      return;
    }
    missingCardEl.hidden = false;
    missingListEl.innerHTML = "";
    missingInformation.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      missingListEl.appendChild(li);
    });
  }

  function renderRangeIndicator(pricing) {
    const { min, max } = pricing.fairRange;
    const quote = pricing.recommendedQuote;

    rangeMinLabel.textContent = formatCurrency(min, pricing.currency);
    rangeMaxLabel.textContent = formatCurrency(max, pricing.currency);

    const span = Math.max(1, max - min);
    const rawPercent = ((quote - min) / span) * 100;
    const percent = Math.min(96, Math.max(4, rawPercent));

    rangeFillEl.style.width = "100%";
    rangeMarkerEl.style.left = percent + "%";
  }

  function renderResult(data, { saveHistory = true } = {}) {
    lastResult = data;

    if (saveHistory) {
      saveToHistory(data);
    }

    recommendedQuoteEl.textContent = formatCurrency(
      data.pricing.recommendedQuote,
      data.pricing.currency,
    );
    fairRangeEl.textContent =
      formatCurrency(data.pricing.fairRange.min, data.pricing.currency) +
      " – " +
      formatCurrency(data.pricing.fairRange.max, data.pricing.currency);
    resultProjectName.textContent = `${data.project.projectType} · ${data.pricing.category}`;
    resultExperience.textContent =
      LABELS.experience[data.project.experience] || data.project.experience;
    resultDeadline.textContent =
      LABELS.deadline[data.project.deadline] || data.project.deadline;

    renderRangeIndicator(data.pricing);
    renderBreakdown({ project: data.project, pricing: data.pricing });
    renderReasons(data.advice.reasons);

    adviceTextEl.textContent = data.advice.advice;
    negotiationTipEl.textContent = data.advice.negotiationTip;

    renderMissingInformation(data.project.missingInformation);
    feedbackForm.reset();
    feedbackMessage.hidden = true;
    feedbackMessage.textContent = "";

    showView("result");
  }

  function buildCopyText(data) {
    const project = data.project;
    const pricing = data.pricing;

    return [
      "PriceCheck Estimate",
      "",
      `Project: ${project.projectType} ${pricing.category}`,
      "",
      `Recommended Quote: ${formatCurrency(pricing.recommendedQuote, pricing.currency)}`,
      `Experience: ${LABELS.experience[project.experience] || project.experience}`,
      `Deadline: ${LABELS.deadline[project.deadline] || project.deadline}`,
      `Fair Range: ${formatCurrency(pricing.fairRange.min, pricing.currency)} – ${formatCurrency(pricing.fairRange.max, pricing.currency)}`,
      "",
      "This is an estimate based on the project scope and should be adjusted based on experience, client value, costs, and negotiation.",
    ].join("\n");
  }

  async function handleCopy() {
    if (!lastResult) return;
    const text = buildCopyText(lastResult);

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback for environments without Clipboard API permissions.
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch (fallbackErr) {
        console.error("Copy failed:", fallbackErr);
      }
      document.body.removeChild(textarea);
    }

    const original = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    copyBtn.disabled = true;
    setTimeout(() => {
      copyBtn.textContent = original;
      copyBtn.disabled = false;
    }, 1800);
  }

  async function handleDownload() {
    if (!lastResult || downloadBtn.disabled) return;
    const original = downloadBtn.textContent;
    downloadBtn.textContent = "Generating PDF...";
    downloadBtn.disabled = true;

    try {
      const response = await fetch("/api/pricecheck/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lastResult),
      });
      if (!response.ok) throw new Error("PDF generation failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const header = response.headers.get("Content-Disposition") || "";
      const filename =
        header.match(/filename="?([^";]+)"?/i)?.[1] ||
        "pricecheck-estimate.pdf";
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert("Couldn't generate the estimate. Please try again.");
    } finally {
      downloadBtn.textContent = original;
      downloadBtn.disabled = false;
    }
  }

  function openInvoiceForm() {
    if (!lastResult) return;
    invoiceForm.hidden = false;
    invoiceFrom.focus();
  }

  async function handleInvoiceSubmit(event) {
    event.preventDefault();
    if (!lastResult || invoiceDownloadBtn.disabled) return;
    invoiceDownloadBtn.disabled = true;
    invoiceDownloadBtn.textContent = "Generating invoice...";

    const deliverables =
      lastResult.project.deliverables?.join(", ") || "Project services";
    const payload = {
      fromName: invoiceFrom.value,
      clientName: invoiceClient.value,
      clientEmail: invoiceEmail.value,
      projectTitle: lastResult.project.projectType,
      deliverables,
      dueDate: invoiceDue.value,
      bankName: invoiceBank.value,
      accountName: invoiceAccountName.value,
      accountNumber: invoiceAccountNumber.value,
      notes: invoiceNotes.value,
      amount: lastResult.pricing.recommendedQuote,
      currency: lastResult.pricing.currency,
    };

    try {
      const response = await fetch("/api/pricecheck/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Invoice generation failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "pricecheck-invoice.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert("Couldn't generate the invoice. Please try again.");
    } finally {
      invoiceDownloadBtn.disabled = false;
      invoiceDownloadBtn.textContent = "Download Invoice PDF";
    }
  }

  function selectOption(button) {
    const group = button.dataset.selection;
    if (!group) return;
    selections[group] = button.dataset.value;
    document
      .querySelectorAll(`[data-selection="${group}"]`)
      .forEach((option) => {
        option.setAttribute("aria-checked", String(option === button));
      });
  }

  function restoreSelections(project, pricing) {
    const savedSelections = {
      experienceLevel: project.experience,
      deadline: project.deadline,
    };
    Object.entries(savedSelections).forEach(([group, value]) => {
      const button = document.querySelector(
        `[data-selection="${group}"][data-value="${value}"]`,
      );
      if (button) selectOption(button);
    });
    if (project.currency?.code) {
      currencySelect.value = project.currency.code;
      selections.currency = project.currency.code;
    } else if (pricing?.currency?.code) {
      currencySelect.value = pricing.currency.code;
      selections.currency = pricing.currency.code;
    }
  }

  function editableDescription(result) {
    return window.PriceCheckHistoryUtils.getEditDraft(result, LABELS)
      .description;
  }

  function editHistoryItem(result) {
    textarea.value = editableDescription(result);
    deliverablesInput.value = result.sourceDeliverables || "";
    restoreSelections(result.project, result.pricing);
    setFieldError(null);
    errorMessageEl.textContent = "";
    setSubmitting(false);
    showView("input");
    window.scrollTo({ top: 0, behavior: "smooth" });
    textarea.focus();
  }

  function resetToInput() {
    lastResult = null;
    textarea.value = "";
    deliverablesInput.value = "";
    invoiceForm.reset();
    invoiceForm.hidden = true;
    selections.experienceLevel = "professional";
    selections.deadline = "3_6_days";
    selections.currency = "NGN";
    currencySelect.value = "NGN";
    document
      .querySelectorAll('[data-selection="experienceLevel"]')
      .forEach((option) => {
        option.setAttribute(
          "aria-checked",
          String(option.dataset.value === selections.experienceLevel),
        );
      });
    document
      .querySelectorAll('[data-selection="deadline"]')
      .forEach((option) => {
        option.setAttribute(
          "aria-checked",
          String(option.dataset.value === selections.deadline),
        );
      });
    setFieldError(null);
    errorMessageEl.textContent = "";
    setSubmitting(false);
    showView("input");
    window.scrollTo({ top: 0, behavior: "smooth" });
    requestAnimationFrame(() => textarea.focus());
  }

  if (historyListEl) {
    historyListEl.addEventListener("click", async (event) => {
      const actionButton = event.target.closest("button[data-history-action]");
      if (!actionButton) return;

      const itemId = actionButton.dataset.historyId;
      const items = readHistory();

      if (actionButton.dataset.historyAction === "delete") {
        if (accountUserId && /^\d+$/.test(itemId)) {
          const response = await fetch(`/api/account/estimates/${itemId}`, {
            method: "DELETE",
          });
          if (!response.ok) return;
        }
        writeHistory(items.filter((item) => item.id !== itemId));
        renderHistory();
        return;
      }

      const item = items.find((historyItem) => historyItem.id === itemId);
      if (item) {
        if (actionButton.dataset.historyAction === "edit") {
          editHistoryItem(item.result);
          return;
        }
        renderResult(item.result, { saveHistory: false });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  if (historyClearBtn) {
    historyClearBtn.addEventListener("click", async () => {
      if (accountUserId) {
        const response = await fetch("/api/account/estimates", {
          method: "DELETE",
        });
        if (!response.ok) return;
      }
      writeHistory([]);
      renderHistory();
    });
  }

  if (form && textarea) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isSubmitting) return;

      const value = textarea.value;
      const validationError = validateInput(value);

      if (validationError) {
        setFieldError(validationError);
        return;
      }
      setFieldError(null);

      setSubmitting(true);
      updateLoadingProgress(5, "Starting");
      showView("loading");

      try {
        const deliverables = deliverablesInput.value.trim();
        const data = await submitDescription(value.trim(), deliverables);
        data.sourceDescription = value.trim();
        data.sourceDeliverables = deliverables;
        renderResult(data);
        void loadAccountHistory();
      } catch (err) {
        errorMessageEl.textContent =
          err.message ||
          "Something went wrong while analyzing your project. Please try again.";
        showView("error");
      } finally {
        setSubmitting(false);
      }
    });
  }

  if (errorRetryBtn && textarea) {
    errorRetryBtn.addEventListener("click", () => {
      errorMessageEl.textContent = "";
      setSubmitting(false);
      showView("input");
      textarea.focus();
    });
  }
  if (errorReturnBtn && textarea) {
    errorReturnBtn.addEventListener("click", () => {
      errorMessageEl.textContent = "";
      setSubmitting(false);
      showView("input");
      textarea.focus();
    });
  }

  if (copyBtn) copyBtn.addEventListener("click", handleCopy);
  if (downloadBtn) downloadBtn.addEventListener("click", handleDownload);
  if (invoiceBtn) invoiceBtn.addEventListener("click", openInvoiceForm);
  if (invoiceCloseBtn && invoiceForm) {
    invoiceCloseBtn.addEventListener("click", () => {
      invoiceForm.hidden = true;
    });
  }
  if (invoiceForm) invoiceForm.addEventListener("submit", handleInvoiceSubmit);
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!lastResult) return;
      const submitButton = feedbackForm.querySelector('button[type="submit"]');
      if (!submitButton) return;
      submitButton.disabled = true;
      try {
        const response = await fetch("/api/pricecheck/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: lastResult.pricing.category,
            currency: lastResult.pricing.currency.code,
            suggestedAmount: lastResult.pricing.recommendedQuote,
            actualAmount: Number(feedbackAmount.value),
            outcome: feedbackOutcome.value,
            adjustmentReason: feedbackReason.value,
          }),
        });
        if (!response.ok) throw new Error("Feedback could not be saved.");
        feedbackMessage.textContent =
          "Thanks. Your feedback will help improve future estimates.";
        feedbackMessage.hidden = false;
        feedbackForm.reset();
      } catch (error) {
        feedbackMessage.textContent = error.message;
        feedbackMessage.hidden = false;
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  if (newCheckBtn) newCheckBtn.addEventListener("click", resetToInput);
  if (dashboardStartBtn && textarea) {
    dashboardStartBtn.addEventListener("click", () => {
      showView("input");
      window.scrollTo({ top: 0, behavior: "smooth" });
      requestAnimationFrame(() => textarea.focus());
    });
  }
  if (dashboardHistoryBtn && historyPanelEl) {
    dashboardHistoryBtn.addEventListener("click", () =>
      showSection(historyPanelEl),
    );
  }
  if (dashboardInvoiceBtn && textarea) {
    dashboardInvoiceBtn.addEventListener("click", () => {
      showView("input");
      window.scrollTo({ top: 0, behavior: "smooth" });
      requestAnimationFrame(() => textarea.focus());
    });
  }
  if (currencySelect) {
    currencySelect.addEventListener("change", () => {
      selections.currency = currencySelect.value;
    });
  }
  authSignout?.addEventListener("click", async () => {
    authSignout.disabled = true;
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (!response.ok) throw new Error("Sign out could not be completed.");
    } catch (error) {
      authSignout.disabled = false;
      showAuthMessage(error.message || "Sign out could not be completed.");
      return;
    }
    if (window.google?.accounts?.id)
      window.google.accounts.id.disableAutoSelect();
    renderAuthenticatedUser(null);
    window.location.assign("/");
  });

  document.querySelectorAll(".selection-card").forEach((button) => {
    button.addEventListener("click", () => selectOption(button));
    button.addEventListener("keydown", (event) => {
      if (
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
      )
        return;
      event.preventDefault();
      const options = [
        ...document.querySelectorAll(
          `[data-selection="${button.dataset.selection}"]`,
        ),
      ];
      const direction =
        event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      const next =
        options[
          (options.indexOf(button) + direction + options.length) %
            options.length
        ];
      next.focus();
      selectOption(next);
    });
  });

  if (textarea && fieldError) {
    textarea.addEventListener("input", () => {
      if (!fieldError.hidden) setFieldError(null);
    });
  }

  if (historyListEl || historyEmptyEl || historyClearBtn) {
    renderHistory();
  }
  initializeAuth();
})();
