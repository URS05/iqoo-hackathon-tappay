import { useEffect, useMemo, useState } from "react";

import type { TxnDoc, WalletDoc } from "@/firebase/types";
import { useSession } from "@/session/SessionContext";
import { getLedger } from "@/wallet";

export function useWalletLive() {
  const session = useSession();
  const ledger = getLedger();
  const uid = session.lastTagUid;
  const [wallet, setWallet] = useState<WalletDoc | null>(null);
  const [txns, setTxns] = useState<TxnDoc[]>([]);

  useEffect(() => {
    if (!uid) {
      setWallet(null);
      return;
    }
    return ledger.subscribeWallet(uid, setWallet);
  }, [uid, ledger]);

  useEffect(() => {
    return ledger.subscribeTxns((all) => {
      setTxns(uid ? all.filter((t) => t.uid === uid) : all);
    });
  }, [uid, ledger]);

  const weekly = useMemo(() => buildWeekly(txns), [txns]);

  return { uid, wallet, txns, weekly, displayName: session.displayName };
}

function buildWeekly(txns: TxnDoc[]) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const income = [0, 0, 0, 0, 0, 0, 0];
  const spend = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  const start = startOfWeek(now);

  for (const t of txns) {
    if (t.status !== "ok") {
      continue;
    }
    const d = new Date(t.createdAt);
    if (d < start) {
      continue;
    }
    const idx = (d.getDay() + 6) % 7;
    const rupees = t.amountPaise / 100;
    if (t.type === "load") {
      income[idx] += rupees;
    } else if (t.type === "pay") {
      spend[idx] += rupees;
    }
  }

  const hasData = income.some(Boolean) || spend.some(Boolean);
  if (!hasData) {
    return {
      days,
      income: [4200, 1800, 2600, 900, 3100, 1500, 2200],
      spend: [1200, 2400, 800, 1900, 1600, 2800, 1100],
      demo: true,
    };
  }

  return { days, income, spend, demo: false };
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day);
  return copy;
}
