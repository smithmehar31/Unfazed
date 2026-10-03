import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import axiosInstance from "../../api/axiosInstance";

function ClientPortal() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [client, setClient] = useState(null);
  const [therapist, setTherapist] = useState(null);

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [presentingConcern, setPresentingConcern] = useState("");
  const [history, setHistory] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [sharedNotes, setSharedNotes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [chatConnected, setChatConnected] = useState(false);
  const [chatError, setChatError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clientId =
    client?._id ||
    client?.id;

  const therapistId =
    therapist?._id ||
    therapist?.id ||
    client?.therapist_id ||
    client?.therapistId;

  useEffect(() => {
    if (!token) {
      setError("This client portal link is missing its access token.");
      setLoading(false);
      return;
    }

    fetchPortal();
  }, [token]);

  useEffect(() => {
    if (!clientId || !therapistId) return;

    connectChat();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("chat:leave");
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      setChatConnected(false);
    };
  }, [clientId, therapistId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function fetchPortal() {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get(
        "/clients/portal/client",
        {
          params: { token },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to load client portal."
        );
      }

      const portalClient = response.data.client || {};
      const portalTherapist = response.data.therapist || {};

      setClient(portalClient);
      setTherapist(portalTherapist);

      setAge(
        portalClient.intake?.demographics?.age ?? ""
      );

      setGender(
        portalClient.intake?.demographics?.gender || ""
      );

      setOccupation(
        portalClient.intake?.demographics?.occupation || ""
      );

      setPresentingConcern(
        portalClient.intake?.presenting_concern || ""
      );

      setHistory(
        portalClient.intake?.history || ""
      );

      setConsentAccepted(
        portalClient.consent?.accepted || false
      );

      await fetchSharedNotes();
    } catch (error) {
      console.error("Portal load error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load the client portal."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchSharedNotes() {
    try {
      setLoadingNotes(true);

      const response = await axiosInstance.get(
        "/notes/portal/shared",
        {
          params: { token },
        }
      );

      const data = response.data || {};

      setSharedNotes(
        Array.isArray(data.notes)
          ? data.notes
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.results)
          ? data.results
          : []
      );
    } catch (error) {
      console.error("Shared notes error:", error);
      setSharedNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  }

  function connectChat() {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(
      import.meta.env.VITE_SOCKET_URL ||
        "http://localhost:5000",
      {
        transports: ["websocket", "polling"],
      }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      setChatConnected(true);
      setChatError("");

      socket.emit("chat:join", {
        client_id: clientId,
        therapist_id: therapistId,
      });
    });

    socket.on("chat:message", (data) => {
      if (!data?.success || !data?.message) return;

      setMessages((current) => {
        const exists = current.some(
          (item) => item._id === data.message._id
        );

        return exists
          ? current
          : [...current, data.message];
      });
    });

    socket.on("chat:error", (data) => {
      setChatError(
        data?.message || "A chat error occurred."
      );
    });

    socket.on("disconnect", () => {
      setChatConnected(false);
    });

    socket.on("connect_error", () => {
      setChatConnected(false);
      setChatError(
        "Unable to connect to real-time chat."
      );
    });
  }

  function sendMessage() {
    const message = messageText.trim();

    if (!message) return;

    if (!socketRef.current?.connected) {
      setChatError(
        "Chat is not connected. Please wait a moment."
      );
      return;
    }

    if (message.length > 2000) {
      setChatError(
        "Message cannot exceed 2000 characters."
      );
      return;
    }

    socketRef.current.emit("chat:send", {
      client_id: clientId,
      therapist_id: therapistId,
      sender_type: "client",
      sender_id: clientId,
      message,
    });

    setMessageText("");
    setChatError("");
  }

  function handleChatKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!consentAccepted) {
      setError(
        "Please accept the consent checkbox before submitting."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await axiosInstance.post(
        "/clients/portal/intake",
        {
          token,
          demographics: {
            age: age === "" ? undefined : Number(age),
            gender: gender.trim(),
            occupation: occupation.trim(),
          },
          presenting_concern: presentingConcern.trim(),
          history: history.trim(),
          consent_accepted: true,
        }
      );

      if (response.data?.success) {
        setClient((current) => ({
          ...current,
          intake: response.data.client.intake,
          consent: response.data.client.consent,
        }));

        setConsentAccepted(true);

        setSuccess(
          response.data.message ||
            "Your intake and consent have been submitted successfully."
        );

        await fetchSharedNotes();
      }
    } catch (error) {
      console.error("Portal submit error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to submit your intake information."
      );
    } finally {
      setSaving(false);
    }
  }

  function noteText(content) {
    if (!content) return "";

    const div = document.createElement("div");
    div.innerHTML = content;

    return div.textContent || div.innerText || "";
  }

  function formatDate(value) {
    if (!value) return "No date";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "No date";
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function chatTime(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <>
        <style>{css}</style>

        <div className="portal-page">
          <div className="state-card">
            <div className="state-icon">U</div>
            <h2>Loading your portal</h2>
            <p>Preparing your client workspace...</p>
          </div>
        </div>
      </>
    );
  }

  if (!token || (error && !client)) {
    return (
      <>
        <style>{css}</style>

        <div className="portal-page">
          <div className="state-card">
            <div className="error-icon">!</div>
            <h2>Client portal unavailable</h2>
            <p>{error}</p>
            <small>
              Please contact your therapist if the link is
              incorrect or expired.
            </small>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>

      <div className="portal-page">
        <div className="portal-shell">
          <header className="topbar">
            <div className="brand">
              <div className="brand-mark">U</div>

              <div>
                <strong>Unfazed</strong>
                <span>Client portal</span>
              </div>
            </div>

            <div className="therapist">
              <span>Therapist</span>
              <strong>
                {therapist?.name || "Your therapist"}
              </strong>
            </div>
          </header>

          <section className="hero">
            <div>
              <div className="eyebrow light">CLIENT PORTAL</div>

              <h1>
                Welcome, {client?.name}
              </h1>

              <p>
                Complete your intake, confirm consent and stay
                connected with your therapist.
              </p>
            </div>

            <div className="hero-badge">
              <span />
              Private workspace
            </div>
          </section>

          {success && (
            <div className="notice success">
              <strong>Submitted successfully</strong>
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="notice error">
              <strong>Action needed</strong>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <section className="card">
              <div className="section-head">
                <div className="number">01</div>

                <div>
                  <div className="eyebrow">ABOUT YOU</div>
                  <h2>Basic information</h2>
                  <p>
                    Tell your therapist a little about yourself.
                  </p>
                </div>
              </div>

              <div className="grid">
                <label>
                  Full name
                  <input value={client?.name || ""} disabled />
                </label>

                <label>
                  Email
                  <input value={client?.email || ""} disabled />
                </label>

                <label>
                  Age
                  <input
                    type="number"
                    min="0"
                    value={age}
                    onChange={(event) =>
                      setAge(event.target.value)
                    }
                    placeholder="Your age"
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
              </div>
            </section>

            <section className="card">
              <div className="section-head">
                <div className="number">02</div>

                <div>
                  <div className="eyebrow">INTAKE</div>
                  <h2>What brings you here?</h2>
                  <p>
                    Share information that will help your therapist
                    prepare for your session.
                  </p>
                </div>
              </div>

              <label>
                Presenting concern
                <textarea
                  rows="6"
                  value={presentingConcern}
                  onChange={(event) =>
                    setPresentingConcern(event.target.value)
                  }
                  placeholder="Describe what you would like support with..."
                />
              </label>

              <label>
                Relevant history
                <textarea
                  rows="7"
                  value={history}
                  onChange={(event) =>
                    setHistory(event.target.value)
                  }
                  placeholder="Share any relevant background or history..."
                />
              </label>
            </section>

            <section className="card">
              <div className="section-head">
                <div className="number">03</div>

                <div>
                  <div className="eyebrow">CONSENT</div>
                  <h2>Confirm your consent</h2>
                  <p>
                    Please review the consent statement before
                    submitting.
                  </p>
                </div>
              </div>

              <label className="consent">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(event) =>
                    setConsentAccepted(
                      event.target.checked
                    )
                  }
                />

                <span>
                  I confirm that the information I have provided is
                  accurate to the best of my knowledge, and I consent
                  to sharing this information with my therapist for
                  my session and practice management.
                </span>
              </label>

              {client?.consent?.accepted &&
                client?.consent?.accepted_at && (
                  <div className="recorded">
                    ✓ Consent recorded on{" "}
                    {formatDate(
                      client.consent.accepted_at
                    )}
                  </div>
                )}
            </section>

            <div className="submit-area">
              <button
                type="submit"
                className="primary-btn"
                disabled={saving}
              >
                {saving
                  ? "Submitting..."
                  : "Submit Intake & Consent"}
              </button>
            </div>
          </form>

          <section className="card chat-card">
            <div className="section-head">
              <div className="number">04</div>

              <div>
                <div className="eyebrow">MESSAGING</div>
                <h2>Chat with your therapist</h2>
                <p>
                  Send a message directly through your secure portal.
                </p>
              </div>

              <div
                className={`chat-status ${
                  chatConnected ? "online" : "offline"
                }`}
              >
                <span />
                {chatConnected ? "Live" : "Connecting"}
              </div>
            </div>

            {chatError && (
              <div className="chat-error">
                {chatError}
              </div>
            )}

            <div className="messages">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="empty-icon">💬</div>
                  <strong>No messages yet</strong>
                  <span>
                    Start the conversation with{" "}
                    {therapist?.name || "your therapist"}.
                  </span>
                </div>
              ) : (
                messages.map((message) => {
                  const mine =
                    message.sender_type === "client";

                  return (
                    <div
                      key={message._id}
                      className={`message ${
                        mine ? "mine" : "theirs"
                      }`}
                    >
                      <div className="bubble">
                        <p>{message.message}</p>

                        <small>
                          {mine
                            ? "You"
                            : therapist?.name || "Therapist"}{" "}
                          · {chatTime(message.createdAt)}
                        </small>
                      </div>
                    </div>
                  );
                })
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="composer">
              <textarea
                rows="3"
                maxLength="2000"
                value={messageText}
                onChange={(event) =>
                  setMessageText(event.target.value)
                }
                onKeyDown={handleChatKeyDown}
                disabled={!chatConnected}
                placeholder={`Message ${
                  therapist?.name || "your therapist"
                }...`}
              />

              <div className="composer-bottom">
                <span>{messageText.length}/2000</span>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={sendMessage}
                  disabled={
                    !chatConnected ||
                    !messageText.trim()
                  }
                >
                  Send Message
                </button>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="section-head">
              <div className="number">05</div>

              <div>
                <div className="eyebrow">SHARED NOTES</div>
                <h2>Notes from your therapist</h2>
                <p>
                  Only notes explicitly shared with you are shown
                  here.
                </p>
              </div>
            </div>

            {loadingNotes ? (
              <div className="notes-state">
                Loading shared notes...
              </div>
            ) : sharedNotes.length === 0 ? (
              <div className="notes-state">
                No shared notes yet.
              </div>
            ) : (
              <div className="notes-list">
                {sharedNotes.map((note) => (
                  <article
                    className="note"
                    key={note._id || note.id}
                  >
                    <div className="note-top">
                      <div>
                        <h3>
                          {note.title || "Session note"}
                        </h3>
                        <span>
                          {formatDate(
                            note.createdAt ||
                              note.created_at
                          )}
                        </span>
                      </div>

                      <b>Shared</b>
                    </div>

                    <p>
                      {noteText(note.content) ||
                        "No note content available."}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer>
            <span>Powered by Unfazed</span>
            <span>Private client workspace</span>
          </footer>
        </div>
      </div>
    </>
  );
}

const css = `
  .portal-page {
    min-height: 100vh;
    background: #f4f6fa;
    color: #192338;
    padding: 20px;
    font-family: Inter, system-ui, -apple-system,
      BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .portal-page * {
    box-sizing: border-box;
  }

  .portal-shell {
    max-width: 900px;
    margin: 0 auto;
  }

  .topbar {
    min-height: 62px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
    border-bottom: 1px solid #e1e6ef;
  }

  .brand,
  .therapist,
  .hero-badge,
  .chat-status {
    display: flex;
    align-items: center;
  }

  .brand {
    gap: 10px;
  }

  .brand-mark {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    background: #4d63d2;
    color: #fff;
    font-weight: 800;
  }

  .brand strong {
    display: block;
    color: #192338;
    font-size: 14px;
  }

  .brand span,
  .therapist span {
    display: block;
    margin-top: 2px;
    color: #8290a2;
    font-size: 9px;
  }

  .therapist {
    align-items: flex-end;
    flex-direction: column;
  }

  .therapist strong {
    color: #40506a;
    font-size: 10px;
  }

  .hero {
    margin-top: 20px;
    padding: 28px;
    border-radius: 20px;
    background: linear-gradient(135deg,#263a78,#5369d7);
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
    box-shadow: 0 12px 28px rgba(46,61,130,.13);
  }

  .eyebrow {
    margin-bottom: 6px;
    color: #728098;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.6px;
  }

  .eyebrow.light {
    color: rgba(255,255,255,.7);
  }

  .hero h1 {
    margin: 0;
    font-size: 32px;
    letter-spacing: -.6px;
  }

  .hero p {
    margin: 8px 0 0;
    color: rgba(255,255,255,.82);
    font-size: 12px;
    line-height: 1.6;
    max-width: 580px;
  }

  .hero-badge {
    gap: 7px;
    flex-shrink: 0;
    padding: 8px 11px;
    border: 1px solid rgba(255,255,255,.2);
    border-radius: 999px;
    background: rgba(255,255,255,.1);
    color: #fff;
    font-size: 9px;
    font-weight: 700;
  }

  .hero-badge span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #68d391;
  }

  .notice {
    margin-top: 14px;
    padding: 12px 14px;
    border-radius: 11px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .notice strong {
    color: #2a354a;
    font-size: 11px;
  }

  .notice span {
    color: #778194;
    font-size: 10px;
    line-height: 1.5;
  }

  .notice.success {
    background: #eef9f2;
    border: 1px solid #d4eadc;
  }

  .notice.error {
    background: #fff2f2;
    border: 1px solid #efd7d7;
  }

  form,
  .chat-card,
  .card {
    margin-top: 16px;
  }

  .card {
    padding: 22px;
    border: 1px solid #e0e5ed;
    border-radius: 17px;
    background: #fff;
    box-shadow: 0 7px 20px rgba(22,31,54,.035);
  }

  .section-head {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    margin-bottom: 19px;
  }

  .number {
    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 10px;
    background: #eef1ff;
    color: #5065cf;
    font-size: 9px;
    font-weight: 800;
  }

  .section-head h2 {
    margin: 0;
    color: #222d42;
    font-size: 19px;
  }

  .section-head p {
    margin: 4px 0 0;
    color: #7b8597;
    font-size: 10px;
    line-height: 1.5;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  label {
    display: block;
    margin-bottom: 14px;
    color: #364156;
    font-size: 11px;
    font-weight: 800;
  }

  label.full {
    grid-column: 1 / -1;
  }

  input,
  textarea {
    width: 100%;
    margin-top: 7px;
    border: 1px solid #d7dee8;
    border-radius: 10px;
    background: #fff;
    color: #273249;
    font: inherit;
    font-size: 12px;
    outline: none;
  }

  input {
    height: 42px;
    padding: 0 11px;
  }

  textarea {
    min-height: 105px;
    padding: 10px 11px;
    resize: vertical;
    line-height: 1.55;
  }

  input:focus,
  textarea:focus {
    border-color: #6173d7;
    box-shadow: 0 0 0 3px rgba(77,99,210,.09);
  }

  input:disabled {
    background: #f6f7fa;
    color: #8791a1;
  }

  .consent {
    display: flex;
    gap: 11px;
    align-items: flex-start;
    margin: 0;
    padding: 13px;
    border-radius: 11px;
    background: #f7f8fb;
    border: 1px solid #e4e8ee;
    cursor: pointer;
  }

  .consent input {
    width: 17px;
    height: 17px;
    margin: 1px 0 0;
    flex-shrink: 0;
  }

  .consent span {
    color: #5c687b;
    font-size: 11px;
    line-height: 1.65;
  }

  .recorded {
    margin-top: 10px;
    color: #348151;
    font-size: 10px;
  }

  .submit-area {
    text-align: right;
    margin-top: 14px;
  }

  .primary-btn,
  .secondary-btn {
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
  }

  .primary-btn:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .chat-card .section-head {
    align-items: center;
  }

  .chat-status {
    margin-left: auto;
    gap: 6px;
    padding: 6px 8px;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 800;
  }

  .chat-status span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .chat-status.online {
    background: #edf9f2;
    color: #32784e;
  }

  .chat-status.online span {
    background: #31a366;
  }

  .chat-status.offline {
    background: #f4f5f7;
    color: #808a9b;
  }

  .chat-status.offline span {
    background: #a2a9b4;
  }

  .chat-error {
    margin-bottom: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #fff2f2;
    border: 1px solid #efd6d6;
    color: #a54040;
    font-size: 10px;
  }

  .messages {
    height: 390px;
    overflow-y: auto;
    padding: 15px;
    border: 1px solid #e4e8ee;
    border-radius: 13px;
    background: #f7f8fb;
  }

  .message {
    display: flex;
    margin-bottom: 10px;
  }

  .message.mine {
    justify-content: flex-end;
  }

  .bubble {
    max-width: 72%;
    padding: 10px 12px;
    border-radius: 12px;
  }

  .message.mine .bubble {
    background: #4d63d2;
    color: #fff;
    border-bottom-right-radius: 4px;
  }

  .message.theirs .bubble {
    background: #fff;
    border: 1px solid #e0e5ed;
    color: #2e394d;
    border-bottom-left-radius: 4px;
  }

  .bubble p {
    margin: 0;
    font-size: 11px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .bubble small {
    display: block;
    margin-top: 6px;
    font-size: 8px;
  }

  .message.mine .bubble small {
    color: rgba(255,255,255,.7);
  }

  .message.theirs .bubble small {
    color: #8992a1;
  }

  .empty-chat {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    text-align: center;
    gap: 6px;
  }

  .empty-icon {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    background: #eef1ff;
    color: #5267cf;
    font-size: 17px;
  }

  .empty-chat strong {
    color: #344056;
    font-size: 12px;
  }

  .empty-chat span {
    color: #8a94a5;
    font-size: 9px;
  }

  .composer {
    margin-top: 11px;
  }

  .composer textarea {
    min-height: 70px;
  }

  .composer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
  }

  .composer-bottom span {
    color: #929aa8;
    font-size: 9px;
  }

  .notes-state {
    padding: 20px;
    border: 1px dashed #d9dfe8;
    border-radius: 12px;
    color: #818b9b;
    text-align: center;
    font-size: 10px;
  }

  .notes-list {
    display: grid;
    gap: 10px;
  }

  .note {
    padding: 14px;
    border: 1px solid #e1e6ed;
    border-radius: 12px;
    background: #fafbfc;
  }

  .note-top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }

  .note h3 {
    margin: 0;
    color: #263148;
    font-size: 14px;
  }

  .note-top span {
    display: block;
    margin-top: 4px;
    color: #8a94a4;
    font-size: 9px;
  }

  .note-top b {
    padding: 5px 8px;
    border-radius: 999px;
    background: #edf8f1;
    color: #347850;
    font-size: 8px;
    flex-shrink: 0;
  }

  .note > p {
    margin: 11px 0 0;
    padding-top: 11px;
    border-top: 1px solid #e9edf2;
    color: #596579;
    font-size: 11px;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-top: 20px;
    padding: 15px 2px 0;
    border-top: 1px solid #e1e6ef;
    color: #8b94a3;
    font-size: 9px;
  }

  .state-card {
    max-width: 430px;
    margin: 100px auto;
    padding: 35px;
    border: 1px solid #e0e5ed;
    border-radius: 18px;
    background: #fff;
    text-align: center;
  }

  .state-icon,
  .error-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 12px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    font-weight: 800;
  }

  .state-icon {
    background: #eef1ff;
    color: #4d63d2;
  }

  .error-icon {
    background: #fff0f0;
    color: #b44747;
  }

  .state-card h2 {
    margin: 0 0 6px;
    color: #29344a;
    font-size: 19px;
  }

  .state-card p {
    margin: 0;
    color: #788396;
    font-size: 11px;
  }

  .state-card small {
    display: block;
    margin-top: 10px;
    color: #929aa8;
    font-size: 9px;
    line-height: 1.5;
  }

  @media (max-width: 700px) {
    .portal-page {
      padding: 14px;
    }

    .hero {
      flex-direction: column;
      align-items: flex-start;
      padding: 22px;
    }

    .hero-badge {
      align-self: flex-start;
    }

    .grid {
      grid-template-columns: 1fr;
    }

    label.full {
      grid-column: auto;
    }

    .submit-area {
      text-align: stretch;
    }

    .submit-area .primary-btn {
      width: 100%;
    }

    .chat-status {
      margin-left: 0;
    }

    .message .bubble {
      max-width: 88%;
    }

    footer,
    .topbar {
      align-items: flex-start;
    }

    footer {
      flex-direction: column;
    }
  }

  @media (max-width: 480px) {
    .topbar {
      flex-direction: column;
      padding-bottom: 12px;
    }

    .therapist {
      align-items: flex-start;
    }

    .hero h1 {
      font-size: 27px;
    }

    .card {
      padding: 17px;
    }

    .section-head {
      gap: 9px;
    }
  }
`;
export default ClientPortal;