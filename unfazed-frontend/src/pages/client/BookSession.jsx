import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

function BookSession() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [therapist, setTherapist] = useState(null);

  const [date, setDate] = useState(getTodayDate());
  const [duration, setDuration] = useState(60);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [loadingTherapist, setLoadingTherapist] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  const [error, setError] = useState("");
  const [slotError, setSlotError] = useState("");
  const [success, setSuccess] = useState("");

  const clientTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";

  function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatSlotTime(dateValue) {
    if (!dateValue) {
      return "";
    }

    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(dateValue));
    } catch (error) {
      return dateValue;
    }
  }

  function formatDateForDisplay(dateValue) {
    if (!dateValue) {
      return "";
    }

    try {
      const selectedDate = new Date(`${dateValue}T00:00:00`);

      return selectedDate.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return dateValue;
    }
  }

  useEffect(() => {
    fetchTherapist();
  }, [slug]);

  useEffect(() => {
    if (therapist) {
      fetchAvailableSlots();
    }
  }, [therapist, date, duration]);

  async function fetchTherapist() {
    try {
      setLoadingTherapist(true);
      setError("");

      const response = await axiosInstance.get(`/therapists/${slug}`);

      if (response.data.success) {
        setTherapist(response.data.therapist);
      } else {
        setError("Therapist profile could not be loaded.");
      }
    } catch (error) {
      console.error("Therapist fetch error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load therapist profile."
      );
    } finally {
      setLoadingTherapist(false);
    }
  }

  async function fetchAvailableSlots() {
    try {
      setLoadingSlots(true);
      setSlotError("");
      setSlots([]);
      setSelectedSlot(null);

      const response = await axiosInstance.get(
        `/scheduling/${slug}/slots`,
        {
          params: {
            date,
            duration,
            timezone: clientTimezone,
          },
        }
      );

      if (response.data.success) {
        setSlots(response.data.slots || []);
      } else {
        setSlotError("No available slots found.");
      }
    } catch (error) {
      console.error("Slot fetch error:", error);

      setSlotError(
        error.response?.data?.message ||
          "Unable to load available slots."
      );
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleBooking(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!clientName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!clientEmail.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!selectedSlot) {
      setError("Please select a time slot.");
      return;
    }

    try {
      setBooking(true);

      const bookingData = {
        date,
        start_at: selectedSlot.start_at,
        duration_minutes: duration,
        client_name: clientName.trim(),
        client_email: clientEmail.trim().toLowerCase(),
        client_timezone: clientTimezone,
      };

      const response = await axiosInstance.post(
        `/scheduling/${slug}/book`,
        bookingData
      );

      if (response.data.success) {
        setSuccess(
          response.data.message || "Session booked successfully."
        );

        setClientName("");
        setClientEmail("");
        setSelectedSlot(null);

        await fetchAvailableSlots();
      } else {
        setError(
          response.data.message || "Unable to book this session."
        );
      }
    } catch (error) {
      console.error("Booking error:", error);

      if (error.response?.status === 409) {
        setError(
          "This slot was just booked by someone else. Please select another slot."
        );

        await fetchAvailableSlots();
      } else {
        setError(
          error.response?.data?.message ||
            "Unable to complete the booking."
        );
      }
    } finally {
      setBooking(false);
    }
  }

  if (loadingTherapist) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <p style={styles.loadingText}>Loading therapist profile...</p>
        </div>
      </div>
    );
  }

  if (error && !therapist) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <h2 style={styles.errorTitle}>Unable to open booking</h2>

          <p style={styles.errorText}>{error}</p>

          <button
            type="button"
            onClick={() => navigate(`/${slug}`)}
            style={styles.secondaryButton}
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button
          type="button"
          onClick={() => navigate(`/${slug}`)}
          style={styles.backButton}
        >
          ← Back to Profile
        </button>

        <div style={styles.headerCard}>
          <div style={styles.avatar}>
            {therapist?.name?.charAt(0)?.toUpperCase() || "T"}
          </div>

          <div>
            <p style={styles.smallLabel}>BOOK A SESSION</p>

            <h1 style={styles.title}>
              Book a session with {therapist?.name}
            </h1>

            <p style={styles.subtitle}>
              Choose a date and available time that works for you.
            </p>
          </div>
        </div>

        {success && (
          <div style={styles.successCard}>
            <div style={styles.successIcon}>✓</div>

            <div>
              <h3 style={styles.successTitle}>Booking confirmed</h3>

              <p style={styles.successText}>{success}</p>

              <p style={styles.successExtra}>
                Your selected slot has been confirmed successfully.
              </p>
            </div>
          </div>
        )}

        {error && therapist && (
          <div style={styles.alertCard}>
            <strong>Booking error:</strong> {error}
          </div>
        )}

        <div style={styles.bookingGrid}>
          <div style={styles.leftColumn}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.cardStep}>STEP 1</p>
                  <h2 style={styles.cardTitle}>Choose date</h2>
                </div>
              </div>

              <input
                type="date"
                value={date}
                min={getTodayDate()}
                onChange={(event) => {
                  setDate(event.target.value);
                  setSuccess("");
                  setError("");
                }}
                style={styles.dateInput}
              />

              <p style={styles.dateInfo}>
                {formatDateForDisplay(date)}
              </p>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.cardStep}>STEP 2</p>
                  <h2 style={styles.cardTitle}>Session duration</h2>
                </div>
              </div>

              <div style={styles.durationGrid}>
                {[30, 45, 60, 90].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => {
                      setDuration(minutes);
                      setSelectedSlot(null);
                      setSuccess("");
                      setError("");
                    }}
                    style={{
                      ...styles.durationButton,
                      ...(duration === minutes
                        ? styles.durationButtonActive
                        : {}),
                    }}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.cardStep}>STEP 3</p>
                  <h2 style={styles.cardTitle}>Choose time</h2>
                </div>

                <span style={styles.timezoneBadge}>
                  {clientTimezone}
                </span>
              </div>

              <p style={styles.timezoneText}>
                Times are shown in your local timezone.
              </p>

              {loadingSlots ? (
                <div style={styles.slotLoading}>
                  Loading available slots...
                </div>
              ) : slotError ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>×</div>

                  <h3 style={styles.emptyTitle}>
                    Unable to load slots
                  </h3>

                  <p style={styles.emptyText}>{slotError}</p>

                  <button
                    type="button"
                    onClick={fetchAvailableSlots}
                    style={styles.retryButton}
                  >
                    Try Again
                  </button>
                </div>
              ) : slots.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>—</div>

                  <h3 style={styles.emptyTitle}>
                    No slots available
                  </h3>

                  <p style={styles.emptyText}>
                    There are no open {duration}-minute sessions for
                    this date. Please try another date.
                  </p>
                </div>
              ) : (
                <div style={styles.slotsGrid}>
                  {slots.map((slot) => {
                    const isSelected =
                      selectedSlot?.start_at === slot.start_at;

                    return (
                      <button
                        key={`${slot.start_at}-${slot.end_at}`}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setSuccess("");
                          setError("");
                        }}
                        style={{
                          ...styles.slotButton,
                          ...(isSelected
                            ? styles.slotButtonActive
                            : {}),
                        }}
                      >
                        {formatSlotTime(slot.start_at)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={styles.rightColumn}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.cardStep}>STEP 4</p>
                  <h2 style={styles.cardTitle}>Your details</h2>
                </div>
              </div>

              <form onSubmit={handleBooking}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name</label>

                  <input
                    type="text"
                    value={clientName}
                    onChange={(event) =>
                      setClientName(event.target.value)
                    }
                    placeholder="Enter your full name"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address</label>

                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(event) =>
                      setClientEmail(event.target.value)
                    }
                    placeholder="Enter your email"
                    style={styles.input}
                  />
                </div>

                <div style={styles.summaryBox}>
                  <p style={styles.summaryHeading}>Booking summary</p>

                  <div style={styles.summaryRow}>
                    <span>Date</span>
                    <strong>{date}</strong>
                  </div>

                  <div style={styles.summaryRow}>
                    <span>Duration</span>
                    <strong>{duration} minutes</strong>
                  </div>

                  <div style={styles.summaryRow}>
                    <span>Timezone</span>
                    <strong>{clientTimezone}</strong>
                  </div>

                  <div style={styles.summaryRow}>
                    <span>Selected time</span>
                    <strong>
                      {selectedSlot
                        ? formatSlotTime(selectedSlot.start_at)
                        : "Not selected"}
                    </strong>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!selectedSlot || booking}
                  style={{
                    ...styles.bookButton,
                    ...((!selectedSlot || booking)
                      ? styles.bookButtonDisabled
                      : {}),
                  }}
                >
                  {booking ? "Confirming..." : "Confirm Booking"}
                </button>

                <p style={styles.disclaimer}>
                  Your booking will be confirmed instantly after the
                  request is successfully completed.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "32px 18px 60px",
    boxSizing: "border-box",
    color: "#172033",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "#4d63d2",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0",
    marginBottom: "20px",
  },

  headerCard: {
    background: "#ffffff",
    border: "1px solid #e3e8f0",
    borderRadius: "20px",
    padding: "28px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 10px 30px rgba(23, 32, 51, 0.06)",
    marginBottom: "20px",
  },

  avatar: {
    width: "62px",
    height: "62px",
    borderRadius: "18px",
    background: "#e9edff",
    color: "#4d63d2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    fontWeight: "700",
    flexShrink: 0,
  },

  smallLabel: {
    margin: "0 0 6px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1.4px",
    color: "#6e7a90",
  },

  title: {
    margin: "0",
    fontSize: "30px",
    lineHeight: "1.2",
    color: "#172033",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#6b7485",
    fontSize: "15px",
  },

  successCard: {
    background: "#edf9f1",
    border: "1px solid #bde4c8",
    borderRadius: "16px",
    padding: "18px",
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "20px",
  },

  successIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#2f9e57",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "800",
    flexShrink: 0,
  },

  successTitle: {
    margin: "0 0 5px",
    color: "#236e3d",
    fontSize: "17px",
  },

  successText: {
    margin: "0",
    color: "#356f49",
    fontSize: "14px",
  },

  successExtra: {
    margin: "7px 0 0",
    color: "#4d795d",
    fontSize: "13px",
  },

  alertCard: {
    background: "#fff2f2",
    border: "1px solid #efc5c5",
    color: "#9d3131",
    borderRadius: "14px",
    padding: "14px 16px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  bookingGrid: {
    display: "grid",
    gridTemplateColumns: "1.45fr 0.95fr",
    gap: "20px",
    alignItems: "start",
  },

  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  rightColumn: {
    position: "sticky",
    top: "20px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e3e8f0",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(23, 32, 51, 0.05)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    marginBottom: "18px",
  },

  cardStep: {
    margin: "0 0 4px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1.2px",
    color: "#718096",
  },

  cardTitle: {
    margin: "0",
    color: "#172033",
    fontSize: "20px",
  },

  dateInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d7deea",
    borderRadius: "12px",
    padding: "13px 14px",
    fontSize: "15px",
    color: "#172033",
    background: "#ffffff",
    outline: "none",
  },

  dateInfo: {
    margin: "10px 0 0",
    fontSize: "13px",
    color: "#6c7688",
  },

  durationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
  },

  durationButton: {
    border: "1px solid #d7deea",
    borderRadius: "11px",
    background: "#ffffff",
    color: "#445066",
    padding: "11px 8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  durationButtonActive: {
    background: "#4d63d2",
    color: "#ffffff",
    border: "1px solid #4d63d2",
  },

  timezoneBadge: {
    background: "#f1f4fb",
    color: "#526077",
    borderRadius: "20px",
    padding: "7px 10px",
    fontSize: "11px",
    fontWeight: "700",
    maxWidth: "180px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  timezoneText: {
    margin: "-8px 0 18px",
    color: "#7b8494",
    fontSize: "13px",
  },

  slotLoading: {
    border: "1px dashed #cdd6e4",
    borderRadius: "13px",
    padding: "28px",
    textAlign: "center",
    color: "#6d778a",
    fontSize: "14px",
  },

  slotsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
  },

  slotButton: {
    border: "1px solid #ccd5e3",
    borderRadius: "11px",
    background: "#ffffff",
    color: "#253149",
    padding: "12px 8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  slotButtonActive: {
    background: "#4d63d2",
    border: "1px solid #4d63d2",
    color: "#ffffff",
  },

  emptyState: {
    border: "1px dashed #cdd6e4",
    borderRadius: "14px",
    padding: "34px 20px",
    textAlign: "center",
  },

  emptyIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "#f0f2f6",
    color: "#778196",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto 12px",
    fontSize: "18px",
    fontWeight: "800",
  },

  emptyTitle: {
    margin: "0 0 7px",
    fontSize: "16px",
    color: "#28344b",
  },

  emptyText: {
    margin: "0 auto",
    maxWidth: "430px",
    fontSize: "13px",
    lineHeight: "1.6",
    color: "#727d90",
  },

  retryButton: {
    marginTop: "16px",
    border: "none",
    background: "#4d63d2",
    color: "#ffffff",
    borderRadius: "9px",
    padding: "10px 15px",
    fontWeight: "600",
    cursor: "pointer",
  },

  formGroup: {
    marginBottom: "16px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#3a4558",
    fontSize: "13px",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d5dce8",
    borderRadius: "11px",
    padding: "12px 13px",
    fontSize: "14px",
    color: "#172033",
    outline: "none",
    background: "#ffffff",
  },

  summaryBox: {
    marginTop: "20px",
    background: "#f7f8fc",
    border: "1px solid #e4e8f0",
    borderRadius: "14px",
    padding: "15px",
  },

  summaryHeading: {
    margin: "0 0 12px",
    fontWeight: "800",
    color: "#253149",
    fontSize: "14px",
  },

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    padding: "9px 0",
    borderBottom: "1px solid #e8ebf1",
    fontSize: "13px",
    color: "#6b7485",
  },

  bookButton: {
    width: "100%",
    border: "none",
    borderRadius: "12px",
    background: "#4d63d2",
    color: "#ffffff",
    padding: "14px",
    marginTop: "18px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },

  bookButtonDisabled: {
    background: "#b8bfd0",
    cursor: "not-allowed",
  },

  disclaimer: {
    margin: "11px 0 0",
    textAlign: "center",
    color: "#7a8495",
    fontSize: "11px",
    lineHeight: "1.5",
  },

  loadingCard: {
    maxWidth: "500px",
    margin: "80px auto",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "35px",
    textAlign: "center",
    border: "1px solid #e3e8f0",
  },

  loadingText: {
    margin: "0",
    color: "#667085",
  },

  errorCard: {
    maxWidth: "520px",
    margin: "80px auto",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "35px",
    textAlign: "center",
    border: "1px solid #e3e8f0",
    boxShadow: "0 10px 30px rgba(23, 32, 51, 0.06)",
  },

  errorTitle: {
    margin: "0 0 8px",
    color: "#263249",
  },

  errorText: {
    margin: "0 0 20px",
    color: "#70798b",
  },

  secondaryButton: {
    border: "none",
    borderRadius: "10px",
    background: "#4d63d2",
    color: "#ffffff",
    padding: "11px 17px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default BookSession;