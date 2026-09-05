/**
 * Smart Event Registry (스마트 행사 등록부)
 * Main Application Logic and Controller
 */

class SmartEventApp {
  constructor() {
    this.currentView = 'home';
    this.activeEventId = null;
    this.signaturePad = null;
    this.pendingRegistrationData = null;
    this.kioskCountdownTimer = null;
    this.customFieldCounter = 0;
    this.printMode = 'registered';
    this.currentBuilderConfig = null;
    this.duplicateOnlyFilter = false;

    this.init();
  }

  init() {
    this.activeEventId = window.rosterStorage.getActiveEventId();

    // Setup Storage change reactive listener
    window.addEventListener('roster_storage_change', (e) => {
      this.updateBadgesAndCounters();
      if (this.currentView === 'home') this.renderDashboard();
      if (this.currentView === 'saved-events') this.renderSavedEvents();
      if (this.currentView === 'manage') this.renderManagementTable();
      if (this.currentView === 'print') this.renderPrintPreview();
    });

    // Mobile nav toggle
    const toggleBtn = document.getElementById('mobile-nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (toggleBtn && navMenu) {
      toggleBtn.addEventListener('click', () => {
        navMenu.classList.toggle('mobile-open');
      });
    }

    // Hash routing listener
    window.addEventListener('hashchange', () => this.handleRoute());

    // Window resize listener for responsive title fit
    window.addEventListener('resize', () => {
      if (this.currentView === 'register') {
        const activeId = window.rosterStorage.getActiveEventId();
        const ev = window.rosterStorage.getEventById(activeId);
        if (ev) this.autoFitKioskTitle(ev.title);
      }
    });

    // Initial route handling or default view
    this.handleRoute();
    this.updateBadgesAndCounters();
  }

  // =========================================================================
  // ROUTING & VIEW NAVIGATION
  // =========================================================================

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const [viewName, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString || '');

    if (params.has('id')) {
      this.activeEventId = params.get('id');
      window.rosterStorage.setActiveEventId(this.activeEventId);
    } else if (params.has('event')) {
      this.activeEventId = params.get('event');
      window.rosterStorage.setActiveEventId(this.activeEventId);
    }

    this.navigate(viewName, false);
  }

  navigate(viewName, updateHash = true) {
    const validViews = ['home', 'new-event', 'saved-events', 'register', 'manage', 'print'];
    if (!validViews.includes(viewName)) viewName = 'home';

    this.currentView = viewName;
    if (updateHash) {
      const query = (this.activeEventId && (viewName === 'register' || viewName === 'manage' || viewName === 'print'))
        ? `?id=${this.activeEventId}`
        : '';
      window.location.hash = `${viewName}${query}`;
    }

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });

    // Close mobile nav if open
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) navMenu.classList.remove('mobile-open');

    // Switch view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`view-${viewName}`);
    if (targetSec) {
      targetSec.classList.add('active');
      window.scrollTo(0, 0);
    }

    // View specific rendering
    switch (viewName) {
      case 'home':
        this.renderDashboard();
        break;
      case 'saved-events':
        this.renderSavedEvents();
        break;
      case 'register':
        this.renderKioskView();
        break;
      case 'manage':
        this.renderManagementTable();
        break;
      case 'print':
        this.renderPrintPreview();
        break;
    }

    this.updateBadgesAndCounters();
  }

  updateBadgesAndCounters() {
    const events = window.rosterStorage.getEvents();
    const eventCountBadge = document.getElementById('nav-event-count');
    if (eventCountBadge) eventCountBadge.textContent = events.length;

    const activeId = window.rosterStorage.getActiveEventId();
    const regCount = activeId ? window.rosterStorage.getRegistrationCount(activeId) : 0;
    const regCountBadge = document.getElementById('nav-reg-count');
    if (regCountBadge) regCountBadge.textContent = regCount;

    // Populate event switchers
    this.populateEventSwitchers();
  }

  populateEventSwitchers() {
    const events = window.rosterStorage.getEvents();
    const activeId = window.rosterStorage.getActiveEventId();

    const switchers = ['home-event-switcher', 'kiosk-event-switcher', 'manage-event-switcher', 'print-event-switcher'];
    switchers.forEach(swId => {
      const select = document.getElementById(swId);
      if (!select) return;

      select.innerHTML = '';
      if (events.length === 0) {
        select.innerHTML = '<option value="">생성된 행사 없음</option>';
        return;
      }

      events.forEach(ev => {
        const opt = document.createElement('option');
        opt.value = ev.id;
        opt.textContent = `${ev.title} (${ev.date})`;
        if (ev.id === activeId) opt.selected = true;
        select.appendChild(opt);
      });
    });
  }

  changeActiveEvent(eventId, viewToRefresh = null) {
    if (!eventId) return;
    this.activeEventId = eventId;
    window.rosterStorage.setActiveEventId(eventId);

    this.updateBadgesAndCounters();
    if (viewToRefresh === 'home' || this.currentView === 'home') this.renderDashboard();
    if (viewToRefresh === 'register' || this.currentView === 'register') this.renderKioskView();
    if (viewToRefresh === 'manage' || this.currentView === 'manage') this.renderManagementTable();
    if (viewToRefresh === 'print' || this.currentView === 'print') this.renderPrintPreview();
  }

  // =========================================================================
  // VIEW: HOME DASHBOARD
  // =========================================================================

  renderDashboard() {
    const events = window.rosterStorage.getEvents();
    const activeId = window.rosterStorage.getActiveEventId();
    const activeEvent = window.rosterStorage.getEventById(activeId) || (events.length > 0 ? events[0] : null);
    const allRegs = window.rosterStorage.getAllRegistrations();

    // 1. [전체 등록 통계] (Overall Statistics)
    const totalEventsEl = document.getElementById('stat-total-events');
    const totalRegsEl = document.getElementById('stat-total-registrations');

    if (totalEventsEl) totalEventsEl.textContent = `${events.length}개`;
    if (totalRegsEl) totalRegsEl.textContent = `${allRegs.length}명`;

    // 2. [현재 선택된 행사 통계] (Current Event Focus)
    const activeTitleEl = document.getElementById('stat-active-event-title');
    const activeRegsEl = document.getElementById('stat-active-registrations');
    const signRateEl = document.getElementById('stat-signature-rate');

    if (activeEvent) {
      if (activeTitleEl) {
        activeTitleEl.textContent = activeEvent.title;
        activeTitleEl.title = `${activeEvent.title} (${activeEvent.date})`;
      }

      const activeRegs = window.rosterStorage.getRegistrationsByEvent(activeEvent.id);
      if (activeRegsEl) activeRegsEl.textContent = `${activeRegs.length}명`;

      if (signRateEl) {
        if (activeRegs.length === 0) {
          signRateEl.textContent = '0%';
        } else {
          const signedCount = activeRegs.filter(r => !!r.signatureUrl).length;
          const rate = Math.round((signedCount / activeRegs.length) * 100);
          signRateEl.textContent = `${rate}%`;
        }
      }
    } else {
      if (activeTitleEl) activeTitleEl.textContent = '선택된 행사 없음';
      if (activeRegsEl) activeRegsEl.textContent = '0명';
      if (signRateEl) signRateEl.textContent = '0%';
    }

    // Render Recent Event Cards
    const container = document.getElementById('home-events-list');
    if (!container) return;

    if (events.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">📋</div>
          <h3>등록된 행사가 없습니다.</h3>
          <p>새 등록부를 만들어 행사를 준비해보세요.</p>
          <button class="btn btn-primary" style="margin-top: 1rem;" onclick="app.openNewEventForm()">
            ➕ 새 등록부 만들기
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = events.map(ev => this._createEventCardHTML(ev)).join('');
  }

  startCurrentEventKiosk() {
    const activeId = window.rosterStorage.getActiveEventId();
    if (!activeId) {
      this.showToast('먼저 새 등록부를 생성해 주세요.', 'warning');
      this.openNewEventForm();
      return;
    }
    this.navigate('register');
  }

  // =========================================================================
  // VIEW: EVENT BUILDER (NEW / EDIT)
  // =========================================================================

  openNewEventForm(eventId = null) {
    const titleHeader = document.getElementById('event-builder-title');
    const idInput = document.getElementById('builder-event-id');
    const titleInput = document.getElementById('builder-title');
    const dateInput = document.getElementById('builder-date');
    const timeInput = document.getElementById('builder-time');
    const locationInput = document.getElementById('builder-location');
    const descInput = document.getElementById('builder-description');
    const customList = document.getElementById('builder-custom-fields-list');

    if (customList) customList.innerHTML = '';
    this.customFieldCounter = 0;

    if (eventId) {
      const eventData = window.rosterStorage.getEventById(eventId);
      if (!eventData) return;

      if (titleHeader) titleHeader.textContent = '등록부 설정 수정';
      if (idInput) idInput.value = eventData.id;
      if (titleInput) titleInput.value = eventData.title;
      if (dateInput) dateInput.value = eventData.date;
      if (timeInput) timeInput.value = eventData.time || '14:00';
      if (locationInput) locationInput.value = eventData.location;
      if (descInput) descInput.value = eventData.description || '';

      this.selectTargetPreset(eventData.target || 'parent', eventData.fields);

      if (eventData.customFields && eventData.customFields.length > 0) {
        eventData.customFields.forEach(cf => this.addCustomFieldRow(cf));
      }
    } else {
      if (titleHeader) titleHeader.textContent = '새 등록부 만들기';
      if (idInput) idInput.value = '';
      if (titleInput) titleInput.value = '';
      
      const today = new Date().toISOString().split('T')[0];
      if (dateInput) dateInput.value = today;
      if (timeInput) timeInput.value = '14:00';
      if (locationInput) locationInput.value = '';
      if (descInput) descInput.value = '';

      this.selectTargetPreset('parent');
    }

    this.navigate('new-event');
  }

  selectTargetPreset(targetKey, existingFields = null) {
    // Update target preset UI cards
    document.querySelectorAll('.target-preset-card').forEach(card => {
      card.classList.toggle('selected', card.getAttribute('data-target') === targetKey);
    });

    const preset = TARGET_PRESETS[targetKey] || TARGET_PRESETS.parent;
    const mount = document.getElementById('builder-standard-fields');
    if (!mount) return;

    mount.innerHTML = '';

    const fieldsToRender = preset.fields.map(defaultField => {
      if (existingFields) {
        const found = existingFields.find(f => f.id === defaultField.id);
        if (found) return { ...defaultField, enabled: found.enabled, required: found.required };
      }
      return defaultField;
    });

    fieldsToRender.forEach(f => {
      const item = document.createElement('label');
      item.className = `field-checkbox-item ${f.enabled ? 'checked' : ''}`;
      item.innerHTML = `
        <input type="checkbox" data-field-id="${f.id}" data-field-label="${f.label}" data-field-type="${f.type}" ${f.enabled ? 'checked' : ''} onchange="this.parentElement.classList.toggle('checked', this.checked)">
        <span>${f.label}</span>
      `;
      mount.appendChild(item);
    });
  }

  addCustomFieldRow(fieldData = null) {
    const list = document.getElementById('builder-custom-fields-list');
    if (!list) return;

    this.customFieldCounter++;
    const rowId = `custom_field_${this.customFieldCounter}`;

    const labelVal = fieldData ? fieldData.label : '';
    const typeVal = fieldData ? fieldData.type : 'text';
    const reqVal = fieldData ? fieldData.required : false;
    const optVal = fieldData && fieldData.options ? fieldData.options.join(', ') : '';

    const row = document.createElement('div');
    row.className = 'custom-field-row';
    row.id = rowId;
    row.innerHTML = `
      <div>
        <label class="form-label" style="font-size: 0.8rem;">항목 이름</label>
        <input type="text" class="form-control custom-field-label" placeholder="예: 차량 번호, 희망 프로그램, 비고" value="${labelVal}" required>
      </div>
      <div>
        <label class="form-label" style="font-size: 0.8rem;">입력 방식</label>
        <select class="form-control custom-field-type" onchange="app.handleCustomTypeChange('${rowId}', this.value)">
          <option value="text" ${typeVal === 'text' ? 'selected' : ''}>한 줄 텍스트</option>
          <option value="textarea" ${typeVal === 'textarea' ? 'selected' : ''}>여러 줄 텍스트</option>
          <option value="select" ${typeVal === 'select' ? 'selected' : ''}>선택 목록 (드롭다운)</option>
          <option value="date" ${typeVal === 'date' ? 'selected' : ''}>날짜</option>
          <option value="checkbox" ${typeVal === 'checkbox' ? 'selected' : ''}>체크박스 (선택/동의)</option>
          <option value="number" ${typeVal === 'number' ? 'selected' : ''}>숫자</option>
        </select>
      </div>
      <div>
        <label class="form-label" style="font-size: 0.8rem;">필수 여부</label>
        <label class="field-checkbox-item" style="padding: 0.5rem 0.75rem;">
          <input type="checkbox" class="custom-field-required" ${reqVal ? 'checked' : ''}>
          <span>필수</span>
        </label>
      </div>
      <div style="display: flex; align-items: flex-end;">
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="document.getElementById('${rowId}').remove()" title="항목 삭제">
          ✕ 삭제
        </button>
      </div>
      <div class="custom-options-container" style="grid-column: 1 / -1; display: ${typeVal === 'select' ? 'block' : 'none'}; margin-top: 0.25rem;">
        <label class="form-label" style="font-size: 0.8rem;">선택 목록 항목 (쉼표로 구분)</label>
        <input type="text" class="form-control custom-field-options" placeholder="예: 1지망, 2지망, 3지망 또는 1명, 2명, 3명 이상" value="${optVal}">
      </div>
    `;

    list.appendChild(row);
  }

  handleCustomTypeChange(rowId, selectedType) {
    const row = document.getElementById(rowId);
    if (!row) return;
    const optContainer = row.querySelector('.custom-options-container');
    if (optContainer) {
      optContainer.style.display = selectedType === 'select' ? 'block' : 'none';
    }
  }

  getCurrentBuilderConfig() {
    const idInput = document.getElementById('builder-event-id');
    const titleInput = document.getElementById('builder-title');
    const dateInput = document.getElementById('builder-date');
    const timeInput = document.getElementById('builder-time');
    const locationInput = document.getElementById('builder-location');
    const descInput = document.getElementById('builder-description');

    const selectedTargetCard = document.querySelector('.target-preset-card.selected');
    const target = selectedTargetCard ? selectedTargetCard.getAttribute('data-target') : 'parent';

    const preset = TARGET_PRESETS[target] || TARGET_PRESETS.parent;
    const standardFields = [];
    document.querySelectorAll('#builder-standard-fields input[type="checkbox"]').forEach(cb => {
      const fId = cb.getAttribute('data-field-id');
      const def = preset.fields.find(pf => pf.id === fId) || {};
      standardFields.push({
        id: fId,
        label: cb.getAttribute('data-field-label'),
        type: cb.getAttribute('data-field-type'),
        placeholder: def.placeholder || '',
        options: def.options || [],
        required: def.required || false,
        enabled: cb.checked,
        auto: def.auto || false
      });
    });

    const customFields = [];
    document.querySelectorAll('#builder-custom-fields-list .custom-field-row').forEach((row, idx) => {
      const labelInput = row.querySelector('.custom-field-label');
      const typeSelect = row.querySelector('.custom-field-type');
      const reqCb = row.querySelector('.custom-field-required');
      const optInput = row.querySelector('.custom-field-options');

      if (labelInput && labelInput.value.trim()) {
        const cType = typeSelect.value;
        const options = (cType === 'select' && optInput)
          ? optInput.value.split(',').map(s => s.trim()).filter(Boolean)
          : [];

        customFields.push({
          id: `cust_${idx + 1}_${Date.now().toString(36)}`,
          label: labelInput.value.trim(),
          type: cType,
          required: reqCb.checked,
          enabled: true,
          options: options
        });
      }
    });

    const title = (titleInput && titleInput.value.trim()) ? titleInput.value.trim() : '행사 등록부';
    const date = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];
    const time = (timeInput && timeInput.value) ? timeInput.value : '';
    const location = (locationInput && locationInput.value.trim()) ? locationInput.value.trim() : '장소 미지정';
    const description = (descInput && descInput.value.trim()) ? descInput.value.trim() : '';

    return {
      id: (idInput && idInput.value) ? idInput.value : 'temp_builder_event',
      title,
      date,
      time,
      location,
      description,
      target,
      fields: standardFields,
      customFields
    };
  }

  openBlankPrintModalFromBuilder() {
    this.currentBuilderConfig = this.getCurrentBuilderConfig();
    this.renderBlankPrintModalPreview();
    this.openModal('modal-blank-print');
  }

  renderBlankPrintModalPreview() {
    if (!this.currentBuilderConfig) return;
    const rowsSelect = document.getElementById('blank-modal-rows');
    const rowCount = parseInt(rowsSelect?.value || '20', 10);

    const previewContainer = document.getElementById('blank-modal-preview-content');
    const printArea = document.getElementById('print-area');

    const html = this._buildRosterHTML(this.currentBuilderConfig, [], true, rowCount);
    if (previewContainer) previewContainer.innerHTML = html;
    if (printArea) printArea.innerHTML = html;
  }

  executeBlankPrintFromModal() {
    this.renderBlankPrintModalPreview();
    setTimeout(() => {
      window.print();
    }, 150);
  }

  saveEventForm(startKioskImmediately = false) {
    const idInput = document.getElementById('builder-event-id');
    const titleInput = document.getElementById('builder-title');
    const dateInput = document.getElementById('builder-date');
    const timeInput = document.getElementById('builder-time');
    const locationInput = document.getElementById('builder-location');
    const descInput = document.getElementById('builder-description');

    if (!titleInput.value.trim()) {
      this.showToast('행사명을 입력해주세요.', 'error');
      titleInput.focus();
      return;
    }
    if (!dateInput.value) {
      this.showToast('행사 날짜를 선택해주세요.', 'error');
      dateInput.focus();
      return;
    }
    if (!locationInput.value.trim()) {
      this.showToast('행사 장소를 입력해주세요.', 'error');
      locationInput.focus();
      return;
    }

    const selectedTargetCard = document.querySelector('.target-preset-card.selected');
    const target = selectedTargetCard ? selectedTargetCard.getAttribute('data-target') : 'parent';

    // Collect standard fields
    const preset = TARGET_PRESETS[target] || TARGET_PRESETS.parent;
    const standardFields = [];
    document.querySelectorAll('#builder-standard-fields input[type="checkbox"]').forEach(cb => {
      const fId = cb.getAttribute('data-field-id');
      const def = preset.fields.find(pf => pf.id === fId) || {};
      standardFields.push({
        id: fId,
        label: cb.getAttribute('data-field-label'),
        type: cb.getAttribute('data-field-type'),
        placeholder: def.placeholder || '',
        options: def.options || [],
        required: def.required || false,
        enabled: cb.checked,
        auto: def.auto || false
      });
    });

    // Collect custom fields
    const customFields = [];
    document.querySelectorAll('#builder-custom-fields-list .custom-field-row').forEach((row, idx) => {
      const labelInput = row.querySelector('.custom-field-label');
      const typeSelect = row.querySelector('.custom-field-type');
      const reqCb = row.querySelector('.custom-field-required');
      const optInput = row.querySelector('.custom-field-options');

      if (labelInput && labelInput.value.trim()) {
        const cType = typeSelect.value;
        const options = (cType === 'select' && optInput)
          ? optInput.value.split(',').map(s => s.trim()).filter(Boolean)
          : [];

        customFields.push({
          id: `cust_${idx + 1}_${Date.now().toString(36)}`,
          label: labelInput.value.trim(),
          type: cType,
          required: reqCb.checked,
          enabled: true,
          options: options
        });
      }
    });

    const eventPayload = {
      id: idInput.value || undefined,
      title: titleInput.value.trim(),
      date: dateInput.value,
      time: timeInput.value || '14:00',
      location: locationInput.value.trim(),
      description: descInput.value.trim(),
      target: target,
      fields: standardFields,
      customFields: customFields,
      printSettings: {
        showTitle: true,
        showDate: true,
        showLocation: true,
        showPhone: true,
        showTimestamp: true,
        showSignature: true
      }
    };

    const savedEvent = window.rosterStorage.saveEvent(eventPayload);
    this.activeEventId = savedEvent.id;
    this.showToast('등록부 설정이 안전하게 저장되었습니다.', 'success');

    if (startKioskImmediately) {
      this.navigate('register');
    } else {
      this.navigate('saved-events');
    }
  }

  // =========================================================================
  // VIEW: SAVED EVENTS LIST
  // =========================================================================

  renderSavedEvents() {
    const events = window.rosterStorage.getEvents();
    const searchVal = (document.getElementById('saved-events-search')?.value || '').toLowerCase().trim();
    const targetFilter = document.getElementById('saved-events-target-filter')?.value || 'all';

    const container = document.getElementById('saved-events-grid');
    if (!container) return;

    let filtered = events.filter(ev => {
      const matchSearch = !searchVal || ev.title.toLowerCase().includes(searchVal) || ev.location.toLowerCase().includes(searchVal);
      const matchTarget = targetFilter === 'all' || ev.target === targetFilter;
      return matchSearch && matchTarget;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">📁</div>
          <h3>조건에 맞는 등록부가 없습니다.</h3>
          <p>새로운 행사 등록부를 생성하거나 검색 조건을 확인해보세요.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(ev => this._createEventCardHTML(ev)).join('');
  }

  _createEventCardHTML(ev) {
    const count = window.rosterStorage.getRegistrationCount(ev.id);
    const targetInfo = TARGET_PRESETS[ev.target] || { name: '기타', icon: 'globe' };

    let targetBadgeClass = 'badge-other';
    if (ev.target === 'student') targetBadgeClass = 'badge-student';
    if (ev.target === 'teacher') targetBadgeClass = 'badge-teacher';
    if (ev.target === 'parent') targetBadgeClass = 'badge-parent';

    return `
      <div class="event-card">
        <div class="event-card-header">
          <span class="event-target-badge ${targetBadgeClass}">
            ${targetInfo.name} 등록부
          </span>
          <h3 class="event-card-title">${this._escapeHtml(ev.title)}</h3>
          <div class="event-card-meta">
            <div class="event-meta-item">
              <span>📅</span> <span>${ev.date} ${ev.time ? `(${ev.time})` : ''}</span>
            </div>
            <div class="event-meta-item">
              <span>📍</span> <span>${this._escapeHtml(ev.location)}</span>
            </div>
          </div>
        </div>

        <div class="event-card-count">
          <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">등록 현황</span>
          <span class="count-highlight">${count}명 등록 완료</span>
        </div>

        <div class="event-card-actions">
          <button class="btn btn-sm btn-primary" onclick="app.launchKiosk('${ev.id}')" title="현장 등록 화면 실행">
            📝 등록 시작
          </button>
          <button class="btn btn-sm btn-secondary" onclick="app.openManageView('${ev.id}')" title="등록 명단 조회 및 관리">
            📊 관리
          </button>
          <button class="btn btn-sm btn-secondary" onclick="app.openNewEventForm('${ev.id}')" title="설정 수정">
            ✏️ 수정
          </button>
          <button class="btn btn-sm btn-outline-primary" onclick="app.openCloneModal('${ev.id}')" title="새 행사로 복사">
            📋 복사
          </button>
          <button class="btn btn-sm btn-outline-primary" onclick="app.openPrintView('${ev.id}')" title="A4 인쇄">
            🖨️ 인쇄
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="app.deleteEventConfirm('${ev.id}')" title="등록부 삭제">
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  launchKiosk(eventId) {
    this.changeActiveEvent(eventId);
    this.navigate('register');
  }

  openManageView(eventId) {
    this.changeActiveEvent(eventId);
    this.navigate('manage');
  }

  openPrintView(eventId) {
    this.changeActiveEvent(eventId);
    this.navigate('print');
  }

  deleteEventConfirm(eventId) {
    const ev = window.rosterStorage.getEventById(eventId);
    if (!ev) return;
    const count = window.rosterStorage.getRegistrationCount(eventId);

    if (confirm(`'${ev.title}' 등록부를 삭제하시겠습니까?\n(등록된 참가자 ${count}명의 데이터도 함께 삭제됩니다)`)) {
      window.rosterStorage.deleteEvent(eventId);
      this.showToast('등록부가 삭제되었습니다.', 'info');
      this.renderSavedEvents();
      this.renderDashboard();
    }
  }

  // =========================================================================
  // VIEW: KIOSK REGISTRATION (현장 등록 화면)
  // =========================================================================

  renderKioskView() {
    const activeId = window.rosterStorage.getActiveEventId();
    const eventData = window.rosterStorage.getEventById(activeId);

    const titleEl = document.getElementById('kiosk-event-title');
    const tagEl = document.getElementById('kiosk-target-tag');
    const dateEl = document.getElementById('kiosk-meta-date');
    const locEl = document.getElementById('kiosk-meta-location');
    const countEl = document.getElementById('kiosk-meta-count');
    const descEl = document.getElementById('kiosk-event-desc');
    const fieldsMount = document.getElementById('kiosk-fields-mount');
    const signContainer = document.getElementById('kiosk-signature-container');
    const successOverlay = document.getElementById('kiosk-success-overlay');
    const formContainer = document.getElementById('kiosk-form-container');

    if (successOverlay) successOverlay.style.display = 'none';
    if (formContainer) formContainer.style.display = 'block';

    if (!eventData) {
      if (titleEl) titleEl.textContent = '선택된 행사가 없습니다.';
      if (fieldsMount) fieldsMount.innerHTML = '<p class="empty-state">등록부를 먼저 생성하거나 선택해주세요.</p>';
      if (signContainer) signContainer.style.display = 'none';
      return;
    }

    const targetInfo = TARGET_PRESETS[eventData.target] || { name: '참가자' };
    const regCount = window.rosterStorage.getRegistrationCount(eventData.id);

    this.autoFitKioskTitle(eventData.title);
    if (tagEl) tagEl.textContent = `${targetInfo.name} 등록부`;
    if (dateEl) dateEl.innerHTML = `📅 ${eventData.date} ${eventData.time ? `(${eventData.time})` : ''}`;
    if (locEl) locEl.innerHTML = `📍 ${this._escapeHtml(eventData.location)}`;
    if (countEl) countEl.innerHTML = `👥 현재 등록: <strong>${regCount}명</strong>`;
    if (descEl) descEl.textContent = eventData.description || '';

    // Render Input Fields
    if (!fieldsMount) return;
    fieldsMount.innerHTML = '';

    let hasSignature = false;

    // 1. Standard Fields (enabled and not auto timestamp/seq)
    (eventData.fields || []).forEach(f => {
      if (!f.enabled) return;
      if (f.id === 'seq' || f.id === 'timestamp') return; // Handled automatically

      if (f.type === 'signature') {
        hasSignature = true;
        return;
      }

      const fieldWrapper = document.createElement('div');
      fieldWrapper.className = 'kiosk-field';

      let inputHtml = '';
      const reqStar = f.required ? '<span class="required-badge">*</span>' : '';

      if (f.type === 'select' && f.options && f.options.length > 0) {
        const optionsHtml = f.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
        inputHtml = `
          <select name="${f.id}" class="form-control kiosk-input kiosk-select" ${f.required ? 'required' : ''}>
            <option value="">-- 선택해 주세요 --</option>
            ${optionsHtml}
          </select>
        `;
      } else {
        const inputType = f.type === 'tel' ? 'tel' : (f.type === 'email' ? 'email' : (f.type === 'number' ? 'number' : 'text'));
        inputHtml = `
          <input type="${inputType}" name="${f.id}" class="form-control kiosk-input" placeholder="${f.placeholder || f.label + ' 입력'}" ${f.required ? 'required' : ''}>
        `;
      }

      fieldWrapper.innerHTML = `
        <label class="kiosk-label">${f.label} ${reqStar}</label>
        ${inputHtml}
      `;
      fieldsMount.appendChild(fieldWrapper);
    });

    // 2. Custom Fields
    (eventData.customFields || []).forEach(cf => {
      if (!cf.enabled) return;

      const fieldWrapper = document.createElement('div');
      fieldWrapper.className = 'kiosk-field';
      const reqStar = cf.required ? '<span class="required-badge">*</span>' : '';

      let inputHtml = '';
      if (cf.type === 'select' && cf.options && cf.options.length > 0) {
        const optionsHtml = cf.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
        inputHtml = `
          <select name="${cf.id}" class="form-control kiosk-input kiosk-select" ${cf.required ? 'required' : ''}>
            <option value="">-- 선택해 주세요 --</option>
            ${optionsHtml}
          </select>
        `;
      } else if (cf.type === 'textarea') {
        inputHtml = `
          <textarea name="${cf.id}" class="form-control kiosk-input" rows="3" placeholder="${cf.label} 입력" ${cf.required ? 'required' : ''}></textarea>
        `;
      } else if (cf.type === 'checkbox') {
        inputHtml = `
          <label class="field-checkbox-item" style="padding: 0.85rem 1.15rem; font-size: 1.05rem;">
            <input type="checkbox" name="${cf.id}" style="width: 22px; height: 22px;">
            <span>${cf.label} (선택/동의)</span>
          </label>
        `;
      } else {
        const inputType = cf.type === 'date' ? 'date' : (cf.type === 'number' ? 'number' : 'text');
        inputHtml = `
          <input type="${inputType}" name="${cf.id}" class="form-control kiosk-input" placeholder="${cf.label} 입력" ${cf.required ? 'required' : ''}>
        `;
      }

      if (cf.type !== 'checkbox') {
        fieldWrapper.innerHTML = `
          <label class="kiosk-label">${cf.label} ${reqStar}</label>
          ${inputHtml}
        `;
      } else {
        fieldWrapper.innerHTML = inputHtml;
      }

      fieldsMount.appendChild(fieldWrapper);
    });

    // Signature Canvas setup
    if (signContainer) {
      if (hasSignature) {
        signContainer.style.display = 'block';
        setTimeout(() => {
          this.initSignaturePad();
        }, 100);
      } else {
        signContainer.style.display = 'none';
      }
    }
  }

  autoFitKioskTitle(titleText) {
    const titleEl = document.getElementById('kiosk-event-title');
    if (!titleEl) return;

    titleEl.textContent = titleText || '';
    titleEl.style.whiteSpace = 'nowrap';
    titleEl.style.overflow = 'hidden';
    titleEl.style.textOverflow = 'ellipsis';
    titleEl.style.display = 'block';

    const len = (titleText || '').length;
    if (len <= 16) {
      titleEl.style.fontSize = '1.85rem';
    } else if (len <= 26) {
      titleEl.style.fontSize = '1.5rem';
    } else if (len <= 38) {
      titleEl.style.fontSize = '1.25rem';
    } else if (len <= 50) {
      titleEl.style.fontSize = '1.05rem';
    } else {
      titleEl.style.fontSize = '0.92rem';
    }

    // Precise calculation based on container clientWidth
    requestAnimationFrame(() => {
      const banner = titleEl.parentElement;
      if (!banner) return;
      const availableWidth = banner.clientWidth - 48;
      if (titleEl.scrollWidth > availableWidth && availableWidth > 80) {
        const currentPx = parseFloat(window.getComputedStyle(titleEl).fontSize) || 24;
        const ratio = availableWidth / titleEl.scrollWidth;
        const targetPx = Math.max(12, Math.floor(currentPx * ratio * 0.96));
        titleEl.style.fontSize = `${targetPx}px`;
      }
    });
  }

  initSignaturePad() {
    const canvas = document.getElementById('kiosk-signature-canvas');
    if (!canvas) return;

    this.signaturePad = new SignaturePad(canvas, {
      strokeColor: '#0f172a',
      maxWidth: 3.5
    });
    this.signaturePad.resizeCanvas(true);
  }

  clearSignature() {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  submitRegistration() {
    const activeId = window.rosterStorage.getActiveEventId();
    const eventData = window.rosterStorage.getEventById(activeId);
    if (!eventData) return;

    const form = document.getElementById('kiosk-registration-form');
    if (!form) return;

    // Extract form data
    const formData = new FormData(form);
    const data = {};

    for (let [key, val] of formData.entries()) {
      data[key] = val;
    }

    // Handle unchecked checkboxes
    (eventData.customFields || []).forEach(cf => {
      if (cf.type === 'checkbox') {
        data[cf.id] = form.elements[cf.id]?.checked || false;
      }
    });

    // Check Signature
    const hasSignatureField = (eventData.fields || []).some(f => f.type === 'signature' && f.enabled);
    let signatureDataUrl = null;

    if (hasSignatureField && this.signaturePad) {
      if (this.signaturePad.getIsEmpty()) {
        this.showToast('자필 서명을 작성해 주세요.', 'error');
        return;
      }
      signatureDataUrl = this.signaturePad.toDataURL();
    }

    // Duplicate Check
    const nameToCheck = data.name || data.parentName || data.studentName || '';
    const phoneToCheck = data.phone || '';

    const duplicate = window.rosterStorage.checkDuplicate(eventData.id, nameToCheck, phoneToCheck);
    if (duplicate) {
      this.pendingRegistrationData = { eventId: eventData.id, data, signatureDataUrl };
      this.showDuplicateModal(duplicate);
      return;
    }

    // Save Registration
    this._executeRegistration(eventData.id, data, signatureDataUrl);
  }

  showDuplicateModal(duplicateEntry) {
    const infoBox = document.getElementById('duplicate-info-box');
    if (infoBox) {
      const d = duplicateEntry.data || {};
      const dupName = d.name || d.parentName || d.studentName || '이름 없음';
      const dupPhone = d.phone || '-';
      infoBox.innerHTML = `
        <strong>기존 등록 번호:</strong> ${duplicateEntry.seq}번<br>
        <strong>성명:</strong> ${this._escapeHtml(dupName)}<br>
        <strong>연락처:</strong> ${this._escapeHtml(dupPhone)}<br>
        <strong>등록 시간:</strong> ${duplicateEntry.registeredAt}
      `;
    }
    this.openModal('modal-duplicate');
  }

  forceSubmitRegistration() {
    this.closeModal('modal-duplicate');
    if (this.pendingRegistrationData) {
      const { eventId, data, signatureDataUrl } = this.pendingRegistrationData;
      this._executeRegistration(eventId, data, signatureDataUrl);
      this.pendingRegistrationData = null;
    }
  }

  _executeRegistration(eventId, data, signatureDataUrl) {
    const newReg = window.rosterStorage.addRegistration(eventId, data, signatureDataUrl);

    // Show Success Overlay
    const formContainer = document.getElementById('kiosk-form-container');
    const successOverlay = document.getElementById('kiosk-success-overlay');
    const seqBadge = document.getElementById('success-seq-text');
    const countdownEl = document.getElementById('success-countdown-text');

    if (formContainer) formContainer.style.display = 'none';
    if (seqBadge) seqBadge.textContent = `등록 번호: ${newReg.seq}번`;
    if (successOverlay) successOverlay.style.display = 'block';

    // Auto-countdown 3 seconds
    let remaining = 3;
    if (countdownEl) countdownEl.innerHTML = `<strong>${remaining}초</strong> 후 다음 참가자를 위해 화면이 초기화됩니다.`;

    if (this.kioskCountdownTimer) clearInterval(this.kioskCountdownTimer);

    this.kioskCountdownTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(this.kioskCountdownTimer);
        this.resetKioskFormImmediate();
      } else {
        if (countdownEl) countdownEl.innerHTML = `<strong>${remaining}초</strong> 후 다음 참가자를 위해 화면이 초기화됩니다.`;
      }
    }, 1000);
  }

  resetKioskFormImmediate() {
    if (this.kioskCountdownTimer) clearInterval(this.kioskCountdownTimer);
    
    const form = document.getElementById('kiosk-registration-form');
    if (form) form.reset();
    if (this.signaturePad) this.signaturePad.clear();

    const formContainer = document.getElementById('kiosk-form-container');
    const successOverlay = document.getElementById('kiosk-success-overlay');

    if (successOverlay) successOverlay.style.display = 'none';
    if (formContainer) formContainer.style.display = 'block';

    // Update real-time counter in header
    const activeId = window.rosterStorage.getActiveEventId();
    const countEl = document.getElementById('kiosk-meta-count');
    if (countEl && activeId) {
      const regCount = window.rosterStorage.getRegistrationCount(activeId);
      countEl.innerHTML = `👥 현재 등록: <strong>${regCount}명</strong>`;
    }

    // Scroll to top of kiosk card
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  // =========================================================================
  // VIEW: MANAGEMENT & ATTENDEE LIST
  // =========================================================================

  toggleDuplicateFilter() {
    this.duplicateOnlyFilter = !this.duplicateOnlyFilter;
    const btn = document.getElementById('manage-duplicate-filter-btn');
    if (btn) {
      btn.classList.toggle('active', this.duplicateOnlyFilter);
    }
    this.renderManagementTable();
  }

  autoCleanDuplicatesConfirm() {
    const activeId = window.rosterStorage.getActiveEventId();
    const regs = window.rosterStorage.getRegistrationsByEvent(activeId);

    const seenNames = new Set();
    const seenPhones = new Set();
    const toDelete = [];

    regs.forEach(r => {
      const d = r.data || {};
      const name = (d.name || d.parentName || d.studentName || '').trim().toLowerCase();
      const phone = (d.phone || '').replace(/[^0-9]/g, '');

      let isDup = false;
      if (phone && seenPhones.has(phone)) isDup = true;
      if (name && seenNames.has(name)) isDup = true;

      if (isDup) {
        toDelete.push({ id: r.id, name: d.name || d.parentName || d.studentName || '참가자', seq: r.seq });
      } else {
        if (name) seenNames.add(name);
        if (phone) seenPhones.add(phone);
      }
    });

    if (toDelete.length === 0) {
      this.showToast('중복 등록된 참가자가 없습니다.', 'info');
      return;
    }

    if (confirm(`중복 등록된 ${toDelete.length}건의 데이터를 자동 정리하시겠습니까?\n\n- 최초 등록본(1건)만 유지하고, 이후 중복 등록된 내역을 일괄 삭제합니다.\n- 삭제 후 모든 참가자의 연번(등록번호)이 1번부터 자동으로 재정렬됩니다.`)) {
      toDelete.forEach(item => window.rosterStorage.deleteRegistration(item.id));
      this.showToast(`중복 등록 ${toDelete.length}건이 성공적으로 정리되었습니다.`, 'success');
      this.duplicateOnlyFilter = false;
      this.renderManagementTable();
    }
  }

  renderManagementTable() {
    const activeId = window.rosterStorage.getActiveEventId();
    const eventData = window.rosterStorage.getEventById(activeId);
    const regs = window.rosterStorage.getRegistrationsByEvent(activeId);
    const searchVal = (document.getElementById('manage-search-input')?.value || '').toLowerCase().trim();

    const headerRow = document.getElementById('manage-table-header-row');
    const body = document.getElementById('manage-table-body');
    const countBadge = document.getElementById('manage-count-badge');
    const dupFilterBtn = document.getElementById('manage-duplicate-filter-btn');
    const dupCleanBtn = document.getElementById('manage-duplicate-clean-btn');
    const dupCountSpan = document.getElementById('manage-duplicate-count');

    if (countBadge) countBadge.textContent = regs.length;

    if (!eventData || !headerRow || !body) return;

    // Detect Duplicates in current event (matching name or phone)
    const nameCountMap = {};
    const phoneCountMap = {};
    regs.forEach(r => {
      const d = r.data || {};
      const name = (d.name || d.parentName || d.studentName || '').trim().toLowerCase();
      const phone = (d.phone || '').replace(/[^0-9]/g, '');
      if (name) nameCountMap[name] = (nameCountMap[name] || 0) + 1;
      if (phone) phoneCountMap[phone] = (phoneCountMap[phone] || 0) + 1;
    });

    const duplicateIdSet = new Set();
    regs.forEach(r => {
      const d = r.data || {};
      const name = (d.name || d.parentName || d.studentName || '').trim().toLowerCase();
      const phone = (d.phone || '').replace(/[^0-9]/g, '');
      if ((name && nameCountMap[name] > 1) || (phone && phoneCountMap[phone] > 1)) {
        duplicateIdSet.add(r.id);
      }
    });

    // Update duplicate buttons in toolbar
    if (duplicateIdSet.size > 0) {
      if (dupFilterBtn) {
        dupFilterBtn.style.display = 'inline-flex';
        if (dupCountSpan) dupCountSpan.textContent = duplicateIdSet.size;
      }
      if (dupCleanBtn) {
        dupCleanBtn.style.display = 'inline-flex';
      }
    } else {
      if (dupFilterBtn) dupFilterBtn.style.display = 'none';
      if (dupCleanBtn) dupCleanBtn.style.display = 'none';
      this.duplicateOnlyFilter = false;
    }

    // Collect active visible columns
    const columns = [
      { id: 'seq', label: '연번' }
    ];

    (eventData.fields || []).forEach(f => {
      if (f.enabled && f.id !== 'seq') {
        columns.push({ id: f.id, label: f.label, type: f.type });
      }
    });

    (eventData.customFields || []).forEach(cf => {
      if (cf.enabled) {
        columns.push({ id: cf.id, label: cf.label, type: cf.type });
      }
    });

    columns.push({ id: 'actions', label: '관리' });

    // Render Table Headers
    headerRow.innerHTML = columns.map(c => `<th ${c.id === 'seq' ? 'style="width: 50px; text-align: center;"' : ''}>${c.label}</th>`).join('');

    // Filter registrations (search + duplicate filter)
    const filtered = regs.filter(r => {
      if (this.duplicateOnlyFilter && !duplicateIdSet.has(r.id)) return false;
      if (!searchVal) return true;
      const dataStr = Object.values(r.data || {}).join(' ').toLowerCase();
      const timeStr = (r.registeredAt || '').toLowerCase();
      return dataStr.includes(searchVal) || timeStr.includes(searchVal) || String(r.seq).includes(searchVal);
    });

    if (filtered.length === 0) {
      body.innerHTML = `
        <tr>
          <td colspan="${columns.length}" style="text-align: center; padding: 3rem 1rem; color: #94a3b8;">
            ${regs.length === 0 ? '아직 등록된 참가자가 없습니다.' : (this.duplicateOnlyFilter ? '중복 등록된 참가자가 없습니다.' : '검색 결과와 일치하는 참가자가 없습니다.')}
          </td>
        </tr>
      `;
      return;
    }

    // Render Rows
    body.innerHTML = filtered.map(r => {
      const isDuplicate = duplicateIdSet.has(r.id);
      const rowClass = isDuplicate ? 'class="row-duplicate-warning"' : '';

      const rowCells = columns.map(col => {
        if (col.id === 'seq') {
          return `<td class="table-seq-cell">${r.seq}</td>`;
        }
        if (col.id === 'timestamp') {
          return `<td>${r.registeredAt || '-'}</td>`;
        }
        if (col.id === 'signature') {
          if (r.signatureUrl) {
            return `
              <td>
                <img src="${r.signatureUrl}" class="signature-thumbnail" alt="서명" onclick="app.openSignatureZoomModal('${r.signatureUrl}', '${this._escapeHtml(r.data?.name || r.data?.parentName || '참가자')}')" title="클릭하여 서명 확대">
              </td>
            `;
          }
          return `<td><span style="color:#94a3b8; font-size:0.8rem;">미서명</span></td>`;
        }
        if (col.id === 'actions') {
          return `
            <td style="white-space: nowrap;">
              <button class="btn btn-sm btn-secondary" onclick="app.openEditAttendeeModal('${r.id}')" title="정보 수정">✏️ 수정</button>
              <button class="btn btn-sm btn-outline-danger" onclick="app.deleteAttendeeConfirm('${r.id}')" title="해당 등록 내역 삭제">🗑️ 삭제</button>
            </td>
          `;
        }

        const val = r.data ? r.data[col.id] : '';
        let cellContent = this._escapeHtml(val || '-');

        // Add duplicate badge next to name fields if duplicated
        if (isDuplicate && (col.id === 'name' || col.id === 'parentName' || col.id === 'studentName')) {
          cellContent += `<span class="badge-duplicate" title="동일한 성명 또는 연락처가 중복 등록되었습니다">⚠️ 중복</span>`;
        }

        if (typeof val === 'boolean') {
          return `<td>${val ? '✓ 예' : '✕ 아니오'}</td>`;
        }
        return `<td>${cellContent}</td>`;
      }).join('');

      return `<tr ${rowClass}>${rowCells}</tr>`;
    }).join('');
  }

  openEditAttendeeModal(regId) {
    const reg = window.rosterStorage.getRegistrationById(regId);
    if (!reg) return;
    const eventData = window.rosterStorage.getEventById(reg.eventId);
    if (!eventData) return;

    const idInput = document.getElementById('edit-reg-id');
    const mount = document.getElementById('edit-fields-mount');
    if (!mount) return;

    idInput.value = reg.id;
    mount.innerHTML = '';

    // Standard Fields
    (eventData.fields || []).forEach(f => {
      if (!f.enabled || f.id === 'seq' || f.id === 'timestamp' || f.type === 'signature') return;

      const currentVal = reg.data ? reg.data[f.id] || '' : '';
      const group = document.createElement('div');
      group.className = 'form-group';
      group.innerHTML = `
        <label class="form-label">${f.label}</label>
        <input type="text" name="${f.id}" class="form-control" value="${this._escapeHtml(currentVal)}">
      `;
      mount.appendChild(group);
    });

    // Custom Fields
    (eventData.customFields || []).forEach(cf => {
      if (!cf.enabled) return;
      const currentVal = reg.data ? reg.data[cf.id] || '' : '';
      const group = document.createElement('div');
      group.className = 'form-group';
      group.innerHTML = `
        <label class="form-label">${cf.label}</label>
        <input type="text" name="${cf.id}" class="form-control" value="${this._escapeHtml(currentVal)}">
      `;
      mount.appendChild(group);
    });

    this.openModal('modal-edit-attendee');
  }

  saveAttendeeEdit() {
    const regId = document.getElementById('edit-reg-id').value;
    const form = document.getElementById('form-edit-attendee');
    if (!regId || !form) return;

    const formData = new FormData(form);
    const updatedData = {};
    for (let [k, v] of formData.entries()) {
      updatedData[k] = v;
    }

    window.rosterStorage.updateRegistration(regId, updatedData);
    this.closeModal('modal-edit-attendee');
    this.showToast('참가자 정보가 수정되었습니다.', 'success');
    this.renderManagementTable();
  }

  deleteAttendeeConfirm(regId) {
    const reg = window.rosterStorage.getRegistrationById(regId);
    const name = reg?.data?.name || reg?.data?.parentName || reg?.data?.studentName || '참가자';
    const seq = reg?.seq ? ` (등록번호 ${reg.seq}번)` : '';

    if (confirm(`[${name}] 님의 등록 내역${seq}을 삭제하시겠습니까?\n\n※ 삭제 후 나머지 참가자의 등록 번호(연번)가 1번부터 자동으로 재정렬됩니다.`)) {
      window.rosterStorage.deleteRegistration(regId);
      this.showToast(`[${name}] 등록 내역이 삭제되었습니다.`, 'info');
      this.renderManagementTable();
    }
  }

  clearRegistrationsConfirm() {
    const activeId = window.rosterStorage.getActiveEventId();
    const count = window.rosterStorage.getRegistrationCount(activeId);
    if (count === 0) {
      this.showToast('등록된 참가자가 없습니다.', 'info');
      return;
    }

    if (confirm(`현재 행사의 모든 등록자 데이터(${count}명)를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      const regs = window.rosterStorage.getRegistrationsByEvent(activeId);
      regs.forEach(r => window.rosterStorage.deleteRegistration(r.id));
      this.showToast('등록자 목록이 초기화되었습니다.', 'success');
      this.renderManagementTable();
    }
  }

  // =========================================================================
  // VIEW: PRINT & EXPORT PREVIEW
  // =========================================================================

  setPrintMode(mode) {
    this.printMode = mode;
    const btnReg = document.getElementById('btn-print-mode-registered');
    const btnBlank = document.getElementById('btn-print-mode-blank');
    const rowsContainer = document.getElementById('print-blank-rows-container');

    if (btnReg && btnBlank) {
      if (mode === 'blank') {
        btnReg.className = 'btn btn-sm btn-secondary';
        btnBlank.className = 'btn btn-sm btn-primary';
        if (rowsContainer) rowsContainer.style.display = 'flex';
      } else {
        btnReg.className = 'btn btn-sm btn-primary';
        btnBlank.className = 'btn btn-sm btn-secondary';
        if (rowsContainer) rowsContainer.style.display = 'none';
      }
    }
    this.renderPrintPreview();
  }

  renderPrintPreview() {
    const activeId = window.rosterStorage.getActiveEventId();
    const eventData = window.rosterStorage.getEventById(activeId);
    const regs = window.rosterStorage.getRegistrationsByEvent(activeId);

    const container = document.getElementById('print-preview-container');
    const printArea = document.getElementById('print-area');
    if (!container || !printArea) return;

    if (!eventData) {
      container.innerHTML = '<div class="empty-state">선택된 행사가 없습니다.</div>';
      printArea.innerHTML = '';
      return;
    }

    const isBlank = this.printMode === 'blank';
    const rowsSelect = document.getElementById('print-blank-rows-select');
    const rowCount = parseInt(rowsSelect?.value || '20', 10);

    const rosterHTML = this._buildRosterHTML(eventData, regs, isBlank, rowCount);
    container.innerHTML = rosterHTML;
    printArea.innerHTML = rosterHTML;
  }

  _getAutoTitleFontSize(title) {
    const len = (title || '').length;
    if (len <= 14) return '22pt';
    if (len <= 22) return '19pt';
    if (len <= 32) return '16.5pt';
    if (len <= 42) return '14pt';
    if (len <= 54) return '12pt';
    if (len <= 68) return '11pt';
    return '10pt';
  }

  _buildRosterHTML(eventData, regs = [], isBlank = false, blankRows = 20) {
    if (!eventData) return '';

    // Read print options
    const optTitle = document.getElementById('print-opt-title')?.checked ?? true;
    const optMeta = document.getElementById('print-opt-meta')?.checked ?? true;
    const optPhone = document.getElementById('print-opt-phone')?.checked ?? true;
    const optTime = document.getElementById('print-opt-time')?.checked ?? true;
    const optSignature = document.getElementById('print-opt-signature')?.checked ?? true;

    // Columns to print
    const columns = [{ id: 'seq', label: '연번', width: '50px' }];

    (eventData.fields || []).forEach(f => {
      if (!f.enabled || f.id === 'seq') return;
      if (f.id === 'phone' && !optPhone) return;
      if (f.id === 'timestamp' && !optTime && !isBlank) return;
      if (f.id === 'timestamp' && isBlank) {
        columns.push({ id: f.id, label: '등록시간', type: f.type, width: '90px' });
        return;
      }
      if (f.type === 'signature' && !optSignature) return;

      let colWidth = 'auto';
      if (f.type === 'signature') colWidth = '110px';
      else if (f.id === 'name' || f.id === 'studentName' || f.id === 'parentName') colWidth = '90px';
      else if (f.id === 'phone') colWidth = '130px';

      columns.push({ id: f.id, label: f.label, type: f.type, width: colWidth });
    });

    (eventData.customFields || []).forEach(cf => {
      if (cf.enabled) {
        columns.push({ id: cf.id, label: cf.label, type: cf.type, width: 'auto' });
      }
    });

    // Table Header HTML
    const tableHeaderHtml = columns.map(c => `<th style="${c.width !== 'auto' ? `width: ${c.width};` : ''}">${c.label}</th>`).join('');

    // Table Rows HTML
    let tableRowsHtml = '';
    if (isBlank) {
      // Generate blank rows for handwriting
      for (let i = 1; i <= blankRows; i++) {
        const cells = columns.map(col => {
          if (col.id === 'seq') return `<td class="seq-cell">${i}</td>`;
          return `<td></td>`;
        }).join('');
        tableRowsHtml += `<tr>${cells}</tr>`;
      }
    } else {
      if (regs.length === 0) {
        tableRowsHtml = `<tr><td colspan="${columns.length}" style="text-align: center; padding: 25px; color: #64748b;">등록된 참가자가 없습니다.</td></tr>`;
      } else {
        tableRowsHtml = regs.map(r => {
          const cells = columns.map(col => {
            if (col.id === 'seq') return `<td class="seq-cell">${r.seq}</td>`;
            if (col.id === 'timestamp') return `<td>${r.registeredAt || '-'}</td>`;
            if (col.id === 'signature') {
              if (r.signatureUrl) {
                return `<td><img src="${r.signatureUrl}" class="print-signature-img" alt="서명"></td>`;
              }
              return `<td>(서명)</td>`;
            }
            const val = r.data ? r.data[col.id] : '';
            return `<td>${this._escapeHtml(val || '-')}</td>`;
          }).join('');
          return `<tr>${cells}</tr>`;
        }).join('');
      }
    }

    const tableClass = isBlank ? 'print-table blank-table' : 'print-table';
    const fullTitleText = `${eventData.title || ''} ${isBlank ? '등록부 (수기용)' : '등록부'}`;
    const titleFontSize = this._getAutoTitleFontSize(fullTitleText);

    return `
      <div class="print-preview-paper">
        <div class="print-roster-header">
          ${optTitle ? `<div class="print-roster-title" style="font-size: ${titleFontSize};">${this._escapeHtml(fullTitleText)}</div>` : ''}
          ${optMeta ? `
            <div class="print-roster-meta">
              <span><strong>일시:</strong> ${eventData.date} ${eventData.time ? `(${eventData.time})` : ''}</span>
              <span><strong>장소:</strong> ${this._escapeHtml(eventData.location)}</span>
              <span><strong>${isBlank ? '총 인쇄 행 수:' : '총 참가 인원:'}</strong> ${isBlank ? `${blankRows}행` : `${regs.length}명`}</span>
            </div>
          ` : ''}
        </div>

        <table class="${tableClass}">
          <thead>
            <tr>${tableHeaderHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="print-footer">
          위와 같이 행사에 참석하여 등록하였음을 확인합니다.
        </div>
      </div>
    `;
  }

  // =========================================================================
  // EXPORT TO EXCEL (CSV with UTF-8 BOM)
  // =========================================================================

  exportToExcel() {
    const activeId = window.rosterStorage.getActiveEventId();
    const eventData = window.rosterStorage.getEventById(activeId);
    const regs = window.rosterStorage.getRegistrationsByEvent(activeId);

    if (!eventData) {
      this.showToast('선택된 행사가 없습니다.', 'warning');
      return;
    }

    if (regs.length === 0) {
      this.showToast('내보낼 등록자 데이터가 없습니다.', 'warning');
      return;
    }

    const columns = [{ id: 'seq', label: '연번' }];
    (eventData.fields || []).forEach(f => {
      if (f.enabled && f.id !== 'seq' && f.type !== 'signature') {
        columns.push({ id: f.id, label: f.label });
      }
    });
    (eventData.customFields || []).forEach(cf => {
      if (cf.enabled) {
        columns.push({ id: cf.id, label: cf.label });
      }
    });
    columns.push({ id: 'signature_status', label: '자필서명여부' });
    columns.push({ id: 'registeredAt', label: '등록시간' });

    // Build CSV Header
    let csvContent = '\uFEFF'; // UTF-8 BOM for Korean Excel
    csvContent += columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',') + '\r\n';

    // Build CSV Rows
    regs.forEach(r => {
      const row = columns.map(col => {
        if (col.id === 'seq') return `"${r.seq}"`;
        if (col.id === 'registeredAt') return `"${r.registeredAt || ''}"`;
        if (col.id === 'signature_status') return `"${r.signatureUrl ? '완료' : '미서명'}"`;
        const val = r.data ? (r.data[col.id] || '') : '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvContent += row.join(',') + '\r\n';
    });

    // Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const filename = `${eventData.title.replace(/[\/\\:*?"<>|]/g, '_')}_등록부_${new Date().toISOString().slice(0, 10)}.csv`;

    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('엑셀(CSV) 파일이 다운로드되었습니다.', 'success');
  }

  // =========================================================================
  // QR CODE MODAL & PRINTABLE POSTER
  // =========================================================================

  openQRModal() {
    const activeId = window.rosterStorage.getActiveEventId();
    const eventData = window.rosterStorage.getEventById(activeId);
    if (!eventData) return;

    const titleEl = document.getElementById('qr-modal-event-title');
    const urlInput = document.getElementById('qr-share-url-input');
    const mount = document.getElementById('qr-code-mount');

    if (titleEl) titleEl.textContent = eventData.title;

    // Create absolute URL pointing to this event
    const baseUrl = window.location.href.split('#')[0];
    const targetUrl = `${baseUrl}#register?id=${eventData.id}`;

    if (urlInput) urlInput.value = targetUrl;

    if (mount && typeof QRCode !== 'undefined') {
      mount.innerHTML = '';
      new QRCode(mount, {
        text: targetUrl,
        width: 220,
        height: 220,
        colorDark: '#0f172a',
        colorLight: '#ffffff'
      });
    }

    this.openModal('modal-qr');
  }

  copyShareUrl() {
    const urlInput = document.getElementById('qr-share-url-input');
    if (!urlInput) return;
    urlInput.select();
    navigator.clipboard.writeText(urlInput.value).then(() => {
      this.showToast('등록 URL이 클립보드에 복사되었습니다.', 'success');
    }).catch(() => {
      document.execCommand('copy');
      this.showToast('등록 URL이 복사되었습니다.', 'success');
    });
  }

  printQRPages() {
    const activeId = window.rosterStorage.getActiveEventId();
    const eventData = window.rosterStorage.getEventById(activeId);
    if (!eventData) return;

    const baseUrl = window.location.href.split('#')[0];
    const targetUrl = `${baseUrl}#register?id=${eventData.id}`;
    const qrDataUrl = QRCode.generateDataURL(targetUrl, 320);

    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    const qrTitleSize = this._getAutoTitleFontSize(eventData.title);

    printArea.innerHTML = `
      <div class="print-preview-paper" style="text-align: center; padding: 3cm 2cm;">
        <div style="font-size: ${qrTitleSize}; font-weight: 800; margin-bottom: 1rem; color: #1e3a8a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${this._escapeHtml(eventData.title)}
        </div>
        <div style="font-size: 20pt; font-weight: 700; color: #334155; margin-bottom: 2rem;">
          📱 스마트폰 디지털 행사 등록부
        </div>

        <div style="display: inline-block; padding: 20px; border: 3px solid #000; border-radius: 20px; background: white; margin-bottom: 2rem;">
          <img src="${qrDataUrl}" style="width: 280px; height: 280px;" alt="QR Code">
        </div>

        <div style="font-size: 16pt; font-weight: 700; color: #0f172a; line-height: 1.6;">
          스마트폰 기본 카메라로 위 QR코드를 비추면<br>
          설치 없이 바로 등록 화면으로 이동합니다.
        </div>

        <div style="margin-top: 3rem; font-size: 12pt; color: #64748b;">
          일시: ${eventData.date} | 장소: ${this._escapeHtml(eventData.location)}
        </div>
      </div>
    `;

    this.closeModal('modal-qr');
    setTimeout(() => {
      window.print();
    }, 200);
  }

  // =========================================================================
  // EVENT CLONING MODAL
  // =========================================================================

  openCloneModal(eventId) {
    const source = window.rosterStorage.getEventById(eventId);
    if (!source) return;

    document.getElementById('clone-source-event-id').value = source.id;
    document.getElementById('clone-new-title').value = `${source.title} (복사본)`;
    document.getElementById('clone-new-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('clone-new-location').value = source.location;

    this.openModal('modal-clone-event');
  }

  executeCloneEvent() {
    const sourceId = document.getElementById('clone-source-event-id').value;
    const newTitle = document.getElementById('clone-new-title').value.trim();
    const newDate = document.getElementById('clone-new-date').value;
    const newLoc = document.getElementById('clone-new-location').value.trim();

    if (!newTitle) {
      this.showToast('새 행사명을 입력해주세요.', 'error');
      return;
    }

    const cloned = window.rosterStorage.cloneEvent(sourceId, newTitle, newDate, newLoc);
    this.closeModal('modal-clone-event');
    this.showToast(`'${newTitle}' 등록부가 성공적으로 복제 생성되었습니다.`, 'success');
    this.navigate('saved-events');
  }

  // =========================================================================
  // SIGNATURE ZOOM MODAL
  // =========================================================================

  openSignatureZoomModal(imgUrl, name) {
    const titleEl = document.getElementById('zoom-signature-name');
    const imgEl = document.getElementById('zoom-signature-img');
    if (titleEl) titleEl.textContent = `${name} 님의 자필 서명`;
    if (imgEl) imgEl.src = imgUrl;
    this.openModal('modal-signature-zoom');
  }

  // =========================================================================
  // BACKUP & RESTORE MODAL
  // =========================================================================

  openBackupModal() {
    this.openModal('modal-backup');
  }

  downloadBackupJSON() {
    const jsonStr = window.rosterStorage.exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `스마트행사등록부_백업_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('백업 파일이 저장되었습니다.', 'success');
  }

  handleBackupFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = window.rosterStorage.importDataJSON(event.target.result);
      if (res.success) {
        this.closeModal('modal-backup');
        this.showToast(`복원 완료! (행사 ${res.eventCount}개, 등록자 ${res.regCount}명)`, 'success');
        this.navigate('home');
      } else {
        this.showToast(`복원 실패: ${res.error}`, 'error');
      }
    };
    reader.readAsText(file);
  }

  resetSampleDataConfirm() {
    if (confirm('모든 행사 및 등록자 데이터를 완전히 초기화하시겠습니까?\n(현재 작성된 모든 내역이 삭제되고 빈 상태로 초기화됩니다)')) {
      window.rosterStorage.resetToSampleData();
      this.showToast('모든 데이터가 초기화되었습니다.', 'success');
      this.navigate('home');
    }
  }

  // =========================================================================
  // MODALS & TOAST HELPERS
  // =========================================================================

  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
  }

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'ℹ️';
    if (type === 'success') {
      icon = '✅';
      toast.style.background = '#065f46';
    } else if (type === 'error') {
      icon = '❌';
      toast.style.background = '#991b1b';
    } else if (type === 'warning') {
      icon = '⚠️';
      toast.style.background = '#92400e';
    }

    toast.innerHTML = `<span>${icon}</span> <span>${this._escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  _escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Global App bootstrap
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SmartEventApp();
});
