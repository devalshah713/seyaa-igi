import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const pass = await bcrypt.hash("password123", 10);

  const admin = await db.user.upsert({
    where: { email: "admin@seyaasolitaire.com" },
    update: {},
    create: {
      firstName: "Deval", lastName: "Shah", email: "admin@seyaasolitaire.com",
      emailVerified: true, role: "ADMIN", status: "APPROVED", passwordHash: pass,
    },
  });

  const sales = await db.user.upsert({
    where: { email: "priya@seyaasolitaire.com" },
    update: {},
    create: {
      firstName: "Priya", lastName: "S", email: "priya@seyaasolitaire.com",
      emailVerified: true, role: "SALES", status: "APPROVED", passwordHash: pass,
    },
  });

  const customer = await db.user.upsert({
    where: { email: "rajesh@rajeshtraders.com" },
    update: {},
    create: {
      firstName: "Rajesh", lastName: "Shah", email: "rajesh@rajeshtraders.com",
      emailVerified: true, role: "CUSTOMER", status: "APPROVED", passwordHash: pass,
      companyName: "Rajesh Traders", mobile: "+919900000000",
    },
  });

  const stones = [
    { ref: "SEY-CN133-22A", shape: "Round", carat: 3.23, color: "E", clarity: "VVS2", cut: "Excellent", polish: "Excellent", symmetry: "Excellent", fluorescence: "None", reportNo: "808617578", growthType: "CVD", location: "Mumbai, India", measurements: "9.39 x 9.34 x 5.88", depthPct: 62.8, tablePct: 59, ratio: 1.01, costPrice: 210, pricePerCt: 86, totalPrice: 278, status: "AVAILABLE" as const },
    { ref: "SEY-2201", shape: "Round", carat: 3.2, color: "E", clarity: "VVS2", cut: "Ideal", polish: "Excellent", symmetry: "Excellent", fluorescence: "None", growthType: "CVD", location: "Mumbai, India", costPrice: 212, pricePerCt: 87, totalPrice: 278, status: "AVAILABLE" as const },
    { ref: "SEY-2202", shape: "Round", carat: 3.2, color: "E", clarity: "VVS2", cut: "Excellent", polish: "Excellent", symmetry: "Excellent", fluorescence: "None", growthType: "CVD", location: "Surat, India", costPrice: 210, pricePerCt: 87, totalPrice: 278, status: "HOLD" as const },
    { ref: "SEY-2204", shape: "Round", carat: 3.24, color: "E", clarity: "VVS2", cut: "Excellent", polish: "Excellent", symmetry: "Excellent", fluorescence: "None", growthType: "CVD", location: "Mumbai, India", costPrice: 208, pricePerCt: 86, totalPrice: 279, status: "MEMO" as const },
    { ref: "SEY-2206", shape: "Oval", carat: 3.02, color: "F", clarity: "VS1", cut: "Excellent", polish: "Excellent", symmetry: "Very Good", fluorescence: "None", growthType: "HPHT", location: "Mumbai, India", costPrice: 180, pricePerCt: 74, totalPrice: 224, status: "AVAILABLE" as const },
    { ref: "SEY-2207", shape: "Cushion", carat: 3.51, color: "E", clarity: "VVS2", cut: "Excellent", polish: "Excellent", symmetry: "Excellent", fluorescence: "None", growthType: "CVD", location: "Mumbai, India", costPrice: 195, pricePerCt: 79, totalPrice: 277, status: "SOLD" as const },
    { ref: "SEY-2208", shape: "Round", carat: 3.2, color: "D", clarity: "VVS1", cut: "Ideal", polish: "Excellent", symmetry: "Excellent", fluorescence: "None", growthType: "CVD", location: "Surat, India", costPrice: 228, pricePerCt: 92, totalPrice: 294, status: "AVAILABLE" as const },
  ];

  for (const s of stones) {
    await db.stone.upsert({ where: { ref: s.ref }, update: s, create: s });
  }

  console.log("Seeded:", { admin: admin.email, sales: sales.email, customer: customer.email, stones: stones.length });
}

main().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
