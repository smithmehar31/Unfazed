import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";

import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

function Chat() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { token, logout } = useAuth();

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [therapist, setTherapist] = useState(null);
  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !clientId) {
      setLoading(false);
      setError("Unable to open chat.");
      return;
    }

    initializeChat();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("chat:leave");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, clientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function initializeChat() {
    try {
      setLoading(true);
      setError("");

      const therapistResponse = await axiosInstance.get(
        "/therapists/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!therapistResponse.data.success) {
        throw new Error("Unable to load therapist profile.");
      }

      const therapistData = therapistResponse.data.therapist;
      setTherapist(therapistData);

      const messagesResponse = await axiosInstance.get(
        `/chat/clients/${clientId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!messagesResponse.data.success) {
        throw new Error(
          messagesResponse.data.message ||
            "Unable to load chat messages."
        );
      }

      setClient(messagesResponse.data.client);
      setMessages(messagesResponse.data.messages || []);

      connectSocket(therapistData._id);
    } catch (error) {
      console.error("Chat initialization error:", error);

      if (error.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load chat."
      );
    } finally {
      setLoading(false);
    }
  }

  function connectSocket(therapistId) {
    const socket = io(
      import.meta.env.VITE_SOCKET_URL ||
        "http://localhost:5000",
      {
        transports: ["websocket", "polling"],
      }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);

      socket.emit("chat:join", {
        client_id: clientId,
        therapist_id: therapistId,
      });
    });

    socket.on("chat:message", (data) => {
      if (!data?.success || !data?.message) {
        return;
      }

      setMessages((current) => {
        const exists = current.some(
          (message) => message._id === data.message._id
        );

        return exists ? current : [...current, data.message];
      });
    });

    socket.on("chat:error", (data) => {
      setError(
        data?.message || "A chat error occurred."
      );
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("connect_error", () => {
      setSocketConnected(false);
      setError("Unable to connect to real-time chat.");
    });
  }

  function sendMessage() {
    const message = messageText.trim();

    if (!message) {
      return;
    }

    if (!socketRef.current?.connected) {
      setError(
        "Chat connection is not active. Please wait a moment and try again."
      );
      return;
    }

    if (!therapist?._id) {
      setError("Therapist information is not available.");
      return;
    }

    if (message.length > 2000) {
      setError("Message cannot exceed 2000 characters.");
      return;
    }

    setSending(true);
    setError("");

    socketRef.current.emit("chat:send", {
      client_id: clientId,
      therapist_id: therapist._id,
      sender_type: "therapist",
      sender_id: therapist._id,
      message,
    });

    setMessageText("");
    setSending(false);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function formatTime(value) {
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
        <div className="chat-page">
          <div className="state-card">
            <div className="state-icon">💬</div>
            <h2>Opening chat</h2>
            <p>Loading client conversation...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !client) {
    return (
      <>
        <style>{css}</style>
        <div className="chat-page">
          <div className="state-card">
            <div className="error-icon">!</div>
            <h2>Unable to open chat</h2>
            <p>{error}</p>
            <button
              className="primary-btn"
              onClick={() => navigate("/clients")}
            >
              Back to Clients
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>

      <div className="chat-page">
        <div className="chat-shell">
          <header className="topbar">
            <div>
              <button
                className="back-link"
                onClick={() => navigate("/clients")}
              >
                ← Clients
              </button>

              <div className="eyebrow">THERAPIST CHAT</div>

              <div className="title-row">
                <div>
                  <h1>{client?.name || "Client"}</h1>
                  <p>
                    {client?.email || "No email provided"}
                  </p>
                </div>

                <div
                  className={`connection ${
                    socketConnected ? "online" : "offline"
                  }`}
                >
                  <span />
                  {socketConnected ? "Live" : "Offline"}
                </div>
              </div>
            </div>
          </header>

          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          <section className="chat-card">
            <div className="chat-head">
              <div>
                <div className="eyebrow">CONVERSATION</div>
                <h2>{client?.name || "Client"}</h2>
              </div>

              <span className="chat-status">
                {socketConnected
                  ? "Real-time messaging active"
                  : "Connecting..."}
              </span>
            </div>

            <div className="messages">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="empty-icon">💬</div>
                  <h3>No messages yet</h3>
                  <p>
                    Start the conversation with{" "}
                    {client?.name || "your client"}.
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const mine =
                    message.sender_type === "therapist";

                  return (
                    <div
                      key={message._id}
                      className={`message-row ${
                        mine ? "mine" : "theirs"
                      }`}
                    >
                      <div
                        className={`bubble ${
                          mine ? "mine" : "theirs"
                        }`}
                      >
                        <p>{message.message}</p>

                        <div className="meta">
                          <span>
                            {mine
                              ? "You"
                              : client?.name || "Client"}
                          </span>

                          <span>
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="composer">
              <textarea
                value={messageText}
                onChange={(event) =>
                  setMessageText(event.target.value)
                }
                onKeyDown={handleKeyDown}
                maxLength={2000}
                rows={3}
                disabled={!socketConnected}
                placeholder={`Message ${
                  client?.name || "client"
                }...`}
              />

              <div className="composer-bottom">
                <span>{messageText.length}/2000</span>

                <button
                  className="primary-btn"
                  onClick={sendMessage}
                  disabled={
                    sending ||
                    !socketConnected ||
                    !messageText.trim()
                  }
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

const css = `
  .chat-page {
    min-height: 100vh;
    background: #f4f6fa;
    color: #192338;
    padding: 22px;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
  }

  .chat-page * {
    box-sizing: border-box;
  }

  .chat-shell {
    max-width: 930px;
    margin: 0 auto;
  }

  .topbar {
    padding-bottom: 20px;
    border-bottom: 1px solid #e1e6ef;
  }

  .back-link {
    border: 0;
    background: transparent;
    color: #5065cf;
    padding: 5px 0;
    margin-bottom: 13px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .eyebrow {
    margin-bottom: 7px;
    color: #748097;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.7px;
  }

  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
  }

  .title-row h1 {
    margin: 0;
    color: #192338;
    font-size: 34px;
    letter-spacing: -.7px;
  }

  .title-row p {
    margin: 7px 0 0;
    color: #748095;
    font-size: 12px;
  }

  .connection {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 11px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
  }

  .connection span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .connection.online {
    background: #edf9f2;
    color: #33784e;
    border: 1px solid #d3eadd;
  }

  .connection.online span {
    background: #31a66a;
  }

  .connection.offline {
    background: #fff7ed;
    color: #9a6828;
    border: 1px solid #efdfc9;
  }

  .connection.offline span {
    background: #c58435;
  }

  .error-banner {
    margin-top: 14px;
    padding: 12px 14px;
    border: 1px solid #efd7d7;
    border-radius: 11px;
    background: #fff3f3;
    color: #a44141;
    font-size: 11px;
  }

  .chat-card {
    margin-top: 18px;
    border: 1px solid #e0e5ed;
    border-radius: 19px;
    background: #fff;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(22,31,54,.045);
  }

  .chat-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    padding: 20px 21px;
    border-bottom: 1px solid #e7ebf0;
    background: #fbfcfe;
  }

  .chat-head h2 {
    margin: 0;
    color: #283349;
    font-size: 18px;
  }

  .chat-status {
    color: #7b8698;
    font-size: 10px;
  }

  .messages {
    height: 500px;
    overflow-y: auto;
    padding: 22px;
    background: #f7f8fb;
  }

  .message-row {
    display: flex;
    margin-bottom: 12px;
  }

  .message-row.mine {
    justify-content: flex-end;
  }

  .message-row.theirs {
    justify-content: flex-start;
  }

  .bubble {
    max-width: 72%;
    padding: 11px 13px;
    border-radius: 14px;
  }

  .bubble.mine {
    background: #4d63d2;
    color: #fff;
    border-bottom-right-radius: 5px;
  }

  .bubble.theirs {
    background: #fff;
    border: 1px solid #e0e5ed;
    color: #263148;
    border-bottom-left-radius: 5px;
  }

  .bubble p {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 13px;
    line-height: 1.55;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 7px;
    font-size: 8px;
  }

  .mine .meta {
    color: rgba(255,255,255,.72);
  }

  .theirs .meta {
    color: #8b94a4;
  }

  .empty-chat {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .empty-icon,
  .state-icon,
  .error-icon {
    display: grid;
    place-items: center;
    border-radius: 14px;
  }

  .empty-icon {
    width: 52px;
    height: 52px;
    background: #eef1ff;
    font-size: 22px;
  }

  .empty-chat h3 {
    margin: 12px 0 5px;
    color: #29354b;
    font-size: 16px;
  }

  .empty-chat p {
    margin: 0;
    color: #7f899b;
    font-size: 11px;
  }

  .composer {
    padding: 16px;
    border-top: 1px solid #e7ebf0;
    background: #fff;
  }

  .composer textarea {
    width: 100%;
    border: 1px solid #d8dfe8;
    border-radius: 11px;
    padding: 11px 12px;
    background: #fff;
    color: #283349;
    font: inherit;
    font-size: 12px;
    resize: vertical;
    outline: none;
  }

  .composer textarea:focus {
    border-color: #6274d8;
    box-shadow: 0 0 0 3px rgba(77,99,210,.1);
  }

  .composer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 9px;
  }

  .composer-bottom > span {
    color: #9199a8;
    font-size: 9px;
  }

  .primary-btn {
    border: 1px solid #4d63d2;
    border-radius: 10px;
    background: #4d63d2;
    color: #fff;
    padding: 10px 15px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .primary-btn:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .state-card {
    max-width: 450px;
    margin: 100px auto;
    padding: 35px;
    border: 1px solid #e0e5ed;
    border-radius: 18px;
    background: #fff;
    text-align: center;
    box-shadow: 0 8px 24px rgba(22,31,54,.045);
  }

  .state-icon,
  .error-icon {
    width: 50px;
    height: 50px;
    margin: 0 auto;
  }

  .state-icon {
    background: #eef1ff;
    font-size: 22px;
  }

  .error-icon {
    background: #fff0f0;
    color: #b04747;
    font-weight: 800;
  }

  .state-card h2 {
    margin: 13px 0 6px;
    color: #29344a;
    font-size: 20px;
  }

  .state-card p {
    margin: 0 0 18px;
    color: #788295;
    font-size: 12px;
  }

  @media (max-width: 650px) {
    .chat-page {
      padding: 14px;
    }

    .title-row,
    .chat-head {
      align-items: flex-start;
      flex-direction: column;
    }

    .messages {
      height: 420px;
      padding: 15px;
    }

    .bubble {
      max-width: 88%;
    }

    .composer-bottom {
      align-items: stretch;
      flex-direction: column;
    }

    .composer-bottom .primary-btn {
      width: 100%;
    }
  }
`;
export default Chat;