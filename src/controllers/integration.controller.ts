import { GithubIntegration } from "@/models/ghIntegration.model";
import type { Request, Response } from "express";
import * as path from 'node:path';
import { Worker } from 'node:worker_threads';
import { SocketService } from '@/common/utils/socket.service';


// Route handlers
export const handleIntegration = async (req: Request, res: Response) => {
  const code = req.query.code;

  // Create a new worker
  const worker = new Worker(path.resolve(__dirname, '../../dist/common/workers', 'integration.worker.js'), {
    workerData: { code },
  });

  // Listen for messages from the worker
  worker.on('message', (message) => {
    if (message instanceof Error) {
      console.error('Worker error:', message);
      SocketService.getSocket().emit('syncProcessing', {
        status: 500,
        error: 'An error occurred while processing your request.'
      })
    } else {
      res.send(message);
    }
  });

  // Handle errors from the worker
  worker.on('error', (error) => {
    console.error('Worker error:', error);
    SocketService.getSocket().emit('syncProcessing', {
      status: 500,
      error: 'An error occurred while processing your request.'
    });
  });

  // Handle worker exit
  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
      SocketService.getSocket().emit('syncProcessing', {
        status: 500,
        error: 'An error occurred while processing your request.'
      });
    }
  });
};

export const handleCheckSyncStatus = async (req: Request, res: Response) => {
  const userId = req.query.userId;
  const user = await GithubIntegration.findOne({
    userId
  });
  
  if (!user) {
    return res.status(404).send({ message: "User not found" });
  } else {
    return res.status(200).send({
      message: 'User found',
      payload: user.toObject(),
    });
  }
};

export const handleLogout = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId;

    // Delete user's GitHub Integration data
    const data = await GithubIntegration.deleteOne({ userId });

    if (data.deletedCount === 0) {
      return res.status(200).send({ error: "User not found" });
    }

    res.status(200).send({ message: "Logged out successfully" });
  } catch (e) {
    res.status(500).send({ error: "Error logging out" });
  }
};


// utility functions
export const saveIntegrationData = async (data: any) => {
  const { userId, username, lastSync, token, isProc } = data;

  try {
    // Check if the integration already exists
    const existingIntegration = await GithubIntegration.findOne({ userId });

    if (existingIntegration) {
      // Update existing integration
      existingIntegration.token = token;
      existingIntegration.lastSync = lastSync;
      existingIntegration.isProc = isProc;

      await existingIntegration.save();
      console.log("GitHub Integration updated successfully");
      return existingIntegration;
    } else {
      // Create a new integration
      const integration = new GithubIntegration({
        userId,
        username,
        lastSync,
        isProc: +isProc,
        token,
      });

      await integration.save();
      console.log("GitHub Integration created successfully");
      return integration;
    }
  } catch (error) {
    console.error("Error saving GitHub Integration data:", error);
    throw new Error("Error saving GitHub Integration data");
  }
};