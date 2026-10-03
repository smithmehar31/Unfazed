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
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "Asia/Kolkata";

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatSlotTime(value) {
    if (!value) return "";

    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(value));
  }

  function formatDate(value) {
    if (!value) return "";

    return new Date(`${value}T00:00:00`).toLocaleDateString(
      undefined,
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
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

      const response = await axiosInstance.get(
        `/therapists/${slug}`
      );

      if (response.data.success) {
        setTherapist(response.data.therapist);
      } else {
        setError("Therapist profile could not be loaded.");
      }
    } catch (error) {
      console.error(error);

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
      console.error(error);

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

      const response = await axiosInstance.post(
        `/scheduling/${slug}/book`,
        {
          date,
          start_at: selectedSlot.start_at,
          duration_minutes: duration,
          client_name: clientName.trim(),
          client_email: clientEmail.trim().toLowerCase(),
          client_timezone: clientTimezone,
        }
      );

      if (response.data.success) {
        setSuccess(
          response.data.message ||
            "Session booked successfully."
        );

        setClientName("");
        setClientEmail("");
        setSelectedSlot(null);

        await fetchAvailableSlots();
      } else {
        setError(
          response.data.message ||
            "Unable to book this session."
        );
      }
    } catch (error) {
      console.error(error);

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
      <>
        <style>{css}</style>

        <div className="booking-page">
          <div className="state-card">
            <div className="state-icon">U</div>
            <h2>Loading booking</h2>
            <p>Preparing therapist information...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !therapist) {
    return (
      <>
        <style>{css}</style>

        <div className="booking-page">
          <div className="state-card">
            <div className="error-icon">!</div>
            <h2>Unable to open booking</h2>
            <p>{error}</p>

            <button
              className="primary-btn"
              onClick={() => navigate(`/${slug}`)}
            >
              Back to Profile
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>

      <div className="booking-page">
        <div className="booking-shell">
          <button
            className="back-link"
            onClick={() => navigate(`/${slug}`)}
          >
            ← Back to profile
          </button>

          <header className="booking-hero">
            <div className="avatar">
              {therapist?.name?.charAt(0)?.toUpperCase() || "T"}
            </div>

            <div>
              <div className="eyebrow">BOOK A SESSION</div>
              <h1>
                Book a session with {therapist?.name}
              </h1>
              <p>
                Choose a date, session length and available time.
              </p>
            </div>
          </header>

          {success && (
            <div className="notice success">
              <strong>Booking confirmed</strong>
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="notice error">
              <strong>Booking issue</strong>
              <span>{error}</span>
            </div>
          )}

          <div className="booking-layout">
            <main className="main-column">
              <section className="card">
                <div className="card-head">
                  <div className="step">01</div>
                  <div>
                    <div className="eyebrow">DATE</div>
                    <h2>Choose a date</h2>
                    <p>
                      Pick a day that works for your session.
                    </p>
                  </div>
                </div>

                <input
                  className="date-input"
                  type="date"
                  value={date}
                  min={getTodayDate()}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setError("");
                    setSuccess("");
                  }}
                />

                <div className="selected-date">
                  {formatDate(date)}
                </div>
              </section>

              <section className="card">
                <div className="card-head">
                  <div className="step">02</div>
                  <div>
                    <div className="eyebrow">DURATION</div>
                    <h2>Choose session length</h2>
                    <p>
                      Select the duration you prefer.
                    </p>
                  </div>
                </div>

                <div className="duration-grid">
                  {[30, 45, 60, 90].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      className={`duration-btn ${
                        duration === minutes ? "active" : ""
                      }`}
                      onClick={() => {
                        setDuration(minutes);
                        setSelectedSlot(null);
                        setError("");
                        setSuccess("");
                      }}
                    >
                      <strong>{minutes}</strong>
                      <span>minutes</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="card">
                <div className="card-head">
                  <div className="step">03</div>
                  <div>
                    <div className="eyebrow">AVAILABILITY</div>
                    <h2>Choose a time</h2>
                    <p>
                      Times are displayed in your local timezone.
                    </p>
                  </div>

                  <span className="timezone">
                    {clientTimezone}
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="slot-state">
                    <div className="state-mini">◷</div>
                    <strong>Finding available times</strong>
                    <span>Please wait...</span>
                  </div>
                ) : slotError ? (
                  <div className="slot-state">
                    <div className="state-mini">!</div>
                    <strong>Unable to load times</strong>
                    <span>{slotError}</span>

                    <button
                      className="secondary-btn"
                      onClick={fetchAvailableSlots}
                    >
                      Try again
                    </button>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="slot-state">
                    <div className="state-mini">—</div>
                    <strong>No slots available</strong>
                    <span>
                      There are no open {duration}-minute sessions
                      for this date. Try another date.
                    </span>
                  </div>
                ) : (
                  <div className="slots-grid">
                    {slots.map((slot) => {
                      const selected =
                        selectedSlot?.start_at ===
                        slot.start_at;

                      return (
                        <button
                          key={`${slot.start_at}-${slot.end_at}`}
                          type="button"
                          className={`slot-btn ${
                            selected ? "active" : ""
                          }`}
                          onClick={() => {
                            setSelectedSlot(slot);
                            setError("");
                            setSuccess("");
                          }}
                        >
                          {formatSlotTime(slot.start_at)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </main>

            <aside className="side-column">
              <section className="card details-card">
                <div className="card-head">
                  <div className="step">04</div>
                  <div>
                    <div className="eyebrow">YOUR DETAILS</div>
                    <h2>Complete booking</h2>
                    <p>
                      Enter your contact information.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleBooking}>
                  <label>
                    Full name
                    <input
                      value={clientName}
                      onChange={(event) =>
                        setClientName(event.target.value)
                      }
                      placeholder="Your full name"
                    />
                  </label>

                  <label>
                    Email address
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(event) =>
                        setClientEmail(event.target.value)
                      }
                      placeholder="you@example.com"
                    />
                  </label>

                  <div className="summary">
                    <div className="summary-title">
                      Booking summary
                    </div>

                    <div>
                      <span>Date</span>
                      <strong>{formatDate(date)}</strong>
                    </div>

                    <div>
                      <span>Duration</span>
                      <strong>{duration} minutes</strong>
                    </div>

                    <div>
                      <span>Time</span>
                      <strong>
                        {selectedSlot
                          ? formatSlotTime(
                              selectedSlot.start_at
                            )
                          : "Not selected"}
                      </strong>
                    </div>

                    <div>
                      <span>Timezone</span>
                      <strong>{clientTimezone}</strong>
                    </div>
                  </div>

                  <button
                    className="confirm-btn"
                    type="submit"
                    disabled={
                      !selectedSlot || booking
                    }
                  >
                    {booking
                      ? "Confirming..."
                      : "Confirm booking"}
                  </button>

                  <p className="helper">
                    Your booking will be confirmed after the request
                    is successfully completed.
                  </p>
                </form>
              </section>
            </aside>
          </div>

          <footer>
            <span>Unfazed</span>
            <span>Secure therapist booking</span>
          </footer>
        </div>
      </div>
    </>
  );
}

const css = `
  .booking-page {
    min-height: 100vh;
    background: #f4f6fa;
    color: #192338;
    padding: 22px;
    font-family: Inter, system-ui, -apple-system,
      BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .booking-page * {
    box-sizing: border-box;
  }

  .booking-shell {
    max-width: 1080px;
    margin: 0 auto;
  }

  .back-link {
    border: 0;
    background: transparent;
    padding: 6px 0;
    margin-bottom: 14px;
    color: #4d63d2;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .booking-hero {
    display: flex;
    align-items: center;
    gap: 17px;
    padding: 24px;
    border-radius: 20px;
    background: linear-gradient(135deg,#243670,#5368d7);
    box-shadow: 0 12px 28px rgba(43,57,125,.13);
  }

  .avatar {
    width: 62px;
    height: 62px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 17px;
    background: rgba(255,255,255,.14);
    border: 1px solid rgba(255,255,255,.2);
    color: #fff;
    font-size: 24px;
    font-weight: 800;
  }

  .eyebrow {
    margin-bottom: 6px;
    color: #718097;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.5px;
  }

  .booking-hero .eyebrow {
    color: rgba(255,255,255,.7);
  }

  .booking-hero h1 {
    margin: 0;
    color: #fff;
    font-size: 29px;
    letter-spacing: -.5px;
  }

  .booking-hero p {
    margin: 7px 0 0;
    color: rgba(255,255,255,.8);
    font-size: 12px;
  }

  .notice {
    margin-top: 14px;
    padding: 13px 15px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 10px;
  }

  .notice strong {
    color: #29344a;
    font-size: 11px;
  }

  .notice span {
    color: #718096;
    line-height: 1.5;
  }

  .notice.success {
    background: #edf8f1;
    border: 1px solid #d1e8d9;
  }

  .notice.error {
    background: #fff1f1;
    border: 1px solid #efd4d4;
  }

  .booking-layout {
    display: grid;
    grid-template-columns: 1.25fr .8fr;
    gap: 16px;
    margin-top: 16px;
    align-items: start;
  }

  .main-column {
    display: grid;
    gap: 16px;
  }

  .side-column {
    position: sticky;
    top: 18px;
  }

  .card {
    background: #fff;
    border: 1px solid #e0e5ed;
    border-radius: 17px;
    padding: 21px;
    box-shadow: 0 8px 22px rgba(22,31,54,.04);
  }

  .card-head {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    margin-bottom: 17px;
  }

  .step {
    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 10px;
    background: #eef1ff;
    color: #5065ce;
    font-size: 9px;
    font-weight: 800;
  }

  .card h2 {
    margin: 0;
    color: #222d42;
    font-size: 19px;
  }

  .card p {
    margin: 5px 0 0;
    color: #7a8598;
    font-size: 10px;
    line-height: 1.5;
  }

  .date-input,
  label input {
    width: 100%;
    height: 43px;
    border: 1px solid #d7dee8;
    border-radius: 10px;
    background: #fff;
    color: #273248;
    padding: 0 11px;
    font: inherit;
    font-size: 12px;
    outline: none;
  }

  .date-input:focus,
  label input:focus {
    border-color: #6274d8;
    box-shadow: 0 0 0 3px rgba(77,99,210,.1);
  }

  .selected-date {
    margin-top: 9px;
    color: #5f6b7e;
    font-size: 10px;
  }

  .duration-grid {
    display: grid;
    grid-template-columns: repeat(4,1fr);
    gap: 9px;
  }

  .duration-btn,
  .slot-btn {
    border: 1px solid #d7deea;
    background: #fff;
    color: #39455a;
    border-radius: 10px;
    cursor: pointer;
  }

  .duration-btn {
    min-height: 64px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 3px;
  }

  .duration-btn strong {
    font-size: 18px;
  }

  .duration-btn span {
    font-size: 9px;
    color: #7d8798;
  }

  .duration-btn.active,
  .slot-btn.active {
    background: #4d63d2;
    border-color: #4d63d2;
    color: #fff;
  }

  .duration-btn.active span {
    color: rgba(255,255,255,.78);
  }

  .timezone {
    margin-left: auto;
    max-width: 170px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 7px 9px;
    border-radius: 999px;
    background: #f1f4f8;
    color: #677286;
    font-size: 8px;
    font-weight: 700;
  }

  .slots-grid {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 9px;
  }

  .slot-btn {
    padding: 11px 8px;
    font-size: 11px;
    font-weight: 700;
  }

  .slot-state {
    min-height: 190px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 5px;
    border: 1px dashed #d8dfe8;
    border-radius: 13px;
    padding: 22px;
  }

  .state-mini {
    width: 40px;
    height: 40px;
    margin-bottom: 5px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: #eef1ff;
    color: #5166cf;
    font-weight: 800;
  }

  .slot-state strong {
    color: #303b50;
    font-size: 13px;
  }

  .slot-state span {
    max-width: 320px;
    color: #7f8999;
    font-size: 10px;
    line-height: 1.5;
  }

  .slot-state .secondary-btn {
    margin-top: 9px;
  }

  label {
    display: block;
    margin-bottom: 14px;
    color: #344057;
    font-size: 10px;
    font-weight: 800;
  }

  label input {
    margin-top: 7px;
  }

  .summary {
    margin-top: 18px;
    padding: 14px;
    border-radius: 13px;
    background: #f7f8fb;
    border: 1px solid #e4e8ee;
  }

  .summary-title {
    margin-bottom: 8px;
    color: #29344a;
    font-size: 12px;
    font-weight: 800;
  }

  .summary > div:not(.summary-title) {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
    border-top: 1px solid #e8ebf0;
    font-size: 9px;
  }

  .summary span {
    color: #818b9b;
  }

  .summary strong {
    color: #364157;
    text-align: right;
    font-size: 9px;
  }

  .confirm-btn,
  .primary-btn,
  .secondary-btn {
    border-radius: 10px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .confirm-btn,
  .primary-btn {
    border: 1px solid #4d63d2;
    background: #4d63d2;
    color: #fff;
  }

  .confirm-btn {
    width: 100%;
    padding: 13px;
    margin-top: 15px;
  }

  .secondary-btn {
    border: 1px solid #d5dce7;
    background: #fff;
    color: #536078;
    padding: 9px 13px;
  }

  .confirm-btn:disabled,
  .primary-btn:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .helper {
    text-align: center;
    margin-top: 9px !important;
    font-size: 9px !important;
  }

  .state-card {
    max-width: 440px;
    margin: 100px auto;
    padding: 35px;
    border: 1px solid #e0e5ed;
    border-radius: 18px;
    background: #fff;
    text-align: center;
    box-shadow: 0 8px 24px rgba(22,31,54,.04);
  }

  .state-icon,
  .error-icon {
    width: 50px;
    height: 50px;
    display: grid;
    place-items: center;
    margin: 0 auto 13px;
    border-radius: 14px;
    font-weight: 800;
  }

  .state-icon {
    background: #eef1ff;
    color: #5166ce;
  }

  .error-icon {
    background: #fff0f0;
    color: #b34848;
  }

  .state-card h2 {
    margin: 0 0 6px;
    color: #283349;
    font-size: 20px;
  }

  .state-card p {
    margin: 0 0 18px;
    color: #788396;
    font-size: 11px;
  }

  footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-top: 20px;
    padding: 15px 2px 0;
    border-top: 1px solid #e1e6ef;
    color: #8a94a5;
    font-size: 9px;
  }

  @media (max-width: 800px) {
    .booking-layout {
      grid-template-columns: 1fr;
    }

    .side-column {
      position: static;
    }
  }

  @media (max-width: 560px) {
    .booking-page {
      padding: 14px;
    }

    .booking-hero {
      padding: 20px;
      align-items: flex-start;
    }

    .booking-hero h1 {
      font-size: 25px;
    }

    .duration-grid,
    .slots-grid {
      grid-template-columns: repeat(2,1fr);
    }

    .timezone {
      max-width: 130px;
    }

    .footer {
      flex-direction: column;
    }
  }
`;
export default BookSession;