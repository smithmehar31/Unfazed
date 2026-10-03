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

  const [portalLink, setPortalLink] = useState("");
  const [portalLinkCopied, setPortalLinkCopied] = useState(false);
  const [generatingPortalLink, setGeneratingPortalLink] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (token) {
      fetchClients();
    }
  }, [token, search, statusFilter]);

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
      setPortalLink("");
      setPortalLinkCopied(false);

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

        setAge(client.intake?.demographics?.age ?? "");
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

      const response = await axiosInstance.post(
        "/clients",
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          status: "active",
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSuccess("Client created successfully.");

        const createdClient = response.data.client;

        setName("");
        setEmail("");
        setPhone("");
        setTags("");
        setShowCreateForm(false);

        await fetchClients();

        if (createdClient?._id) {
          await openClientProfile(createdClient._id);
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

  async function generatePortalLink() {
    if (!selectedClient?._id) {
      return;
    }

    try {
      setGeneratingPortalLink(true);
      setError("");
      setSuccess("");
      setPortalLinkCopied(false);

      const response = await axiosInstance.post(
        `/clients/${selectedClient._id}/portal-token`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to generate client portal link."
        );
      }

      const data = response.data || {};
      const portal = data.portal ||
        data.clientPortal ||
        data.client_portal ||
        {};

      const portalToken =
        data.portalToken ||
        data.portal_token ||
        data.clientPortalToken ||
        data.client_portal_token ||
        data.token ||
        portal.portalToken ||
        portal.portal_token ||
        portal.token ||
        "";

      const returnedLink =
        data.portalUrl ||
        data.portal_url ||
        data.portalLink ||
        data.portal_link ||
        data.clientPortalUrl ||
        data.client_portal_url ||
        portal.portalUrl ||
        portal.portal_url ||
        portal.portalLink ||
        portal.portal_link ||
        "";

      if (!portalToken && !returnedLink) {
        throw new Error(
          "Portal token was not returned by the server."
        );
      }

      const link =
        returnedLink ||
        `${window.location.origin}/portal?token=${encodeURIComponent(
          portalToken
        )}`;

      setPortalLink(link);
      setSuccess("Secure client portal link generated.");
    } catch (error) {
      console.error("Portal link error:", error);

      if (error.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to generate portal link."
      );
    } finally {
      setGeneratingPortalLink(false);
    }
  }

  async function copyPortalLink() {
    if (!portalLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(portalLink);
      setPortalLinkCopied(true);
      setSuccess("Portal link copied.");
    } catch (error) {
      setError(
        "Unable to copy the link. Please copy it manually."
      );
    }
  }

  function openClientChat() {
    if (selectedClient?._id) {
      navigate(`/therapist/chat/${selectedClient._id}`);
    }
  }

  async function saveIntake() {
    if (!selectedClient?._id) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await axiosInstance.put(
        `/clients/${selectedClient._id}/intake`,
        {
          demographics: {
            age: age === "" ? undefined : Number(age),
            gender: gender.trim(),
            occupation: occupation.trim(),
          },
          presenting_concern: presentingConcern.trim(),
          history: history.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSuccess("Intake information updated.");

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
    if (!selectedClient?._id) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await axiosInstance.post(
        `/clients/${selectedClient._id}/consent`,
        { accepted: true },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSuccess("Client consent recorded.");

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

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(value) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getInitial(value) {
    return value?.charAt(0)?.toUpperCase() || "C";
  }

  const activeCount = clients.filter(
    (client) => client.status === "active"
  ).length;

  const inactiveCount = clients.filter(
    (client) => client.status === "inactive"
  ).length;

  return (
    <>
      <style>{css}</style>

      <div className="clients-page">
        <div className="clients-shell">
          <header className="clients-topbar">
            <div>
              <button
                className="back-link"
                onClick={() => navigate("/dashboard")}
              >
                ← Dashboard
              </button>

              <div className="eyebrow">THERAPIST WORKSPACE</div>

              <h1>Clients</h1>

              <p>
                Keep client profiles, intake, consent and communication
                organized in one place.
              </p>
            </div>

            <button
              className="primary-btn"
              onClick={() => {
                setShowCreateForm((value) => !value);
                setError("");
                setSuccess("");
              }}
            >
              {showCreateForm ? "Close form" : "+ Add client"}
            </button>
          </header>

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">◉</div>
              <div>
                <span>Total clients</span>
                <strong>{clients.length}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">✓</div>
              <div>
                <span>Active</span>
                <strong>{activeCount}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon gray">○</div>
              <div>
                <span>Inactive</span>
                <strong>{inactiveCount}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                {getInitial(selectedClient?.name)}
              </div>
              <div>
                <span>Selected</span>
                <strong>
                  {selectedClient?.name || "None"}
                </strong>
              </div>
            </div>
          </section>

          {error && (
            <div className="alert error">
              <div className="alert-symbol">!</div>
              <div>
                <strong>Something went wrong</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="alert success">
              <div className="alert-symbol">✓</div>
              <div>
                <strong>Updated</strong>
                <span>{success}</span>
              </div>
            </div>
          )}

          {showCreateForm && (
            <section className="create-card">
              <div className="section-head">
                <div>
                  <div className="eyebrow">NEW CLIENT</div>
                  <h2>Add a client</h2>
                  <p>
                    Add basic contact information. Intake can be
                    completed after creation.
                  </p>
                </div>

                <div className="section-icon">+</div>
              </div>

              <form onSubmit={handleCreateClient}>
                <div className="form-grid">
                  <label>
                    Full name
                    <input
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      placeholder="Client name"
                      required
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="client@example.com"
                    />
                  </label>

                  <label>
                    Phone
                    <input
                      value={phone}
                      onChange={(event) =>
                        setPhone(event.target.value)
                      }
                      placeholder="Phone number"
                    />
                  </label>

                  <label>
                    Tags
                    <input
                      value={tags}
                      onChange={(event) =>
                        setTags(event.target.value)
                      }
                      placeholder="online, new-client"
                    />
                  </label>
                </div>

                <div className="form-actions">
                  <span>Use commas to separate multiple tags.</span>

                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={saving}
                  >
                    {saving ? "Creating..." : "Create client"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <div className="clients-layout">
            <section className="directory-card">
              <div className="directory-head">
                <div>
                  <div className="eyebrow">CLIENT DIRECTORY</div>
                  <h2>Your clients</h2>
                </div>

                <div className="count-badge">
                  {clients.length}
                </div>
              </div>

              <div className="toolbar">
                <div className="search-box">
                  <span>⌕</span>
                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search by name or email..."
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                >
                  <option value="">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {loadingClients ? (
                <div className="empty-state">
                  <div className="empty-icon">◌</div>
                  <h3>Loading clients</h3>
                  <p>Fetching your client directory...</p>
                </div>
              ) : clients.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">◉</div>
                  <h3>No clients found</h3>
                  <p>
                    Try a different search or add your first client.
                  </p>

                  <button
                    className="secondary-btn"
                    onClick={() => setShowCreateForm(true)}
                  >
                    + Add client
                  </button>
                </div>
              ) : (
                <div className="client-list">
                  {clients.map((client) => {
                    const selected =
                      selectedClient?._id === client._id;

                    return (
                      <button
                        key={client._id}
                        className={`client-row ${
                          selected ? "selected" : ""
                        }`}
                        onClick={() =>
                          openClientProfile(client._id)
                        }
                      >
                        <div className="client-avatar">
                          {getInitial(client.name)}
                        </div>

                        <div className="client-row-main">
                          <div className="client-row-top">
                            <strong>{client.name}</strong>

                            <span
                              className={`status-badge ${
                                client.status === "inactive"
                                  ? "inactive"
                                  : ""
                              }`}
                            >
                              {client.status}
                            </span>
                          </div>

                          <span className="client-email">
                            {client.email || "No email"}
                          </span>

                          <div className="client-row-bottom">
                            <span>
                              Last session:{" "}
                              {formatDate(
                                client.last_session_at
                              )}
                            </span>

                            <span>→</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="profile-card">
              {loadingProfile ? (
                <div className="empty-state large">
                  <div className="empty-icon">◌</div>
                  <h3>Loading profile</h3>
                  <p>Fetching client information...</p>
                </div>
              ) : !selectedClient ? (
                <div className="empty-state large">
                  <div className="empty-icon">◉</div>
                  <h3>Select a client</h3>
                  <p>
                    Choose a client from the directory to view their
                    profile, portal, intake and session history.
                  </p>
                </div>
              ) : (
                <>
                  <div className="profile-header">
                    <div className="large-avatar">
                      {getInitial(selectedClient.name)}
                    </div>

                    <div className="profile-identity">
                      <div className="profile-meta">
                        <div className="eyebrow">CLIENT PROFILE</div>

                        <span
                          className={`profile-status ${
                            selectedClient.status === "inactive"
                              ? "inactive"
                              : ""
                          }`}
                        >
                          <span />
                          {selectedClient.status}
                        </span>
                      </div>

                      <h2>{selectedClient.name}</h2>

                      <div className="contacts">
                        <span>
                          {selectedClient.email ||
                            "No email provided"}
                        </span>

                        <span>
                          {selectedClient.phone ||
                            "No phone provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-stats">
                    <div>
                      <span>Sessions</span>
                      <strong>
                        {selectedClient.session_count || 0}
                      </strong>
                    </div>

                    <div>
                      <span>Consent</span>
                      <strong>
                        {selectedClient.consent?.accepted
                          ? "Recorded"
                          : "Pending"}
                      </strong>
                    </div>

                    <div>
                      <span>Last session</span>
                      <strong>
                        {formatDate(
                          selectedClient.last_session_at
                        )}
                      </strong>
                    </div>
                  </div>

                  <section className="detail-section">
                    <div className="detail-head">
                      <div>
                        <div className="eyebrow">
                          CLIENT PORTAL
                        </div>
                        <h3>Secure access</h3>
                        <p>
                          Generate and share a secure portal link for
                          this client.
                        </p>
                      </div>

                      <div className="detail-icon">↗</div>
                    </div>

                    <div className="portal-actions">
                      <button
                        className="secondary-btn"
                        onClick={openClientChat}
                      >
                        Open chat →
                      </button>

                      <button
                        className="primary-btn"
                        onClick={generatePortalLink}
                        disabled={generatingPortalLink}
                      >
                        {generatingPortalLink
                          ? "Generating..."
                          : "Generate portal link"}
                      </button>

                      {portalLink && (
                        <>
                          <button
                            className="secondary-btn"
                            onClick={() =>
                              window.open(
                                portalLink,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                          >
                            Open portal ↗
                          </button>

                          <button
                            className="secondary-btn"
                            onClick={copyPortalLink}
                          >
                            {portalLinkCopied
                              ? "Copied ✓"
                              : "Copy link"}
                          </button>
                        </>
                      )}
                    </div>

                    {portalLink && (
                      <div className="portal-link">
                        <span>SECURE LINK</span>
                        <strong>{portalLink}</strong>
                      </div>
                    )}
                  </section>

                  <section className="detail-section">
                    <div className="detail-head">
                      <div>
                        <div className="eyebrow">INTAKE</div>
                        <h3>Client information</h3>
                        <p>
                          Keep relevant demographic and intake details
                          up to date.
                        </p>
                      </div>

                      <div className="detail-icon">✎</div>
                    </div>

                    <div className="form-grid profile-form">
                      <label>
                        Age
                        <input
                          type="number"
                          min="0"
                          value={age}
                          onChange={(event) =>
                            setAge(event.target.value)
                          }
                          placeholder="Age"
                        />
                      </label>

                      <label>
                        Gender
                        <input
                          value={gender}
                          onChange={(event) =>
                            setGender(event.target.value)
                          }
                          placeholder="Gender"
                        />
                      </label>

                      <label className="full">
                        Occupation
                        <input
                          value={occupation}
                          onChange={(event) =>
                            setOccupation(event.target.value)
                          }
                          placeholder="Occupation"
                        />
                      </label>

                      <label className="full">
                        Presenting concern
                        <textarea
                          rows="4"
                          value={presentingConcern}
                          onChange={(event) =>
                            setPresentingConcern(
                              event.target.value
                            )
                          }
                          placeholder="Describe the presenting concern..."
                        />
                      </label>

                      <label className="full">
                        Relevant history
                        <textarea
                          rows="5"
                          value={history}
                          onChange={(event) =>
                            setHistory(event.target.value)
                          }
                          placeholder="Relevant client history..."
                        />
                      </label>
                    </div>

                    <div className="detail-footer">
                      <span>
                        Keep information accurate and relevant to
                        the client's care.
                      </span>

                      <button
                        className="primary-btn"
                        onClick={saveIntake}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save intake"}
                      </button>
                    </div>
                  </section>

                  <section className="detail-section">
                    <div className="detail-head">
                      <div>
                        <div className="eyebrow">CONSENT</div>
                        <h3>Digital consent</h3>
                        <p>
                          Record the client's consent status.
                        </p>
                      </div>

                      <div className="detail-icon">✓</div>
                    </div>

                    {selectedClient.consent?.accepted ? (
                      <div className="consent-box confirmed">
                        <div className="consent-symbol">✓</div>

                        <div>
                          <strong>Consent recorded</strong>
                          <p>
                            Recorded on{" "}
                            {formatDate(
                              selectedClient.consent.accepted_at
                            )}
                          </p>
                        </div>

                        <span>Confirmed</span>
                      </div>
                    ) : (
                      <div className="consent-box pending">
                        <div className="consent-symbol">!</div>

                        <div>
                          <strong>Consent pending</strong>
                          <p>
                            Consent has not been recorded for this
                            client yet.
                          </p>
                        </div>

                        <button
                          className="secondary-btn"
                          onClick={recordConsent}
                          disabled={saving}
                        >
                          {saving
                            ? "Recording..."
                            : "Record consent"}
                        </button>
                      </div>
                    )}
                  </section>

                  <section className="detail-section">
                    <div className="detail-head">
                      <div>
                        <div className="eyebrow">SESSIONS</div>
                        <h3>Session history</h3>
                        <p>
                          Review sessions associated with this client.
                        </p>
                      </div>

                      <div className="detail-icon">◷</div>
                    </div>

                    {selectedClient.session_history?.length ? (
                      <div className="session-list">
                        {selectedClient.session_history.map(
                          (session) => (
                            <div
                              className="session-card"
                              key={session._id}
                            >
                              <div className="session-date">
                                <strong>
                                  {new Date(
                                    session.start_at
                                  ).getDate()}
                                </strong>

                                <span>
                                  {new Date(
                                    session.start_at
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                  })}
                                </span>
                              </div>

                              <div className="session-main">
                                <strong>
                                  {formatDate(session.start_at)}
                                </strong>

                                <span>
                                  {formatTime(session.start_at)}
                                  {session.end_at
                                    ? ` – ${formatTime(
                                        session.end_at
                                      )}`
                                    : ""}
                                </span>
                              </div>

                              <span
                                className={`session-status ${
                                  session.status === "cancelled"
                                    ? "cancelled"
                                    : ""
                                }`}
                              >
                                {session.status}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="no-sessions">
                        <span>◷</span>
                        <p>No sessions linked to this client yet.</p>
                      </div>
                    )}
                  </section>
                </>
              )}
            </section>
          </div>

          <footer className="footer">
            <span>Unfazed Practice Management</span>
            <span>Client workspace</span>
          </footer>
        </div>
      </div>
    </>
  );
}

const css = `
  .clients-page {
    min-height: 100vh;
    background: #f4f6fa;
    color: #192338;
    padding: 22px;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
  }

  .clients-page * {
    box-sizing: border-box;
  }

  .clients-shell {
    max-width: 1220px;
    margin: 0 auto;
  }

  .clients-topbar {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 24px;
    padding-bottom: 22px;
    border-bottom: 1px solid #e1e6ef;
  }

  .back-link {
    display: block;
    margin-bottom: 14px;
    border: 0;
    background: transparent;
    color: #5065cf;
    font-size: 11px;
    font-weight: 800;
    padding: 5px 0;
    cursor: pointer;
  }

  .eyebrow {
    margin-bottom: 7px;
    color: #748097;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.6px;
  }

  .clients-topbar h1 {
    margin: 0;
    color: #192338;
    font-size: 36px;
    letter-spacing: -.8px;
  }

  .clients-topbar p {
    margin: 8px 0 0;
    color: #6e798d;
    font-size: 13px;
    line-height: 1.6;
    max-width: 720px;
  }

  .primary-btn,
  .secondary-btn {
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    transition: .18s ease;
  }

  .primary-btn {
    border: 1px solid #4d63d2;
    background: #4d63d2;
    color: #fff;
    box-shadow: 0 7px 16px rgba(77,99,210,.12);
  }

  .secondary-btn {
    border: 1px solid #d6dde8;
    background: #fff;
    color: #536078;
  }

  .primary-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(77,99,210,.18);
  }

  .secondary-btn:hover:not(:disabled) {
    background: #f7f8fc;
    border-color: #c8d0df;
  }

  .primary-btn:disabled,
  .secondary-btn:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 11px;
    margin: 18px 0;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
    padding: 14px;
    border: 1px solid #e0e5ed;
    border-radius: 15px;
    background: #fff;
    box-shadow: 0 7px 18px rgba(22,31,54,.035);
  }

  .stat-icon {
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 800;
  }

  .stat-icon.blue {
    background: #ebf3ff;
    color: #3975bc;
  }

  .stat-icon.green {
    background: #eaf8f0;
    color: #2d8758;
  }

  .stat-icon.gray {
    background: #f1f3f6;
    color: #747f90;
  }

  .stat-icon.purple {
    background: #efedff;
    color: #6658c4;
  }

  .stat-card span {
    display: block;
    margin-bottom: 4px;
    color: #8a94a5;
    font-size: 9px;
  }

  .stat-card strong {
    display: block;
    color: #273248;
    font-size: 17px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .alert {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    margin-bottom: 13px;
    border-radius: 12px;
  }

  .alert.error {
    background: #fff3f3;
    border: 1px solid #efd7d7;
  }

  .alert.success {
    background: #f0faf4;
    border: 1px solid #d7ecde;
  }

  .alert-symbol {
    width: 25px;
    height: 25px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: #fff;
    font-size: 11px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .alert.error .alert-symbol {
    color: #b44c4c;
  }

  .alert.success .alert-symbol {
    color: #2e8556;
  }

  .alert strong {
    display: block;
    color: #2a344a;
    font-size: 10px;
  }

  .alert span {
    display: block;
    margin-top: 3px;
    color: #778195;
    font-size: 10px;
    line-height: 1.45;
  }

  .create-card,
  .directory-card,
  .profile-card {
    background: #fff;
    border: 1px solid #e0e5ed;
    box-shadow: 0 8px 24px rgba(22,31,54,.045);
  }

  .create-card {
    padding: 22px;
    border-radius: 19px;
    margin-bottom: 16px;
  }

  .section-head,
  .directory-head,
  .detail-head,
  .profile-meta,
  .form-actions,
  .detail-footer,
  .client-row-top,
  .client-row-bottom,
  .consent-box,
  .session-card {
    display: flex;
  }

  .section-head,
  .directory-head,
  .detail-head,
  .profile-meta {
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
  }

  .section-head {
    margin-bottom: 18px;
  }

  .section-head h2,
  .directory-head h2 {
    margin: 0;
    color: #232e44;
    font-size: 20px;
  }

  .section-head p {
    margin: 5px 0 0;
    color: #7d8799;
    font-size: 10px;
    line-height: 1.5;
  }

  .section-icon,
  .detail-icon,
  .count-badge {
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .section-icon,
  .detail-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: #eef1ff;
    color: #5266cf;
    font-size: 14px;
    font-weight: 800;
  }

  .count-badge {
    min-width: 34px;
    height: 34px;
    border-radius: 10px;
    padding: 0 8px;
    background: #eef1ff;
    color: #5064cb;
    font-size: 11px;
    font-weight: 800;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 14px;
  }

  .form-grid label {
    color: #354056;
    font-size: 10px;
    font-weight: 800;
  }

  .form-grid label input,
  .form-grid label textarea {
    margin-top: 7px;
  }

  .form-grid label.full {
    grid-column: 1 / -1;
  }

  .form-grid input,
  .form-grid textarea,
  .search-box input,
  .toolbar select {
    width: 100%;
    border: 1px solid #d8dfe8;
    border-radius: 10px;
    background: #fff;
    color: #29344a;
    font: inherit;
    font-size: 12px;
    outline: none;
  }

  .form-grid input,
  .toolbar select {
    height: 42px;
    padding: 0 11px;
  }

  .form-grid textarea {
    min-height: 110px;
    padding: 10px 11px;
    resize: vertical;
    line-height: 1.55;
  }

  .form-grid input:focus,
  .form-grid textarea:focus,
  .search-box input:focus,
  .toolbar select:focus {
    border-color: #6274d8;
    box-shadow: 0 0 0 3px rgba(77,99,210,.1);
  }

  .form-actions {
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 17px;
    padding-top: 16px;
    border-top: 1px solid #edf0f4;
  }

  .form-actions > span {
    color: #8d96a6;
    font-size: 9px;
  }

  .clients-layout {
    display: grid;
    grid-template-columns: 370px minmax(0,1fr);
    gap: 17px;
    align-items: start;
  }

  .directory-card {
    border-radius: 19px;
    overflow: hidden;
  }

  .directory-head {
    padding: 20px 18px 14px;
  }

  .toolbar {
    display: flex;
    gap: 8px;
    padding: 0 14px 14px;
    border-bottom: 1px solid #edf0f4;
  }

  .search-box {
    position: relative;
    flex: 1;
    min-width: 0;
  }

  .search-box > span {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: #8b95a7;
    font-size: 14px;
  }

  .search-box input {
    height: 41px;
    padding: 0 10px 0 31px;
    background: #fbfcfe;
  }

  .toolbar select {
    width: 110px;
    flex-shrink: 0;
    padding: 0 9px;
  }

  .client-list {
    display: flex;
    flex-direction: column;
  }

  .client-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 11px;
    text-align: left;
    padding: 13px 14px;
    border: 0;
    border-bottom: 1px solid #edf0f4;
    background: #fff;
    cursor: pointer;
    transition: .18s ease;
  }

  .client-row:hover {
    background: #fafbff;
  }

  .client-row.selected {
    background: linear-gradient(90deg,#f2f5ff,#fbfcff);
    box-shadow: inset 3px 0 0 #5368d0;
  }

  .client-avatar,
  .large-avatar {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    background: linear-gradient(135deg,#e9edff,#dce4ff);
    color: #5367cf;
    font-weight: 800;
  }

  .client-avatar {
    width: 42px;
    height: 42px;
    border-radius: 13px;
    font-size: 13px;
  }

  .client-row-main {
    flex: 1;
    min-width: 0;
  }

  .client-row-top {
    align-items: center;
    gap: 8px;
  }

  .client-row-top strong {
    min-width: 0;
    color: #2a354a;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status-badge,
  .profile-status,
  .session-status {
    border-radius: 999px;
    font-size: 8px;
    font-weight: 800;
    text-transform: capitalize;
  }

  .status-badge {
    padding: 4px 7px;
    background: #edf8f1;
    color: #397d54;
    flex-shrink: 0;
  }

  .status-badge.inactive,
  .profile-status.inactive {
    background: #f1f3f6;
    color: #737e90;
  }

  .client-email {
    display: block;
    margin-top: 3px;
    color: #7c8698;
    font-size: 9px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .client-row-bottom {
    justify-content: space-between;
    gap: 10px;
    margin-top: 5px;
  }

  .client-row-bottom span {
    color: #98a0ae;
    font-size: 8px;
  }

  .profile-card {
    border-radius: 19px;
    padding: 21px;
    min-height: 600px;
  }

  .profile-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding-bottom: 17px;
    border-bottom: 1px solid #edf0f4;
  }

  .large-avatar {
    width: 65px;
    height: 65px;
    border-radius: 18px;
    background: linear-gradient(135deg,#5167d0,#7789df);
    color: #fff;
    font-size: 23px;
    box-shadow: 0 9px 20px rgba(77,99,210,.15);
  }

  .profile-identity {
    flex: 1;
    min-width: 0;
  }

  .profile-meta {
    align-items: center;
  }

  .profile-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    background: #edf9f2;
    color: #367950;
  }

  .profile-status > span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #33a268;
  }

  .profile-identity h2 {
    margin: 2px 0 4px;
    color: #202b41;
    font-size: 23px;
    overflow-wrap: anywhere;
  }

  .contacts {
    display: flex;
    flex-wrap: wrap;
    gap: 5px 14px;
  }

  .contacts span {
    color: #7a8598;
    font-size: 10px;
    overflow-wrap: anywhere;
  }

  .profile-stats {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 8px;
    margin-top: 15px;
  }

  .profile-stats > div {
    padding: 12px;
    border: 1px solid #e7ebf0;
    border-radius: 11px;
    background: #f8f9fb;
  }

  .profile-stats span {
    display: block;
    margin-bottom: 5px;
    color: #8993a5;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: .4px;
  }

  .profile-stats strong {
    color: #364158;
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .detail-section {
    margin-top: 20px;
    padding-top: 19px;
    border-top: 1px solid #edf0f4;
  }

  .detail-head {
    margin-bottom: 14px;
  }

  .detail-head h3 {
    margin: 0;
    color: #2a354a;
    font-size: 17px;
  }

  .detail-head p {
    margin: 4px 0 0;
    color: #858f9f;
    font-size: 9px;
    line-height: 1.5;
    max-width: 620px;
  }

  .portal-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .portal-link {
    margin-top: 10px;
    padding: 10px 11px;
    border-radius: 10px;
    background: #f7f8fb;
    border: 1px solid #e6eaf0;
  }

  .portal-link span {
    display: block;
    margin-bottom: 5px;
    color: #8a94a5;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .portal-link strong {
    display: block;
    color: #566177;
    font-size: 10px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .profile-form {
    margin-top: 2px;
  }

  .detail-footer {
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid #edf0f4;
  }

  .detail-footer > span {
    color: #8c95a5;
    font-size: 9px;
  }

  .consent-box {
    align-items: center;
    gap: 10px;
    padding: 13px;
    border-radius: 12px;
  }

  .consent-box.confirmed {
    background: #eff9f3;
    border: 1px solid #d7ebde;
  }

  .consent-box.pending {
    background: #fff9ed;
    border: 1px solid #f0e2c3;
  }

  .consent-symbol {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    background: #fff;
    font-weight: 800;
    flex-shrink: 0;
  }

  .confirmed .consent-symbol {
    color: #2c8757;
  }

  .pending .consent-symbol {
    color: #b68023;
  }

  .consent-box strong {
    display: block;
    color: #344057;
    font-size: 11px;
  }

  .consent-box p {
    margin: 3px 0 0;
    color: #7c8698;
    font-size: 9px;
  }

  .consent-box > span {
    margin-left: auto;
    padding: 5px 8px;
    border-radius: 999px;
    background: #daf1e2;
    color: #347850;
    font-size: 8px;
    font-weight: 800;
  }

  .consent-box.pending .secondary-btn {
    margin-left: auto;
    flex-shrink: 0;
  }

  .session-list {
    display: grid;
    gap: 8px;
  }

  .session-card {
    align-items: center;
    gap: 11px;
    padding: 11px;
    border: 1px solid #e5e9ef;
    border-radius: 12px;
    background: #fbfcfd;
  }

  .session-date {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    align-content: center;
    flex-shrink: 0;
    border-radius: 11px;
    background: #eef1ff;
    color: #5266cc;
  }

  .session-date strong {
    font-size: 15px;
    line-height: 1;
  }

  .session-date span {
    margin-top: 3px;
    font-size: 8px;
    text-transform: uppercase;
  }

  .session-main {
    flex: 1;
    min-width: 0;
  }

  .session-main strong,
  .session-main span {
    display: block;
  }

  .session-main strong {
    color: #344057;
    font-size: 10px;
  }

  .session-main span {
    margin-top: 3px;
    color: #7e8899;
    font-size: 9px;
  }

  .session-status {
    padding: 5px 8px;
    background: #edf8f1;
    color: #397c54;
    flex-shrink: 0;
  }

  .session-status.cancelled {
    background: #fff0f0;
    color: #ad4b4b;
  }

  .empty-state {
    min-height: 300px;
    display: grid;
    place-items: center;
    align-content: center;
    text-align: center;
    padding: 25px;
  }

  .empty-state.large {
    min-height: 520px;
  }

  .empty-icon {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background: #eef1ff;
    color: #5368d0;
    font-size: 18px;
    font-weight: 800;
  }

  .empty-state h3 {
    margin: 12px 0 5px;
    color: #2b364b;
    font-size: 15px;
  }

  .empty-state p {
    margin: 0 0 15px;
    max-width: 300px;
    color: #808a9b;
    font-size: 10px;
    line-height: 1.55;
  }

  .no-sessions {
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    border: 1px dashed #dce2eb;
    border-radius: 12px;
  }

  .no-sessions span {
    color: #5368d0;
    font-weight: 800;
  }

  .no-sessions p {
    margin: 0;
    color: #8993a3;
    font-size: 10px;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-top: 22px;
    padding: 16px 2px 0;
    border-top: 1px solid #e1e6ef;
    color: #8c95a5;
    font-size: 9px;
  }

  @media (max-width: 1000px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .clients-layout {
      grid-template-columns: 1fr;
    }

    .profile-card {
      min-height: auto;
    }
  }

  @media (max-width: 720px) {
    .clients-page {
      padding: 15px;
    }

    .clients-topbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .clients-topbar .primary-btn {
      width: 100%;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .form-grid label.full {
      grid-column: auto;
    }

    .form-actions,
    .detail-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .form-actions > .primary-btn,
    .detail-footer > .primary-btn {
      width: 100%;
    }

    .toolbar {
      flex-direction: column;
    }

    .toolbar select {
      width: 100%;
    }
  }

  @media (max-width: 520px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .profile-header,
    .profile-meta,
    .consent-box,
    .session-card {
      align-items: flex-start;
    }

    .profile-header,
    .profile-meta,
    .consent-box {
      flex-direction: column;
    }

    .consent-box > span,
    .consent-box.pending .secondary-btn {
      margin-left: 0;
    }

    .portal-actions .primary-btn,
    .portal-actions .secondary-btn {
      width: 100%;
    }

    .footer {
      flex-direction: column;
    }
  }
`;
export default Clients;