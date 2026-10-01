#!/usr/bin/env node
import { randomInt } from "node:crypto";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./server.js";

serveStdio(() => createServer({ randomSeed: () => randomInt(0, 2 ** 32) }));
