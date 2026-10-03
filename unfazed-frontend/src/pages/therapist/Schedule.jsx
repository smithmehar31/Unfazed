import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

function Schedule() {
  const { token } = useAuth();

  const [availability, setAvailability] = useState([]);

  const [type, setType] = useState("weekly");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [bufferMinutes, setBufferMinutes] = useState("15");
  const [sessionDurations, setSessionDurations] = useState([
    30,
    45,
    60,
    90,
  ]);

  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const typeInfo = {
    weekly: {
      title: "Weekly schedule",
      text: "Repeat this availability every week.",
      icon: "↻",
    },
    override: {
      title: "One-time override",
      text: "Use a different schedule for a specific date.",
      icon: "◷",
    },
    blocked: {
      title: "Blocked date",
      text: "Prevent clients from booking on a specific date.",
      icon: "×",
    },
  };

  useEffect(() => {
    if (token) {
      fetchAvailability();
    }
  }, [token]);

  async function fetchAvailability() {
    try {
      setLoadingList(true);
      setError("");

      const response = await axiosInstance.get("/availability", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAvailability(response.data.availability || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to load your availability."
      );
    } finally {
      setLoadingList(false);
    }
  }

  function toggleDuration(duration) {
    setSessionDurations((current) => {
      if (current.includes(duration)) {
        return current.filter((item) => item !== duration);
      }

      return [...current, duration].sort((a, b) => a - b);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    if (type !== "blocked" && sessionDurations.length === 0) {
      setError("Please select at least one session duration.");
      setLoading(false);
      return;
    }

    if ((type === "override" || type === "blocked") && !date) {
      setError("Please select a date.");
      setLoading(false);
      return;
    }

    try {
      const payload = { type };

      if (type === "weekly") {
        payload.day_of_week = Number(dayOfWeek);
        payload.start_time = startTime;
        payload.end_time = endTime;
        payload.buffer_minutes = Number(bufferMinutes);
        payload.session_durations = sessionDurations;
      }

      if (type === "override") {
        payload.date = date;
        payload.start_time = startTime;
        payload.end_time = endTime;
        payload.buffer_minutes = Number(bufferMinutes);
        payload.session_durations = sessionDurations;
      }

      if (type === "blocked") {
        payload.date = date;
      }

      const response = await axiosInstance.post(
        "/availability",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data.message || "Availability added successfully."
      );

      setDate("");
      setStartTime("09:00");
      setEndTime("17:00");
      setBufferMinutes("15");

      await fetchAvailability();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to save availability."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      setError("");
      setSuccess("");

      await axiosInstance.delete(`/availability/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Availability deleted successfully.");
      await fetchAvailability();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to delete availability."
      );
    }
  }

  function formatDate(value) {
    if (!value) return "";

    const parts = String(value).slice(0, 10).split("-");

    if (parts.length !== 3) {
      return value;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return (
    <>
      <style>{css}</style>

      <div className="schedule-page">
        <div className="schedule-shell">
          <header className="topbar">
            <div>
              <div className="brand-row">
                <div className="brand-mark">U</div>
                <div>
                  <strong>Unfazed</strong>
                  <span>Therapist workspace</span>
                </div>
              </div>
            </div>

            <div className="status">
              <span />
              Availability manager
            </div>
          </header>

          <section className="heading">
            <div>
              <div className="eyebrow">BOOKING SETTINGS</div>
              <h1>Schedule & availability</h1>
              <p>
                Set when clients can book sessions with you and keep
                your calendar organized.
              </p>
            </div>

            <div className="count-badge">
              {availability.length} active
            </div>
          </section>

          {error && (
            <div className="alert error">
              <span>!</span>
              <div>
                <strong>Something went wrong</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="alert success">
              <span>✓</span>
              <div>
                <strong>Updated successfully</strong>
                <p>{success}</p>
              </div>
            </div>
          )}

          <div className="schedule-grid">
            <section className="card form-card">
              <div className="card-head">
                <div>
                  <div className="eyebrow">CONFIGURE</div>
                  <h2>Add availability</h2>
                  <p>
                    Create a weekly schedule, a one-time override or
                    block a date.
                  </p>
                </div>

                <div className="card-icon">+</div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Availability type</label>

                  <div className="type-grid">
                    {Object.entries(typeInfo).map(
                      ([value, item]) => {
                        const selected = type === value;

                        return (
                          <button
                            key={value}
                            type="button"
                            className={`type-option ${
                              selected ? "selected" : ""
                            }`}
                            onClick={() => setType(value)}
                          >
                            <span className="type-icon">
                              {item.icon}
                            </span>

                            <span className="type-copy">
                              <strong>{item.title}</strong>
                              <small>{item.text}</small>
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {type === "weekly" && (
                  <div className="field">
                    <label htmlFor="day">Day of week</label>
                    <select
                      id="day"
                      value={dayOfWeek}
                      onChange={(event) =>
                        setDayOfWeek(event.target.value)
                      }
                    >
                      {days.map((day, index) => (
                        <option key={day} value={index}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {type !== "weekly" && (
                  <div className="field">
                    <label htmlFor="date">
                      {type === "blocked"
                        ? "Blocked date"
                        : "Override date"}
                    </label>

                    <input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(event) =>
                        setDate(event.target.value)
                      }
                    />
                  </div>
                )}

                {type !== "blocked" && (
                  <>
                    <div className="two-col">
                      <div className="field">
                        <label htmlFor="startTime">Start time</label>
                        <input
                          id="startTime"
                          type="time"
                          value={startTime}
                          onChange={(event) =>
                            setStartTime(event.target.value)
                          }
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="endTime">End time</label>
                        <input
                          id="endTime"
                          type="time"
                          value={endTime}
                          onChange={(event) =>
                            setEndTime(event.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label htmlFor="buffer">Buffer between sessions</label>

                      <div className="input-with-suffix">
                        <input
                          id="buffer"
                          type="number"
                          min="0"
                          value={bufferMinutes}
                          onChange={(event) =>
                            setBufferMinutes(event.target.value)
                          }
                        />
                        <span>minutes</span>
                      </div>

                      <small className="help">
                        Add a short break between appointments when
                        needed.
                      </small>
                    </div>

                    <div className="field">
                      <div className="label-row">
                        <label>Session durations</label>
                        <span>
                          {sessionDurations.length} selected
                        </span>
                      </div>

                      <div className="duration-grid">
                        {[30, 45, 60, 90].map((duration) => {
                          const selected =
                            sessionDurations.includes(duration);

                          return (
                            <button
                              type="button"
                              key={duration}
                              className={`duration ${
                                selected ? "selected" : ""
                              }`}
                              onClick={() =>
                                toggleDuration(duration)
                              }
                            >
                              <strong>{duration}</strong>
                              <span>min</span>
                              <i>{selected ? "✓" : ""}</i>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <button
                  className="submit-btn"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Add availability"}
                  <span>→</span>
                </button>
              </form>
            </section>

            <section className="card list-card">
              <div className="card-head">
                <div>
                  <div className="eyebrow">CURRENT SETTINGS</div>
                  <h2>Existing availability</h2>
                  <p>
                    Review and manage the schedule clients can book.
                  </p>
                </div>

                <div className="list-count">
                  {availability.length}
                </div>
              </div>

              {loadingList ? (
                <div className="empty-state">
                  <div className="empty-icon">◷</div>
                  <h3>Loading availability</h3>
                  <p>Fetching your current schedule...</p>
                </div>
              ) : availability.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">◷</div>
                  <h3>No availability yet</h3>
                  <p>
                    Add your first schedule using the form on the
                    left.
                  </p>
                </div>
              ) : (
                <div className="availability-list">
                  {availability.map((item) => (
                    <article
                      className="availability-item"
                      key={item._id}
                    >
                      <div className="item-top">
                        <span
                          className={`type-badge ${
                            item.type === "blocked"
                              ? "blocked"
                              : item.type === "override"
                              ? "override"
                              : ""
                          }`}
                        >
                          {item.type}
                        </span>

                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(item._id)}
                        >
                          Delete
                        </button>
                      </div>

                      <h3>
                        {item.type === "weekly"
                          ? days[item.day_of_week]
                          : formatDate(item.date)}
                      </h3>

                      {item.type === "blocked" ? (
                        <p className="blocked-text">
                          No client bookings will be accepted.
                        </p>
                      ) : (
                        <>
                          <div className="time-line">
                            <strong>
                              {item.start_time} – {item.end_time}
                            </strong>
                            <span>
                              {item.buffer_minutes || 0} min buffer
                            </span>
                          </div>

                          <div className="duration-tags">
                            {(item.session_durations || []).map(
                              (duration) => (
                                <span key={duration}>
                                  {duration} min
                                </span>
                              )
                            )}
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <footer className="footer">
            <span>Unfazed Practice Management</span>
            <span>Professional therapist workspace</span>
          </footer>
        </div>
      </div>
    </>
  );
}

const css = `
  .schedule-page {
    min-height: 100vh;
    background: #f4f6fa;
    color: #192338;
    padding: 22px;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
  }

  .schedule-page * {
    box-sizing: border-box;
  }

  .schedule-shell {
    max-width: 1180px;
    margin: 0 auto;
  }

  .topbar {
    min-height: 64px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e1e6ef;
    gap: 20px;
  }

  .brand-row,
  .status,
  .alert,
  .label-row,
  .item-top,
  .time-line {
    display: flex;
    align-items: center;
  }

  .brand-row {
    gap: 10px;
  }

  .brand-mark {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: #4d63d2;
    color: #fff;
    font-weight: 800;
  }

  .brand-row strong {
    display: block;
    color: #192338;
    font-size: 15px;
  }

  .brand-row span {
    display: block;
    color: #7b8698;
    font-size: 10px;
    margin-top: 2px;
  }

  .status {
    gap: 7px;
    padding: 8px 11px;
    background: #eef8f2;
    border: 1px solid #d5ebde;
    color: #2c7951;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
  }

  .status > span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #34a267;
  }

  .heading {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 20px;
    padding: 32px 2px 22px;
  }

  .eyebrow {
    margin-bottom: 7px;
    color: #718096;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.7px;
  }

  .heading h1 {
    margin: 0;
    color: #192338;
    font-size: 36px;
    letter-spacing: -.7px;
  }

  .heading p,
  .card-head p,
  .help,
  .empty-state p,
  .alert p,
  .blocked-text {
    color: #6f7b8e;
  }

  .heading p {
    margin: 9px 0 0;
    font-size: 13px;
  }

  .count-badge,
  .list-count {
    background: #eef1ff;
    color: #4d63d2;
    font-weight: 800;
  }

  .count-badge {
    border-radius: 999px;
    padding: 9px 12px;
    font-size: 10px;
  }

  .alert {
    gap: 11px;
    padding: 12px 14px;
    border-radius: 12px;
    margin-bottom: 15px;
  }

  .alert > span {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    font-weight: 800;
  }

  .alert.error {
    background: #fff3f3;
    border: 1px solid #efd8d8;
  }

  .alert.error > span {
    background: #ffe5e5;
    color: #b54848;
  }

  .alert.success {
    background: #eff9f3;
    border: 1px solid #d8ecdf;
  }

  .alert.success > span {
    background: #def3e5;
    color: #2d8858;
  }

  .alert strong {
    display: block;
    color: #263248;
    font-size: 11px;
  }

  .alert p {
    margin: 2px 0 0;
    font-size: 10px;
  }

  .schedule-grid {
    display: grid;
    grid-template-columns: .96fr 1.04fr;
    gap: 18px;
  }

  .card {
    background: #fff;
    border: 1px solid #e0e5ed;
    border-radius: 19px;
    box-shadow: 0 8px 24px rgba(20,32,60,.04);
  }

  .form-card,
  .list-card {
    padding: 23px;
  }

  .card-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 20px;
  }

  .card-head h2 {
    margin: 0;
    color: #202b3f;
    font-size: 20px;
  }

  .card-head p {
    margin: 5px 0 0;
    font-size: 11px;
    line-height: 1.5;
  }

  .card-icon,
  .list-count {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 10px;
  }

  .card-icon {
    background: #eef1ff;
    color: #4d63d2;
    font-weight: 800;
  }

  .list-count {
    font-size: 12px;
  }

  .field {
    margin-bottom: 16px;
  }

  .field > label {
    display: block;
    margin-bottom: 7px;
    color: #354158;
    font-size: 11px;
    font-weight: 700;
  }

  .type-grid {
    display: grid;
    gap: 9px;
  }

  .type-option {
    width: 100%;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 11px;
    align-items: center;
    text-align: left;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid #dce2eb;
    background: #fff;
    cursor: pointer;
  }

  .type-option.selected {
    border-color: #8694df;
    background: #f5f6ff;
  }

  .type-icon {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: #eef1ff;
    color: #4d63d2;
    font-weight: 800;
  }

  .type-copy strong {
    display: block;
    color: #273248;
    font-size: 12px;
  }

  .type-copy small {
    display: block;
    margin-top: 3px;
    color: #798497;
    font-size: 10px;
    line-height: 1.4;
  }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 11px;
  }

  input,
  select {
    width: 100%;
    height: 42px;
    border: 1px solid #d8dfe8;
    border-radius: 10px;
    padding: 0 11px;
    background: #fff;
    color: #263248;
    font: inherit;
    font-size: 12px;
    outline: none;
  }

  input:focus,
  select:focus {
    border-color: #6173d8;
    box-shadow: 0 0 0 3px rgba(77,99,210,.1);
  }

  .input-with-suffix {
    position: relative;
  }

  .input-with-suffix input {
    padding-right: 72px;
  }

  .input-with-suffix span {
    position: absolute;
    right: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: #8a94a5;
    font-size: 10px;
  }

  .help {
    margin: 6px 0 0;
    font-size: 10px;
  }

  .label-row {
    justify-content: space-between;
    gap: 10px;
  }

  .label-row span {
    color: #8a94a5;
    font-size: 10px;
  }

  .duration-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .duration {
    position: relative;
    min-height: 64px;
    border: 1px solid #dce2eb;
    border-radius: 11px;
    background: #fff;
    cursor: pointer;
    color: #283349;
  }

  .duration.selected {
    background: #4d63d2;
    border-color: #4d63d2;
    color: #fff;
  }

  .duration strong {
    display: block;
    font-size: 16px;
  }

  .duration > span {
    font-size: 9px;
  }

  .duration i {
    position: absolute;
    top: 5px;
    right: 7px;
    font-style: normal;
    font-size: 9px;
  }

  .submit-btn {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 6px;
    border: 0;
    border-radius: 11px;
    padding: 13px 15px;
    background: #4d63d2;
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
  }

  .submit-btn:disabled {
    opacity: .6;
    cursor: not-allowed;
  }

  .empty-state {
    min-height: 360px;
    display: grid;
    place-items: center;
    align-content: center;
    text-align: center;
    border: 1px dashed #dbe1ea;
    border-radius: 14px;
  }

  .empty-icon {
    width: 45px;
    height: 45px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background: #eef1ff;
    color: #4d63d2;
    font-size: 20px;
    font-weight: 800;
  }

  .empty-state h3 {
    margin: 12px 0 4px;
    color: #273248;
    font-size: 15px;
  }

  .empty-state p {
    margin: 0;
    max-width: 260px;
    font-size: 10px;
    line-height: 1.5;
  }

  .availability-list {
    display: grid;
    gap: 10px;
  }

  .availability-item {
    padding: 15px;
    border: 1px solid #e1e6ee;
    border-radius: 14px;
    background: #fbfcfd;
  }

  .item-top {
    justify-content: space-between;
    gap: 10px;
  }

  .type-badge {
    padding: 5px 8px;
    border-radius: 999px;
    background: #eef1ff;
    color: #4d63d2;
    font-size: 9px;
    font-weight: 800;
    text-transform: capitalize;
  }

  .type-badge.override {
    background: #f3efff;
    color: #7250b7;
  }

  .type-badge.blocked {
    background: #fff0f0;
    color: #b24848;
  }

  .delete-btn {
    border: 1px solid #efcdcd;
    background: #fff;
    color: #b44848;
    border-radius: 8px;
    padding: 6px 9px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
  }

  .availability-item h3 {
    margin: 13px 0 9px;
    color: #202b3f;
    font-size: 17px;
  }

  .time-line {
    justify-content: space-between;
    gap: 12px;
  }

  .time-line strong {
    color: #39465c;
    font-size: 11px;
  }

  .time-line span {
    color: #7d8798;
    font-size: 9px;
  }

  .duration-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 11px;
  }

  .duration-tags span {
    padding: 5px 8px;
    border-radius: 7px;
    background: #eef1ff;
    color: #4d5fb9;
    font-size: 9px;
    font-weight: 700;
  }

  .blocked-text {
    margin: 0;
    font-size: 10px;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    padding: 17px 2px 0;
    margin-top: 22px;
    border-top: 1px solid #e1e6ef;
    color: #8a94a5;
    font-size: 10px;
  }

  @media (max-width: 850px) {
    .schedule-page {
      padding: 15px;
    }

    .schedule-grid {
      grid-template-columns: 1fr;
    }

    .heading,
    .topbar,
    .footer {
      align-items: flex-start;
    }
  }

  @media (max-width: 600px) {
    .heading,
    .topbar,
    .footer {
      flex-direction: column;
    }

    .two-col,
    .duration-grid {
      grid-template-columns: 1fr 1fr;
    }

    .form-card,
    .list-card {
      padding: 18px;
    }
  }
`;
export default Schedule;