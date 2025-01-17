import express from "express";

import { getPaginatedCommits, getSearchResults } from "@/controllers/commits.controller";

const router = express.Router();

router.get("/", getPaginatedCommits);

router.get("/textSearch", getSearchResults);

export { router };

// Controller pattern
// Worker thread
// Move to octokit

// Server side filtering and sorting ( hint: can be done with the current ag grid )
