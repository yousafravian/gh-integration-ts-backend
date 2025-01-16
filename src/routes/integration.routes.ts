import express from "express";
import { handleIntegration, handleLogout } from "@/controllers/integration.controller";

const router = express.Router();

router.get("/", handleIntegration);

router.get("/logout", handleLogout);

export { router };
