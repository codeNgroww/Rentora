'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Tag,
  Phone,
  Users,
  Briefcase,
  MoreHorizontal,
  X,
  Check,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  day: number;
  time: string;
  title: string;
  type: 'call' | 'meeting' | 'project';
  person?: string;
  attendees?: string[];
}

const INITIAL_EVENTS: CalendarEvent[] = [
  { id: '1', day: 5, time: '08:40 AM', title: 'Call', type: 'call', person: 'Diha Glenn' },
  { id: '2', day: 13, time: '10:00 - 11:00 AM', title: 'Meeting', type: 'meeting', attendees: ['SA', 'TJ', 'CN'] },
  { id: '3', day: 17, time: '10:00 - 12:20 AM', title: 'Lease Renewal', type: 'meeting', attendees: ['SA', 'RM'] },
  { id: '4', day: 21, time: '10:00 - 11:00 AM', title: 'Meeting', type: 'project', person: 'Chris Newton' },
  { id: '5', day: 28, time: '10:00 AM', title: 'Meeting', type: 'meeting', attendees: ['SA', 'TJ'] },
];

export function CalendarScheduleView() {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [activeDate, setActiveDate] = useState<number>(17);
  const [showEventModal, setShowEventModal] = useState<boolean>(true);
  const [eventType, setEventType] = useState<'meeting' | 'call' | 'project'>('meeting');
  const [eventTitle, setEventTitle] = useState<string>('Contract Review');
  const [eventDate, setEventDate] = useState<string>('Tuesday, 17 November 2026');
  const [startTime, setStartTime] = useState<string>('10:00 AM');
  const [endTime, setEndTime] = useState<string>('12:20 AM');
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);

  // Calendar cells definition (November 2026 starting from previous month end)
  const calendarDays = [
    { num: 26, isOther: true },
    { num: 27, isOther: true },
    { num: 28, isOther: true },
    { num: 29, isOther: true },
    { num: 30, isOther: true },
    { num: 31, isOther: true },
    { num: 1, isOther: false },
    { num: 2, isOther: false },
    { num: 3, isOther: false },
    { num: 4, isOther: false },
    { num: 5, isOther: false },
    { num: 6, isOther: false },
    { num: 7, isOther: false },
    { num: 8, isOther: false },
    { num: 9, isOther: false },
    { num: 10, isOther: false },
    { num: 11, isOther: false },
    { num: 12, isOther: false },
    { num: 13, isOther: false },
    { num: 14, isOther: false },
    { num: 15, isOther: false },
    { num: 16, isOther: false },
    { num: 17, isOther: false },
    { num: 18, isOther: false },
    { num: 19, isOther: false },
    { num: 20, isOther: false },
    { num: 21, isOther: false },
    { num: 22, isOther: false },
    { num: 23, isOther: false },
    { num: 24, isOther: false },
    { num: 25, isOther: false },
    { num: 26, isOther: false },
    { num: 27, isOther: false },
    { num: 28, isOther: false },
    { num: 29, isOther: false },
    { num: 30, isOther: false },
    { num: 1, isOther: true },
    { num: 2, isOther: true },
    { num: 3, isOther: true },
    { num: 4, isOther: true },
    { num: 5, isOther: true },
    { num: 6, isOther: true },
  ];

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: CalendarEvent = {
      id: String(Date.now()),
      day: activeDate,
      time: `${startTime} - ${endTime}`,
      title: eventTitle || (eventType === 'meeting' ? 'Meeting' : eventType === 'call' ? 'Call' : 'Project'),
      type: eventType,
      attendees: ['SA', 'TJ'],
    };
    setEvents([...events, newEvent]);
    setShowEventModal(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Top Header Row matching screenshot */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', margin: 0 }}>
            Calendar
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: '3px 0 0 0' }}>
            View and manage your events, meetings and important dates.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Day / Week / Month Pill Selector */}
          <div className="pill-segmented-control">
            <button
              type="button"
              className={`pill-btn ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
            <button
              type="button"
              className={`pill-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              type="button"
              className={`pill-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>

          {/* + Add Event Primary Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowEventModal(true)}
            style={{ borderRadius: '10px', height: '42px', padding: '0 18px', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid Layout */}
      <div className="calendar-layout-grid">
        {/* Left Column: Big Monthly Calendar Grid Card */}
        <div className="calendar-main-card">
          {/* Calendar Month Header Navigation */}
          <div className="calendar-header-nav">
            <div className="calendar-nav-arrows">
              <button type="button" className="calendar-arrow-btn" aria-label="Previous Month">
                <ChevronLeft size={16} />
              </button>
              <button type="button" className="calendar-arrow-btn" aria-label="Next Month">
                <ChevronRight size={16} />
              </button>
            </div>
            <h2 className="calendar-month-title">November 2026</h2>
            <div className="calendar-nav-arrows">
              <button type="button" className="calendar-arrow-btn" aria-label="Next Navigation">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="calendar-weekdays-row">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* Calendar Days Matrix */}
          <div className="calendar-days-grid">
            {calendarDays.map((day, idx) => {
              const dayEvents = !day.isOther ? events.filter((ev) => ev.day === day.num) : [];
              const isActive = !day.isOther && day.num === activeDate;

              return (
                <div
                  key={idx}
                  className={`calendar-day-cell ${day.isOther ? 'other-month' : ''} ${isActive ? 'active-today' : ''}`}
                  onClick={() => {
                    if (!day.isOther) {
                      setActiveDate(day.num);
                      setEventDate(`November ${day.num}, 2026`);
                    }
                  }}
                >
                  <div className="calendar-day-number">{day.num}</div>

                  {/* Render event chips if any */}
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={`cal-event-chip ${ev.type}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDate(ev.day);
                        setShowEventModal(true);
                      }}
                      title={`${ev.title} (${ev.time})`}
                    >
                      <span className={`cal-event-dot ${ev.type === 'call' ? 'green' : ev.type === 'meeting' ? 'purple' : 'blue'}`} />
                      <span>{ev.title} {ev.time}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Interactive Popover Modal "Event today" matching screenshot */}
          {showEventModal && (
            <div className="event-popover-card">
              <div className="event-popover-header">
                <span className="event-popover-title">Event today</span>
                <button
                  type="button"
                  className="event-popover-close"
                  onClick={() => setShowEventModal(false)}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Date Input */}
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <CalendarIcon size={13} color="#10b981" />
                    <span>Date</span>
                  </label>
                  <div
                    style={{
                      background: '#f8faf9',
                      border: '1px solid #e2ece6',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{eventDate}</span>
                    <span style={{ fontSize: '11px', color: '#10b981' }}>🗓️</span>
                  </div>
                </div>

                {/* Hour Range Input */}
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Clock size={13} color="#10b981" />
                    <span>Hour</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      style={{
                        flex: 1,
                        background: '#f8faf9',
                        border: '1px solid #e2ece6',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: '#1e293b',
                        outline: 'none',
                      }}
                    />
                    <span style={{ color: '#94a3b8' }}>–</span>
                    <input
                      type="text"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      style={{
                        flex: 1,
                        background: '#f8faf9',
                        border: '1px solid #e2ece6',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: '#1e293b',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Type Selection */}
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Tag size={13} color="#10b981" />
                    <span>Type</span>
                  </label>
                  <div className="event-type-pills">
                    <button
                      type="button"
                      className={`event-type-pill ${eventType === 'meeting' ? 'active' : ''}`}
                      onClick={() => setEventType('meeting')}
                    >
                      Meeting
                    </button>
                    <button
                      type="button"
                      className={`event-type-pill ${eventType === 'call' ? 'active' : ''}`}
                      onClick={() => setEventType('call')}
                    >
                      Call
                    </button>
                    <button
                      type="button"
                      className={`event-type-pill ${eventType === 'project' ? 'active' : ''}`}
                      onClick={() => setEventType('project')}
                    >
                      Project meeting
                    </button>
                  </div>
                </div>

                {/* Add users / Avatar Stack */}
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                    Add users
                  </label>
                  <div className="avatar-stack">
                    <div className="avatar-stack-item" style={{ background: '#3b82f6' }}>SA</div>
                    <div className="avatar-stack-item" style={{ background: '#10b981' }}>TJ</div>
                    <div className="avatar-stack-item" style={{ background: '#f59e0b' }}>CN</div>
                    <button type="button" className="avatar-stack-add" title="Invite User">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '10px',
                    marginTop: '8px',
                    fontWeight: 700,
                    fontSize: '14px',
                  }}
                >
                  Save
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Mini Calendar & To Do List Widgets */}
        <div>
          {/* Mini Calendar Card */}
          <div className="mini-cal-card">
            <div className="mini-cal-header">
              <span className="mini-cal-title">November 2026</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button type="button" className="calendar-arrow-btn" style={{ width: '26px', height: '26px' }}>
                  <ChevronLeft size={13} />
                </button>
                <button type="button" className="calendar-arrow-btn" style={{ width: '26px', height: '26px' }}>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            <div className="mini-cal-weekdays">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            <div className="mini-cal-days">
              {/* Row 1 */}
              <div className="mini-cal-day other">26</div>
              <div className="mini-cal-day other">27</div>
              <div className="mini-cal-day other">28</div>
              <div className="mini-cal-day other">29</div>
              <div className="mini-cal-day other">30</div>
              <div className="mini-cal-day other">31</div>
              <div className="mini-cal-day">1</div>
              {/* Row 2 */}
              <div className="mini-cal-day">2</div>
              <div className="mini-cal-day">3</div>
              <div className="mini-cal-day">4</div>
              <div className="mini-cal-day">5</div>
              <div className="mini-cal-day">6</div>
              <div className="mini-cal-day">7</div>
              <div className="mini-cal-day">8</div>
              {/* Row 3 */}
              <div className="mini-cal-day">9</div>
              <div className="mini-cal-day">10</div>
              <div className="mini-cal-day">11</div>
              <div className="mini-cal-day">12</div>
              <div className="mini-cal-day">13</div>
              <div className="mini-cal-day">14</div>
              <div className="mini-cal-day">15</div>
              {/* Row 4 with active day 17 */}
              <div className="mini-cal-day">16</div>
              <div className="mini-cal-day active">17</div>
              <div className="mini-cal-day">18</div>
              <div className="mini-cal-day">19</div>
              <div className="mini-cal-day">20</div>
              <div className="mini-cal-day">21</div>
              <div className="mini-cal-day">22</div>
              {/* Row 5 */}
              <div className="mini-cal-day">23</div>
              <div className="mini-cal-day">24</div>
              <div className="mini-cal-day">25</div>
              <div className="mini-cal-day">26</div>
              <div className="mini-cal-day">27</div>
              <div className="mini-cal-day">28</div>
              <div className="mini-cal-day">29</div>
              {/* Row 6 */}
              <div className="mini-cal-day">30</div>
              <div className="mini-cal-day other">1</div>
              <div className="mini-cal-day other">2</div>
              <div className="mini-cal-day other">3</div>
              <div className="mini-cal-day other">4</div>
              <div className="mini-cal-day other">5</div>
              <div className="mini-cal-day other">6</div>
            </div>
          </div>

          {/* To Do List Widget */}
          <div className="todo-widget-card">
            <div className="todo-widget-header">
              <span className="todo-widget-title">To Do list</span>
              <button
                type="button"
                className="todo-widget-link"
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                View all
              </button>
            </div>

            {/* Task Item 1: Call */}
            <div className="todo-item-card call">
              <div className="todo-icon-circle call">
                <Phone size={15} />
              </div>
              <div className="todo-info-meta">
                <div className="todo-title">Call</div>
                <div className="todo-subtitle">Diha Glenn</div>
                <div className="todo-time call">08:40 - 10:00 AM</div>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                aria-label="Options"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>

            {/* Task Item 2: Meeting */}
            <div className="todo-item-card meeting">
              <div className="todo-icon-circle meeting">
                <Users size={15} />
              </div>
              <div className="todo-info-meta">
                <div className="todo-title">Meeting</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <div className="avatar-stack">
                    <div className="avatar-stack-item" style={{ width: '20px', height: '20px', fontSize: '9px', background: '#3b82f6' }}>SA</div>
                    <div className="avatar-stack-item" style={{ width: '20px', height: '20px', fontSize: '9px', background: '#10b981' }}>TJ</div>
                    <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '8px', fontWeight: 600 }}>+1</span>
                  </div>
                </div>
                <div className="todo-time meeting">10:00 - 12:20 AM</div>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                aria-label="Options"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>

            {/* Task Item 3: Meeting Project */}
            <div className="todo-item-card project">
              <div className="todo-icon-circle project">
                <Briefcase size={15} />
              </div>
              <div className="todo-info-meta">
                <div className="todo-title">Meeting project</div>
                <div className="todo-subtitle">Chris Newton</div>
                <div className="todo-time project">14:00 - 15:00 AM</div>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                aria-label="Options"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
