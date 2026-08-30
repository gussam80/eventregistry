/**
 * Storage Layer for Smart Event Registry
 * Handles localStorage persistence, CRUD operations, duplicate checks, import/export, and event cloning
 */

const STORAGE_KEYS = {
  EVENTS: 'smart_event_roster_events_v1',
  REGISTRATIONS: 'smart_event_roster_registrations_v1',
  CURRENT_EVENT_ID: 'smart_event_roster_active_event_id_v1'
};

class EventStorage {
  constructor() {
    this._initStorage();
  }

  _initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      this.resetToSampleData();
    }
  }

  // Reset to initial sample data
  resetToSampleData() {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_SAMPLE_DATA.events));
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(INITIAL_SAMPLE_DATA.registrations));
      if (INITIAL_SAMPLE_DATA.events.length > 0) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_EVENT_ID, INITIAL_SAMPLE_DATA.events[0].id);
      }
      this._emitChange('all');
      return true;
    } catch (e) {
      console.error('Failed to initialize sample data:', e);
      return false;
    }
  }

  // Event Listeners for reactive updates
  _emitChange(type, detail = {}) {
    window.dispatchEvent(new CustomEvent('roster_storage_change', {
      detail: { type, ...detail }
    }));
  }

  // =====================
  // EVENT CRUD OPERATIONS
  // =====================

  getEvents() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading events:', e);
      return [];
    }
  }

  getEventById(eventId) {
    if (!eventId) return null;
    const events = this.getEvents();
    return events.find(e => e.id === eventId) || null;
  }

  saveEvent(eventData) {
    const events = this.getEvents();
    const isNew = !eventData.id;
    const now = new Date().toISOString();

    let targetEvent;
    if (isNew) {
      targetEvent = {
        ...eventData,
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        createdAt: now,
        updatedAt: now
      };
      events.unshift(targetEvent);
    } else {
      const index = events.findIndex(e => e.id === eventData.id);
      if (index === -1) {
        targetEvent = {
          ...eventData,
          updatedAt: now
        };
        events.unshift(targetEvent);
      } else {
        targetEvent = {
          ...events[index],
          ...eventData,
          updatedAt: now
        };
        events[index] = targetEvent;
      }
    }

    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    this.setActiveEventId(targetEvent.id);
    this._emitChange('event_saved', { event: targetEvent });
    return targetEvent;
  }

  deleteEvent(eventId) {
    let events = this.getEvents();
    events = events.filter(e => e.id !== eventId);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

    // Also delete associated registrations
    let regs = this.getAllRegistrations();
    regs = regs.filter(r => r.eventId !== eventId);
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regs));

    const activeId = this.getActiveEventId();
    if (activeId === eventId) {
      const nextActive = events.length > 0 ? events[0].id : null;
      this.setActiveEventId(nextActive);
    }

    this._emitChange('event_deleted', { eventId });
    return true;
  }

  // Clone an existing event with its field configuration, resetting registrations
  cloneEvent(sourceEventId, newTitle, newDate, newLocation) {
    const source = this.getEventById(sourceEventId);
    if (!source) return null;

    const clonedEvent = {
      ...JSON.parse(JSON.stringify(source)),
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: newTitle || (source.title + ' (복사본)'),
      date: newDate || new Date().toISOString().split('T')[0],
      location: newLocation || source.location,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const events = this.getEvents();
    events.unshift(clonedEvent);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    this.setActiveEventId(clonedEvent.id);
    this._emitChange('event_cloned', { event: clonedEvent });
    return clonedEvent;
  }

  // Active Event Context
  getActiveEventId() {
    const id = localStorage.getItem(STORAGE_KEYS.CURRENT_EVENT_ID);
    if (id && this.getEventById(id)) return id;
    const events = this.getEvents();
    if (events.length > 0) {
      this.setActiveEventId(events[0].id);
      return events[0].id;
    }
    return null;
  }

  setActiveEventId(eventId) {
    if (eventId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_EVENT_ID, eventId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_EVENT_ID);
    }
    this._emitChange('active_event_changed', { eventId });
  }

  // ============================
  // REGISTRATION CRUD OPERATIONS
  // ============================

  getAllRegistrations() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading registrations:', e);
      return [];
    }
  }

  getRegistrationsByEvent(eventId) {
    if (!eventId) return [];
    const all = this.getAllRegistrations();
    return all
      .filter(r => r.eventId === eventId)
      .sort((a, b) => a.seq - b.seq);
  }

  getRegistrationCount(eventId) {
    if (!eventId) return 0;
    const all = this.getAllRegistrations();
    return all.filter(r => r.eventId === eventId).length;
  }

  getRegistrationById(id) {
    const all = this.getAllRegistrations();
    return all.find(r => r.id === id) || null;
  }

  // Check if a person is already registered for this event
  checkDuplicate(eventId, attendeeName, attendeePhone) {
    if (!eventId) return null;
    const list = this.getRegistrationsByEvent(eventId);
    const cleanPhone = (attendeePhone || '').replace(/[^0-9]/g, '');
    const cleanName = (attendeeName || '').trim();

    return list.find(r => {
      const d = r.data || {};
      const regName = (d.name || d.parentName || d.studentName || '').trim();
      const regPhone = (d.phone || '').replace(/[^0-9]/g, '');

      // Match conditions: Same phone number (if given) OR same exact name
      if (cleanPhone && regPhone && cleanPhone === regPhone) {
        return true;
      }
      if (cleanName && regName && cleanName.toLowerCase() === regName.toLowerCase()) {
        return true;
      }
      return false;
    }) || null;
  }

  addRegistration(eventId, data, signatureUrl) {
    const all = this.getAllRegistrations();
    const existingForEvent = all.filter(r => r.eventId === eventId);
    const nextSeq = existingForEvent.length > 0
      ? Math.max(...existingForEvent.map(r => r.seq || 0)) + 1
      : 1;

    const now = new Date();
    const timeFormatted = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newReg = {
      id: 'reg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      eventId: eventId,
      seq: nextSeq,
      data: data || {},
      signatureUrl: signatureUrl || null,
      registeredAt: timeFormatted
    };

    all.push(newReg);
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(all));
    this._emitChange('registration_added', { registration: newReg, eventId });
    return newReg;
  }

  updateRegistration(regId, updatedData, updatedSignature) {
    const all = this.getAllRegistrations();
    const index = all.findIndex(r => r.id === regId);
    if (index === -1) return null;

    all[index] = {
      ...all[index],
      data: { ...all[index].data, ...(updatedData || {}) },
      signatureUrl: updatedSignature !== undefined ? updatedSignature : all[index].signatureUrl
    };

    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(all));
    this._emitChange('registration_updated', { registration: all[index] });
    return all[index];
  }

  deleteRegistration(regId) {
    let all = this.getAllRegistrations();
    const target = all.find(r => r.id === regId);
    if (!target) return false;

    const eventId = target.eventId;
    all = all.filter(r => r.id !== regId);

    // Re-index sequences for consistency
    let seq = 1;
    all.forEach(r => {
      if (r.eventId === eventId) {
        r.seq = seq++;
      }
    });

    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(all));
    this._emitChange('registration_deleted', { regId, eventId });
    return true;
  }

  // ============================
  // BACKUP, IMPORT, EXPORT
  // ============================

  exportAllDataJSON() {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      events: this.getEvents(),
      registrations: this.getAllRegistrations()
    }, null, 2);
  }

  importDataJSON(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (!parsed || !Array.isArray(parsed.events)) {
        throw new Error('유효한 등록부 데이터 형식이 아닙니다.');
      }

      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(parsed.events));
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(parsed.registrations || []));
      if (parsed.events.length > 0) {
        this.setActiveEventId(parsed.events[0].id);
      }
      this._emitChange('all');
      return { success: true, eventCount: parsed.events.length, regCount: (parsed.registrations || []).length };
    } catch (e) {
      console.error('Import error:', e);
      return { success: false, error: e.message };
    }
  }

  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.REGISTRATIONS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_EVENT_ID);
    this._emitChange('all');
  }
}

// Global singleton instance
window.rosterStorage = new EventStorage();
