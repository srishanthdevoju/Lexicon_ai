import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "@/lib/LanguageContext";
import { supabase } from "@/lib/supabase";
import { getAppointments, createAppointment, updateAppointment, getLawyers, createPaymentOrder, verifyPayment } from "@/lib/api";
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
  Video,
  CreditCard
} from "lucide-react";

export default function AppointmentsPage() {
  const { user, userRole } = useAuth();
  const { t, lang } = useTranslation();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [payingId, setPayingId] = useState(null);
  
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
      const { data, error } = await supabase
        .from("lawyers")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      setLawyers(data || []);
    } catch (err) {
      console.error("Failed to fetch lawyers list via Supabase, trying backend API...", err);
      try {
        const data = await getLawyers();
        setLawyers(data || []);
      } catch (backendErr) {
        console.error("Failed to fetch lawyers list via backend API:", backendErr);
      }
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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (appt) => {
    setPayingId(appt.id);
    setError("");
    setSuccess("");
    
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setError("Failed to load payment processor. Please check your internet connection.");
        setPayingId(null);
        return;
      }
      
      const orderData = await createPaymentOrder(appt.id);
      
      if (orderData.status === "paid") {
        setSuccess("This consultation has already been paid.");
        fetchAppointments();
        setPayingId(null);
        return;
      }
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || import.meta.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_T3kbOWjN6XNT4w",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Lexicon AI",
        description: `Consultation Fee — ${appt.title}`,
        order_id: orderData.order_id,
        handler: async function (response) {
          setPayingId(appt.id);
          try {
            const verifyRes = await verifyPayment({
              appointment_id: appt.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            if (verifyRes.success) {
              setSuccess("Payment successful! Consultation fee paid.");
              fetchAppointments();
              setTimeout(() => setSuccess(""), 4000);
            } else {
              setError("Payment verification failed.");
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            setError("Payment verification failed. Please contact support.");
          } finally {
            setPayingId(null);
          }
        },
        prefill: {
          name: user?.name || user?.email?.split('@')[0] || "",
          email: user?.email || ""
        },
        theme: {
          color: "#0F172A"
        },
        modal: {
          ondismiss: function () {
            setPayingId(null);
          }
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Initiating payment failed:", err);
      setError(err.response?.data?.detail || "Failed to initiate payment. Please try again.");
      setPayingId(null);
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
    t("january", "appointments"),
    t("february", "appointments"),
    t("march", "appointments"),
    t("april", "appointments"),
    t("may", "appointments"),
    t("june", "appointments"),
    t("july", "appointments"),
    t("august", "appointments"),
    t("september", "appointments"),
    t("october", "appointments"),
    t("november", "appointments"),
    t("december", "appointments")
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

  const getFormattedDateStr = (day) => {
    const mm = String(calendarMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${calendarYear}-${mm}-${dd}`;
  };

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
              {userRole === "client" ? t("schedulingTitle", "appointments") : t("lawyerTitle", "appointments")}
            </h1>
            <p className="text-[13px] text-text-secondary">
              {userRole === "client" 
                ? t("schedulingSub", "appointments") 
                : t("lawyerSub", "appointments")}
            </p>
          </div>
          {userRole === "client" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded hover:bg-primary-light transition-colors shadow-xs shrink-0 self-start sm:self-center cursor-pointer"
            >
              {showForm ? <ChevronRight className="w-4 h-4 rotate-90" /> : <Plus className="w-4 h-4" />}
              <span>{showForm ? t("cancelScheduling", "appointments") : t("scheduleConsultation", "appointments")}</span>
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
          
          {/* LEFT COLUMN: Sidebar (Calendar & Client Forms) */}
          <div className={userRole === "client" ? "lg:col-span-5 space-y-6" : "lg:col-span-4 space-y-6"}>

            {/* SHARED VISUAL CALENDAR */}
            <div className="bg-white border border-border rounded-lg p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[13px] text-primary">
                  {monthNames[calendarMonth]} {calendarYear}
                </h3>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-slate-100 rounded border border-border text-text-secondary transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-slate-100 rounded border border-border text-text-secondary transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-text-secondary uppercase mb-2">
                <span>{t("sun", "appointments")}</span>
                <span>{t("mon", "appointments")}</span>
                <span>{t("tue", "appointments")}</span>
                <span>{t("wed", "appointments")}</span>
                <span>{t("thu", "appointments")}</span>
                <span>{t("fri", "appointments")}</span>
                <span>{t("sat", "appointments")}</span>
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
                      className={`h-8 w-full rounded flex flex-col items-center justify-center text-[11px] font-semibold relative transition-all cursor-pointer ${cellStyle}`}
                    >
                      <span>{day}</span>
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
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t("legendUpcoming", "appointments")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {t("legendCompleted", "appointments")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-risk-red"></span> {t("legendCancelled", "appointments")}
                </span>
              </div>
            </div>

            {/* CLIENT VIEW: Schedule Request Form */}
            {userRole === "client" && showForm && (
              <form onSubmit={handleScheduleSubmit} className="bg-white border border-border rounded-lg p-5 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="border-b border-border pb-2">
                  <h3 className="font-bold text-[13px] text-primary">{t("requestConsultation", "appointments")}</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">{t("selectCounsel", "appointments")}</label>
                  <select
                    value={selectedLawyerId}
                    onChange={(e) => setSelectedLawyerId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded text-[13px] bg-background focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="">{t("anyAvailable", "appointments")}</option>
                    {lawyers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} {l.specialty ? `(${l.specialty})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">{t("topic", "appointments")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("topicPlaceholder", "appointments")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded text-[13px] bg-background focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">{t("description", "appointments")}</label>
                  <textarea
                    placeholder={t("descriptionPlaceholder", "appointments")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded text-[13px] bg-background focus:outline-none focus:border-primary resize-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase">{t("selectDate", "appointments")}</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded text-[13px] bg-white focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase">{t("selectTime", "appointments")}</label>
                    <select
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded text-[13px] bg-white focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="">{t("chooseTime", "appointments")}</option>
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
                    {t("sharePhone", "appointments")}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 bg-primary hover:bg-primary-light text-white text-[12px] font-semibold rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t("submitting", "appointments")}</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>{t("submitRequest", "appointments")}</span>
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
                  <span>{t("showingConsultationsOn", "appointments")} <strong className="text-primary">{selectedDateStr}</strong></span>
                </span>
                <button 
                  onClick={() => setSelectedDateStr("")}
                  className="text-primary hover:text-primary-light font-semibold hover:underline cursor-pointer"
                >
                  {t("clearFilter", "appointments")}
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center bg-white border border-border rounded-lg shadow-xs">
                <RefreshCw className="w-6 h-6 text-primary animate-spin mb-2" />
                <span className="text-xs text-text-secondary">{t("loading", "common")}</span>
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center bg-white border border-border rounded-lg text-center shadow-xs">
                <Calendar className="w-10 h-10 text-text-muted mb-3" />
                <h3 className="font-semibold text-[14px] text-primary">{t("noConsultations", "appointments")}</h3>
                <p className="text-[12px] text-text-secondary mt-1 max-w-sm leading-relaxed">
                  {userRole === "client"
                    ? t("noConsultationsDescClient", "appointments")
                    : t("noConsultationsDescLawyer", "appointments")}
                </p>
                {userRole === "client" && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 px-4 py-2 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors cursor-pointer"
                  >
                    {t("scheduleConsultation", "appointments")}
                  </button>
                )}
              </div>
            ) : upcomingAppointments.length === 0 && pastAppointments.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center bg-white border border-border rounded-lg text-center shadow-xs">
                <Calendar className="w-8 h-8 text-text-muted mb-2" />
                <h3 className="font-semibold text-xs text-primary">{t("noConsultations", "appointments")}</h3>
                <p className="text-[11px] text-text-secondary mt-1 max-w-xs leading-relaxed">
                  {t("noConsultationsScheduledOnDate", "appointments")}
                </p>
                <button 
                  onClick={() => setSelectedDateStr("")}
                  className="mt-3 px-3 py-1.5 bg-primary-100 hover:bg-primary-200 text-primary text-xs font-semibold rounded transition-colors cursor-pointer"
                >
                  {t("showAllDates", "appointments")}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* UPCOMING APPOINTMENTS */}
                {upcomingAppointments.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{t("upcomingTitle", "appointments")}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {upcomingAppointments.map((appt) => {
                        const isAccepted = appt.status === "accepted";
                        const isScheduled = appt.status === "scheduled";
                        const isPaid = appt.payment_status === "paid";

                        const borderColor = isAccepted ? "border-l-blue-500" : "border-l-emerald-500";
                        const statusBg = isAccepted 
                          ? "bg-blue-50 text-blue-700 border-blue-100" 
                          : "bg-emerald-50 text-emerald-700 border-emerald-100";

                        const statusText = isAccepted 
                          ? t("accepted", "appointments") 
                          : t("scheduled", "appointments");

                        const paymentStatusText = isPaid
                          ? t("paid", "appointments")
                          : appt.payment_status === "failed"
                            ? t("paymentFailed", "appointments")
                            : t("paymentPending", "appointments");

                        return (
                        <div key={appt.id} className={`bg-white border border-border rounded-lg p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all border-l-4 ${borderColor} relative`}>
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-[13px] text-primary leading-tight">{appt.title}</h4>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className={`px-2 py-0.5 text-[9px] font-bold border rounded uppercase tracking-wider ${statusBg}`}>
                                  {statusText}
                                </span>
                                <span className={`px-2 py-0.5 text-[8px] font-bold border rounded uppercase tracking-wider ${
                                  isPaid 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                    : appt.payment_status === "failed" 
                                      ? "bg-risk-red-light text-risk-red border-risk-red/10" 
                                      : "bg-amber-50 text-amber-700 border-amber-100"
                                }`}>
                                  {paymentStatusText}
                                </span>
                              </div>
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
                                    <>{t("counselLabel", "appointments")}: <span className="font-medium text-primary">{appt.lawyer_name || "Assigned Counsel"}</span></>
                                  ) : (
                                    <>{t("clientLabel", "appointments")}: <span className="font-medium text-primary">{appt.client_name || "Client"}</span></>
                                  )}
                                </span>
                              </div>

                              {/* Phone Numbers Exchange */}
                              {userRole === "client" && appt.lawyer_phone && (
                                <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                                  <span className="font-semibold text-primary">{t("counselPhone", "appointments")}:</span>
                                  <a href={`tel:${appt.lawyer_phone}`} className="text-blue-600 hover:underline">{appt.lawyer_phone}</a>
                                </div>
                              )}
                              {userRole === "lawyer" && appt.client_phone && (
                                <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                                  <span className="font-semibold text-primary">{t("clientPhone", "appointments")}:</span>
                                  <a href={`tel:${appt.client_phone}`} className="text-blue-600 hover:underline">{appt.client_phone}</a>
                                </div>
                              )}
                              {userRole === "lawyer" && isAccepted && !appt.client_phone && (
                                <div className="flex items-center gap-1.5 text-[11px] text-text-muted italic">
                                  <span>{t("noPhoneShared", "appointments")}</span>
                                </div>
                              )}

                              {/* Chat status indicator */}
                              <div className="pt-1.5">
                                <span className={`px-2 py-0.5 text-[9px] font-bold border rounded uppercase tracking-wider ${
                                  isAccepted && isPaid
                                    ? "bg-blue-50 text-blue-700 border-blue-100" 
                                    : "bg-amber-50 text-amber-700 border-amber-100"
                                }`}>
                                  {isAccepted && isPaid 
                                    ? t("chatUnlocked", "appointments") 
                                    : isAccepted && !isPaid 
                                      ? t("chatLockedPay", "appointments") 
                                      : t("chatLocked", "appointments")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action panel — state-based buttons */}
                          <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center justify-end gap-2">
                            
                            {/* ACCEPTED state: Show payment button first if unpaid, or Virtual Meeting if paid */}
                            {isAccepted && (
                              <>
                                {/* CLIENT UPFRONT PAYMENT BUTTON FIRST */}
                                {userRole === "client" && !isPaid && (
                                  <button
                                    onClick={() => handlePayment(appt)}
                                    disabled={payingId === appt.id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>{payingId === appt.id ? t("processing", "common") : `${t("payConsultationFee", "appointments")} (₹${appt.consultation_fee || 500})`}</span>
                                  </button>
                                )}

                                {/* VIRTUAL MEETING BUTTON LINK (Unlocked when paid or for lawyer) */}
                                {(isPaid || userRole === "lawyer") ? (
                                  <a 
                                    href={appt.meeting_link || `https://meet.jit.si/lexicon-meeting-${appt.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 border border-blue-700 rounded text-[11px] text-white font-semibold transition-colors shadow-xs"
                                  >
                                    <Video className="w-3 h-3" />
                                    <span>{t("virtualMeeting", "appointments")}</span>
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-amber-600 font-semibold italic flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{t("payToUnlockMeeting", "appointments")}</span>
                                  </span>
                                )}

                                {userRole === "lawyer" && (
                                  <button
                                    onClick={() => handleStatusUpdate(appt.id, "completed")}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{t("complete", "appointments")}</span>
                                  </button>
                                )}
                              </>
                            )}

                            {/* SCHEDULED state (Lawyer): Accept + Decline */}
                            {isScheduled && userRole === "lawyer" && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(appt.id, "accepted")}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-light text-white rounded text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{t("accept", "appointments")}</span>
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(appt.id, "cancelled")}
                                  className="flex items-center gap-1 px-2.5 py-1.5 border border-border text-text-secondary hover:text-risk-red hover:bg-risk-red-light/20 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>{t("decline", "appointments")}</span>
                                </button>
                              </>
                            )}

                            {/* SCHEDULED state (Client): just Cancel */}
                            {isScheduled && userRole === "client" && (
                              <>
                                <span className="text-[10px] text-amber-600 font-medium italic">{t("awaitingAcceptance", "appointments")}</span>

                                <button
                                  onClick={() => handleStatusUpdate(appt.id, "cancelled")}
                                  className="flex items-center gap-1 px-2.5 py-1.5 border border-border text-text-secondary hover:text-risk-red hover:bg-risk-red-light/20 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>{t("cancel", "common")}</span>
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

                {/* PAST / HISTORICAL APPOINTMENTS */}
                {pastAppointments.length > 0 && (
                  <div className="space-y-3 pt-3">
                    <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">{t("historyTitle", "appointments")}</h3>
                    <div className="bg-white border border-border rounded-lg overflow-hidden shadow-xs">
                      <div className="divide-y divide-border">
                        {pastAppointments.map((appt) => {
                          const isCompleted = appt.status === "completed";
                          const isCancelled = appt.status === "cancelled";
                          const isPaid = appt.payment_status === "paid";

                          const statusStyle = isCompleted
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : isCancelled
                              ? "bg-risk-red-light text-risk-red border-risk-red/10"
                              : "bg-slate-50 text-text-secondary border-border";

                          const statusText = isCompleted
                            ? t("completedStatus", "appointments")
                            : isCancelled
                              ? t("cancelledStatus", "appointments")
                              : appt.status;

                          return (
                            <div key={appt.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-[13px] text-primary truncate">{appt.title}</h4>
                                  <span className={`px-2 py-0.5 text-[8px] font-bold rounded border uppercase tracking-wider shrink-0 ${statusStyle}`}>
                                    {statusText}
                                  </span>
                                  <span className={`px-2 py-0.5 text-[8px] font-bold rounded border uppercase tracking-wider shrink-0 ${
                                    isPaid
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border-amber-100"
                                  }`}>
                                    {isPaid ? t("paid", "appointments") : t("unpaid", "appointments")}
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
                              {/* Payment Button for completed unpaid consultations fallback */}
                              {isCompleted && userRole === "client" && !isPaid && (
                                <div className="shrink-0 self-start md:self-center">
                                  <button
                                    onClick={() => handlePayment(appt)}
                                    disabled={payingId === appt.id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>{payingId === appt.id ? t("processing", "common") : `${t("payConsultationFee", "appointments")} (₹${appt.consultation_fee || 500})`}</span>
                                  </button>
                                </div>
                              )}
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
