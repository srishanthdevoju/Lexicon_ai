import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { getAppointments, createAppointment, updateAppointment, getLawyers } from "@/lib/api";
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  Plus,
  RefreshCw,
  Video
} from "lucide-react";

export default function AppointmentsPage() {
  const { user, userRole } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Client specific states
  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyerId, setSelectedLawyerId] = useState("");
  const [loadingLawyers, setLoadingLawyers] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Time slot and phone sharing options
  const [slots, setSlots] = useState([]);
  const [sharePhone, setSharePhone] = useState(false);

  useEffect(() => {
    if (selectedLawyerId) {
      const selectedLawyer = lawyers.find(l => l.id === selectedLawyerId);
      if (selectedLawyer && selectedLawyer.available_slots) {
        setSlots(selectedLawyer.available_slots.split(",").map(s => s.trim()));
      } else {
        setSlots(["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]);
      }
    } else {
      setSlots(["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]);
    }
    setTime("");
  }, [selectedLawyerId, lawyers]);

  // Calendar visual states
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAppointments();
      setAppointments(data || []);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      setError("Failed to load consultations list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLawyersData = async () => {
    if (userRole !== "client") return;
    setLoadingLawyers(true);
    try {
      const data = await getLawyers();
      setLawyers(data || []);
    } catch (err) {
      console.error("Failed to fetch lawyers list:", err);
    } finally {
      setLoadingLawyers(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchLawyersData();
  }, [userRole]);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await createAppointment({
        lawyer_id: selectedLawyerId || null,
        title,
        description,
        appointment_date: date,
        appointment_time: time,
        share_phone_with_lawyer: sharePhone
      });
      setSuccess("Consultation requested! Confirmation emails have been logged to both client and lawyer.");
      setTitle("");
      setDescription("");
      setDate("");
      setTime("");
      setSelectedLawyerId("");
      setSharePhone(false);
      setShowForm(false);
      fetchAppointments();
    } catch (err) {
      console.error("Failed to schedule appointment:", err);
      setError(err.response?.data?.detail || "Failed to schedule appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    if (newStatus !== "accepted") {
      const actionText = newStatus === "completed" ? "complete" : "cancel";
      if (!window.confirm(`Are you sure you want to ${actionText} this consultation?`)) return;
    }

    try {
      await updateAppointment(appointmentId, newStatus);
      const label = newStatus === "accepted" ? "Accepted! Meeting link generated." : `Consultation marked as ${newStatus}.`;
      setSuccess(label);
      fetchAppointments();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Failed to update status:", err);
      setError("Failed to update consultation status.");
    }
  };

  // Group appointments into upcoming and past
  const now = new Date();
  const getApptDateTime = (appt) => new Date(`${appt.appointment_date}T${appt.appointment_time}`);
  
  const upcomingAppointments = appointments.filter(a => {
    if (a.status !== "scheduled" && a.status !== "accepted") return false;
    if (selectedDateStr && a.appointment_date !== selectedDateStr) return false;
    return getApptDateTime(a) >= now;
  });

  const pastAppointments = appointments.filter(a => {
    if (selectedDateStr && a.appointment_date !== selectedDateStr) return false;
    return a.status === "completed" || a.status === "cancelled" || getApptDateTime(a) < now;
  });

  // Calendar utilities
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(prev => prev - 1);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(prev => prev + 1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  };

  const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
  const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);

  // Format a day number into "YYYY-MM-DD" for the current calendar month/year
  const getFormattedDateStr = (day) => {
    const mm = String(calendarMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${calendarYear}-${mm}-${dd}`;
  };

  // Return appointments that fall on a given date string
  const getAppointmentsForDate = (dateStr) =>
    appointments.filter((a) => a.appointment_date === dateStr);

  const daysGrid = [];
  for (let i = 0; i < firstDay; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(d);
  }

  return (
    <Shell>
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              {userRole === "client" ? "Consultation Scheduling" : "Client Consultations"}
            </h1>
            <p className="text-[13px] text-text-secondary">
              {userRole === "client" 
                ? "Schedule and manage video or legal advisory calls with your assigned counsel." 
                : "Manage client consultation requests, advisory sessions, and status updates."}
            </p>
          </div>
          {userRole === "client" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded hover:bg-primary-light transition-colors shadow-xs shrink-0 self-start sm:self-center"
            >
              {showForm ? <ChevronRight className="w-4 h-4 rotate-90" /> : <Plus className="w-4 h-4" />}
              <span>{showForm ? "Cancel Scheduling" : "Schedule Consultation"}</span>
            </button>
          )}
        </div>

        {/* Info alerts */}
        {success && (
          <div className="p-3 bg-risk-green-light border border-risk-green/20 rounded-md flex items-center gap-2 text-[12px] text-risk-green">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="p-3 bg-risk-red-light border border-risk-red/20 rounded-md flex items-center gap-2 text-[12px] text-risk-red">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Sidebar (Calendar & Client Info/Forms) */}
          <div className={userRole === "client" ? "lg:col-span-5 space-y-6" : "lg:col-span-4 space-y-6"}>

            {/* SHARED VISUAL CALENDAR: Calendar Month picker & indicators */}
            <div className="bg-white border border-border rounded-lg p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[13px] text-primary">
                  {monthNames[calendarMonth]} {calendarYear}
                </h3>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-slate-100 rounded border border-border text-text-secondary transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-slate-100 rounded border border-border text-text-secondary transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-text-secondary uppercase mb-2">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {daysGrid.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-8"></div>;
                  }

                  const dateStr = getFormattedDateStr(day);
                  const dayAppts = getAppointmentsForDate(dateStr);
                  const isSelected = dateStr === selectedDateStr;
                  
                  const todayObj = new Date();
                  const isToday = todayObj.getDate() === day && 
                                  todayObj.getMonth() === calendarMonth && 
                                  todayObj.getFullYear() === calendarYear;
                                  
                  const hasScheduled = dayAppts.some(a => a.status === "scheduled");
                  const hasCompleted = dayAppts.some(a => a.status === "completed");
                  const hasCancelled = dayAppts.some(a => a.status === "cancelled");

                  let cellStyle = "bg-slate-50 text-text-primary hover:bg-slate-100";
                  if (isSelected) {
                    cellStyle = "bg-primary text-white hover:bg-primary-light";
                  } else if (isToday) {
                    cellStyle = "bg-white border-2 border-primary text-primary font-bold";
                  }

                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() => setSelectedDateStr(isSelected ? "" : dateStr)}
                      className={`h-8 w-full rounded flex flex-col items-center justify-center text-[11px] font-semibold relative transition-all ${cellStyle}`}
                    >
                      <span>{day}</span>
                      {/* Indicators Container */}
                      <div className="absolute bottom-0.5 flex gap-0.5">
                        {hasScheduled && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500 animate-pulse'}`}></span>
                        )}
                        {hasCompleted && !hasScheduled && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></span>
                        )}
                        {hasCancelled && !hasScheduled && !hasCompleted && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-risk-red'}`}></span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[9px] text-text-secondary">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Upcoming
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Completed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-risk-red"></span> Cancelled
                </span>
              </div>
            </div>

            {/* CLIENT VIEW: Schedule Request Form */}
            {userRole === "client" && showForm && (
              <form onSubmit={handleScheduleSubmit} className="bg-white border border-border rounded-lg p-5 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="border-b border-border pb-2">
                  <h3 className="font-bold text-[13px] text-primary">Request Consultation</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Select Counsel</label>
                  <select
                    value={selectedLawyerId}
                    onChange={(e) => setSelectedLawyerId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded text-[13px] bg-background focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="">Any Available Lawyer (Auto-assign)</option>
                    {lawyers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} {l.specialty ? `(${l.specialty})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Consultation Topic</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Agreement Auditing, Clause Redrafting"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded text-[13px] bg-background focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Brief Description / Notes</label>
                  <textarea
                    placeholder="Add details, document questions, or issues you wish to discuss."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded text-[13px] bg-background focus:outline-none focus:border-primary resize-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase">Select Date</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded text-[13px] bg-white focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase">Select Time Slot</label>
                    <select
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded text-[13px] bg-white focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="">Choose time slot...</option>
                      {slots.map((s, idx) => (
                        <option key={idx} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1.5 text-[12px] text-text-secondary">
                  <input
                    type="checkbox"
                    id="sharePhone"
                    checked={sharePhone}
                    onChange={(e) => setSharePhone(e.target.checked)}
                    className="w-3.5 h-3.5 border-border rounded text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <label htmlFor="sharePhone" className="cursor-pointer font-medium leading-tight">
                    Share my phone number with this lawyer once they accept my request
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 bg-primary hover:bg-primary-light text-white text-[12px] font-semibold rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Submit Schedule Request</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* RIGHT COLUMN: Consultation Feeds */}
          <div className={userRole === "client" ? "lg:col-span-7 space-y-6" : "lg:col-span-8 space-y-6"}>
            
            {/* Active Calendar Date Filter Status Banner */}
            {selectedDateStr && (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-border rounded-lg text-xs text-text-secondary animate-in slide-in-from-top-1 duration-200">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Showing consultations on <strong className="text-primary">{selectedDateStr}</strong></span>
                </span>
                <button 
                  onClick={() => setSelectedDateStr("")}
                  className="text-primary hover:text-primary-light font-semibold hover:underline"
                >
                  Clear Filter
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center bg-white border border-border rounded-lg shadow-xs">
                <RefreshCw className="w-6 h-6 text-primary animate-spin mb-2" />
                <span className="text-xs text-text-secondary">Fetching consultations schedule...</span>
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center bg-white border border-border rounded-lg text-center shadow-xs">
                <Calendar className="w-10 h-10 text-text-muted mb-3" />
                <h3 className="font-semibold text-[14px] text-primary">No Consultations Found</h3>
                <p className="text-[12px] text-text-secondary mt-1 max-w-sm leading-relaxed">
                  {userRole === "client"
                    ? "You haven't scheduled any advisory consultations yet. Click the button above to request one with your lawyer."
                    : "No consultation requests have been submitted by clients yet."}
                </p>
                {userRole === "client" && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 px-4 py-2 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors"
                  >
                    Schedule Consultation
                  </button>
                )}
              </div>
            ) : upcomingAppointments.length === 0 && pastAppointments.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center bg-white border border-border rounded-lg text-center shadow-xs">
                <Calendar className="w-8 h-8 text-text-muted mb-2" />
                <h3 className="font-semibold text-xs text-primary">No Consultations Scheduled</h3>
                <p className="text-[11px] text-text-secondary mt-1 max-w-xs leading-relaxed">
                  There are no consultations scheduled for {selectedDateStr}. Click the "Clear Filter" button to see your entire history.
                </p>
                <button 
                  onClick={() => setSelectedDateStr("")}
                  className="mt-3 px-3 py-1.5 bg-primary-100 hover:bg-primary-200 text-primary text-xs font-semibold rounded transition-colors"
                >
                  Show All Dates
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* UPCOMING APPOINTMENTS */}
                {upcomingAppointments.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Upcoming Matched Consultations</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {upcomingAppointments.map((appt) => {
                        const isAccepted = appt.status === "accepted";
                        const isScheduled = appt.status === "scheduled";
                        const borderColor = isAccepted ? "border-l-blue-500" : "border-l-emerald-500";
                        const statusBg = isAccepted 
                          ? "bg-blue-50 text-blue-700 border-blue-100" 
                          : "bg-emerald-50 text-emerald-700 border-emerald-100";

                        return (
                        <div key={appt.id} className={`bg-white border border-border rounded-lg p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all border-l-4 ${borderColor} relative`}>
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-[13px] text-primary leading-tight">{appt.title}</h4>
                              <span className={`px-2 py-0.5 text-[9px] font-bold border rounded uppercase tracking-wider shrink-0 ${statusBg}`}>
                                {appt.status}
                              </span>
                            </div>
                            
                            {appt.description && (
                              <p className="text-[11.5px] text-text-secondary leading-relaxed bg-slate-50 p-2.5 rounded border border-border/40">
                                {appt.description}
                              </p>
                            )}

                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                                <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                <span className="font-medium text-primary">{appt.appointment_date}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                                <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                <span className="font-medium text-primary">{appt.appointment_time}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                                <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                <span>
                                  {userRole === "client" ? (
                                    <>Counsel: <span className="font-medium text-primary">{appt.lawyer_name || "Assigned Counsel"}</span></>
                                  ) : (
                                    <>Client: <span className="font-medium text-primary">{appt.client_name || "Client"}</span></>
                                  )}
                                </span>
                              </div>

                              {/* Phone Numbers Exchange */}
                              {userRole === "client" && appt.lawyer_phone && (
                                <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                                  <span className="font-semibold text-primary">Counsel Phone:</span>
                                  <a href={`tel:${appt.lawyer_phone}`} className="text-blue-600 hover:underline">{appt.lawyer_phone}</a>
                                </div>
                              )}
                              {userRole === "lawyer" && appt.client_phone && (
                                <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                                  <span className="font-semibold text-primary">Client Phone:</span>
                                  <a href={`tel:${appt.client_phone}`} className="text-blue-600 hover:underline">{appt.client_phone}</a>
                                </div>
                              )}
                              {userRole === "lawyer" && isAccepted && !appt.client_phone && (
                                <div className="flex items-center gap-1.5 text-[11px] text-text-muted italic">
                                  <span>Client opted not to share phone number</span>
                                </div>
                              )}

                              {/* Chat status indicator */}
                              <div className="pt-1.5">
                                <span className={`px-2 py-0.5 text-[9px] font-bold border rounded uppercase tracking-wider ${
                                  isAccepted 
                                    ? "bg-blue-50 text-blue-700 border-blue-100" 
                                    : "bg-amber-50 text-amber-700 border-amber-100"
                                }`}>
                                  {isAccepted ? "Chat unlocked" : "Chat locked until accepted"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action panel — state-based buttons */}
                          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-end gap-2">
                            
                            {/* ACCEPTED state: Show meeting link + Complete button */}
                            {isAccepted && (
                              <>
                                <a 
                                  href={appt.meeting_link || `https://meet.jit.si/lexicon-meeting-${appt.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 border border-blue-700 rounded text-[11px] text-white font-semibold transition-colors shadow-xs"
                                >
                                  <Video className="w-3 h-3" />
                                  <span>Virtual Meeting</span>
                                </a>

                                {userRole === "lawyer" && (
                                  <button
                                    onClick={() => handleStatusUpdate(appt.id, "completed")}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors shadow-xs"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Complete</span>
                                  </button>
                                )}
                              </>
                            )}

                            {/* SCHEDULED state (Lawyer): Accept + Cancel */}
                            {isScheduled && userRole === "lawyer" && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(appt.id, "accepted")}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-light text-white rounded text-[11px] font-semibold transition-colors shadow-xs"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(appt.id, "cancelled")}
                                  className="flex items-center gap-1 px-2.5 py-1.5 border border-border text-text-secondary hover:text-risk-red hover:bg-risk-red-light/20 rounded text-[11px] font-semibold transition-colors"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Decline</span>
                                </button>
                              </>
                            )}

                            {/* SCHEDULED state (Client): just Cancel */}
                            {isScheduled && userRole === "client" && (
                              <>
                                <span className="text-[10px] text-amber-600 font-medium italic">Awaiting counsel's acceptance</span>
                                <button
                                  onClick={() => handleStatusUpdate(appt.id, "cancelled")}
                                  className="flex items-center gap-1 px-2.5 py-1.5 border border-border text-text-secondary hover:text-risk-red hover:bg-risk-red-light/20 rounded text-[11px] font-semibold transition-colors"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Cancel</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  </div>
                )}

                {/* PAST / OTHER APPOINTMENTS */}
                {pastAppointments.length > 0 && (
                  <div className="space-y-3 pt-3">
                    <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Historical Advisory Log</h3>
                    <div className="bg-white border border-border rounded-lg overflow-hidden shadow-xs">
                      <div className="divide-y divide-border">
                        {pastAppointments.map((appt) => {
                          const isCompleted = appt.status === "completed";
                          const isCancelled = appt.status === "cancelled";
                          const statusStyle = isCompleted
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : isCancelled
                              ? "bg-risk-red-light text-risk-red border-risk-red/10"
                              : "bg-slate-50 text-text-secondary border-border";

                          return (
                            <div key={appt.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-[13px] text-primary truncate">{appt.title}</h4>
                                  <span className={`px-2 py-0.5 text-[8px] font-bold rounded border uppercase tracking-wider shrink-0 ${statusStyle}`}>
                                    {appt.status}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-secondary">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-text-muted" />
                                    {appt.appointment_date}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-text-muted" />
                                    {appt.appointment_time}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3 text-text-muted" />
                                    {userRole === "client" ? appt.lawyer_name : appt.client_name}
                                  </span>
                                </div>
                                {appt.description && (
                                  <p className="text-[11px] text-text-secondary line-clamp-1 italic">
                                    Notes: {appt.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>
    </Shell>
  );
}
