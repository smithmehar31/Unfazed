import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import UpgradePrompt from "../../components/common/UpgradePrompt";
import useEntitlement from "../../hooks/useEntitlement";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

function auth() {
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };
}

function id(item) {
  return item?._id || item?.id || "";
}

function name(item) {
  return item?.name || item?.client_name || "Unnamed Client";
}

function text(html) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return div.textContent || div.innerText || "";
}

function date(value) {
  if (!value) return "No date";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "Invalid date";
  }

  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function sessionLabel(session) {
  const start = session?.start_at || session?.startAt;
  const end = session?.end_at || session?.endAt;

  if (start) {
    const value = date(start);
    return end ? `${value} → ${date(end)}` : value;
  }

  return `Session ${id(session).slice(-8)}`;
}

function sessionsFrom(data) {
  if (Array.isArray(data?.sessions)) return data.sessions;
  if (Array.isArray(data?.session_history)) return data.session_history;
  if (Array.isArray(data?.sessionHistory)) return data.sessionHistory;
  if (Array.isArray(data?.client?.sessions)) return data.client.sessions;
  if (Array.isArray(data?.client?.session_history)) {
    return data.client.session_history;
  }

  return [];
}

function featureName(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Notes() {
  const editorRef = useRef(null);

  const [notes, setNotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [clientId, setClientId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("private");
  const [format, setFormat] = useState("richtext");
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");

  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [blockedFeature, setBlockedFeature] = useState("");

  const {
    tier,
    loading: entitlementLoading,
    error: entitlementError,
    hasAccess,
    checkAccess,
  } = useEntitlement();

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return notes;
    }

    return notes.filter((note) => {
      const titleText = note?.title || "";
      const contentText = text(note?.content || "");
      const clientName =
        note?.client_id?.name || note?.client_name || "";

      return (
        titleText.toLowerCase().includes(query) ||
        contentText.toLowerCase().includes(query) ||
        String(note?.type || "")
          .toLowerCase()
          .includes(query) ||
        String(note?.format || "")
          .toLowerCase()
          .includes(query) ||
        clientName.toLowerCase().includes(query)
      );
    });
  }, [notes, search]);

  useEffect(() => {
    loadNotes();
    loadClients();
  }, []);

  async function loadNotes() {
    try {
      setLoadingNotes(true);
      setError("");

      const response = await api.get("/notes", auth());
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : data?.notes || data?.data || data?.results || [];

      setNotes(list);
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message ||
          "Unable to load clinical notes."
      );
    } finally {
      setLoadingNotes(false);
    }
  }

  async function loadClients() {
    try {
      setLoadingClients(true);

      const response = await api.get("/clients", auth());
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : data?.clients || data?.data || data?.results || [];

      setClients(list);
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message ||
          "Unable to load clients."
      );
    } finally {
      setLoadingClients(false);
    }
  }

  async function loadSessions(clientValue) {
    if (!clientValue) {
      setSessions([]);
      setSessionId("");
      return;
    }

    try {
      setLoadingSessions(true);
      setError("");
      setSessionId("");

      const response = await api.get(
        `/clients/${clientValue}`,
        auth()
      );

      setSessions(sessionsFrom(response.data));
    } catch (error) {
      console.error(error);
      setSessions([]);
      setError(
        error.response?.data?.message ||
          "Unable to load client sessions."
      );
    } finally {
      setLoadingSessions(false);
    }
  }

  function changeClient(event) {
    const value = event.target.value;

    setClientId(value);
    loadSessions(value);
  }

  function clearEditor() {
    setEditingId("");
    setClientId("");
    setSessionId("");
    setSessions([]);
    setTitle("");
    setType("private");
    setFormat("richtext");
    setError("");
    setSuccess("");
    setBlockedFeature("");

    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  }

  function editorContent() {
    return editorRef.current?.innerHTML?.trim() || "";
  }

  function command(value) {
    editorRef.current?.focus();
    document.execCommand(value, false, null);
  }

  async function changeFormat(event) {
    const nextFormat = event.target.value;

    setError("");
    setSuccess("");
    setBlockedFeature("");

    if (["soap", "dap"].includes(nextFormat)) {
      const allowed = await checkAccess("soap_dap_templates");

      if (!allowed) {
        setBlockedFeature("soap_dap_templates");
        setFormat("richtext");
        setError(
          `${featureName(nextFormat)} templates are not included in your current plan.`
        );
        return;
      }
    }

    setFormat(nextFormat);
  }

  async function submit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setBlockedFeature("");

    if (!clientId) {
      setError("Please select a client.");
      return;
    }

    if (!sessionId) {
      setError("Please select a session.");
      return;
    }

    if (["soap", "dap"].includes(format)) {
      const allowed =
        hasAccess("soap_dap_templates") ||
        (await checkAccess("soap_dap_templates"));

      if (!allowed) {
        setBlockedFeature("soap_dap_templates");
        setError(
          "SOAP/DAP templates require a higher subscription plan."
        );
        return;
      }
    }

    const content = editorContent();

    if (!content || text(content).trim() === "") {
      setError("Please write some note content.");
      return;
    }

    const payload = {
      client_id: clientId,
      session_id: sessionId,
      type,
      title: title.trim(),
      content,
      format,
    };

    try {
      setSaving(true);

      if (editingId) {
        await api.put(
          `/notes/${editingId}`,
          payload,
          auth()
        );
        setSuccess("Note updated successfully.");
      } else {
        await api.post("/notes", payload, auth());
        setSuccess("Note created successfully.");
      }

      await loadNotes();
      clearEditor();
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message ||
          "Unable to save the note."
      );
    } finally {
      setSaving(false);
    }
  }

  async function editNote(note) {
    setError("");
    setSuccess("");
    setBlockedFeature("");

    const selectedClient =
      note?.client_id?._id ||
      note?.client_id ||
      "";

    const selectedSession =
      note?.session_id?._id ||
      note?.session_id ||
      "";

    const nextFormat = note?.format || "richtext";

    if (["soap", "dap"].includes(nextFormat)) {
      const allowed =
        hasAccess("soap_dap_templates") ||
        (await checkAccess("soap_dap_templates"));

      if (!allowed) {
        setBlockedFeature("soap_dap_templates");
        setError(
          "This note uses a template that is not included in your current plan."
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    setEditingId(note?._id || note?.id || "");
    setClientId(selectedClient);
    setTitle(note?.title || "");
    setType(note?.type || "private");
    setFormat(nextFormat);

    await loadSessions(selectedClient);
    setSessionId(selectedSession);

    if (editorRef.current) {
      editorRef.current.innerHTML = note?.content || "";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function archiveNote(noteId) {
    if (!window.confirm("Archive this note?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/notes/${noteId}`, auth());

      if (editingId === noteId) {
        clearEditor();
      }

      setSuccess("Note archived successfully.");
      await loadNotes();
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message ||
          "Unable to archive the note."
      );
    }
  }

  function clientName(note) {
    return (
      note?.client_id?.name ||
      note?.client_name ||
      clients.find(
        (client) =>
          id(client) ===
          (note?.client_id?._id || note?.client_id)
      )?.name ||
      "Unknown Client"
    );
  }

  return (
    <>
      <style>{css}</style>

      <div className="notes-page">
        <div className="notes-shell">
          <header className="topbar">
            <div>
              <button
                className="back-link"
                onClick={() => window.history.back()}
              >
                ← Back
              </button>

              <div className="eyebrow">CLINICAL RECORDS</div>
              <h1>Clinical Notes</h1>
              <p>
                Create and manage private or shared client session
                notes.
              </p>
            </div>

            <div className="header-pill">
              <span />
              Secure workspace
            </div>
          </header>

          {error && (
            <div className="alert error">
              <strong>Something went wrong</strong>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert success">
              <strong>Done</strong>
              <span>{success}</span>
            </div>
          )}

          {entitlementError && (
            <div className="alert warning">
              <strong>Subscription status unavailable</strong>
              <span>
                Some template access information could not be loaded.
              </span>
            </div>
          )}

          {blockedFeature && (
            <div className="upgrade-box">
              <UpgradePrompt
                featureName="SOAP / DAP Templates"
                currentPlan={
                  tier?.display_name || "Current plan"
                }
                message="SOAP and DAP clinical note templates are not available on your current subscription. Upgrade your plan to access these templates."
              />
            </div>
          )}

          <section className="editor-card">
            <div className="card-head">
              <div>
                <div className="eyebrow">NOTE EDITOR</div>
                <h2>
                  {editingId ? "Edit note" : "Create a note"}
                </h2>
                <p>
                  Link every note to the correct client and session.
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={clearEditor}
                >
                  Cancel edit
                </button>
              )}
            </div>

            <form onSubmit={submit}>
              <div className="field-grid">
                <label>
                  Client
                  <select
                    value={clientId}
                    onChange={changeClient}
                    disabled={loadingClients || saving}
                  >
                    <option value="">
                      {loadingClients
                        ? "Loading clients..."
                        : "Select client"}
                    </option>

                    {clients.map((client) => (
                      <option key={id(client)} value={id(client)}>
                        {name(client)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Session
                  <select
                    value={sessionId}
                    onChange={(event) =>
                      setSessionId(event.target.value)
                    }
                    disabled={
                      !clientId ||
                      loadingSessions ||
                      saving
                    }
                  >
                    <option value="">
                      {!clientId
                        ? "Select client first"
                        : loadingSessions
                        ? "Loading sessions..."
                        : sessions.length
                        ? "Select session"
                        : "No sessions found"}
                    </option>

                    {sessions.map((session) => (
                      <option
                        key={id(session)}
                        value={id(session)}
                      >
                        {sessionLabel(session)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Note type
                  <select
                    value={type}
                    onChange={(event) =>
                      setType(event.target.value)
                    }
                    disabled={saving}
                  >
                    <option value="private">Private</option>
                    <option value="shared">
                      Shared with client
                    </option>
                  </select>
                </label>

                <label>
                  Format
                  <select
                    value={format}
                    onChange={changeFormat}
                    disabled={saving || entitlementLoading}
                  >
                    <option value="richtext">Rich text</option>
                    <option value="soap">SOAP</option>
                    <option value="dap">DAP</option>
                  </select>

                  {!entitlementLoading &&
                    !hasAccess("soap_dap_templates") && (
                      <small>
                        SOAP/DAP templates are available on higher
                        plans.
                      </small>
                    )}
                </label>
              </div>

              <label className="field-full">
                Title
                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Example: Session 1 notes"
                  disabled={saving}
                />
              </label>

              <div className="editor-section">
                <label>Note content</label>

                <div className="editor-box">
                  <div className="toolbar">
                    <button
                      type="button"
                      onClick={() => command("bold")}
                    >
                      <strong>B</strong>
                    </button>

                    <button
                      type="button"
                      onClick={() => command("italic")}
                    >
                      <em>I</em>
                    </button>

                    <button
                      type="button"
                      onClick={() => command("underline")}
                    >
                      <u>U</u>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        command("insertUnorderedList")
                      }
                    >
                      • List
                    </button>
                  </div>

                  <div
                    ref={editorRef}
                    className="editor"
                    contentEditable={!saving}
                    suppressContentEditableWarning
                    data-placeholder="Write your clinical note here..."
                  />
                </div>
              </div>

              <div className="editor-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={clearEditor}
                  disabled={saving}
                >
                  Clear
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving || entitlementLoading}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update note"
                    : "Create note"}
                </button>
              </div>
            </form>
          </section>

          <section className="existing-section">
            <div className="existing-head">
              <div>
                <div className="eyebrow">NOTE LIBRARY</div>
                <h2>Existing notes</h2>
              </div>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search notes..."
              />
            </div>

            {loadingNotes ? (
              <div className="state-card">
                <div className="state-icon">◌</div>
                <h3>Loading notes</h3>
                <p>Fetching your clinical records...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="state-card">
                <div className="state-icon">✎</div>
                <h3>No notes found</h3>
                <p>
                  Create your first note or change the search term.
                </p>
              </div>
            ) : (
              <div className="notes-list">
                {filteredNotes.map((note) => (
                  <article
                    key={note?._id || note?.id}
                    className="note-card"
                  >
                    <div className="note-head">
                      <div>
                        <div className="note-label">
                          {note?.type || "private"}
                        </div>

                        <h3>
                          {note?.title || "Untitled Note"}
                        </h3>

                        <div className="note-meta">
                          Client: <strong>{clientName(note)}</strong>
                        </div>

                        <div className="note-date">
                          Created{" "}
                          {date(
                            note?.createdAt ||
                              note?.created_at
                          )}
                        </div>
                      </div>

                      <span className="format-badge">
                        {note?.format || "richtext"}
                      </span>
                    </div>

                    <div
                      className="note-content"
                      dangerouslySetInnerHTML={{
                        __html:
                          note?.content ||
                          "<p>No content</p>",
                      }}
                    />

                    <div className="note-actions">
                      <button
                        className="secondary-btn"
                        onClick={() => editNote(note)}
                      >
                        Edit
                      </button>

                      <button
                        className="danger-btn"
                        onClick={() =>
                          archiveNote(
                            note?._id || note?.id
                          )
                        }
                      >
                        Archive
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="footer">
            <span>Unfazed Practice Management</span>
            <span>Private clinical workspace</span>
          </footer>
        </div>
      </div>
    </>
  );
}

const css = `
  .notes-page {
    min-height: 100vh;
    background: #f4f6fa;
    color: #192338;
    padding: 22px;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
  }

  .notes-page * {
    box-sizing: border-box;
  }

  .notes-shell {
    max-width: 1180px;
    margin: 0 auto;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 20px;
    padding-bottom: 22px;
    border-bottom: 1px solid #e1e6ef;
  }

  .back-link {
    margin-bottom: 13px;
    border: 0;
    background: transparent;
    padding: 6px 0;
    color: #5065cf;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .eyebrow {
    margin-bottom: 7px;
    color: #758097;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.7px;
  }

  .topbar h1 {
    margin: 0;
    color: #192338;
    font-size: 36px;
    letter-spacing: -.8px;
  }

  .topbar p {
    margin: 8px 0 0;
    color: #6c788b;
    font-size: 13px;
    line-height: 1.6;
  }

  .header-pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 11px;
    border: 1px solid #d7eadf;
    background: #eef9f3;
    color: #32784f;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
  }

  .header-pill span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #31a66a;
  }

  .alert {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-top: 14px;
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 10px;
  }

  .alert strong {
    color: #263248;
    font-size: 11px;
  }

  .alert span {
    color: #737e90;
    line-height: 1.5;
  }

  .alert.error {
    background: #fff3f3;
    border: 1px solid #efd7d7;
  }

  .alert.success {
    background: #eff9f3;
    border: 1px solid #d7ebde;
  }

  .alert.warning {
    background: #fff9ed;
    border: 1px solid #efdfbd;
  }

  .upgrade-box {
    margin-top: 14px;
  }

  .editor-card {
    margin-top: 18px;
    padding: 23px;
    border: 1px solid #e0e5ed;
    border-radius: 20px;
    background: #fff;
    box-shadow: 0 8px 24px rgba(22,31,54,.045);
  }

  .card-head,
  .existing-head,
  .note-head,
  .editor-actions,
  .note-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
  }

  .card-head {
    align-items: flex-start;
    padding-bottom: 18px;
    border-bottom: 1px solid #edf0f4;
    margin-bottom: 19px;
  }

  .card-head h2,
  .existing-head h2 {
    margin: 0;
    color: #232e44;
    font-size: 21px;
  }

  .card-head p {
    margin: 5px 0 0;
    color: #7d8799;
    font-size: 10px;
  }

  .field-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 12px;
  }

  .field-grid label,
  .field-full,
  .editor-section > label {
    display: block;
    color: #344057;
    font-size: 10px;
    font-weight: 800;
  }

  select,
  input,
  textarea {
    width: 100%;
    margin-top: 7px;
    border: 1px solid #d8dfe8;
    border-radius: 10px;
    background: #fff;
    color: #29344a;
    font: inherit;
    font-size: 12px;
    outline: none;
  }

  select,
  input {
    height: 42px;
    padding: 0 11px;
  }

  .field-grid small {
    display: block;
    margin-top: 5px;
    color: #8c6a24;
    font-size: 9px;
    line-height: 1.4;
  }

  select:focus,
  input:focus,
  textarea:focus {
    border-color: #6274d8;
    box-shadow: 0 0 0 3px rgba(77,99,210,.1);
  }

  .field-full {
    margin-top: 14px;
  }

  .editor-section {
    margin-top: 15px;
  }

  .editor-box {
    margin-top: 7px;
    border: 1px solid #d9dfe8;
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
  }

  .toolbar {
    display: flex;
    gap: 7px;
    padding: 8px;
    border-bottom: 1px solid #e7ebf0;
    background: #f7f8fb;
  }

  .toolbar button {
    min-width: 31px;
    height: 30px;
    padding: 0 9px;
    border: 1px solid #d9dfe8;
    border-radius: 7px;
    background: #fff;
    color: #38445a;
    cursor: pointer;
    font-size: 11px;
  }

  .editor {
    min-height: 185px;
    padding: 14px;
    color: #273249;
    font-size: 13px;
    line-height: 1.65;
    outline: none;
  }

  .editor:empty::before {
    content: attr(data-placeholder);
    color: #a0a7b4;
  }

  .editor-actions {
    justify-content: flex-end;
    margin-top: 17px;
    padding-top: 16px;
    border-top: 1px solid #edf0f4;
  }

  .primary-btn,
  .secondary-btn,
  .danger-btn {
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .primary-btn {
    border: 1px solid #4d63d2;
    background: #4d63d2;
    color: #fff;
    box-shadow: 0 7px 15px rgba(77,99,210,.12);
  }

  .secondary-btn {
    border: 1px solid #d7dee8;
    background: #fff;
    color: #536078;
  }

  .danger-btn {
    border: 1px solid #eccfcf;
    background: #fff5f5;
    color: #b24a4a;
  }

  .primary-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .primary-btn:disabled,
  .secondary-btn:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .existing-section {
    margin-top: 22px;
  }

  .existing-head {
    align-items: end;
    margin-bottom: 12px;
  }

  .existing-head input {
    width: 280px;
    margin: 0;
    background: #fff;
  }

  .notes-list {
    display: grid;
    gap: 12px;
  }

  .note-card {
    padding: 18px;
    border: 1px solid #e0e5ed;
    border-radius: 17px;
    background: #fff;
    box-shadow: 0 7px 18px rgba(22,31,54,.035);
  }

  .note-head {
    align-items: flex-start;
  }

  .note-label {
    display: inline-block;
    margin-bottom: 5px;
    padding: 5px 8px;
    border-radius: 999px;
    background: #eef1ff;
    color: #5266cf;
    font-size: 8px;
    font-weight: 800;
    text-transform: capitalize;
  }

  .note-head h3 {
    margin: 0;
    color: #273249;
    font-size: 17px;
  }

  .note-meta {
    margin-top: 6px;
    color: #768196;
    font-size: 10px;
  }

  .note-meta strong {
    color: #354056;
  }

  .note-date {
    margin-top: 4px;
    color: #99a0ad;
    font-size: 9px;
  }

  .format-badge {
    padding: 6px 9px;
    border-radius: 999px;
    background: #f2f4f7;
    color: #697489;
    font-size: 8px;
    font-weight: 800;
    text-transform: capitalize;
  }

  .note-content {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid #edf0f4;
    color: #4d586c;
    font-size: 12px;
    line-height: 1.65;
  }

  .note-content p {
    margin: 0 0 8px;
  }

  .note-actions {
    justify-content: flex-end;
    margin-top: 14px;
  }

  .state-card {
    padding: 50px 20px;
    text-align: center;
    border: 1px dashed #dce2eb;
    border-radius: 16px;
    background: #fff;
  }

  .state-icon {
    width: 46px;
    height: 46px;
    margin: 0 auto;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background: #eef1ff;
    color: #5267ce;
    font-size: 18px;
    font-weight: 800;
  }

  .state-card h3 {
    margin: 12px 0 5px;
    color: #29344a;
    font-size: 15px;
  }

  .state-card p {
    margin: 0;
    color: #808a9b;
    font-size: 10px;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-top: 22px;
    padding: 16px 2px 0;
    border-top: 1px solid #e1e6ef;
    color: #8b94a4;
    font-size: 9px;
  }

  @media (max-width: 900px) {
    .field-grid {
      grid-template-columns: repeat(2, minmax(0,1fr));
    }
  }

  @media (max-width: 700px) {
    .notes-page {
      padding: 15px;
    }

    .topbar,
    .card-head,
    .existing-head,
    .footer {
      flex-direction: column;
      align-items: flex-start;
    }

    .header-pill {
      align-self: flex-start;
    }

    .field-grid {
      grid-template-columns: 1fr;
    }

    .existing-head input {
      width: 100%;
    }

    .editor-actions,
    .note-actions {
      justify-content: stretch;
      width: 100%;
    }

    .editor-actions button,
    .note-actions button {
      flex: 1;
    }
  }
`;
export default Notes;