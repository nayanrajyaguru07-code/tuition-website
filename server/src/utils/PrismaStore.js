import Prisma from "../lib/prisma.js";

class PrismaStore {
  async sessionExists(options) {
    const session = await Prisma.whatsappSession.findUnique({
      where: { sessionId: options.session },
    });
    return !!session;
  }

  async save(options) {
    await Prisma.whatsappSession.upsert({
      where: { sessionId: options.session },
      update: { data: JSON.stringify(options) },
      create: { sessionId: options.session, data: JSON.stringify(options) },
    });
  }

  async extract(options) {
    const session = await Prisma.whatsappSession.findUnique({
      where: { sessionId: options.session },
    });
    return session ? JSON.parse(session.data) : null;
  }

  async delete(options) {
    await Prisma.whatsappSession
      .delete({
        where: { sessionId: options.session },
      })
      .catch(() => {}); // Ignore errors if already deleted
  }
}

export default PrismaStore;
