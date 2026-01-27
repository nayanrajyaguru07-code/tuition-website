import Prisma from "./src/lib/prisma.js";
import wakeNeon from "./src/connection/DB.wakeNeon.js";

async function main() {
  await wakeNeon();
  const hostels = await Prisma.hostel.findMany();
  console.log("Hostels found:", hostels.length);
  console.log(JSON.stringify(hostels, null, 2));
}

main()
  .catch(console.error)
  .finally(() => process.exit());
