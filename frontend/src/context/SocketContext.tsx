import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import { io, Socket } from "socket.io-client";
import { useAppData } from "./AppProvider";
import { realtimeService } from "../main";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuth } = useAppData();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuth) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    if (socketRef.current) return;

    const socket = io(realtimeService, {
      auth: {
        token: localStorage.getItem("token"),
      },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    /*
    One big confusion:
    if nobody is calling these events then how after a successful connection,
    connect event is beign trggered automatically
    Solution:
    connect works because Socket.IO itself emits that reserved event automatically when the socket successfully establishes a connection. 
    If you rename it to something else, it won't run unless some code explicitly emits that event.
    */
    socket.on("connect", () => {
      console.log("Socket is connected", socket.id);
    });
    socket.on("disconnect", () => {
      console.log("Socket is Disconnected");
    });

    socket.on("connect_error", (err) => {
      console.log("Socket Error: ", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuth]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
