import express, { Request, Response } from "express";
import dotenv from "dotenv";
import sequelize from "./sequelize";
import Transaction from "./models/Transaction";

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

interface YnabTransaction {
  date: string;
  amount: number;
  id: string;
  payee_name: string;
}

interface YnabResponse {
  data: {
    transactions: YnabTransaction[];
  };
}

app.get("/api/transactions", async (_req: Request, res: Response) => {
  const endpoint =
    "https://api.ynab.com/v1/budgets/e5afb653-a1e1-4e63-8138-811fa1e01146/transactions";

  const token = process.env.API_KEY;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-type": "application/json",
      },
    });

    const data: YnabResponse = await response.json();

    // Map the API response to plain objects
    const transactions = data.data.transactions.map((t: YnabTransaction) => ({
      id: t.id,
      date: t.date,
      amount: t.amount,
      payee: t.payee_name || "Unknown",
    }));

    // Save transactions to the database
    for (const transaction of transactions) {
      await Transaction.upsert(transaction); // Use upsert to avoid duplicates
    }

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
