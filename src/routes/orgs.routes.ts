import express from "express";
import { getPaginatedOrgs } from "@/controllers/orgs.controller";

const router = express.Router();

router.get("/", getPaginatedOrgs);

export { router };
