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

  const fetchAvailability = async () => {
    try {
      setLoadingList(true);

      const response = await axiosInstance.get("/availability", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAvailability(response.data.availability || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load availability"
      );
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAvailability();
    }
  }, [token]);

  const handleDurationChange = (duration) => {
    setSessionDurations((previous) => {
      if (previous.includes(duration)) {
        return previous.filter((item) => item !== duration);
      }

      return [...previous, duration].sort((a, b) => a - b);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        type,
      };

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

      setSuccess(response.data.message);

      setDate("");
      setStartTime("09:00");
      setEndTime("17:00");
      setBufferMinutes("15");

      await fetchAvailability();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to create availability"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setError("");
      setSuccess("");

      await axiosInstance.delete(`/availability/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Availability deleted successfully");

      await fetchAvailability();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to delete availability"
      );
    }
  };

  const getDayName = (day) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return days[day];
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <p style={styles.brand}>UNFAZED</p>

            <h1 style={styles.title}>
              Schedule & Availability
            </h1>

            <p style={styles.subtitle}>
              Set when clients can book sessions with you.
            </p>
          </div>
        </div>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>
            Add Availability
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Type */}
            <div style={styles.field}>
              <label style={styles.label}>
                Availability Type
              </label>

              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
                style={styles.input}
              >
                <option value="weekly">
                  Weekly Schedule
                </option>

                <option value="override">
                  One-Time Override
                </option>

                <option value="blocked">
                  Blocked Date
                </option>
              </select>
            </div>

            {/* Weekly day */}
            {type === "weekly" && (
              <div style={styles.field}>
                <label style={styles.label}>
                  Day
                </label>

                <select
                  value={dayOfWeek}
                  onChange={(event) =>
                    setDayOfWeek(event.target.value)
                  }
                  style={styles.input}
                >
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                </select>
              </div>
            )}

            {/* Date */}
            {(type === "override" ||
              type === "blocked") && (
              <div style={styles.field}>
                <label style={styles.label}>
                  Date
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDate(event.target.value)
                  }
                  required
                  style={styles.input}
                />
              </div>
            )}

            {/* Time */}
            {type !== "blocked" && (
              <div style={styles.twoColumn}>
                <div style={styles.field}>
                  <label style={styles.label}>
                    Start Time
                  </label>

                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) =>
                      setStartTime(event.target.value)
                    }
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    End Time
                  </label>

                  <input
                    type="time"
                    value={endTime}
                    onChange={(event) =>
                      setEndTime(event.target.value)
                    }
                    required
                    style={styles.input}
                  />
                </div>
              </div>
            )}

            {/* Buffer */}
            {type !== "blocked" && (
              <div style={styles.field}>
                <label style={styles.label}>
                  Buffer Time (minutes)
                </label>

                <input
                  type="number"
                  min="0"
                  value={bufferMinutes}
                  onChange={(event) =>
                    setBufferMinutes(event.target.value)
                  }
                  style={styles.input}
                />
              </div>
            )}

            {/* Session durations */}
            {type !== "blocked" && (
              <div style={styles.field}>
                <label style={styles.label}>
                  Session Durations
                </label>

                <div style={styles.durationGrid}>
                  {[30, 45, 60, 90].map((duration) => (
                    <label
                      key={duration}
                      style={styles.checkboxCard}
                    >
                      <input
                        type="checkbox"
                        checked={sessionDurations.includes(
                          duration
                        )}
                        onChange={() =>
                          handleDurationChange(duration)
                        }
                      />

                      <span>
                        {duration} min
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}

            {success && (
              <div style={styles.success}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={styles.button}
            >
              {loading
                ? "Saving..."
                : "Add Availability"}
            </button>
          </form>
        </section>

        {/* Existing availability */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>
            Existing Availability
          </h2>

          {loadingList ? (
            <p style={styles.muted}>
              Loading availability...
            </p>
          ) : availability.length === 0 ? (
            <p style={styles.muted}>
              No availability added yet.
            </p>
          ) : (
            <div style={styles.list}>
              {availability.map((item) => (
                <div
                  key={item._id}
                  style={styles.listItem}
                >
                  <div>
                    <span style={styles.typeBadge}>
                      {item.type}
                    </span>

                    {item.type === "weekly" && (
                      <h3 style={styles.itemTitle}>
                        {getDayName(item.day_of_week)}
                      </h3>
                    )}

                    {item.type !== "weekly" &&
                      item.date && (
                        <h3 style={styles.itemTitle}>
                          {new Date(
                            item.date
                          ).toLocaleDateString()}
                        </h3>
                      )}

                    {item.type !== "blocked" && (
                      <p style={styles.itemText}>
                        {item.start_time} -{" "}
                        {item.end_time}
                      </p>
                    )}

                    {item.type !== "blocked" && (
                      <p style={styles.itemText}>
                        Buffer: {item.buffer_minutes} min
                      </p>
                    )}

                    {item.type !== "blocked" && (
                      <p style={styles.itemText}>
                        Sessions:{" "}
                        {item.session_durations.join(
                          ", "
                        )}{" "}
                        min
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(item._id)
                    }
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "40px 20px",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "25px",
  },

  brand: {
    margin: "0 0 8px",
    fontSize: "13px",
    fontWeight: "800",
    letterSpacing: "2px",
    color: "#475569",
  },

  title: {
    margin: 0,
    fontSize: "34px",
    color: "#0f172a",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "28px",
    marginBottom: "24px",
    boxSizing: "border-box",
  },

  cardTitle: {
    margin: "0 0 24px",
    color: "#0f172a",
    fontSize: "21px",
  },

  field: {
    marginBottom: "20px",
  },

  twoColumn: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#0f172a",
    fontWeight: "600",
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
    boxSizing: "border-box",
  },

  durationGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "10px",
  },

  checkboxCard: {
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#334155",
    cursor: "pointer",
  },

  button: {
    width: "100%",
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    padding: "13px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },

  error: {
    marginBottom: "18px",
    padding: "12px",
    borderRadius: "8px",
    background: "#fee2e2",
    color: "#b91c1c",
  },

  success: {
    marginBottom: "18px",
    padding: "12px",
    borderRadius: "8px",
    background: "#dcfce7",
    color: "#15803d",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
  },

  typeBadge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "7px",
  },

  itemTitle: {
    margin: "0 0 6px",
    color: "#0f172a",
    fontSize: "17px",
  },

  itemText: {
    margin: "4px 0",
    color: "#64748b",
    fontSize: "14px",
  },

  deleteButton: {
    border: "1px solid #fecaca",
    background: "#ffffff",
    color: "#dc2626",
    padding: "9px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    flexShrink: 0,
  },

  muted: {
    margin: 0,
    color: "#64748b",
  },
};

export default Schedule;