const mongoose = require("mongoose");
const ChatMessage = require("../models/ChatMessage");

function buildRoomId(clientId) {
  return `client_chat_${clientId}`;
}

function initializeChatSocket(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.emit("chat:connected", {
      success: true,
      message: "Connected to Unfazed chat server.",
      socket_id: socket.id,
    });

    socket.on("chat:join", async (data) => {
      try {
        const {
          client_id,
          therapist_id,
        } = data || {};

        if (
          !mongoose.Types.ObjectId.isValid(client_id) ||
          !mongoose.Types.ObjectId.isValid(therapist_id)
        ) {
          socket.emit("chat:error", {
            success: false,
            message: "Invalid client or therapist ID.",
          });

          return;
        }

        const roomId = buildRoomId(client_id);

        socket.join(roomId);

        socket.data.client_id = client_id;
        socket.data.therapist_id = therapist_id;
        socket.data.room_id = roomId;

        socket.emit("chat:joined", {
          success: true,
          room_id: roomId,
          client_id,
          therapist_id,
          message: "Joined chat successfully.",
        });
      } catch (error) {
        console.error("Chat join error:", error);

        socket.emit("chat:error", {
          success: false,
          message: "Unable to join chat.",
        });
      }
    });

    socket.on("chat:send", async (data) => {
      try {
        const {
          client_id,
          therapist_id,
          sender_type,
          sender_id,
          message,
        } = data || {};

        if (
          !mongoose.Types.ObjectId.isValid(client_id) ||
          !mongoose.Types.ObjectId.isValid(therapist_id) ||
          !mongoose.Types.ObjectId.isValid(sender_id)
        ) {
          socket.emit("chat:error", {
            success: false,
            message: "Invalid chat identifiers.",
          });

          return;
        }

        if (
          !["therapist", "client"].includes(sender_type)
        ) {
          socket.emit("chat:error", {
            success: false,
            message: "Invalid sender type.",
          });

          return;
        }

        if (
          typeof message !== "string" ||
          !message.trim()
        ) {
          socket.emit("chat:error", {
            success: false,
            message: "Message cannot be empty.",
          });

          return;
        }

        if (message.trim().length > 2000) {
          socket.emit("chat:error", {
            success: false,
            message: "Message cannot exceed 2000 characters.",
          });

          return;
        }

        const roomId = buildRoomId(client_id);

        if (!socket.rooms.has(roomId)) {
          socket.join(roomId);
        }

        const chatMessage = await ChatMessage.create({
          therapist_id,
          client_id,
          sender_type,
          sender_id,
          message: message.trim(),
        });

        const populatedMessage = await ChatMessage.findById(
          chatMessage._id
        )
          .populate("therapist_id", "name email")
          .populate("client_id", "name email")
          .lean();

        io.to(roomId).emit("chat:message", {
          success: true,
          message: populatedMessage,
        });
      } catch (error) {
        console.error("Chat send error:", error);

        socket.emit("chat:error", {
          success: false,
          message: "Unable to send message.",
        });
      }
    });

    socket.on("chat:leave", () => {
      const roomId = socket.data.room_id;

      if (roomId) {
        socket.leave(roomId);
      }

      socket.data.room_id = null;

      socket.emit("chat:left", {
        success: true,
        message: "Left chat successfully.",
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.id} | Reason: ${reason}`
      );
    });
  });
}

module.exports = initializeChatSocket;