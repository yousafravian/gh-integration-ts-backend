import express from "express";
import { getPaginatedIssues, getSearchResults } from "@/controllers/issues.controller";

const router = express.Router();

router.get("/", getPaginatedIssues);

router.get("/textSearch", getSearchResults);

export { router };
