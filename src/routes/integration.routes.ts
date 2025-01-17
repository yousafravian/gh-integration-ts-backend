import express from "express";
import { handleCheckSyncStatus, handleIntegration, handleLogout } from "@/controllers/integration.controller";

const router = express.Router();

router.get("/", handleIntegration);
router.get("/checkSyncStatus", handleCheckSyncStatus);

router.get("/logout", handleLogout);

export { router };
