import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";

/*
    Main Confusion i had for a long time:
    Express creates a HTTP server under the hood using http.createServer()
    Socket.io piggyback itself over that http server(or express server) and also become a socket.io server
    Express route handling and Socket.io connections are all done on the same port using the same server

    Good Summary for Socket.io
    In my realtime microservice, I first create an HTTP server and attach the Express application to it, 
    allowing the same server to handle traditional REST API requests through Express. 
    I then initialize Socket.IO on top of that HTTP server, so both HTTP traffic and realtime communication can share the same port. 
    During startup, Socket.IO is configured with authentication middleware and connection event handlers, but no client connections exist yet. 
    When a client attempts to connect, it first passes through the Socket.IO middleware where its JWT token is verified; if authentication succeeds, 
    the connection is accepted and a socket object is created for that client. Socket.IO internally manages all connected sockets, rooms, and event listeners through its adapter, 
    which maintains efficient mappings between rooms and sockets. Every connected socket is automatically assigned a private room whose name is its socket.id, 
    allowing the server to target that specific client using the same room-based broadcasting mechanism used for larger groups. Additional rooms, such as user-specific or restaurant-specific rooms, 
    can be joined dynamically, enabling events to be broadcast efficiently to a single user, all devices belonging to a user, or all members of a restaurant. 
    This architecture allows the service to support scalable realtime communication while keeping authentication, connection management, 
    and event delivery centralized within a single Socket.IO server instance.

    basically jaise hi connect hua client, 
    to Socket.io do jagah entry krta h 
    ek to usko ek private room assign krta h takai agr io.to("socketId") kre koi to uss id pr jaa ske directly
    ek tareeke se yeh maanle ki vo uss socket id ko special room consider krta h jisse event handling asaan ho jaise room mn hoti h
    aur dusra jis room pr connect hua vahan entry hoti h and ofcourse uska khudka socket mn add hota hi h

    when i do -> socket.id = abc123 is created
    rooms = {
        "abc123": ["abc123"]
        }

        sids = {
        "abc123": ["abc123"]
    }
    now when i join this socket to a room -> socket.join("restaurant:5");
    The state becomes: 
    rooms = {
        "abc123": ["abc123"],

        "restaurant:5": [
            "abc123"
        ]
    }

    sids = {
        "abc123": [
            "abc123",
            "restaurant:5"
        ]
    }

    And all this inf is stored in global socket.io adapter map -> inside RAM 
*/
let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error("Unauthorized person attemping to make a connection"),
        );
      }

      const decoded = jwt.verify(token, process.env.JWT_SEC!) as any;

      if (!decoded || !decoded.user) {
        return next(new Error("Unauthorized"));
      }
      socket.data.user = decoded.user;
      next();
    } catch (err) {
      console.log("Socket Connection Failed ❌");
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    if (!user) {
      socket.disconnect();
      return;
    }

    const userId = user._id;
    // this is creating a room of user
    socket.join(`user:${userId}`);
    // this is creating a room of restaurant
    if (user.restaurantId) {
      socket.join(`restaurant:${user.restaurantId}`);
    }

    console.log(`User connected: ${userId}`);
    console.log(`Socket room: `, [...socket.rooms]);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
    });
    return io;
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error("No SocketIO server is initialied");
  }
  return io;
};
