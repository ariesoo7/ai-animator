/**
 * Prisma Client Singleton.
 * We instantiate PrismaClient once and export it to prevent exhausting database
 * connections during hot reloads or in multiple controller files.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
