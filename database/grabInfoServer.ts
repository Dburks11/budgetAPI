import express, { Request, Response } from "express";

const app = express();

const PORT = process.env.PORT || 3000;

class Transaction {
  date: string;
  amount: number;
  id: string;
  payee: string;
  constructor(date: string, amount: number, id: string, payee: string) {
    this.date = date;
    this.amount = amount;
    this.id = id;
    this.payee = payee;
  }
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
      (t: YnabTransaction) =>
        new Transaction(t.date, t.amount, t.id, t.payee_name)
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
