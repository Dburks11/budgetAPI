import express, { Request, Response } from "express";
import dotenv from "dotenv";
import sequelize = require("sequelize");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

interface Transaction {
  date: string;
  amount: number;
  id: string;
  payee: string;
}

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

    const transactions: Transaction[] = data.data.transactions.map(
      (t: YnabTransaction) => ({
        date: t.date,
        amount: t.amount,
        id: t.id,
        payee: t.payee_name || "Unkown",
      })
    );

    res.json(transactions);
    console.log(transactions);
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
