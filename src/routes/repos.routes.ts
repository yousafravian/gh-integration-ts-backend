import express from "express";
import { getPaginatedRepos } from "@/controllers/repos.controller";

const router = express.Router();

router.get("/", getPaginatedRepos);

export { router };
