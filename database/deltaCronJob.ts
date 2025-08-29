import express, { Request, Response } from "express";
import dotenv from "dotenv";
import sequelize from "./sequelize";
import Transaction from "./models/Transaction";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// Sync the database
sequelize
  .sync()
  .then(() => {
    console.log("Database synced successfully.");
  })
  .catch((error) => {
    console.error("Error syncing database:", error);
  });

app.use(express.json());

const SERVER_KNOWLEDGE_FILE = path.join(__dirname, "server_knowledge.json");

function getLastServerKnowledge(): number {
  try {
    const data = fs.readFileSync(SERVER_KNOWLEDGE_FILE, "utf-8");
    return JSON.parse(data).server_knowledge || 0;
  } catch {
    return 0;
  }
}

function setLastServerKnowledge(server_knowledge: number) {
  fs.writeFileSync(
    SERVER_KNOWLEDGE_FILE,
    JSON.stringify({ server_knowledge }, null, 2),
    "utf-8"
  );
}

interface YnabTransaction {
  date: string;
  amount: number;
  id: string;
  payee_name: string;
}

interface YnabResponse {
  data: {
    transactions: YnabTransaction[];
    server_knowledge: number;
  };
}

app.get("/api/transactions", async (_req: Request, res: Response) => {
  const endpoint =
    "https://api.ynab.com/v1/budgets/e5afb653-a1e1-4e63-8138-811fa1e01146/transactions";

  const token = process.env.API_KEY;
  const lastKnowledge = getLastServerKnowledge();

  try {
    const url = `${endpoint}?last_knowledge_of_server=${lastKnowledge}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-type": "application/json",
      },
    });

    const data: YnabResponse = await response.json();
    const newServerKnowledge = data.data.server_knowledge;

    // Map the API response to plain objects
    const transactions = data.data.transactions.map((t: YnabTransaction) => ({
      id: t.id,
      date: t.date,
      amount: parseFloat((t.amount / 1000).toFixed(2)),
      payee: t.payee_name || "Unknown",
    }));

    if (transactions.length === 0) {
      console.log("No new transactions to fetch.");
      res.json({ message: "No new transactions to fetch." });
      return;
    }

    // Save transactions to the database
    for (const transaction of transactions) {
      await Transaction.upsert(transaction); // Use upsert to avoid duplicates
    }

    setLastServerKnowledge(newServerKnowledge);

    // Fetch all transactions from the database
    const savedTransactions = await Transaction.findAll();

    res.json(savedTransactions);
    console.log("Transactions saved to the database:", savedTransactions);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
