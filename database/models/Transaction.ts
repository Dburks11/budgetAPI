import { DataTypes, Model } from "sequelize";
import sequelize from "../sequelize";

// interface for type-checking
export interface ITransaction {
  id: string;
  date: string;
  amount: number;
  payee: string;
}

// the Sequelize model
class Transaction extends Model<ITransaction> implements ITransaction {
  public id!: string;
  public date!: string;
  public amount!: number;
  public payee!: string;
}

Transaction.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    payee: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "transactions",
    timestamps: false, // Disable createdAt/updatedAt fields
  }
);

export default Transaction;
