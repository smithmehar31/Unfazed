import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

function Clients() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tags, setTags] = useState("");

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [presentingConcern, setPresentingConcern] = useState("");
  const [history, setHistory] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchClients();
  }, [search, statusFilter]);

  async function fetchClients() {
    try {
      setLoadingClients(true);
      setError("");

      const response = await axiosInstance.get("/clients", {
        params: {
          search: search.trim(),
          status: statusFilter,
          sort: "name",
          order: "asc",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setClients(response.data.clients || []);
      }
    } catch (error) {
      console.error("Client list error:", error);

      if (error.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to load clients."
      );
    } finally {
      setLoadingClients(false);
    }
  }

  async function openClientProfile(clientId) {
    try {
      setLoadingProfile(true);
      setError("");
      setSuccess("");

      const response = await axiosInstance.get(
        `/clients/${clientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const client = response.data.client;

        setSelectedClient(client);

        setAge(client.intake?.demographics?.age || "");
        setGender(client.intake?.demographics?.gender || "");
        setOccupation(
          client.intake?.demographics?.occupation || ""
        );
        setPresentingConcern(
          client.intake?.presenting_concern || ""
        );
        setHistory(client.intake?.history || "");
      }
    } catch (error) {
      console.error("Client profile error:", error);

      if (error.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to load client profile."
      );
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleCreateClient(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Client name is required.");
      return;
    }

    try {
      setSaving(true);

      const clientData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        status: "active",
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      const response = await axiosInstance.post(
        "/clients",
        clientData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSuccess("Client created successfully.");

        setName("");
        setEmail("");
        setPhone("");
        setTags("");
        setShowCreateForm(false);

        await fetchClients();

        if (response.data.client?._id) {
          await openClientProfile(response.data.client._id);
        }
      }
    } catch (error) {
      console.error("Create client error:", error);

      if (error.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to create client."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveIntake() {
    if (!selectedClient) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const intakeData = {
        demographics: {
          age: age === "" ? undefined : Number(age),
          gender: gender.trim(),
          occupation: occupation.trim(),
        },
        presenting_concern: presentingConcern.trim(),
        history: history.trim(),
      };

      const response = await axiosInstance.put(
        `/clients/${selectedClient._id}/intake`,
        intakeData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSuccess("Intake information updated successfully.");

        await openClientProfile(selectedClient._id);
      }
    } catch (error) {
      console.error("Intake update error:", error);

      if (error.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to update intake information."
      );
    } finally {
      setSaving(false);
    }
  }

  async function recordConsent() {
    if (!selectedClient) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await axiosInstance.post(
        `/clients/${selectedClient._id}/consent`,
        {
          accepted: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSuccess("Client consent recorded successfully.");

        await openClientProfile(selectedClient._id);
      }
    } catch (error) {
      console.error("Consent error:", error);

      if (error.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to record consent."
      );
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return "—";
    }

    try {
      return new Date(dateValue).toLocaleDateString();
    } catch (error) {
      return "—";
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              style={styles.backButton}
            >
              ← Dashboard
            </button>

            <h1 style={styles.title}>Clients</h1>

            <p style={styles.subtitle}>
              Manage your clients, intake information and consent.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreateForm((value) => !value);
              setError("");
              setSuccess("");
            }}
            style={styles.primaryButton}
          >
            {showCreateForm ? "Close" : "+ Add Client"}
          </button>
        </header>

        {error && (
          <div style={styles.errorBanner}>
            {error}
          </div>
        )}

        {success && (
          <div style={styles.successBanner}>
            {success}
          </div>
        )}

        {showCreateForm && (
          <div style={styles.createCard}>
            <div style={styles.sectionHeader}>
              <div>
                <p style={styles.sectionLabel}>NEW CLIENT</p>

                <h2 style={styles.sectionTitle}>
                  Add a client
                </h2>
              </div>
            </div>

            <form onSubmit={handleCreateClient}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name</label>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Client name"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="client@example.com"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone</label>

                  <input
                    type="text"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="Phone number"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Tags</label>

                  <input
                    type="text"
                    value={tags}
                    onChange={(event) =>
                      setTags(event.target.value)
                    }
                    placeholder="new, online"
                    style={styles.input}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  ...styles.primaryButton,
                  ...(saving
                    ? styles.disabledButton
                    : {}),
                }}
              >
                {saving ? "Creating..." : "Create Client"}
              </button>
            </form>
          </div>
        )}

        <div style={styles.layout}>
          <section style={styles.listCard}>
            <div style={styles.toolbar}>
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search clients..."
                style={styles.searchInput}
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                style={styles.select}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {loadingClients ? (
              <div style={styles.empty}>
                Loading clients...
              </div>
            ) : clients.length === 0 ? (
              <div style={styles.empty}>
                <h3 style={styles.emptyTitle}>
                  No clients found
                </h3>

                <p style={styles.emptyText}>
                  Add your first client to start managing your
                  practice.
                </p>
              </div>
            ) : (
              <div style={styles.clientList}>
                {clients.map((client) => {
                  const isSelected =
                    selectedClient?._id === client._id;

                  return (
                    <button
                      key={client._id}
                      type="button"
                      onClick={() =>
                        openClientProfile(client._id)
                      }
                      style={{
                        ...styles.clientItem,
                        ...(isSelected
                          ? styles.clientItemSelected
                          : {}),
                      }}
                    >
                      <div style={styles.clientAvatar}>
                        {client.name
                          ?.charAt(0)
                          ?.toUpperCase() || "C"}
                      </div>

                      <div style={styles.clientInfo}>
                        <div style={styles.clientTopRow}>
                          <strong style={styles.clientName}>
                            {client.name}
                          </strong>

                          <span
                            style={{
                              ...styles.statusBadge,
                              ...(client.status === "inactive"
                                ? styles.inactiveBadge
                                : {}),
                            }}
                          >
                            {client.status}
                          </span>
                        </div>

                        <span style={styles.clientEmail}>
                          {client.email || "No email"}
                        </span>

                        <span style={styles.clientMeta}>
                          Last session:{" "}
                          {formatDate(
                            client.last_session_at
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section style={styles.profileCard}>
            {loadingProfile ? (
              <div style={styles.empty}>
                Loading client profile...
              </div>
            ) : !selectedClient ? (
              <div style={styles.empty}>
                <div style={styles.profilePlaceholder}>
                  👤
                </div>

                <h3 style={styles.emptyTitle}>
                  Select a client
                </h3>

                <p style={styles.emptyText}>
                  Choose a client from the list to view their
                  profile and intake information.
                </p>
              </div>
            ) : (
              <>
                <div style={styles.profileHeader}>
                  <div style={styles.largeAvatar}>
                    {selectedClient.name
                      ?.charAt(0)
                      ?.toUpperCase() || "C"}
                  </div>

                  <div>
                    <p style={styles.sectionLabel}>
                      CLIENT PROFILE
                    </p>

                    <h2 style={styles.profileName}>
                      {selectedClient.name}
                    </h2>

                    <p style={styles.profileContact}>
                      {selectedClient.email ||
                        "No email provided"}
                    </p>

                    <p style={styles.profileContact}>
                      {selectedClient.phone ||
                        "No phone provided"}
                    </p>
                  </div>
                </div>

                <div style={styles.statsGrid}>
                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>
                      Status
                    </span>

                    <strong>{selectedClient.status}</strong>
                  </div>

                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>
                      Sessions
                    </span>

                    <strong>
                      {selectedClient.session_count || 0}
                    </strong>
                  </div>

                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>
                      Consent
                    </span>

                    <strong>
                      {selectedClient.consent?.accepted
                        ? "Recorded"
                        : "Pending"}
                    </strong>
                  </div>
                </div>

                <div style={styles.detailSection}>
                  <div style={styles.sectionHeader}>
                    <div>
                      <p style={styles.sectionLabel}>
                        INTAKE
                      </p>

                      <h3 style={styles.sectionTitle}>
                        Client intake information
                      </h3>
                    </div>
                  </div>

                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        Age
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={age}
                        onChange={(event) =>
                          setAge(event.target.value)
                        }
                        placeholder="Age"
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        Gender
                      </label>

                      <input
                        type="text"
                        value={gender}
                        onChange={(event) =>
                          setGender(event.target.value)
                        }
                        placeholder="Gender"
                        style={styles.input}
                      />
                    </div>

                    <div
                      style={{
                        ...styles.formGroup,
                        gridColumn: "1 / -1",
                      }}
                    >
                      <label style={styles.label}>
                        Occupation
                      </label>

                      <input
                        type="text"
                        value={occupation}
                        onChange={(event) =>
                          setOccupation(
                            event.target.value
                          )
                        }
                        placeholder="Occupation"
                        style={styles.input}
                      />
                    </div>

                    <div
                      style={{
                        ...styles.formGroup,
                        gridColumn: "1 / -1",
                      }}
                    >
                      <label style={styles.label}>
                        Presenting Concern
                      </label>

                      <textarea
                        value={presentingConcern}
                        onChange={(event) =>
                          setPresentingConcern(
                            event.target.value
                          )
                        }
                        placeholder="Describe the presenting concern..."
                        style={styles.textarea}
                        rows={4}
                      />
                    </div>

                    <div
                      style={{
                        ...styles.formGroup,
                        gridColumn: "1 / -1",
                      }}
                    >
                      <label style={styles.label}>
                        History
                      </label>

                      <textarea
                        value={history}
                        onChange={(event) =>
                          setHistory(event.target.value)
                        }
                        placeholder="Relevant client history..."
                        style={styles.textarea}
                        rows={5}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={saveIntake}
                    disabled={saving}
                    style={{
                      ...styles.primaryButton,
                      ...(saving
                        ? styles.disabledButton
                        : {}),
                    }}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Intake"}
                  </button>
                </div>

                <div style={styles.detailSection}>
                  <div style={styles.sectionHeader}>
                    <div>
                      <p style={styles.sectionLabel}>
                        CONSENT
                      </p>

                      <h3 style={styles.sectionTitle}>
                        Digital consent
                      </h3>
                    </div>
                  </div>

                  {selectedClient.consent?.accepted ? (
                    <div style={styles.consentSuccess}>
                      <strong>
                        Consent recorded
                      </strong>

                      <span>
                        {formatDate(
                          selectedClient.consent
                            ?.accepted_at
                        )}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p style={styles.consentText}>
                        Consent has not been recorded for this
                        client yet.
                      </p>

                      <button
                        type="button"
                        onClick={recordConsent}
                        disabled={saving}
                        style={{
                          ...styles.secondaryButton,
                          ...(saving
                            ? styles.disabledSecondary
                            : {}),
                        }}
                      >
                        {saving
                          ? "Recording..."
                          : "Record Consent"}
                      </button>
                    </div>
                  )}
                </div>

                <div style={styles.detailSection}>
                  <div style={styles.sectionHeader}>
                    <div>
                      <p style={styles.sectionLabel}>
                        SESSIONS
                      </p>

                      <h3 style={styles.sectionTitle}>
                        Session history
                      </h3>
                    </div>
                  </div>

                  {!selectedClient.session_history ||
                  selectedClient.session_history.length === 0 ? (
                    <p style={styles.mutedText}>
                      No sessions linked to this client yet.
                    </p>
                  ) : (
                    <div style={styles.sessionList}>
                      {selectedClient.session_history.map(
                        (session) => (
                          <div
                            key={session._id}
                            style={styles.sessionItem}
                          >
                            <div>
                              <strong>
                                {formatDate(
                                  session.start_at
                                )}
                              </strong>

                              <p style={styles.sessionTime}>
                                {new Date(
                                  session.start_at
                                ).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>

                            <span
                              style={styles.sessionStatus}
                            >
                              {session.status}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#172033",
    padding: "30px 18px 60px",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "22px",
  },

  backButton: {
    border: "none",
    background: "transparent",
    padding: "0",
    marginBottom: "8px",
    color: "#4d63d2",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  title: {
    margin: "0",
    fontSize: "32px",
    color: "#172033",
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#6d7788",
    fontSize: "14px",
  },

  primaryButton: {
    border: "none",
    borderRadius: "10px",
    background: "#4d63d2",
    color: "#ffffff",
    padding: "12px 17px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  secondaryButton: {
    border: "1px solid #4d63d2",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#4d63d2",
    padding: "11px 17px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  disabledSecondary: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  errorBanner: {
    background: "#fff1f1",
    border: "1px solid #eccaca",
    color: "#9e3434",
    borderRadius: "12px",
    padding: "13px 15px",
    marginBottom: "15px",
    fontSize: "14px",
  },

  successBanner: {
    background: "#eef9f1",
    border: "1px solid #c5e5cc",
    color: "#317246",
    borderRadius: "12px",
    padding: "13px 15px",
    marginBottom: "15px",
    fontSize: "14px",
  },

  createCard: {
    background: "#ffffff",
    border: "1px solid #e1e6ef",
    borderRadius: "18px",
    padding: "22px",
    marginBottom: "20px",
    boxShadow: "0 8px 24px rgba(23,32,51,0.04)",
  },

  sectionHeader: {
    marginBottom: "17px",
  },

  sectionLabel: {
    margin: "0 0 5px",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1.2px",
    color: "#7b8597",
  },

  sectionTitle: {
    margin: "0",
    fontSize: "19px",
    color: "#202b3f",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },

  formGroup: {
    marginBottom: "4px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#3e495d",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d6dde8",
    borderRadius: "10px",
    background: "#ffffff",
    padding: "11px 12px",
    fontSize: "14px",
    color: "#172033",
    outline: "none",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d6dde8",
    borderRadius: "10px",
    background: "#ffffff",
    padding: "11px 12px",
    fontSize: "14px",
    color: "#172033",
    outline: "none",
    resize: "vertical",
    lineHeight: "1.5",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "0.85fr 1.45fr",
    gap: "20px",
    alignItems: "start",
  },

  listCard: {
    background: "#ffffff",
    border: "1px solid #e1e6ef",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(23,32,51,0.04)",
  },

  profileCard: {
    background: "#ffffff",
    border: "1px solid #e1e6ef",
    borderRadius: "18px",
    padding: "24px",
    minHeight: "500px",
    boxShadow: "0 8px 24px rgba(23,32,51,0.04)",
  },

  toolbar: {
    display: "flex",
    gap: "10px",
    padding: "16px",
    borderBottom: "1px solid #edf0f4",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    border: "1px solid #d6dde8",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "13px",
    outline: "none",
  },

  select: {
    width: "125px",
    border: "1px solid #d6dde8",
    borderRadius: "10px",
    padding: "10px 9px",
    fontSize: "13px",
    color: "#334057",
    background: "#ffffff",
  },

  clientList: {
    display: "flex",
    flexDirection: "column",
  },

  clientItem: {
    width: "100%",
    border: "none",
    borderBottom: "1px solid #edf0f4",
    background: "#ffffff",
    padding: "15px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textAlign: "left",
    cursor: "pointer",
  },

  clientItemSelected: {
    background: "#f2f4ff",
  },

  clientAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "#e9edff",
    color: "#4d63d2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    flexShrink: 0,
  },

  clientInfo: {
    minWidth: 0,
    flex: 1,
  },

  clientTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },

  clientName: {
    fontSize: "14px",
    color: "#263248",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  clientEmail: {
    display: "block",
    marginTop: "3px",
    fontSize: "12px",
    color: "#727d90",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  clientMeta: {
    display: "block",
    marginTop: "5px",
    fontSize: "11px",
    color: "#9299a7",
  },

  statusBadge: {
    flexShrink: 0,
    borderRadius: "20px",
    background: "#ebf8ef",
    color: "#3c8050",
    padding: "4px 8px",
    fontSize: "10px",
    fontWeight: "800",
    textTransform: "capitalize",
  },

  inactiveBadge: {
    background: "#f0f2f5",
    color: "#727c8d",
  },

  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    paddingBottom: "20px",
    borderBottom: "1px solid #edf0f4",
  },

  largeAvatar: {
    width: "64px",
    height: "64px",
    borderRadius: "18px",
    background: "#e9edff",
    color: "#4d63d2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    fontWeight: "800",
    flexShrink: 0,
  },

  profileName: {
    margin: "0",
    color: "#202b3f",
    fontSize: "24px",
  },

  profileContact: {
    margin: "4px 0 0",
    color: "#717c8e",
    fontSize: "13px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginTop: "18px",
  },

  statBox: {
    background: "#f7f8fb",
    border: "1px solid #e8ebf0",
    borderRadius: "12px",
    padding: "13px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  statLabel: {
    fontSize: "11px",
    color: "#7a8495",
  },

  detailSection: {
    marginTop: "25px",
    paddingTop: "22px",
    borderTop: "1px solid #edf0f4",
  },

  empty: {
    padding: "55px 25px",
    textAlign: "center",
    color: "#697487",
  },

  profilePlaceholder: {
    fontSize: "34px",
    marginBottom: "10px",
  },

  emptyTitle: {
    margin: "0 0 7px",
    fontSize: "17px",
    color: "#2b374d",
  },

  emptyText: {
    margin: "0 auto",
    maxWidth: "340px",
    lineHeight: "1.6",
    fontSize: "13px",
    color: "#80899a",
  },

  consentSuccess: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    background: "#eef9f1",
    border: "1px solid #c6e5cd",
    borderRadius: "12px",
    padding: "13px 15px",
    color: "#337449",
    fontSize: "13px",
  },

  consentText: {
    margin: "0 0 12px",
    color: "#717c8f",
    fontSize: "13px",
  },

  mutedText: {
    margin: "0",
    color: "#7e8798",
    fontSize: "13px",
  },

  sessionList: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },

  sessionItem: {
    border: "1px solid #e7ebf1",
    borderRadius: "11px",
    padding: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },

  sessionTime: {
    margin: "3px 0 0",
    fontSize: "12px",
    color: "#7b8596",
  },

  sessionStatus: {
    borderRadius: "20px",
    padding: "5px 9px",
    background: "#f0f3f8",
    color: "#59657a",
    fontSize: "10px",
    fontWeight: "800",
    textTransform: "capitalize",
  },
};

export default Clients;