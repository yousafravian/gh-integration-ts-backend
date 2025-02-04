import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import { router as integrationRouter } from "@/routes/integration.routes";
import { router as commitsRouter } from "@/routes/commits.routes";
import { router as reposRouter } from "@/routes/repos.routes";
import { router as pullRequestsRouter } from "@/routes/pull-requests.routes";
import { router as issuesRouter } from "@/routes/issues.routes";
import { router as orgsRouter } from "@/routes/orgs.routes";

import errorHandler from "@/common/middleware/errorHandler";
import requestLogger from "@/common/middleware/requestLogger";
import http from "node:http";
import { Server } from "socket.io";
import { SocketService } from '@/common/utils/socket.service';

const logger = pino( { name: "server start" } );
const app: Express = express();
const server = http.createServer(app);
const io = SocketService.initSocket(server);

// Set the application to trust the reverse proxy
app.set( "trust proxy", true );

// Middlewares
app.use( express.json() );
app.use( express.urlencoded( { extended: true } ) );
app.use(
  cors( {
    origin: "*",
    methods: [ "*" ],
    allowedHeaders: [ "*" ],
  } ),
);
app.use( helmet() );

// Request logging
app.use( requestLogger );

// Routes
app.use( "/api/v1/integration", integrationRouter );
app.use( "/api/v1/commits", commitsRouter );
app.use( "/api/v1/repos", reposRouter );
app.use( "/api/v1/pulls", pullRequestsRouter );
app.use( "/api/v1/issues", issuesRouter );
app.use( "/api/v1/organizations", orgsRouter );

// Socket connection handler
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
});

// Error handlers
app.use( errorHandler() );

export { server, logger, io };
