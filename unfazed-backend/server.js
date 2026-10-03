require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./src/config/db");
const initializeChatSocket = require("./src/sockets/chatSocket");

const {
  startNotificationScheduler,
} = require("./src/services/notificationScheduler");

const PORT =
  process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server =
      http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin:
          "http://localhost:5173",
        methods: [
          "GET",
          "POST",
        ],
      },
    });

    initializeChatSocket(io);

    server.listen(
      PORT,
      async () => {
        console.log(
          `Server running on http://localhost:${PORT}`
        );

        console.log(
          "Socket.io chat server initialized successfully."
        );

        try {
          await startNotificationScheduler();

          console.log(
            "Notification scheduler initialized successfully."
          );
        } catch (error) {
          console.error(
            "Notification scheduler initialization failed:",
            error.message
          );
        }
      }
    );
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();