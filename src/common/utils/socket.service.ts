import type http from 'node:http';
import { Server, Socket } from 'socket.io';

let socket: Server;

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class SocketService {
  public static initSocket(s: http.Server) {
    socket = new Server(s);
    return socket;
  }

  public static getSocket() {
    return socket;
  }
}
