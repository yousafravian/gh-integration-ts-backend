import express from "express";
import { getPaginatedPullRequests, getSearchResults } from '@/controllers/pull-requests.controller';

const router = express.Router();

router.get("/", getPaginatedPullRequests);

router.get("/textSearch", getSearchResults);

export { router };